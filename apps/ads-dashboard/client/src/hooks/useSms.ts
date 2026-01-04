import { useState, useCallback, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings, getSmsUrl } from "../lib/settings";
import { db, SmsMessage as DbSmsMessage } from "../lib/db";

export interface SmsMessage {
  id: string | number;
  direction: "sent" | "received";
  text: string;
  timestamp: Date;
  status?: "pending" | "sent" | "delivered" | "failed";
}

// Global last poll timestamp for deduplication
let lastInboundPoll = new Date(Date.now() - 60000); // Start from 1 minute ago

export function useSms(phoneNumber: string, leadId?: string) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for inbound SMS messages from server
  const pollInboundMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/ads/dialer/sms/inbound?since=${lastInboundPoll.toISOString()}`
      );
      if (!response.ok) return;

      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        // Update last poll time to newest message
        lastInboundPoll = new Date();

        // Add each new message to Dexie
        for (const msg of data.messages) {
          // Check if we already have this message
          const existing = await db.smsMessages
            .where("twilioSid")
            .equals(msg.twilioSid)
            .first();

          if (!existing) {
            await db.smsMessages.add({
              leadId: leadId || "",
              phoneNumber: msg.from,
              direction: "received",
              text: msg.body,
              status: "delivered",
              timestamp: new Date(msg.timestamp),
              twilioSid: msg.twilioSid,
            } as DbSmsMessage);
          }
        }
      }
    } catch (e) {
      console.warn("[SMS Poll] Failed to fetch inbound messages:", e);
    }
  }, [leadId]);

  // Start polling when component mounts
  useEffect(() => {
    const settings = getSettings();
    if (!settings.smsEnabled || settings.useNativePhone) return;

    // Poll immediately
    pollInboundMessages();

    // Poll every 10 seconds
    pollIntervalRef.current = setInterval(pollInboundMessages, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pollInboundMessages]);

  // Fetch messages from Dexie with live updates
  const messages = useLiveQuery(
    async () => {
      if (!phoneNumber && !leadId) return [];

      let query = db.smsMessages.orderBy("timestamp");

      if (leadId) {
        query = db.smsMessages.where("leadId").equals(leadId).reverse();
      } else if (phoneNumber) {
        // Normalize phone number for comparison
        const normalized = phoneNumber.replace(/\D/g, "");
        query = db.smsMessages
          .filter((msg) => msg.phoneNumber.replace(/\D/g, "") === normalized)
          .reverse() as any;
      }

      return query.limit(50).toArray();
    },
    [phoneNumber, leadId],
    []
  );

  const sendSms = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim() || !phoneNumber) {
        throw new Error("Phone number and message required");
      }

      const settings = getSettings();

      if (!settings.smsEnabled) {
        setError("SMS is disabled in settings");
        throw new Error("SMS is disabled in settings");
      }

      // Create pending message in Dexie
      const pendingMessage: Omit<DbSmsMessage, "id"> = {
        leadId: leadId || "",
        phoneNumber: phoneNumber,
        direction: "sent",
        text: text.trim(),
        status: "pending",
        timestamp: new Date(),
      };

      const messageId = await db.smsMessages.add(pendingMessage as DbSmsMessage);

      // If native mode, open SMS app
      if (settings.useNativePhone) {
        const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(text)}`;
        window.open(smsUrl, "_self");
        // Mark as sent (we can't confirm delivery in native mode)
        await db.smsMessages.update(messageId, { status: "sent" });
        return;
      }

      if (!settings.smsPhoneNumber) {
        await db.smsMessages.update(messageId, { status: "failed" });
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
          await db.smsMessages.update(messageId, { status: "failed" });
          throw new Error(errData.message || "SMS send failed");
        }

        const result = await response.json().catch(() => ({}));

        // Update message with Twilio SID and status
        await db.smsMessages.update(messageId, {
          status: "sent",
          twilioSid: result.sid,
        });
      } catch (e) {
        await db.smsMessages.update(messageId, { status: "failed" });
        setError(e instanceof Error ? e.message : "Failed to send SMS");
        throw e;
      } finally {
        setSending(false);
      }
    },
    [phoneNumber, leadId]
  );

  const clearMessages = useCallback(async () => {
    if (leadId) {
      await db.smsMessages.where("leadId").equals(leadId).delete();
    } else if (phoneNumber) {
      const normalized = phoneNumber.replace(/\D/g, "");
      const toDelete = await db.smsMessages
        .filter((msg) => msg.phoneNumber.replace(/\D/g, "") === normalized)
        .toArray();
      await db.smsMessages.bulkDelete(toDelete.map((m) => m.id!));
    }
  }, [phoneNumber, leadId]);

  // Convert DB messages to hook format
  const formattedMessages: SmsMessage[] = (messages || []).map((msg) => ({
    id: msg.id!,
    direction: msg.direction,
    text: msg.text,
    timestamp: new Date(msg.timestamp),
    status: msg.status,
  }));

  return {
    messages: formattedMessages,
    sending,
    error,
    sendSms,
    clearMessages,
  };
}

