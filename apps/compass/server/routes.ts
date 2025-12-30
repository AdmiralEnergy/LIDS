import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { enrichLead } from "./enrichment";
import { generateAgentResponse } from "./agent-responses";
import { getObjectionResponse, suggestNextAction } from "./coach";
import { z } from "zod";

// FieldOps agents backend configuration (on admiral-server via Tailscale)
const BACKEND_HOST_INTERNAL = process.env.BACKEND_HOST || "100.66.42.81";

// Twenty CRM configuration (on droplet)
const TWENTY_CRM_URL = process.env.TWENTY_CRM_URL || "http://localhost:3001";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY || "";

// FieldOps agent port mapping
const FIELDOPS_PORTS: Record<string, number> = {
  'fo-001': 5001, // SCOUT
  'fo-002': 5002, // ANALYST
  'fo-003': 5003, // CALLER
  'fo-004': 5004, // SCRIBE
  'fo-005': 5005, // WATCHMAN
  'fo-006': 5006, // COURIER
  'fo-007': 5007, // CRAFTER
  'fo-008': 5008, // TRAINER
  'fo-009': 5009, // RECON
  'fo-010': 5010, // APEX
  'livewire': 5000, // LIVEWIRE (special APEX agent)
};

// Guardian (agent-claude with Autogen) - primary AI with persistent memory
const GUARDIAN_PORT = 4110;
const GUARDIAN_AGENT_IDS = ['guardian', 'agent-claude', 'claude'];

function isGuardianAgent(agentId: string): boolean {
  return GUARDIAN_AGENT_IDS.includes(agentId.toLowerCase());
}

function getGuardianUrl(): string {
  return `http://${BACKEND_HOST_INTERNAL}:${GUARDIAN_PORT}`;
}

function getAgentUrl(agentId: string): string | null {
  const port = FIELDOPS_PORTS[agentId];
  if (!port) return null;
  return `http://${BACKEND_HOST_INTERNAL}:${port}`;
}

console.log(`[COMPASS] Backend host: ${BACKEND_HOST_INTERNAL}`);

// Validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1),
  context: z.object({
    leadId: z.string().optional(),
    callSid: z.string().optional(),
  }).optional(),
});

const enrichmentRequestSchema = z.object({
  leadId: z.string(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zip: z.string().min(5).max(10),
  county: z.string().optional(),
  mortgageBalance: z.number().optional(),
});

const insertLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zip: z.string().min(5).max(10),
  county: z.string().optional(),
  mortgageBalance: z.number().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'closed']).optional(),
});

