import { useState, useCallback } from "react";
import { getSettings } from "../lib/settings";

export interface EmailMessage {
  id: string;
  direction: "sent" | "received";
  subject: string;
  body: string;
  timestamp: Date;
  status?: "sending" | "sent" | "delivered" | "failed";
}

export function useEmail(recipientEmail: string) {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = useCallback(async (subject: string, body: string): Promise<void> => {
    if (!recipientEmail) {
      throw new Error("Recipient email required");
    }

    const settings = getSettings();

    if (!settings.emailEnabled) {
      setError("Email is disabled in settings");
      throw new Error("Email is disabled in settings");
    }

    if (settings.useNativePhone) {
      const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, "_blank");
      return;
    }

    const sender = settings.emailFrom || "Admiral Energy <sales@admiralenergy.com>";

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          from: sender,
          subject,
          body,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Email send failed");
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to send email";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSending(false);
    }
  }, [recipientEmail]);

  const clearEmails = useCallback(() => setEmails([]), []);

  return { emails, sending, error, sendEmail, clearEmails, setEmails };
}
