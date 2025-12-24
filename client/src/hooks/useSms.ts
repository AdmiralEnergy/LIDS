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

  const sendSms = useCallback(async (text: string): Promise<void> => {
    if (!text.trim() || !phoneNumber) {
      throw new Error("Phone number and message required");
    }

    const settings = getSettings();

    if (!settings.smsEnabled) {
      setError("SMS is disabled in settings");
      throw new Error("SMS is disabled in settings");
    }

    if (settings.useNativePhone) {
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(text)}`;
      window.open(smsUrl, "_self");
      return;
    }

    if (!settings.smsPhoneNumber) {
      setError("SMS phone number not configured in settings");
      throw new Error("SMS phone number not configured");
    }

    setSending(true);
    setError(null);

    try {
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
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "SMS send failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send SMS");
      throw e;
    } finally {
      setSending(false);
    }
  }, [phoneNumber]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, sending, error, sendSms, clearMessages, setMessages };
}
