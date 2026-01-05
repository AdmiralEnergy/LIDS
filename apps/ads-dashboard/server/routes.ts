import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertActivitySchema } from "@shared/schema";
import chatRouter from "./chat-routes";

// Runtime env vars (dotenv loaded in index.ts)
const BACKEND_HOST = process.env.BACKEND_HOST;
const TWENTY_API_URL = process.env.TWENTY_API_URL || (BACKEND_HOST ? `http://${BACKEND_HOST}:3001` : "");
const TWENTY_API_KEY = process.env.TWENTY_API_KEY || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Mount Admiral Chat routes
  app.use("/api/chat", chatRouter);

  app.get("/api/leads", async (req, res) => {
    const leads = await storage.getLeads();
    res.json({ data: leads, total: leads.length });
  });

  app.get("/api/leads/:id", async (req, res) => {
    const lead = await storage.getLead(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json({ data: lead });
  });

  app.post("/api/leads", async (req, res) => {
    const result = insertLeadSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }
    const lead = await storage.createLead(result.data);
    res.status(201).json({ data: lead });
  });

  app.patch("/api/leads/:id", async (req, res) => {
    const lead = await storage.updateLead(req.params.id, req.body);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json({ data: lead });
  });

  app.delete("/api/leads/:id", async (req, res) => {
    const deleted = await storage.deleteLead(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json({ success: true });
  });

  app.get("/api/activities", async (req, res) => {
    const leadId = req.query.leadId as string;
    const activities = leadId 
      ? await storage.getActivitiesByLeadId(leadId)
      : await storage.getActivities();
    res.json({ data: activities, total: activities.length });
  });

  app.post("/api/activities", async (req, res) => {
    const result = insertActivitySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }
    const activity = await storage.createActivity(result.data);
    res.status(201).json({ data: activity });
  });

  app.post("/api/twenty/graphql", async (req, res) => {
    if (!TWENTY_API_URL || !TWENTY_API_KEY) {
      return res.status(503).json({ 
        error: "Twenty API not configured",
        connected: false 
      });
    }

    try {
      const response = await fetch(`${TWENTY_API_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TWENTY_API_KEY}`,
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error(`Twenty API returned ${response.status}`);
      }

      const data = await response.json();
      
      const hasErrors = data.errors && data.errors.length > 0;
      const hasData = data.data && Object.keys(data.data).length > 0;
      
      if (hasErrors) {
        console.warn("Twenty GraphQL errors:", data.errors);
      }
      
      res.json({ 
        ...data, 
        connected: true,
        hasErrors: hasErrors,
        usable: hasData && !hasErrors
      });
    } catch (error) {
      console.error("Twenty API error:", error);
      res.status(503).json({ 
        error: error instanceof Error ? error.message : "Connection failed",
        connected: false 
      });
    }
  });

  app.post("/api/import/leads", async (req, res) => {
    const { rows, mappings, assignedRep } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No rows provided" });
    }

    if (!mappings || !Array.isArray(mappings)) {
      return res.status(400).json({ error: "No mappings provided" });
    }

    // Log assignment info for debugging
    if (assignedRep) {
      console.log(`[Import] Assigning ${rows.length} leads to: ${assignedRep}`);
    }

    const results: { success: boolean; error?: string; id?: string }[] = [];

    for (const row of rows) {
      const personData: Record<string, any> = {};

      for (const mapping of mappings) {
        const value = row[mapping.csvColumn]?.trim();
        if (value) {
          personData[mapping.twentyField] = value;
        }
      }

      if (!personData.firstName && !personData.lastName) {
        results.push({ success: false, error: "Missing first or last name" });
        continue;
      }

      if (TWENTY_API_URL && TWENTY_API_KEY) {
        try {
          const mutation = `
            mutation CreatePerson($data: PersonCreateInput!) {
              createPerson(data: $data) {
                id
              }
            }
          `;

          const createData: Record<string, any> = {
            name: {
              firstName: personData.firstName || "",
              lastName: personData.lastName || "",
            },
          };

          if (personData.email) {
            createData.emails = { primaryEmail: personData.email };
          }
          if (personData.phone) {
            createData.phones = { primaryPhoneNumber: personData.phone };
          }
          if (personData.company) {
            createData.jobTitle = personData.company;
          }
          // Add rep assignment if provided
          if (assignedRep) {
            createData.assignedRep = assignedRep;
          }

          const response = await fetch(`${TWENTY_API_URL}/graphql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${TWENTY_API_KEY}`,
            },
            body: JSON.stringify({
              query: mutation,
              variables: { data: createData },
            }),
          });

          const data = await response.json();

          if (data.errors && data.errors.length > 0) {
            results.push({ success: false, error: data.errors[0].message });
          } else if (data.data?.createPerson?.id) {
            results.push({ success: true, id: data.data.createPerson.id });
          } else {
            results.push({ success: false, error: "Unknown error" });
          }
        } catch (error) {
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : "Request failed" 
          });
        }
      } else {
        const lead = await storage.createLead({
          name: `${personData.firstName || ""} ${personData.lastName || ""}`.trim(),
          email: personData.email || "",
          phone: personData.phone || null,
          company: personData.company || null,
          stage: "new",
          status: "new",
          icpScore: 50,
          source: "CSV Import",
        });
        results.push({ success: true, id: lead.id });
      }
    }

    res.json({
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });
  });

  app.get("/api/twenty/status", async (req, res) => {
    if (!TWENTY_API_URL || !TWENTY_API_KEY) {
      return res.json({ 
        connected: false, 
        error: "Twenty API not configured",
        url: TWENTY_API_URL ? "configured" : "missing"
      });
    }

    try {
      const response = await fetch(`${TWENTY_API_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TWENTY_API_KEY}`,
        },
        body: JSON.stringify({ 
          query: "{ __typename }" 
        }),
      });

      if (response.ok) {
        res.json({ connected: true, url: TWENTY_API_URL });
      } else {
        res.json({ connected: false, error: `HTTP ${response.status}` });
      }
    } catch (error) {
      res.json({ 
        connected: false, 
        error: error instanceof Error ? error.message : "Connection failed" 
      });
    }
  });

  // ============ EMAIL API (Resend) ============
  app.post("/api/email/send", async (req, res) => {
    if (!RESEND_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "Email service not configured. Please set RESEND_API_KEY environment variable.",
      });
    }

    const { to, subject, body, from } = req.body;

    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: to, subject, body",
      });
    }

    // Force correct domain - admiralenergy.ai is verified in Resend
    const verifiedFrom = "Admiral Energy <sales@admiralenergy.ai>";
    console.log("[Email] Requested from:", from, "-> Using:", verifiedFrom);

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: verifiedFrom,
          to: [to],
          subject,
          html: body.replace(/\n/g, "<br>"), // Convert newlines to HTML
          text: body,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Email] Resend API error:", response.status, errorData);
        return res.status(response.status).json({
          success: false,
          error: errorData.message || `Email service error (${response.status})`,
        });
      }

      const result = await response.json();
      console.log("[Email] Sent successfully:", result.id);

      res.json({
        success: true,
        messageId: result.id,
      });
    } catch (error) {
      console.error("[Email] Failed to send:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      });
    }
  });

  // ============ SMS WEBHOOKS ============
  // Twilio SMS inbound and status webhooks
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
  // Configured in Twilio: POST https://lids.ripemerchant.host/api/ads/dialer/sms/inbound
  app.post("/api/ads/dialer/sms/inbound", async (req, res) => {
    const { From, To, Body, MessageSid, AccountSid } = req.body;

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
  // Configured in Twilio: POST https://lids.ripemerchant.host/api/ads/dialer/sms/status
  app.post("/api/ads/dialer/sms/status", async (req, res) => {
    const { MessageSid, MessageStatus, To, ErrorCode, ErrorMessage } = req.body;

    console.log(`[SMS Status] SID: ${MessageSid}, Status: ${MessageStatus}, To: ${To}`);

    if (ErrorCode) {
      console.error(`[SMS Status] Error ${ErrorCode}: ${ErrorMessage}`);
    }

    // Acknowledge the webhook
    res.sendStatus(200);
  });

  // Get recent inbound SMS messages (for client polling)
  app.get("/api/ads/dialer/sms/inbound", async (req, res) => {
    const since = req.query.since ? new Date(req.query.since as string) : null;
    const phoneNumber = req.query.phone as string;

    let messages = inboundSmsMessages;

    // Filter by timestamp if provided
    if (since) {
      messages = messages.filter(m => m.timestamp > since);
    }

    // Filter by phone number if provided
    if (phoneNumber) {
      const normalized = phoneNumber.replace(/\D/g, "");
      messages = messages.filter(m =>
        m.from.replace(/\D/g, "").includes(normalized) ||
        m.to.replace(/\D/g, "").includes(normalized)
      );
    }

    res.json({ messages, count: messages.length });
  });

  return httpServer;
}