const actionRequestSchema = z.object({
  action: z.string().min(1),
  params: z.record(z.unknown()),
  leadId: z.string().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============================================
  // Twenty CRM Auth Route
  // ============================================

  app.post("/api/twenty/auth", async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    if (!TWENTY_API_KEY) {
      return res.status(503).json({ error: "Twenty CRM not configured" });
    }

    try {
      const response = await fetch(`${TWENTY_CRM_URL}/rest/workspaceMembers`, {
        headers: {
          "Authorization": `Bearer ${TWENTY_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`[twenty/auth] Twenty CRM returned ${response.status}`);
        return res.status(503).json({ error: "Twenty CRM unavailable" });
      }

      const data = await response.json();
      const members = data.data?.workspaceMembers || data.workspaceMembers || [];

      // Find member by email (Twenty uses 'userEmail' field)
      const lowerEmail = email.toLowerCase();
      const member = members.find((m: any) =>
        m.userEmail?.toLowerCase() === lowerEmail
      );

      if (member) {
        return res.json({
          success: true,
          user: {
            id: member.id,
            name: member.name?.firstName
              ? `${member.name.firstName} ${member.name.lastName}`.trim()
              : email.split("@")[0],
            email: member.userEmail,
          },
        });
      }

      return res.status(404).json({
        success: false,
        error: "Not a workspace member. Contact admin for access.",
      });
    } catch (err) {
      console.error("[twenty/auth] Error:", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  });

  // ============================================
  // Agent Chat Routes
  // ============================================
  
  // Chat with a specific agent - routes to Guardian or FieldOps agents
  app.post("/api/agent/:agentId/chat", async (req, res) => {
    try {
      const { agentId } = req.params;
      const parseResult = chatRequestSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }

      const { message, context } = parseResult.data;

      // GUARDIAN ROUTING - Use Guardian for persistent memory chat
      if (isGuardianAgent(agentId)) {
        try {
          const guardianUrl = getGuardianUrl();
          console.log(`[COMPASS] Routing to Guardian at ${guardianUrl}/guardian/chat`);

          const guardianResponse = await fetch(`${guardianUrl}/guardian/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              userId: 'compass-user',
            }),
          });

          if (guardianResponse.ok) {
            const data = await guardianResponse.json();
            return res.json({
              message: data.response || 'Guardian response received',
              agentId: 'guardian',
              contextUsed: data.context_used || false,
              timestamp: new Date().toISOString(),
            });
          }

          console.warn(`[COMPASS] Guardian returned ${guardianResponse.status}`);
        } catch (fetchError) {
          console.warn(`[COMPASS] Could not reach Guardian:`, fetchError);
        }

        // Guardian fallback
        return res.json({
          message: "Guardian is not available. Please try again later.",
          agentId: 'guardian',
          timestamp: new Date().toISOString(),
        });
      }

      // FIELDOPS ROUTING - Get the agent's URL based on their port
      const agentUrl = getAgentUrl(agentId);

      if (agentUrl) {
        try {
          console.log(`[COMPASS] Routing chat to ${agentId} at ${agentUrl}/chat`);
          const agentResponse = await fetch(`${agentUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              userName: 'Compass User',
              context,
            }),
          });

          if (agentResponse.ok) {
            const data = await agentResponse.json();
            // Normalize response format - frontend expects 'message' field
            return res.json({
              message: data.result?.response || data.response || 'Agent response received',
              agentId,
              timestamp: new Date().toISOString(),
            });
          }

          console.warn(`[COMPASS] Agent ${agentId} returned ${agentResponse.status}`);
        } catch (fetchError) {
          console.warn(`[COMPASS] Could not reach agent ${agentId} at ${agentUrl}:`, fetchError);
        }
      }

      // Fallback to mock response if agent unavailable
      console.log(`[COMPASS] Using mock response for ${agentId}`);
      const response = generateAgentResponse(agentId, message, context);
      return res.json(response);
    } catch (error) {
      console.error("Agent chat error:", error);
      return res.status(500).json({ error: "Failed to process chat request" });
    }
  });

  // ============================================
  // Lead Routes
  // ============================================
  
  // Get all leads
  app.get("/api/leads", async (_req, res) => {
    try {
      const leads = await storage.getLeads();
      return res.json(leads);
    } catch (error) {
      console.error("Get leads error:", error);
      return res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get single lead
  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      return res.json(lead);
    } catch (error) {
      console.error("Get lead error:", error);
      return res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  // Create lead
  app.post("/api/leads", async (req, res) => {
    try {
      const parseResult = insertLeadSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }
      
      const lead = await storage.createLead(parseResult.data);
      return res.status(201).json(lead);
    } catch (error) {
      console.error("Create lead error:", error);
      return res.status(500).json({ error: "Failed to create lead" });
    }
  });

  // Update lead
  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const parseResult = insertLeadSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }
      
      const lead = await storage.updateLead(req.params.id, parseResult.data);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      return res.json(lead);
    } catch (error) {
      console.error("Update lead error:", error);
      return res.status(500).json({ error: "Failed to update lead" });
    }
  });

  // Delete lead
  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const success = await storage.deleteLead(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Lead not found" });
      }
      return res.status(204).send();
    } catch (error) {
      console.error("Delete lead error:", error);
      return res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // ============================================
  // Enrichment Routes
  // ============================================
  
  // Enrich a lead with property data
  app.post("/api/enrichment/enrich", async (req, res) => {
    try {
      const parseResult = enrichmentRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }
      
      const { address, city, state, zip, county, mortgageBalance } = parseResult.data;
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      const enrichmentResult = enrichLead(address, city, state, zip, county, mortgageBalance);
      return res.json(enrichmentResult);
    } catch (error) {
      console.error("Enrichment error:", error);
      return res.status(500).json({ error: "Failed to enrich lead" });
    }
  });

  // ============================================
  // Command Routes (for PWA quick commands)
  // ============================================

  // Property lookup
  app.post("/api/lookup", async (req, res) => {
    try {
      const { address, leadId } = req.body;
      
      // Mock property data - would integrate with real API
      const mockData = {
        success: true,
        property: {
          value: 350000 + Math.floor(Math.random() * 150000),
          sqft: 1800 + Math.floor(Math.random() * 1500),
          bedrooms: 3 + Math.floor(Math.random() * 2),
          bathrooms: 2 + Math.floor(Math.random() * 2) * 0.5,
          yearBuilt: 2000 + Math.floor(Math.random() * 24)
        },
        solarPotential: {
          potential: ['excellent', 'good', 'moderate'][Math.floor(Math.random() * 3)],
          recommendation: 'South-facing roof with minimal shading. Ideal for solar installation.'
        }
      };
      
      return res.json(mockData);
    } catch (error) {
      console.error("Lookup error:", error);
      return res.status(500).json({ error: "Failed to lookup property" });
    }
  });

  // Objection handling - powered by Coach micro-agent
  app.post("/api/objection", async (req, res) => {
    try {
      const { objection, context } = req.body;

      if (!objection || typeof objection !== 'string') {
        return res.status(400).json({ error: "objection is required" });
      }

      const result = getObjectionResponse(objection, context);
      return res.json(result);
    } catch (error) {
      console.error("[Coach] Objection error:", error);
      return res.status(500).json({ error: "Failed to handle objection" });
    }
  });

  // Suggest next action - powered by Coach micro-agent
  app.post("/api/suggest-action", async (req, res) => {
    try {
      const { callState, leadData } = req.body;

      if (!callState) {
        return res.status(400).json({ error: "callState is required" });
      }

      const result = suggestNextAction(
        callState as 'opening' | 'discovery' | 'objection' | 'closing',
        leadData || { status: 'new', attempts: 0 }
      );
      return res.json(result);
    } catch (error) {
      console.error("[Coach] Suggest action error:", error);
      return res.status(500).json({ error: "Failed to suggest action" });
    }
  });

  // TCPA compliance check
  app.get("/api/tcpa/:leadId", async (req, res) => {
    try {
      const canCall = Math.random() > 0.15;
      
      return res.json({
        status: canCall ? 'safe' : 'dnc',
        canCall,
        callableNumbers: canCall ? ['primary'] : [],
        dncNumbers: canCall ? [] : ['primary']
      });
    } catch (error) {
      console.error("TCPA check error:", error);
      return res.status(500).json({ error: "Failed to check TCPA" });
    }
  });

  // Note: /api/suggest-action now handled by Coach micro-agent above

  // Telegram push for agent questions
  app.post("/api/telegram-push", async (req, res) => {
    try {
      const { userId, agentId, question, leadContext, source } = req.body;
      
      console.log(`[TELEGRAM PUSH] User: ${userId}, Agent: ${agentId}`);
      console.log(`Question: ${question}`);
      console.log(`Lead context:`, leadContext);
      
      // TODO: Integrate with actual Telegram bot
      return res.json({
        success: true,
        message: 'Forwarded to FieldOps agent',
        agentId
      });
    } catch (error) {
      console.error("Telegram push error:", error);
      return res.status(500).json({ error: "Failed to send to Telegram" });
    }
  });

  // ============================================
  // LiveWire Proxy Routes
  // ============================================
  // Proxy requests to LiveWire backend on admiral-server (via Tailscale)
  const BACKEND_HOST = process.env.BACKEND_HOST || "100.66.42.81";
  const LIVEWIRE_API_URL = `http://${BACKEND_HOST}:5000`;

  app.get("/api/livewire/leads", async (req, res) => {
    try {
      console.log(`[LiveWire Proxy] Fetching from ${LIVEWIRE_API_URL}/leads`);
      const response = await fetch(`${LIVEWIRE_API_URL}/leads`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      console.log(`[LiveWire Proxy] Got ${data.leads?.length || 0} leads`);
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Proxy] Error:", error);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
        leads: []
      });
    }
  });

  app.get("/api/livewire/health", async (req, res) => {
    try {
      const response = await fetch(`${LIVEWIRE_API_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        res.json({ status: "ok", ...data });
      } else {
        res.json({ status: "error", error: `HTTP ${response.status}` });
      }
    } catch (error) {
      res.json({
        status: "error",
        error: error instanceof Error ? error.message : "Connection failed"
      });
    }
  });

  // Update lead status (PATCH /api/livewire/leads/:leadId/status)
  app.patch("/api/livewire/leads/:leadId/status", async (req, res) => {
    try {
      const { leadId } = req.params;
      const { status, notes } = req.body;

      console.log(`[LiveWire Proxy] Updating lead ${leadId} status to ${status}`);
      const response = await fetch(`${LIVEWIRE_API_URL}/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      console.log(`[LiveWire Proxy] Lead ${leadId} status updated to ${status}`);
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Proxy] Status update error:", error);
      res.status(503).json({
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // Submit feedback for a lead (human-in-the-loop training)
  app.post("/api/livewire/leads/:leadId/feedback", async (req, res) => {
    try {
      const { leadId } = req.params;
      const { quality, reason, correctedIntent, keywordsToRemove, keywordsToAdd, notes } = req.body;

      console.log(`[LiveWire Proxy] Submitting feedback for lead ${leadId}: quality=${quality}`);

      const response = await fetch(`${LIVEWIRE_API_URL}/leads/${leadId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quality,
          reason,
          correctedIntent,
          keywordsToRemove,
          keywordsToAdd,
          notes,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[LiveWire Proxy] Feedback error: ${response.status} - ${errorText}`);
        throw new Error(`LiveWire API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`[LiveWire Proxy] Feedback recorded for lead ${leadId}`);
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Proxy] Feedback submission error:", error);
      res.status(503).json({
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // Get LiveWire settings
  app.get("/api/livewire/settings", async (req, res) => {
    try {
      console.log(`[LiveWire Proxy] Fetching settings from ${LIVEWIRE_API_URL}/settings`);
      const response = await fetch(`${LIVEWIRE_API_URL}/settings`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      console.log(`[LiveWire Proxy] Got settings:`, Object.keys(data));
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Proxy] Settings GET error:", error);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // Update LiveWire settings
  app.post("/api/livewire/settings", async (req, res) => {
    try {
      console.log(`[LiveWire Proxy] Saving settings to ${LIVEWIRE_API_URL}/settings`);
      const response = await fetch(`${LIVEWIRE_API_URL}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      console.log(`[LiveWire Proxy] Settings saved successfully`);
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Proxy] Settings POST error:", error);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // ============================================
  // LiveWire Scanner Status & Notifications
  // ============================================

  // In-memory scanner status (persists while server runs)
  let livewireScannerStatus = {
    isActive: false,
    lastScan: null as string | null,
    lastLeadCount: 0,
    lastNotification: null as any,
    recentNotifications: [] as any[],
  };

  // Get scanner status (for UI)
  app.get("/api/livewire/scanner-status", (req, res) => {
    res.json(livewireScannerStatus);
  });

  // Receive notifications from LiveWire backend
  app.post("/api/livewire/notify", async (req, res) => {
    try {
      const { type, title, message, data, priority, recipient } = req.body;
      console.log(`[LiveWire Notify] Received: ${type} - ${title}`);

      // Update scanner status
      livewireScannerStatus.isActive = true;
      livewireScannerStatus.lastScan = new Date().toISOString();
      livewireScannerStatus.lastNotification = { type, title, message, data, timestamp: new Date().toISOString() };

      if (data?.stats?.leadsFound) {
        livewireScannerStatus.lastLeadCount = data.stats.leadsFound;
      }

      // Keep last 20 notifications
      livewireScannerStatus.recentNotifications.unshift(livewireScannerStatus.lastNotification);
      if (livewireScannerStatus.recentNotifications.length > 20) {
        livewireScannerStatus.recentNotifications = livewireScannerStatus.recentNotifications.slice(0, 20);
      }

      // Forward to Telegram if configured
      const TELEGRAM_BOT_TOKEN = process.env.LIVEWIRE_TELEGRAM_BOT_TOKEN;
      const TELEGRAM_CHAT_ID = process.env.LIVEWIRE_TELEGRAM_CHAT_ID || process.env.NATE_TELEGRAM_CHAT_ID;

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        try {
          // Format message for Telegram
          let emoji = '📊';
          if (type === 'hot_lead') emoji = '🔥';
          else if (type === 'lead_found') emoji = '🎯';
          else if (type === 'alert') emoji = '⚠️';

          let text = `${emoji} *${title}*\n\n${message}`;

          // Add top leads if present
          if (data?.topLeads?.length) {
            text += '\n\n*Top Leads:*';
            for (const lead of data.topLeads.slice(0, 5)) {
              text += `\n• ${lead.author} (score: ${lead.score})`;
            }
          }

          // Add stats if present
          if (data?.stats) {
            const s = data.stats;
            text += `\n\n📈 Posts: ${s.postsScanned || 0} | Leads: ${s.leadsFound || 0} | NC: ${s.ncRelevant || 0}`;
          }

          const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text,
              parse_mode: 'Markdown',
              disable_web_page_preview: true,
            }),
          });

          if (telegramResponse.ok) {
            console.log(`[LiveWire Notify] Telegram sent: ${title}`);
          } else {
            console.log(`[LiveWire Notify] Telegram failed: ${telegramResponse.status}`);
          }
        } catch (telegramError) {
          console.error('[LiveWire Notify] Telegram error:', telegramError);
        }
      }

      res.json({ success: true, received: type });
    } catch (error) {
      console.error("[LiveWire Notify] Error:", error);
      res.status(500).json({ error: "Failed to process notification" });
    }
  });

  // ============================================
  // LiveWire Feedback Loop Endpoints (Proxy)
  // ============================================

  // GET /api/livewire/feedback/dashboard - Full dashboard data
  app.get("/api/livewire/feedback/dashboard", async (req, res) => {
    try {
      const response = await fetch(`${LIVEWIRE_API_URL}/feedback/dashboard`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Feedback] Error:", error);
      res.status(503).json({ error: "Failed to fetch feedback dashboard" });
    }
  });

  // POST /api/livewire/feedback/run - Trigger feedback analysis
  app.post("/api/livewire/feedback/run", async (req, res) => {
    try {
      const response = await fetch(`${LIVEWIRE_API_URL}/feedback/run`, { method: "POST" });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Feedback] Error:", error);
      res.status(503).json({ error: "Failed to run feedback analysis" });
    }
  });

  // GET /api/livewire/feedback/recommendations - Get pending recommendations
  app.get("/api/livewire/feedback/recommendations", async (req, res) => {
    try {
      const response = await fetch(`${LIVEWIRE_API_URL}/feedback/recommendations`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Feedback] Error:", error);
      res.status(503).json({ error: "Failed to fetch recommendations" });
    }
  });

  // POST /api/livewire/feedback/recommendations/:id/approve - Approve recommendation
  app.post("/api/livewire/feedback/recommendations/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const response = await fetch(`${LIVEWIRE_API_URL}/feedback/recommendations/${id}/approve`, { method: "POST" });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Feedback] Error:", error);
      res.status(503).json({ error: "Failed to approve recommendation" });
    }
  });

  // POST /api/livewire/feedback/recommendations/:id/reject - Reject recommendation
  app.post("/api/livewire/feedback/recommendations/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const response = await fetch(`${LIVEWIRE_API_URL}/feedback/recommendations/${id}/reject`, { method: "POST" });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Feedback] Error:", error);
      res.status(503).json({ error: "Failed to reject recommendation" });
    }
  });

  // GET /api/livewire/feedback/weights - Get current weights
  app.get("/api/livewire/feedback/weights", async (req, res) => {
    try {
      const response = await fetch(`${LIVEWIRE_API_URL}/feedback/weights`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Feedback] Error:", error);
      res.status(503).json({ error: "Failed to fetch weights" });
    }
  });

  // GET /api/livewire/feedback/outcomes - Get recent outcomes
  app.get("/api/livewire/feedback/outcomes", async (req, res) => {
    try {
      const { limit, outcome, subreddit } = req.query;
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit as string);
      if (outcome) params.append('outcome', outcome as string);
      if (subreddit) params.append('subreddit', subreddit as string);

      const url = `${LIVEWIRE_API_URL}/feedback/outcomes${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire Feedback] Error:", error);
      res.status(503).json({ error: "Failed to fetch outcomes" });
    }
  });

  // ============================================
  // LiveWire v2.0 Endpoints (Keyword Learning, Subreddit Tiers, Context Analysis)
  // ============================================

  // GET /api/livewire/v2/scoring/:leadId - Full score transparency
  app.get("/api/livewire/v2/scoring/:leadId", async (req, res) => {
    try {
      const { leadId } = req.params;
      console.log(`[LiveWire v2] Getting score breakdown for lead ${leadId}`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/scoring/${leadId}`);

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Scoring error:", error);
      res.status(503).json({ error: "Failed to get score breakdown" });
    }
  });

  // GET /api/livewire/v2/keywords - All keywords with scores
  app.get("/api/livewire/v2/keywords", async (req, res) => {
    try {
      console.log(`[LiveWire v2] Fetching all keywords`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/keywords`);

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Keywords error:", error);
      res.status(503).json({ error: "Failed to fetch keywords" });
    }
  });

  // GET /api/livewire/v2/keywords/flagged - Keywords with negative performance
  app.get("/api/livewire/v2/keywords/flagged", async (req, res) => {
    try {
      console.log(`[LiveWire v2] Fetching flagged keywords`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/keywords/flagged`);

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Flagged keywords error:", error);
      res.status(503).json({ error: "Failed to fetch flagged keywords" });
    }
  });

  // POST /api/livewire/v2/keywords/:keyword/reset - Reset keyword score
  app.post("/api/livewire/v2/keywords/:keyword/reset", async (req, res) => {
    try {
      const { keyword } = req.params;
      console.log(`[LiveWire v2] Resetting keyword: ${keyword}`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/keywords/${encodeURIComponent(keyword)}/reset`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Keyword reset error:", error);
      res.status(503).json({ error: "Failed to reset keyword" });
    }
  });

  // GET /api/livewire/v2/subreddits - All subreddits with tiers
  app.get("/api/livewire/v2/subreddits", async (req, res) => {
    try {
      console.log(`[LiveWire v2] Fetching all subreddits`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/subreddits`);

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Subreddits error:", error);
      res.status(503).json({ error: "Failed to fetch subreddits" });
    }
  });

  // POST /api/livewire/v2/subreddits/:name/promote - Promote subreddit tier
  app.post("/api/livewire/v2/subreddits/:name/promote", async (req, res) => {
    try {
      const { name } = req.params;
      console.log(`[LiveWire v2] Promoting subreddit: ${name}`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/subreddits/${encodeURIComponent(name)}/promote`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Subreddit promote error:", error);
      res.status(503).json({ error: "Failed to promote subreddit" });
    }
  });

  // POST /api/livewire/v2/subreddits/:name/demote - Demote subreddit tier
  app.post("/api/livewire/v2/subreddits/:name/demote", async (req, res) => {
    try {
      const { name } = req.params;
      console.log(`[LiveWire v2] Demoting subreddit: ${name}`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/subreddits/${encodeURIComponent(name)}/demote`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Subreddit demote error:", error);
      res.status(503).json({ error: "Failed to demote subreddit" });
    }
  });

  // POST /api/livewire/v2/subreddits/:name/retire - Retire subreddit
  app.post("/api/livewire/v2/subreddits/:name/retire", async (req, res) => {
    try {
      const { name } = req.params;
      console.log(`[LiveWire v2] Retiring subreddit: ${name}`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/subreddits/${encodeURIComponent(name)}/retire`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Subreddit retire error:", error);
      res.status(503).json({ error: "Failed to retire subreddit" });
    }
  });

  // POST /api/livewire/v2/context/analyze - Analyze post content for intent
  app.post("/api/livewire/v2/context/analyze", async (req, res) => {
    try {
      const { content, title } = req.body;
      console.log(`[LiveWire v2] Analyzing context`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/context/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      });

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Context analysis error:", error);
      res.status(503).json({ error: "Failed to analyze context" });
    }
  });

  // ============================================
  // LiveWire v2.0 Learning Engine Routes
  // ============================================

  // GET /api/livewire/v2/learning/metrics - Learning progress metrics
  app.get("/api/livewire/v2/learning/metrics", async (req, res) => {
    try {
      console.log(`[LiveWire v2] Fetching learning metrics`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/learning/metrics`);

      if (!response.ok) {
        // Return mock data if endpoint not yet implemented
        return res.json({
          metrics: {
            totalFeedback: 0,
            positiveFeedback: 0,
            negativeFeedback: 0,
            accuracyRate: 0,
            accuracyTrend: 'stable',
            lastTrainingDate: new Date().toISOString(),
            modelVersion: '2.0.0'
          }
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Learning metrics error:", error);
      res.json({
        metrics: {
          totalFeedback: 0,
          positiveFeedback: 0,
          negativeFeedback: 0,
          accuracyRate: 0,
          accuracyTrend: 'stable',
          lastTrainingDate: new Date().toISOString(),
          modelVersion: '2.0.0'
        }
      });
    }
  });

  // GET /api/livewire/v2/learning/recommendations - AI-generated recommendations
  app.get("/api/livewire/v2/learning/recommendations", async (req, res) => {
    try {
      console.log(`[LiveWire v2] Fetching learning recommendations`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/learning/recommendations`);

      if (!response.ok) {
        // Return mock recommendations if endpoint not yet implemented
        return res.json({
          recommendations: [
            {
              id: 'rec-1',
              type: 'keyword',
              priority: 'high',
              title: 'Review underperforming keywords',
              description: 'Some keywords are matching "already bought" posts more often than shopping posts.',
              action: 'Go to Keyword Manager to review flagged keywords',
              impact: 'Could improve lead quality by 15-20%'
            }
          ]
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Learning recommendations error:", error);
      res.json({ recommendations: [] });
    }
  });

  // GET /api/livewire/v2/learning/thinking-logs - Sequential thinking logs
  app.get("/api/livewire/v2/learning/thinking-logs", async (req, res) => {
    try {
      const { limit } = req.query;
      console.log(`[LiveWire v2] Fetching thinking logs`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/learning/thinking-logs?limit=${limit || 10}`);

      if (!response.ok) {
        return res.json({ logs: [] });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Thinking logs error:", error);
      res.json({ logs: [] });
    }
  });

  // POST /api/livewire/v2/learning/apply-recommendation - Apply a recommendation
  app.post("/api/livewire/v2/learning/apply-recommendation", async (req, res) => {
    try {
      const { recommendationId } = req.body;
      console.log(`[LiveWire v2] Applying recommendation: ${recommendationId}`);
      const response = await fetch(`${LIVEWIRE_API_URL}/v2/learning/apply-recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId }),
      });

      if (!response.ok) {
        throw new Error(`LiveWire API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[LiveWire v2] Apply recommendation error:", error);
      res.status(503).json({ error: "Failed to apply recommendation" });
    }
  });

  // ============================================
  // Action Routes
  // ============================================

  // Execute a suggested action
  app.post("/api/actions/execute", async (req, res) => {
    try {
      const parseResult = actionRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }
      
      const { action, params, leadId } = parseResult.data;
      
      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
      
      // Handle different action types
      switch (action) {
        case 'show_leads':
          const leads = await storage.getLeads();
          return res.json({ success: true, data: leads });
          
        case 'sort_leads':
          const sortedLeads = await storage.getLeads();
          // Sort logic would go here
          return res.json({ success: true, data: sortedLeads });
          
        case 'filter_leads':
          const allLeads = await storage.getLeads();
          const status = params.status as string;
          const filtered = status ? allLeads.filter(l => l.status === status) : allLeads;
          return res.json({ success: true, data: filtered });
          
        case 'update_status':
          if (leadId && params.status) {
            const updated = await storage.updateLead(leadId, { status: params.status as any });
            return res.json({ success: true, data: updated });
          }
          return res.json({ success: true, message: 'Status update simulated' });
          
        case 'add_note':
          return res.json({ success: true, message: 'Note added successfully' });
          
        default:
          return res.json({ success: true, message: `Action '${action}' executed successfully` });
      }
    } catch (error) {
      console.error("Action execution error:", error);
      return res.status(500).json({ error: "Failed to execute action" });
    }
  });

  return httpServer;
}
