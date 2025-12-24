import { useState, useCallback } from "react";
import { getSettings, getEmailApiUrl } from "../lib/settings";

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

    if (settings.useNativePhone || !settings.smtpHost) {
      const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, "_blank");
      return;
    }

    if (!settings.emailFrom) {
      setError("Sender email not configured in settings");
      throw new Error("Sender email not configured");
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch(getEmailApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          from: settings.emailFrom,
          subject,
          body,
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPassword: settings.smtpPassword,
        }),
      });

      if (!response.ok) {
        throw new Error("Email send failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send email");
      throw e;
    } finally {
      setSending(false);
    }
  }, [recipientEmail]);

  const clearEmails = useCallback(() => setEmails([]), []);

  return { emails, sending, error, sendEmail, clearEmails, setEmails };
}
