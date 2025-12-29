// ADS Dashboard - Chat Page
// Team communication via Admiral Chat

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../lib/user-context";
import { Typography, Input, Button, List, Badge, Spin, Avatar, Tooltip } from "antd";
import {
  MessageOutlined,
  SendOutlined,
  TeamOutlined,
  NumberOutlined,
  UserOutlined,
  ReloadOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface Channel {
  id: string;
  type: "public" | "private" | "dm";
  name: string | null;
  slug: string | null;
  unreadCount?: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
}

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string | null;
  content: string;
  messageType: string;
  createdAt: string;
}

const API_BASE = "/api/chat";

export function ChatPage() {
  const { currentUser } = useUser();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "x-workspace-member-id": currentUser?.id || "",
    "x-workspace-member-name": currentUser?.name || currentUser?.email || "",
  }), [currentUser]);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/channels`, { headers: getHeaders() });
      const data = await res.json();
      setChannels(data);
      if (!activeChannel && data.length > 0) {
        setActiveChannel(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch channels:", err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, activeChannel]);

  // Fetch messages for active channel
  const fetchMessages = useCallback(async () => {
    if (!activeChannel) return;
    try {
      const res = await fetch(`${API_BASE}/channels/${activeChannel.id}/messages`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [activeChannel, getHeaders]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/channels/${activeChannel.id}/messages`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
        await fetchMessages();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (currentUser) {
      fetchChannels();
    }
  }, [currentUser, fetchChannels]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (activeChannel) {
      fetchMessages();
    }
  }, [activeChannel, fetchMessages]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentUser) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 32 }}>
        <Text style={{ color: "rgba(255,255,255,0.45)" }}>Please log in to access chat.</Text>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", background: "#0a1929" }}>
      {/* Channel Sidebar */}
      <div style={{
        width: 240,
        borderRight: "1px solid #1e3a5f",
        display: "flex",
        flexDirection: "column",
        background: "#0c2340"
      }}>
        <div style={{ padding: 16, borderBottom: "1px solid #1e3a5f" }}>
          <Title level={5} style={{ color: "#fff", margin: 0 }}>
            <TeamOutlined style={{ marginRight: 8, color: "#c9a648" }} />
            Channels
          </Title>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <Spin />
          </div>
        ) : (
          <List
            style={{ flex: 1, overflow: "auto" }}
            dataSource={channels}
            renderItem={(channel) => (
              <List.Item
                onClick={() => setActiveChannel(channel)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  background: activeChannel?.id === channel.id ? "#1e3a5f" : "transparent",
                  borderBottom: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                  {channel.type === "dm" ? (
                    <UserOutlined style={{ color: "#c9a648", marginRight: 8 }} />
                  ) : (
                    <NumberOutlined style={{ color: "#c9a648", marginRight: 8 }} />
                  )}
                  <Text style={{ color: "#fff", flex: 1 }}>{channel.name || channel.slug}</Text>
                  {channel.unreadCount ? (
                    <Badge count={channel.unreadCount} size="small" />
                  ) : null}
                </div>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Channel Header */}
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid #1e3a5f",
          display: "flex",
          alignItems: "center",
          background: "#0c2340"
        }}>
          {activeChannel ? (
            <>
              <NumberOutlined style={{ color: "#c9a648", marginRight: 8, fontSize: 18 }} />
              <Title level={5} style={{ color: "#fff", margin: 0 }}>
                {activeChannel.name || activeChannel.slug}
              </Title>
              <Tooltip title="Refresh">
                <Button
                  type="text"
                  icon={<ReloadOutlined style={{ color: "#fff" }} />}
                  onClick={fetchMessages}
                  style={{ marginLeft: "auto" }}
                />
              </Tooltip>
            </>
          ) : (
            <Text style={{ color: "rgba(255,255,255,0.45)" }}>Select a channel</Text>
          )}
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <MessageOutlined style={{ fontSize: 48, color: "rgba(255,255,255,0.1)", marginBottom: 16 }} />
              <Text style={{ color: "rgba(255,255,255,0.45)", display: "block" }}>
                No messages yet. Start the conversation!
              </Text>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === currentUser?.id;
              const isSystem = msg.messageType === "system" || msg.messageType === "sequence";

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: isOwn ? "row-reverse" : "row",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  {!isOwn && (
                    <Avatar
                      size="small"
                      style={{
                        background: isSystem ? "#c9a648" : "#1890ff",
                        flexShrink: 0
                      }}
                    >
                      {(msg.senderName || "?")[0].toUpperCase()}
                    </Avatar>
                  )}
                  <div style={{
                    maxWidth: "70%",
                    background: isSystem ? "#2d4a3e" : isOwn ? "#1e4976" : "#1e3a5f",
                    padding: "8px 12px",
                    borderRadius: 8,
                  }}>
                    {!isOwn && (
                      <Text style={{
                        color: isSystem ? "#c9a648" : "#1890ff",
                        fontSize: 12,
                        display: "block",
                        marginBottom: 4
                      }}>
                        {msg.senderName || "Unknown"}
                      </Text>
                    )}
                    <Text style={{ color: "#fff", whiteSpace: "pre-wrap" }}>{msg.content}</Text>
                    <Text style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 10,
                      display: "block",
                      marginTop: 4,
                      textAlign: isOwn ? "right" : "left"
                    }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div style={{
          padding: 16,
          borderTop: "1px solid #1e3a5f",
          background: "#0c2340"
        }}>
          <Input.Group compact style={{ display: "flex" }}>
            <Input
              placeholder={activeChannel ? `Message #${activeChannel.name || activeChannel.slug}` : "Select a channel"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onPressEnter={sendMessage}
              disabled={!activeChannel || sending}
              style={{
                flex: 1,
                background: "#0a1929",
                borderColor: "#1e3a5f",
                color: "#fff"
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              loading={sending}
              disabled={!activeChannel || !newMessage.trim()}
              style={{ background: "#c9a648", borderColor: "#c9a648" }}
            >
              Send
            </Button>
          </Input.Group>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
