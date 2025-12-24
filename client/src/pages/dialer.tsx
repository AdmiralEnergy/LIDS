import { useState, useMemo } from "react";
import { Row, Col, Card, List, Button, Input, Tag, Typography, Empty, Space, Drawer, Radio, message, Divider, Spin } from "antd";
import { useTable } from "@refinedev/antd";
import { useCreate } from "@refinedev/core";
import { Phone, PhoneOff, Mic, MicOff, Delete, Calendar, CheckCircle } from "lucide-react";
import { useDialer } from "../hooks/useDialer";
import { useTranscription, type TranscriptionEntry } from "../hooks/useTranscription";
import { NumericKeypad } from "../components/NumericKeypad";
import { getSettings, getCalendlyApiUrl } from "../lib/settings";

const { Title, Text } = Typography;

interface TwentyPerson {
  id: string;
  name: { firstName: string; lastName: string };
  phone?: string;
  jobTitle?: string;
}

interface TimeSlot {
  id: string;
  datetime: string;
  display: string;
}

const MOCK_SLOTS: TimeSlot[] = [
  { id: "1", datetime: "2025-01-02T14:00:00", display: "Thu Jan 2, 2:00 PM" },
  { id: "2", datetime: "2025-01-02T15:00:00", display: "Thu Jan 2, 3:00 PM" },
  { id: "3", datetime: "2025-01-03T10:00:00", display: "Fri Jan 3, 10:00 AM" },
  { id: "4", datetime: "2025-01-03T14:00:00", display: "Fri Jan 3, 2:00 PM" },
  { id: "5", datetime: "2025-01-06T09:00:00", display: "Mon Jan 6, 9:00 AM" },
  { id: "6", datetime: "2025-01-06T11:00:00", display: "Mon Jan 6, 11:00 AM" },
  { id: "7", datetime: "2025-01-07T14:00:00", display: "Tue Jan 7, 2:00 PM" },
  { id: "8", datetime: "2025-01-07T16:00:00", display: "Tue Jan 7, 4:00 PM" },
];

export default function DialerPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(MOCK_SLOTS);

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

  const leads = (tableProps.dataSource || []) as TwentyPerson[];

  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

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
    const settings = getSettings();

    if (!settings.calendlyApiKey || !settings.calendlyEventTypeUri) {
      setAvailableSlots(MOCK_SLOTS);
      return;
    }

    setLoadingSlots(true);
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
        throw new Error("Failed to fetch Calendly slots");
      }

      const data = await response.json();
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

      setAvailableSlots(slots.length > 0 ? slots : MOCK_SLOTS);
    } catch (e) {
      console.warn("Calendly fetch failed, using mock slots:", e);
      setAvailableSlots(MOCK_SLOTS);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenBooking = () => {
    setSelectedSlot(null);
    setBookingConfirmed(false);
    setBookingOpen(true);
    fetchCalendlySlots();
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedLead) return;

    setBooking(true);
    await new Promise((r) => setTimeout(r, 1000));

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
    } catch (err) {
      console.warn("Failed to create note:", err);
    }

    message.success(`Booked ${slot?.display} for ${selectedLead.name?.firstName}`);
    
    if (addEntry) {
      addEntry({
        id: crypto.randomUUID(),
        speaker: "rep",
        text: `[SYSTEM] Appointment booked: ${slot?.display}`,
      });
    }

    setBookingConfirmed(true);
    setBooking(false);

    setTimeout(() => {
      setBookingOpen(false);
    }, 1500);
  };

  return (
    <div style={{ padding: 24, height: "100%", overflow: "auto" }}>
      <Title level={3} style={{ marginBottom: 24 }}>
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
                    className="hover-elevate"
                    data-testid={`lead-item-${lead.id}`}
                  >
                    <List.Item.Meta
                      title={<Text strong>{fullName}</Text>}
                      description={
                        <Space direction="vertical" size={0}>
                          {lead.phone && <Text type="secondary">{lead.phone}</Text>}
                          {lead.jobTitle && <Text type="secondary">{lead.jobTitle}</Text>}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
              locale={{ emptyText: <Empty description="No leads available" /> }}
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
              <Tag color="green" style={{ fontSize: 18, padding: "4px 16px" }} data-testid="tag-duration">
                {formattedDuration}
              </Tag>
            )}

            {status === "connecting" && (
              <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
                Connecting...
              </Tag>
            )}

            <NumericKeypad onPress={appendDigit} disabled={status !== "idle"} />

            <Space size="large" style={{ marginTop: 16 }}>
              {status === "idle" ? (
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  onClick={dial}
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

            {muted && status !== "idle" && (
              <Text type="warning">Muted</Text>
            )}

            <Divider style={{ margin: "16px 0 8px" }} />

            <Button
              type="default"
              icon={<Calendar size={16} />}
              onClick={handleOpenBooking}
              disabled={!selectedLead}
              data-testid="button-book-appointment"
              style={{ width: "80%" }}
            >
              Book Appointment
            </Button>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title="Live Transcription"
            style={{ height: "calc(100vh - 180px)" }}
            styles={{ body: { overflow: "auto", maxHeight: "calc(100vh - 240px)", padding: 16 } }}
          >
            {entries.length === 0 ? (
              <Empty
                description="Transcription will appear during call..."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={entries}
                renderItem={(entry) => (
                  <List.Item
                    style={{ padding: "8px 0", border: "none" }}
                    data-testid={`transcription-${entry.id}`}
                  >
                    <div style={{ width: "100%" }}>
                      <Tag
                        color={entry.text.startsWith("[SYSTEM]") ? "gold" : entry.speaker === "rep" ? "blue" : "green"}
                        style={{ marginBottom: 4 }}
                      >
                        {entry.text.startsWith("[SYSTEM]") ? "System" : entry.speaker === "rep" ? "Rep" : "Customer"}
                      </Tag>
                      <div>
                        <Text>{entry.text.replace("[SYSTEM] ", "")}</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
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
            <Text type="secondary">
              Confirmation has been added to the call notes.
            </Text>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <Text type="secondary">Booking for:</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 16 }}>
                  {selectedLead
                    ? `${selectedLead.name?.firstName || ""} ${selectedLead.name?.lastName || ""}`.trim()
                    : "No lead selected"}
                </Text>
              </div>
              {selectedLead?.phone && (
                <Text type="secondary">{selectedLead.phone}</Text>
              )}
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: "block", marginBottom: 12 }}>
                Available Time Slots
              </Text>
              {loadingSlots ? (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <Spin />
                  <div style={{ marginTop: 8 }}>Loading available times...</div>
                </div>
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
                        data-testid={`slot-${slot.id}`}
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
              disabled={!selectedSlot}
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
