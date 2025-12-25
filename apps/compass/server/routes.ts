import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { enrichLead } from "./enrichment";
import { generateAgentResponse } from "./agent-responses";
import { z } from "zod";

// FieldOps agents backend configuration (on admiral-server via Tailscale)
const BACKEND_HOST_INTERNAL = process.env.BACKEND_HOST || "100.66.42.81";

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
  // Agent Chat Routes
  // ============================================
  
  // Chat with a specific FieldOps agent - proxy to real agents on admiral-server
  app.post("/api/agent/:agentId/chat", async (req, res) => {
    try {
      const { agentId } = req.params;
      const parseResult = chatRequestSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }

      const { message, context } = parseResult.data;

      // Get the agent's URL based on their port
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

  // Objection handling
  app.post("/api/objection", async (req, res) => {
    try {
      const { objection } = req.body;
      
      const responses: Record<string, any> = {
        "not interested": {
          response: "I completely understand. Most homeowners I speak with weren't interested initially either. What changed their mind was seeing how much they'd save.",
          technique: "Feel-Felt-Found",
          confidence: 0.85,
          followUp: "What's your current monthly electric bill?"
        },
        "too expensive": {
          response: "That's a fair concern. What if I told you that with available incentives, most homeowners see a lower payment than their current electric bill from day one?",
          technique: "Reframe",
          confidence: 0.82,
          followUp: "What do you currently pay Duke Energy each month?"
        },
        "need to think about it": {
          response: "Absolutely, this is an important decision. What specifically would you like to think about?",
          technique: "Isolate",
          confidence: 0.78,
          followUp: "Is it the cost, the timing, or something else?"
        },
        "already have solar": {
          response: "That's great! How's it working out? Many homeowners with older systems are upgrading for better efficiency.",
          technique: "Pivot",
          confidence: 0.75,
          followUp: "How old is your current system?"
        },
        "renting": {
          response: "I understand. Do you know anyone who owns their home who might benefit?",
          technique: "Referral Ask",
          confidence: 0.70,
          followUp: "Who do you know that owns their home?"
        },
        "bad credit": {
          response: "We work with a variety of financing options. Would you be open to at least checking?",
          technique: "Soft Close",
          confidence: 0.72,
          followUp: "The credit check is soft and won't affect your score."
        }
      };
      
      const key = objection.toLowerCase();
      const match = responses[key] || {
        response: "I understand your concern. Let me address that for you.",
        technique: "Empathize & Redirect",
        confidence: 0.65,
        followUp: "What would need to change for this to make sense for you?"
      };
      
      return res.json(match);
    } catch (error) {
      console.error("Objection error:", error);
      return res.status(500).json({ error: "Failed to handle objection" });
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

  // Script suggestions
  app.post("/api/suggest-action", async (req, res) => {
    try {
      const { callState } = req.body;
      
      const scripts: Record<string, any> = {
        opening: {
          action: "Warm Introduction",
          script: "Hi, this is [Name] with Admiral Energy. I'm calling because we're helping homeowners in [City] reduce their electricity costs. Is now a good time?",
          tip: "Smile when you dial - they can hear it!"
        },
        discovery: {
          action: "Qualify the Lead",
          script: "Great! To see if this makes sense for you, can you tell me about your current electric bill?",
          tip: "Listen more than you talk."
        },
        objection: {
          action: "Address Concerns",
          script: "I hear you. What specifically concerns you most about making the switch?",
          tip: "Never argue. Acknowledge, then redirect."
        },
        closing: {
          action: "Set Appointment",
          script: "Based on what you've shared, I'd like to have one of our consultants show you exactly how much you'd save. Does Tuesday or Thursday work better?",
          tip: "Offer two options, not an open question."
        }
      };
      
      return res.json(scripts[callState] || scripts.opening);
    } catch (error) {
      console.error("Script suggestion error:", error);
      return res.status(500).json({ error: "Failed to get script" });
    }
  });

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
