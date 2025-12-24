import { useState, useCallback } from "react";
import { getSettings, getSmsUrl } from "../lib/settings";

export interface SmsMessage {
  id: string;
  direction: "sent" | "received";
  text: string;
  timestamp: Date;
  status?: "sending" | "sent" | "delivered" | "failed";
}

export function useSms(phoneNumber: string) {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendSms = useCallback(async (text: string) => {
    if (!text.trim() || !phoneNumber) return;

    const settings = getSettings();

    if (!settings.smsEnabled) {
      setError("SMS is disabled in settings");
      return;
    }

    const newMessage: SmsMessage = {
      id: crypto.randomUUID(),
      direction: "sent",
      text,
      timestamp: new Date(),
      status: "sending",
    };

    setMessages(prev => [...prev, newMessage]);
    setSending(true);
    setError(null);

    try {
      if (settings.smsPhoneNumber) {
        const response = await fetch(`${getSmsUrl()}/sms/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: phoneNumber,
            from: settings.smsPhoneNumber,
            body: text,
          }),
        });

        if (!response.ok) {
          throw new Error("SMS send failed");
        }

        setMessages(prev =>
          prev.map(m => m.id === newMessage.id ? { ...m, status: "sent" } : m)
        );
      } else {
        await new Promise(r => setTimeout(r, 500));
        setMessages(prev =>
          prev.map(m => m.id === newMessage.id ? { ...m, status: "sent" } : m)
        );
      }
    } catch (e) {
      setError("Failed to send SMS");
      setMessages(prev =>
        prev.map(m => m.id === newMessage.id ? { ...m, status: "failed" } : m)
      );
    } finally {
      setSending(false);
    }
  }, [phoneNumber]);

  const clearMessages = useCallback(() => setMessages([]), []);

  const simulateReceived = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      direction: "received",
      text,
      timestamp: new Date(),
    }]);
  }, []);

  return { messages, sending, error, sendSms, clearMessages, simulateReceived };
}
