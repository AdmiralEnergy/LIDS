// ADS Dashboard - Chat Page
// Team communication via Admiral Chat
// TODO: Import ChatWindow from @lids/admiral-chat when package is ready

import { useUser } from "../lib/user-context";
import { Typography, Card } from "antd";
import { MessageOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export function ChatPage() {
  const { currentUser } = useUser();

  if (!currentUser) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 32 }}>
        <Text style={{ color: "rgba(255,255,255,0.45)" }}>Please log in to access chat.</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <Title level={2} style={{ color: "#fff", marginBottom: 24 }}>
        <MessageOutlined style={{ marginRight: 12, color: "#c9a648" }} />
        Team Chat
      </Title>
      <Card style={{ background: "#0f3654", border: "none" }}>
        <div style={{ textAlign: "center", padding: 48 }}>
          <MessageOutlined style={{ fontSize: 64, color: "rgba(255,255,255,0.2)", marginBottom: 24 }} />
          <Title level={4} style={{ color: "rgba(255,255,255,0.65)" }}>
            Coming Soon
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.45)" }}>
            Team chat integration is under development.
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default ChatPage;
