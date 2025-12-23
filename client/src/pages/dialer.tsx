import { useState } from "react";
import { Row, Col, Card, List, Button, Input, Tag, Typography, Empty, Space } from "antd";
import { useTable } from "@refinedev/antd";
import { Phone, PhoneOff, Mic, MicOff, Delete } from "lucide-react";
import { useDialer } from "../hooks/useDialer";
import { useTranscription } from "../hooks/useTranscription";
import { NumericKeypad } from "../components/NumericKeypad";

const { Title, Text } = Typography;

interface TwentyPerson {
  id: string;
  name: { firstName: string; lastName: string };
  phone?: string;
  jobTitle?: string;
}

export default function DialerPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { tableProps } = useTable<TwentyPerson>({
    resource: "people",
    syncWithLocation: false,
  });

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

  const { entries, clearTranscription } = useTranscription(status === "connected");

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

  const leads = (tableProps.dataSource || []) as TwentyPerson[];

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
            bodyStyle={{ padding: 0, overflow: "auto", maxHeight: "calc(100vh - 240px)" }}
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
            bodyStyle={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 32 }}
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
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title="Live Transcription"
            style={{ height: "calc(100vh - 180px)" }}
            bodyStyle={{ overflow: "auto", maxHeight: "calc(100vh - 240px)", padding: 16 }}
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
                        color={entry.speaker === "rep" ? "blue" : "green"}
                        style={{ marginBottom: 4 }}
                      >
                        {entry.speaker === "rep" ? "Rep" : "Customer"}
                      </Tag>
                      <div>
                        <Text>{entry.text}</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
