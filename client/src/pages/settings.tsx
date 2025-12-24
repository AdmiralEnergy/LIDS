import { useState } from "react";
import { Card, Form, Input, Button, Typography, Space, Tag, Row, Col, message, Alert } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, ApiOutlined, DatabaseOutlined, PhoneOutlined, AudioOutlined, SettingOutlined, CalendarOutlined } from "@ant-design/icons";
import { useSettings } from "../hooks/useSettings";
import { getTwentyCrmUrl, getTwilioUrl, getN8nUrl } from "../lib/settings";

const { Title, Text } = Typography;

type ConnectionStatus = "idle" | "testing" | "connected" | "failed";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [statuses, setStatuses] = useState<Record<string, ConnectionStatus>>({
    twenty: "idle",
    twilio: "idle",
    transcription: "idle",
    n8n: "idle",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const testConnection = async (service: string) => {
    setStatuses((prev) => ({ ...prev, [service]: "testing" }));
    setErrors((prev) => ({ ...prev, [service]: "" }));

    try {
      let url = "";
      switch (service) {
        case "twenty":
          url = `${getTwentyCrmUrl()}/rest/people?limit=1`;
          break;
        case "twilio":
          url = `${getTwilioUrl()}/health`;
          break;
        case "n8n":
          url = `${getN8nUrl()}/healthz`;
          break;
        default:
          throw new Error("Unknown service");
      }

      const response = await fetch(url, {
        method: "GET",
        headers:
          service === "twenty" && settings.twentyApiKey
            ? { Authorization: `Bearer ${settings.twentyApiKey}` }
            : {},
      });

      if (response.ok) {
        setStatuses((prev) => ({ ...prev, [service]: "connected" }));
        message.success(`${service} connected!`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err: any) {
      setStatuses((prev) => ({ ...prev, [service]: "failed" }));
      setErrors((prev) => ({ ...prev, [service]: err.message }));
      message.error(`${service} connection failed: ${err.message}`);
    }
  };

  const StatusIcon = ({ status }: { status: ConnectionStatus }) => {
    switch (status) {
      case "testing":
        return <LoadingOutlined style={{ color: "#1890ff" }} />;
      case "connected":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "failed":
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <Tag>Not tested</Tag>;
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Title level={2} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 12 }} />
          Settings
        </Title>
        <Button danger onClick={resetSettings} data-testid="button-reset-settings">
          Reset to Defaults
        </Button>
      </div>

      <Alert
        message="Network Configuration"
        description="Configure connections to your local network services. Settings are saved in your browser."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="Network" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="Backend Host (IP or hostname)">
            <Input
              value={settings.backendHost}
              onChange={(e) => updateSettings({ backendHost: e.target.value })}
              placeholder="192.168.1.23"
              addonBefore={<ApiOutlined />}
              data-testid="input-backend-host"
            />
          </Form.Item>
          <Text type="secondary">
            This is the base address for all backend services (admiral-server)
          </Text>
        </Form>
      </Card>

      <Card
        title={
          <>
            <DatabaseOutlined /> Twenty CRM
          </>
        }
        extra={<StatusIcon status={statuses.twenty} />}
        style={{ marginBottom: 16 }}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Port">
                <Input
                  value={settings.twentyCrmPort}
                  onChange={(e) => updateSettings({ twentyCrmPort: e.target.value })}
                  placeholder="3001"
                  data-testid="input-twenty-port"
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="API Key (JWT Token)">
                <Input.Password
                  value={settings.twentyApiKey}
                  onChange={(e) => updateSettings({ twentyApiKey: e.target.value })}
                  placeholder="Enter Twenty CRM API key"
                  data-testid="input-twenty-api-key"
                />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button onClick={() => testConnection("twenty")} data-testid="button-test-twenty">
              Test Connection
            </Button>
            <Text type="secondary">URL: {getTwentyCrmUrl()}</Text>
          </Space>
          {errors.twenty && <Alert message={errors.twenty} type="error" style={{ marginTop: 8 }} />}
        </Form>
      </Card>

      <Card
        title={
          <>
            <PhoneOutlined /> Twilio Service
          </>
        }
        extra={<StatusIcon status={statuses.twilio} />}
        style={{ marginBottom: 16 }}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Port">
                <Input
                  value={settings.twilioPort}
                  onChange={(e) => updateSettings({ twilioPort: e.target.value })}
                  placeholder="4115"
                  data-testid="input-twilio-port"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Account SID">
                <Input.Password
                  value={settings.twilioAccountSid}
                  onChange={(e) => updateSettings({ twilioAccountSid: e.target.value })}
                  placeholder="ACxxxxxxxx"
                  data-testid="input-twilio-sid"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Auth Token">
                <Input.Password
                  value={settings.twilioAuthToken}
                  onChange={(e) => updateSettings({ twilioAuthToken: e.target.value })}
                  placeholder="Auth token"
                  data-testid="input-twilio-token"
                />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button onClick={() => testConnection("twilio")} data-testid="button-test-twilio">
              Test Connection
            </Button>
            <Text type="secondary">URL: {getTwilioUrl()}</Text>
          </Space>
          {errors.twilio && <Alert message={errors.twilio} type="error" style={{ marginTop: 8 }} />}
        </Form>
      </Card>

      <Card
        title={
          <>
            <AudioOutlined /> Transcription Service
          </>
        }
        extra={<StatusIcon status={statuses.transcription} />}
        style={{ marginBottom: 16 }}
      >
        <Form layout="vertical">
          <Form.Item label="WebSocket Port">
            <Input
              value={settings.transcriptionPort}
              onChange={(e) => updateSettings({ transcriptionPort: e.target.value })}
              placeholder="4116"
              style={{ maxWidth: 200 }}
              data-testid="input-transcription-port"
            />
          </Form.Item>
          <Text type="secondary">WebSocket connections will be tested when dialer connects</Text>
        </Form>
      </Card>

      <Card
        title={
          <>
            <ApiOutlined /> n8n Workflows
          </>
        }
        extra={<StatusIcon status={statuses.n8n} />}
        style={{ marginBottom: 16 }}
      >
        <Form layout="vertical">
          <Form.Item label="Port">
            <Input
              value={settings.n8nPort}
              onChange={(e) => updateSettings({ n8nPort: e.target.value })}
              placeholder="5678"
              style={{ maxWidth: 200 }}
              data-testid="input-n8n-port"
            />
          </Form.Item>
          <Space>
            <Button onClick={() => testConnection("n8n")} data-testid="button-test-n8n">
              Test Connection
            </Button>
            <Text type="secondary">URL: {getN8nUrl()}</Text>
          </Space>
          {errors.n8n && <Alert message={errors.n8n} type="error" style={{ marginTop: 8 }} />}
        </Form>
      </Card>

      <Card
        title={
          <>
            <CalendarOutlined /> Calendly
          </>
        }
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="API Key (Personal Access Token)">
                <Input.Password
                  value={settings.calendlyApiKey}
                  onChange={(e) => updateSettings({ calendlyApiKey: e.target.value })}
                  placeholder="Enter Calendly API key"
                  data-testid="input-calendly-api-key"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Event Type URI">
                <Input
                  value={settings.calendlyEventTypeUri}
                  onChange={(e) => updateSettings({ calendlyEventTypeUri: e.target.value })}
                  placeholder="https://api.calendly.com/event_types/XXXXX"
                  data-testid="input-calendly-event-uri"
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Get this from Calendly API: GET /event_types
                </Text>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
