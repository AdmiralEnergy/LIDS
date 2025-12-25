import { useEffect } from "react";
import { Button, Typography } from "antd";
import { Phone, PhoneOff, Voicemail } from "lucide-react";

const { Title, Text } = Typography;

export interface IncomingCallModalProps {
  visible: boolean;
  callerNumber: string;
  callerName?: string;
  leadId?: string;
  onAccept: () => void;
  onReject: () => void;
  onSendToVoicemail: () => void;
}

export function IncomingCallModal({
  visible,
  callerNumber,
  callerName,
  onAccept,
  onReject,
  onSendToVoicemail,
}: IncomingCallModalProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      onSendToVoicemail();
    }, 30000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [onSendToVoicemail, visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 47, 74, 0.95)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <style>
        {`
          @keyframes ringPulse {
            0% { transform: scale(0.9); opacity: 0.3; }
            50% { transform: scale(1.05); opacity: 0.6; }
            100% { transform: scale(0.9); opacity: 0.3; }
          }
          @keyframes iconPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.08); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          background: "rgba(247, 245, 242, 0.06)",
          border: "1px solid rgba(201, 166, 72, 0.4)",
          borderRadius: 16,
          padding: "48px 32px 32px",
          textAlign: "center",
          color: "#f7f5f2",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -110,
            left: "50%",
            transform: "translateX(-50%)",
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "2px solid rgba(201, 166, 72, 0.45)",
            animation: "ringPulse 2.2s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: 84,
            height: 84,
            margin: "0 auto 16px",
            borderRadius: "50%",
            background: "rgba(201, 166, 72, 0.2)",
            border: "1px solid rgba(201, 166, 72, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "iconPulse 1.6s ease-in-out infinite",
          }}
        >
          <Phone size={36} color="#c9a648" />
        </div>
        <Title level={3} style={{ color: "#c9a648", marginBottom: 8 }}>
          Incoming Call
        </Title>
        <Text style={{ display: "block", fontSize: 22, fontWeight: 600, color: "#f7f5f2" }}>
          {callerNumber}
        </Text>
        <Text style={{ display: "block", marginTop: 8, color: "rgba(247, 245, 242, 0.7)" }}>
          {callerName || "Unknown Caller"}
        </Text>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <Button
            type="primary"
            onClick={onAccept}
            style={{ background: "#22c55e", borderColor: "#22c55e", color: "#0c2f4a" }}
          >
            <Phone size={16} style={{ marginRight: 8 }} />
            Accept
          </Button>
          <Button danger onClick={onReject}>
            <PhoneOff size={16} style={{ marginRight: 8 }} />
            Reject
          </Button>
          <Button onClick={onSendToVoicemail} style={{ background: "#3f4752", borderColor: "#3f4752", color: "#f7f5f2" }}>
            <Voicemail size={16} style={{ marginRight: 8 }} />
            Voicemail
          </Button>
        </div>
      </div>
    </div>
  );
}
