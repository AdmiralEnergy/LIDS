import { useState, useMemo, useCallback } from "react";
import { Row, Col, Card, List, Button, Input, Tag, Typography, Empty, Space, Drawer, Radio, message, Divider, Spin, Switch } from "antd";
import { useTable } from "@refinedev/antd";
import { useCreate } from "@refinedev/core";
import { Phone, PhoneOff, Mic, MicOff, Delete, Calendar, CheckCircle, Mail } from "lucide-react";
import { AudioOutlined, MessageOutlined, MobileOutlined, MailOutlined } from "@ant-design/icons";
import { useDialer } from "../hooks/useDialer";
import { useTranscription } from "../hooks/useTranscription";
import { useSms } from "../hooks/useSms";
import { useEmail } from "../hooks/useEmail";
import { NumericKeypad } from "../components/NumericKeypad";
import { getCalendlyApiUrl } from "../lib/settings";
import { useSettings } from "../hooks/useSettings";

const { Title, Text } = Typography;

interface TwentyPerson {
  id: string;
  name: { firstName: string; lastName: string };
  phone?: string;
  email?: string;
  jobTitle?: string;
}

interface TimeSlot {
  id: string;
  datetime: string;
  display: string;
}

export default function DialerPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"transcription" | "sms" | "email">("transcription");
  const [smsInput, setSmsInput] = useState("");
  const [smsHistory, setSmsHistory] = useState<Record<string, Array<{ id: string; direction: "sent" | "received"; text: string; timestamp: string; status?: string }>>>({});

  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailHistory, setEmailHistory] = useState<Record<string, Array<{ id: string; direction: "sent" | "received"; subject: string; body: string; timestamp: string; status?: string }>>>({});

  const { tableProps } = useTable<TwentyPerson>({
    resource: "people",
    syncWithLocation: false,
  });

  const { mutate: createNote } = useCreate();

  const {
    phoneNumber,
    setPhoneNumber,
    status,
    formattedDuration,
    muted,
    dial,
    hangup,
    toggleMute,
    appendDigit,
    clearNumber,
  } = useDialer();

  const { entries, clearTranscription, addEntry } = useTranscription(status === "connected");
  const { sending: smsSending, sendSms: sendSmsHook, error: smsError } = useSms(phoneNumber);

  const leads = (tableProps.dataSource || []) as TwentyPerson[];
  
  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  const selectedEmail = selectedLead?.email || "";
  const { sending: emailSending, sendEmail: sendEmailHook, error: emailError } = useEmail(selectedEmail);

  const smsMessages = useMemo(() => {
    if (!phoneNumber) return [];
    return smsHistory[phoneNumber] || [];
  }, [phoneNumber, smsHistory]);

  const emailMessages = useMemo(() => {
    if (!selectedLead?.email) return [];
    return emailHistory[selectedLead.email] || [];
  }, [selectedLead?.email, emailHistory]);

  const dialNative = useCallback(() => {
    if (!phoneNumber) return;
    window.open(`tel:${phoneNumber}`, "_self");
  }, [phoneNumber]);

  const handleDial = () => {
    if (settings.useNativePhone) {
      dialNative();
    } else {
      dial();
    }
  };

  const handleSendSms = async () => {
    if (!smsInput.trim() || !phoneNumber) return;

    const newMsg = {
      id: crypto.randomUUID(),
      direction: "sent" as const,
      text: smsInput,
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    setSmsHistory(prev => ({
      ...prev,
      [phoneNumber]: [...(prev[phoneNumber] || []), newMsg],
    }));

    const msgText = smsInput;
    setSmsInput("");

    try {
      await sendSmsHook(msgText);
      setSmsHistory(prev => ({
        ...prev,
        [phoneNumber]: prev[phoneNumber].map(m => m.id === newMsg.id ? { ...m, status: "sent" } : m),
      }));
      message.success("SMS sent");
    } catch {
      setSmsHistory(prev => ({
        ...prev,
        [phoneNumber]: prev[phoneNumber].map(m => m.id === newMsg.id ? { ...m, status: "failed" } : m),
      }));
      message.error(smsError || "Failed to send SMS");
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim() || !selectedLead?.email) {
      message.error("Subject, body, and recipient email required");
      return;
    }

    const newEmail = {
      id: crypto.randomUUID(),
      direction: "sent" as const,
      subject: emailSubject,
      body: emailBody,
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    setEmailHistory(prev => ({
      ...prev,
      [selectedLead.email!]: [...(prev[selectedLead.email!] || []), newEmail],
    }));

    const subj = emailSubject;
    const body = emailBody;
    setEmailSubject("");
    setEmailBody("");

    try {
      await sendEmailHook(subj, body);
      setEmailHistory(prev => ({
        ...prev,
        [selectedLead.email!]: prev[selectedLead.email!].map(e => e.id === newEmail.id ? { ...e, status: "sent" } : e),
      }));
      message.success("Email sent");
    } catch {
      setEmailHistory(prev => ({
        ...prev,
        [selectedLead.email!]: prev[selectedLead.email!].map(e => e.id === newEmail.id ? { ...e, status: "failed" } : e),
      }));
      message.error(emailError || "Failed to send email");
    }
  };

  const handleSelectLead = (lead: TwentyPerson) => {
    setSelectedLeadId(lead.id);
    if (lead.phone) {
      setPhoneNumber(lead.phone);
    }
  };

  const handleHangup = () => {
    hangup();
    clearTranscription();
  };

  const fetchCalendlySlots = async () => {
    if (!settings.calendlyApiKey || !settings.calendlyEventTypeUri) {
      setSlotsError("Calendly not configured. Go to Settings to add API key and Event Type URI.");
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSlotsError(null);

    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${getCalendlyApiUrl()}/event_type_available_times?event_type=${encodeURIComponent(settings.calendlyEventTypeUri)}&start_time=${now.toISOString()}&end_time=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${settings.calendlyApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Calendly API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.collection || data.collection.length === 0) {
        setSlotsError("No available time slots found for the next 7 days.");
        setAvailableSlots([]);
        return;
      }

      const slots: TimeSlot[] = data.collection.slice(0, 8).map((slot: any, index: number) => ({
        id: String(index + 1),
        datetime: slot.start_time,
        display: new Date(slot.start_time).toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      }));

      setAvailableSlots(slots);
    } catch (e) {
      console.error("Calendly fetch failed:", e);
      setSlotsError(e instanceof Error ? e.message : "Failed to fetch Calendly slots");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenBooking = () => {
    setSelectedSlot(null);
    setBookingConfirmed(false);
    setSlotsError(null);
    setBookingOpen(true);
    fetchCalendlySlots();
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedLead) return;

    setBooking(true);

    const slot = availableSlots.find((s) => s.id === selectedSlot);
    const leadName = `${selectedLead.name?.firstName || ""} ${selectedLead.name?.lastName || ""}`.trim();

    try {
      createNote({
        resource: "notes",
        values: {
          title: `Appointment booked: ${slot?.display}`,
          body: `Scheduled consultation for ${leadName} on ${slot?.display}`,
        },
      });

      message.success(`Booked ${slot?.display} for ${selectedLead.name?.firstName}`);

      if (addEntry) {
        addEntry({
          id: crypto.randomUUID(),
          speaker: "rep",
          text: `[SYSTEM] Appointment booked: ${slot?.display}`,
        });
      }

      setBookingConfirmed(true);
      setTimeout(() => setBookingOpen(false), 1500);
    } catch (err) {
      console.error("Failed to create booking note:", err);
      message.error("Booking noted but failed to save to CRM");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div style={{ padding: 24, height: "100%", overflow: "auto" }}>
      <Title level={3} style={{ marginBottom: 24 }} data-testid="text-dialer-title">
        Dialer
      </Title>

      <Row gutter={24}>
        <Col span={8}>
          <Card
            title="Lead Queue"
            style={{ height: "calc(100vh - 180px)" }}
            styles={{ body: { padding: 0, overflow: "auto", maxHeight: "calc(100vh - 240px)" } }}
          >
            <List
              loading={tableProps.loading}
              dataSource={leads}
              renderItem={(lead) => {
                const fullName = `${lead.name?.firstName || ""} ${lead.name?.lastName || ""}`.trim() || "Unknown";
                const isSelected = lead.id === selectedLeadId;

                return (
                  <List.Item
                    onClick={() => handleSelectLead(lead)}
                    style={{
                      cursor: "pointer",
                      padding: "12px 16px",
                      backgroundColor: isSelected ? "rgba(201, 166, 72, 0.1)" : undefined,
                      borderLeft: isSelected ? "3px solid #c9a648" : "3px solid transparent",
                    }}
                    data-testid={`list-item-lead-${lead.id}`}
                  >
                    <List.Item.Meta
                      title={<Text strong>{fullName}</Text>}
                      description={
                        <Space direction="vertical" size={0}>
                          {lead.phone && <Text type="secondary">{lead.phone}</Text>}
                          {lead.email && <Text type="secondary">{lead.email}</Text>}
                          {lead.jobTitle && <Text type="secondary">{lead.jobTitle}</Text>}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
              locale={{ emptyText: <Empty description="No leads available. Check Twenty CRM connection in Settings." /> }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title="Dialer"
            style={{ height: "calc(100vh - 180px)" }}
            styles={{ body: { display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 32 } }}
          >
            <div style={{ width: "100%", position: "relative" }}>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                size="large"
                style={{ fontSize: 24, textAlign: "center", letterSpacing: 2 }}
                disabled={status !== "idle"}
                data-testid="input-phone-number"
              />
              {phoneNumber && status === "idle" && (
                <Button
                  type="text"
                  size="small"
                  onClick={clearNumber}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
                  data-testid="button-clear-number"
                >
                  <Delete size={18} />
                </Button>
              )}
            </div>

            {status === "connected" && (
              <Tag color="green" style={{ fontSize: 18, padding: "4px 16px" }} data-testid="tag-call-duration">
                {formattedDuration}
              </Tag>
            )}

            {status === "connecting" && (
              <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }} data-testid="tag-connecting">
                Connecting...
              </Tag>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              <MobileOutlined />
              <Switch
                size="small"
                checked={settings.useNativePhone}
                onChange={(checked) => updateSettings({ useNativePhone: checked })}
                data-testid="switch-native-dial"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {settings.useNativePhone ? "Using my phone (calls + SMS + email)" : "Using Twilio"}
              </Text>
            </div>

            <NumericKeypad onPress={appendDigit} disabled={status !== "idle"} />

            <Space size="large" style={{ marginTop: 16 }}>
              {status === "idle" ? (
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  onClick={handleDial}
                  disabled={!phoneNumber}
                  style={{
                    width: 64,
                    height: 64,
                    backgroundColor: phoneNumber ? "#52c41a" : undefined,
                    borderColor: phoneNumber ? "#52c41a" : undefined,
                  }}
                  data-testid="button-dial"
                >
                  <Phone size={24} />
                </Button>
              ) : (
                <>
                  <Button
                    type="default"
                    shape="circle"
                    size="large"
                    onClick={toggleMute}
                    style={{ width: 64, height: 64 }}
                    data-testid="button-mute"
                  >
                    {muted ? <MicOff size={24} /> : <Mic size={24} />}
                  </Button>
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    size="large"
                    onClick={handleHangup}
                    style={{ width: 64, height: 64 }}
                    data-testid="button-hangup"
                  >
                    <PhoneOff size={24} />
                  </Button>
                </>
              )}
            </Space>

            {muted && status !== "idle" && <Text type="warning">Muted</Text>}

            <Divider style={{ margin: "16px 0 8px" }} />

            <Button
              type="default"
              icon={<Calendar size={16} />}
              onClick={handleOpenBooking}
              disabled={!selectedLead}
              style={{ width: "80%" }}
              data-testid="button-book-appointment"
            >
              Book Appointment
            </Button>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            style={{ height: "calc(100vh - 180px)" }}
            tabList={[
              { key: "transcription", tab: <><AudioOutlined /> Transcription</> },
              { key: "sms", tab: <><MessageOutlined /> SMS</> },
              { key: "email", tab: <><MailOutlined /> Email</> },
            ]}
            activeTabKey={activeTab}
            onTabChange={(key) => setActiveTab(key as "transcription" | "sms" | "email")}
            styles={{ body: { padding: 0, height: "calc(100% - 55px)", display: "flex", flexDirection: "column" } }}
          >
            {activeTab === "transcription" && (
              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                {entries.length === 0 ? (
                  <Empty description="Transcription will appear during call..." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <List
                    dataSource={entries}
                    renderItem={(entry) => (
                      <List.Item style={{ padding: "8px 0", border: "none" }}>
                        <div style={{ width: "100%" }}>
                          <Tag color={entry.text.startsWith("[SYSTEM]") ? "gold" : entry.speaker === "rep" ? "blue" : "green"} style={{ marginBottom: 4 }}>
                            {entry.text.startsWith("[SYSTEM]") ? "System" : entry.speaker === "rep" ? "Rep" : "Customer"}
                          </Tag>
                          <div><Text>{entry.text.replace("[SYSTEM] ", "")}</Text></div>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )}

            {activeTab === "sms" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                  {!phoneNumber ? (
                    <Empty description="Select a lead to send SMS" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : smsMessages.length === 0 ? (
                    <Empty description="No messages yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <List
                      dataSource={smsMessages}
                      renderItem={(msg) => (
                        <div
                          key={msg.id}
                          style={{
                            display: "flex",
                            justifyContent: msg.direction === "sent" ? "flex-end" : "flex-start",
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "80%",
                              padding: "8px 12px",
                              borderRadius: 12,
                              backgroundColor: msg.direction === "sent" ? "#1890ff" : "rgba(255,255,255,0.1)",
                              color: "#fff",
                            }}
                          >
                            <div>{msg.text}</div>
                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                              {msg.direction === "sent" && msg.status && (
                                <span style={{ marginLeft: 8 }}>
                                  {msg.status === "sending" && "..."}
                                  {msg.status === "sent" && "Sent"}
                                  {msg.status === "delivered" && "Delivered"}
                                  {msg.status === "failed" && "Failed"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  )}
                </div>
                <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <Space.Compact style={{ width: "100%" }}>
                    <Input
                      value={smsInput}
                      onChange={(e) => setSmsInput(e.target.value)}
                      placeholder="Type a message..."
                      onPressEnter={handleSendSms}
                      disabled={!phoneNumber || smsSending}
                      data-testid="input-sms-message"
                    />
                    <Button
                      type="primary"
                      onClick={handleSendSms}
                      loading={smsSending}
                      disabled={!phoneNumber || !smsInput.trim()}
                      data-testid="button-send-sms"
                    >
                      Send
                    </Button>
                  </Space.Compact>
                  {settings.useNativePhone && (
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                      Native mode: Opens your SMS app
                    </Text>
                  )}
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                  {!selectedLead?.email ? (
                    <Empty description="Selected lead has no email address" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : emailMessages.length === 0 ? (
                    <Empty description="No emails sent yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <List
                      dataSource={emailMessages}
                      renderItem={(email) => (
                        <div
                          key={email.id}
                          style={{
                            marginBottom: 12,
                            padding: "8px 12px",
                            borderRadius: 8,
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderLeft: email.direction === "sent" ? "3px solid #1890ff" : "3px solid #52c41a",
                          }}
                        >
                          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{email.subject}</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{email.body.substring(0, 100)}...</div>
                          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
                            {new Date(email.timestamp).toLocaleString()}
                            {email.status && <span style={{ marginLeft: 8 }}>{email.status}</span>}
                          </div>
                        </div>
                      )}
                    />
                  )}
                </div>
                <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject"
                    style={{ marginBottom: 8 }}
                    disabled={!selectedLead?.email || emailSending}
                    data-testid="input-email-subject"
                  />
                  <Input.TextArea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Email body..."
                    rows={3}
                    style={{ marginBottom: 8 }}
                    disabled={!selectedLead?.email || emailSending}
                    data-testid="input-email-body"
                  />
                  <Button
                    type="primary"
                    icon={<Mail size={14} />}
                    onClick={handleSendEmail}
                    loading={emailSending}
                    disabled={!selectedLead?.email || !emailSubject.trim() || !emailBody.trim()}
                    block
                    data-testid="button-send-email"
                  >
                    Send Email
                  </Button>
                  {settings.useNativePhone && (
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                      Native mode: Opens your email app
                    </Text>
                  )}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Drawer
        title="Book Appointment"
        placement="right"
        onClose={() => setBookingOpen(false)}
        open={bookingOpen}
        width={400}
      >
        {bookingConfirmed ? (
          <div style={{ textAlign: "center", paddingTop: 48 }}>
            <CheckCircle size={64} color="#52c41a" style={{ marginBottom: 16 }} />
            <Title level={4}>Appointment Booked!</Title>
            <Text type="secondary">Confirmation has been added to the call notes.</Text>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <Text type="secondary">Booking for:</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 16 }}>
                  {selectedLead ? `${selectedLead.name?.firstName || ""} ${selectedLead.name?.lastName || ""}`.trim() : "No lead selected"}
                </Text>
              </div>
              {selectedLead?.phone && <Text type="secondary">{selectedLead.phone}</Text>}
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: "block", marginBottom: 12 }}>Available Time Slots</Text>

              {loadingSlots ? (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <Spin />
                  <div style={{ marginTop: 8 }}>Loading available times...</div>
                </div>
              ) : slotsError ? (
                <div style={{ textAlign: "center", padding: 24, color: "#ff4d4f" }}>
                  {slotsError}
                </div>
              ) : availableSlots.length === 0 ? (
                <Empty description="No slots available" />
              ) : (
                <Radio.Group
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {availableSlots.map((slot) => (
                      <Radio
                        key={slot.id}
                        value={slot.id}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 6,
                          backgroundColor: selectedSlot === slot.id ? "rgba(201, 166, 72, 0.1)" : undefined,
                        }}
                        data-testid={`radio-slot-${slot.id}`}
                      >
                        {slot.display}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              )}
            </div>

            <Button
              type="primary"
              block
              size="large"
              onClick={handleBook}
              loading={booking}
              disabled={!selectedSlot || !!slotsError}
              data-testid="button-confirm-booking"
            >
              Confirm Booking
            </Button>
          </>
        )}
      </Drawer>
    </div>
  );
}
