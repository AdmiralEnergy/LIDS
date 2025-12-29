import { Router } from "express";

const router = Router();

// In-memory store for received SMS (will be synced to client via polling)
const inboundSmsMessages: Array<{
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  twilioSid: string;
}> = [];

// Inbound SMS webhook - receives incoming SMS from Twilio
// Configured in Twilio: POST https://helm.ripemerchant.host/api/ads/dialer/sms/inbound
router.post("/inbound", async (req, res) => {
  const { From, To, Body, MessageSid } = req.body;

  console.log(`[SMS Inbound] From: ${From}, To: ${To}, Body: ${Body?.substring(0, 50)}...`);

  // Store the message
  const message = {
    id: MessageSid || `msg_${Date.now()}`,
    from: From,
    to: To,
    body: Body || "",
    timestamp: new Date(),
    twilioSid: MessageSid || "",
  };
  inboundSmsMessages.unshift(message);

  // Keep only last 100 messages in memory
  if (inboundSmsMessages.length > 100) {
    inboundSmsMessages.pop();
  }

  // Return TwiML response (empty response = no auto-reply)
  res.set("Content-Type", "text/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
});

// SMS status callback - receives delivery status updates
// Configured in Twilio: POST https://helm.ripemerchant.host/api/ads/dialer/sms/status
router.post("/status", async (req, res) => {
  const { MessageSid, MessageStatus, To, ErrorCode, ErrorMessage } = req.body;

  console.log(`[SMS Status] SID: ${MessageSid}, Status: ${MessageStatus}, To: ${To}`);

  if (ErrorCode) {
    console.error(`[SMS Status] Error ${ErrorCode}: ${ErrorMessage}`);
  }

  // Acknowledge the webhook
  res.sendStatus(200);
});

// Get recent inbound SMS messages (for client polling)
router.get("/inbound", async (req, res) => {
  const since = req.query.since ? new Date(req.query.since as string) : null;
  const phoneNumber = req.query.phone as string;

  let messages = inboundSmsMessages;

  // Filter by timestamp if provided
  if (since) {
    messages = messages.filter((m) => m.timestamp > since);
  }

  // Filter by phone number if provided
  if (phoneNumber) {
    const normalized = phoneNumber.replace(/\D/g, "");
    messages = messages.filter(
      (m) =>
        m.from.replace(/\D/g, "").includes(normalized) ||
        m.to.replace(/\D/g, "").includes(normalized)
    );
  }

  res.json({ messages, count: messages.length });
});

export { router as smsRoutes };