// Helper to add received SMS (for webhook integration)
export async function addReceivedSms(
  leadId: string,
  phoneNumber: string,
  text: string,
  twilioSid?: string
): Promise<void> {
  await db.smsMessages.add({
    leadId,
    phoneNumber,
    direction: "received",
    text,
    status: "delivered",
    timestamp: new Date(),
    twilioSid,
  } as DbSmsMessage);
}

// Standalone function to send SMS to any phone number (not tied to hook state)
export async function sendSmsToNumber(
  to: string,
  text: string,
  leadId?: string
): Promise<void> {
  if (!to.trim() || !text.trim()) {
    throw new Error("Phone number and message required");
  }

  const settings = getSettings();

  if (!settings.smsEnabled) {
    throw new Error("SMS is disabled in settings");
  }

  // Normalize phone number
  const normalizedTo = to.replace(/\D/g, "");
  const formattedTo = normalizedTo.length === 10 ? `+1${normalizedTo}` : normalizedTo.length === 11 ? `+${normalizedTo}` : to;

  // Create pending message in Dexie
  const pendingMessage: Omit<DbSmsMessage, "id"> = {
    leadId: leadId || "",
    phoneNumber: formattedTo,
    direction: "sent",
    text: text.trim(),
    status: "pending",
    timestamp: new Date(),
  };

  const messageId = await db.smsMessages.add(pendingMessage as DbSmsMessage);

  // If native mode, open SMS app
  if (settings.useNativePhone) {
    const smsUrl = `sms:${formattedTo}?body=${encodeURIComponent(text)}`;
    window.open(smsUrl, "_self");
    await db.smsMessages.update(messageId, { status: "sent" });
    return;
  }

  if (!settings.smsPhoneNumber) {
    await db.smsMessages.update(messageId, { status: "failed" });
    throw new Error("SMS phone number not configured");
  }

  try {
    const response = await fetch(`${getSmsUrl()}/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: formattedTo,
        from: settings.smsPhoneNumber,
        body: text,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      await db.smsMessages.update(messageId, { status: "failed" });
      throw new Error(errData.message || "SMS send failed");
    }

    const result = await response.json().catch(() => ({}));
    await db.smsMessages.update(messageId, {
      status: "sent",
      twilioSid: result.sid,
    });
  } catch (e) {
    await db.smsMessages.update(messageId, { status: "failed" });
    throw e;
  }
}

// Get all conversations (grouped by lead)
export async function getConversations(): Promise<
  Array<{ leadId: string; phoneNumber: string; lastMessage: string; timestamp: Date; unread: number }>
> {
  const allMessages = await db.smsMessages.orderBy("timestamp").reverse().toArray();

  const conversationMap = new Map<
    string,
    { leadId: string; phoneNumber: string; lastMessage: string; timestamp: Date; unread: number }
  >();

  for (const msg of allMessages) {
    const key = msg.leadId || msg.phoneNumber;
    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        leadId: msg.leadId,
        phoneNumber: msg.phoneNumber,
        lastMessage: msg.text,
        timestamp: new Date(msg.timestamp),
        unread: msg.direction === "received" ? 1 : 0,
      });
    } else if (msg.direction === "received") {
      const conv = conversationMap.get(key)!;
      conv.unread++;
    }
  }

  return Array.from(conversationMap.values());
}
