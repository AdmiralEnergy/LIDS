/**
 * ChatPanel.tsx - Embeddable team chat component
 *
 * Extracted from pages/chat.tsx for use in Dialer panel.
 * Shows team chat with channels and messages.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../lib/user-context";
import { Typography, Input, Button, List, Badge, Spin, Avatar, Empty } from "antd";
import {
  MessageOutlined,
  SendOutlined,
  NumberOutlined,
  UserOutlined,
  ReloadOutlined
} from "@ant-design/icons";

const { Text } = Typography;

interface Channel {
  id: string;
  type: "public" | "private" | "dm";
  name: string | null;
  slug: string | null;
  unreadCount?: number;
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

interface ChatPanelProps {
  /** Current user's workspace member ID */
  currentUserId?: string;
  /** Compact mode for embedding */
  compact?: boolean;
}

const API_BASE = "/api/chat";

export function ChatPanel({ currentUserId, compact = false }: ChatPanelProps) {
  const { currentUser } = useUser();
  const userId = currentUserId || currentUser?.id;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "x-workspace-member-id": userId || "",
    "x-workspace-member-name": currentUser?.name || currentUser?.email || "",
  }), [userId, currentUser]);

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
    if (userId) {
      fetchChannels();
    }
  }, [userId, fetchChannels]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (activeChannel) {
      fetchMessages();
    }
  }, [activeChannel, fetchMessages]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 10000);
    return () => clearInterval(interval);
  }, [userId, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!userId) {
    return (
      <Empty
        description={<Text style={{ color: "rgba(255,255,255,0.45)" }}>Please log in to access chat.</Text>}
        style={{ padding: compact ? 24 : 48 }}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: compact ? 24 : 48 }}>
        <Spin />
      </div>
    );
  }

  const panelHeight = compact ? 300 : 400;

  return (
    <div style={{ display: "flex", height: panelHeight, background: "#0a1929", borderRadius: 8, overflow: "hidden" }}>
      {/* Channel Sidebar */}
      <div style={{
        width: compact ? 140 : 180,
        borderRight: "1px solid #1e3a5f",
        display: "flex",
        flexDirection: "column",
        background: "#0c2340"
      }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Channels</Text>
          <Button type="text" size="small" icon={<ReloadOutlined />} onClick={fetchChannels} style={{ color: "rgba(255,255,255,0.5)" }} />
        </div>

        <List
          style={{ flex: 1, overflow: "auto" }}
          dataSource={channels}
          size="small"
          renderItem={(channel) => (
            <List.Item
              onClick={() => setActiveChannel(channel)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: activeChannel?.id === channel.id ? "#1e3a5f" : "transparent",
                borderBottom: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 6 }}>
                {channel.type === "dm" ? (
                  <UserOutlined style={{ color: "#c9a648", fontSize: 12 }} />
                ) : (
                  <NumberOutlined style={{ color: "#c9a648", fontSize: 12 }} />
                )}
                <Text style={{ color: "#fff", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {channel.name || channel.slug}
                </Text>
                {channel.unreadCount ? <Badge count={channel.unreadCount} size="small" /> : null}
              </div>
            </List.Item>
          )}
        />
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Messages */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 6
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <MessageOutlined style={{ fontSize: 32, color: "rgba(255,255,255,0.1)", marginBottom: 8 }} />
              <Text style={{ color: "rgba(255,255,255,0.45)", display: "block", fontSize: 12 }}>
                No messages yet
              </Text>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === userId;
              const isSystem = msg.messageType === "system" || msg.messageType === "sequence";

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: isOwn ? "row-reverse" : "row",
                    alignItems: "flex-start",
                    gap: 6,
                  }}
                >
                  {!isOwn && (
                    <Avatar
                      size="small"
                      style={{
                        background: isSystem ? "#c9a648" : "#1890ff",
                        flexShrink: 0,
                        width: 24,
                        height: 24,
                        fontSize: 10,
                      }}
                    >
                      {(msg.senderName || "?")[0].toUpperCase()}
                    </Avatar>
                  )}
                  <div style={{
                    maxWidth: "80%",
                    background: isSystem ? "#2d4a3e" : isOwn ? "#1e4976" : "#1e3a5f",
                    padding: "6px 10px",
                    borderRadius: 6,
                  }}>
                    {!isOwn && (
                      <Text style={{
                        color: isSystem ? "#c9a648" : "#1890ff",
                        fontSize: 10,
                        display: "block",
                        marginBottom: 2
                      }}>
                        {msg.senderName || "Unknown"}
                      </Text>
                    )}
                    <Text style={{ color: "#fff", whiteSpace: "pre-wrap", fontSize: 12 }}>{msg.content}</Text>
                    <Text style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 9,
                      display: "block",
                      marginTop: 2,
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
          padding: 8,
          borderTop: "1px solid #1e3a5f",
          background: "#0c2340",
          display: "flex",
          gap: 8,
        }}>
          <Input
            placeholder={activeChannel ? `Message #${activeChannel.name || activeChannel.slug}` : "Select a channel"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onPressEnter={sendMessage}
            disabled={!activeChannel || sending}
            size="small"
            style={{
              flex: 1,
              background: "#0a1929",
              borderColor: "#1e3a5f",
              color: "#fff",
              fontSize: 12,
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            loading={sending}
            disabled={!activeChannel || !newMessage.trim()}
            size="small"
            style={{ background: "#c9a648", borderColor: "#c9a648" }}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
