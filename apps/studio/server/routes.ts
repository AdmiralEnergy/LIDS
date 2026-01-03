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
            // Normalize response format
            return res.json({
              response: data.result?.response || data.response || 'Agent response received',
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


  // ============ TWENTY AUTH PROXY ============
  // Proxy Twenty workspace members for client-side auth
  app.post("/api/twenty/auth", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const TWENTY_URL = process.env.TWENTY_CRM_URL || "http://localhost:3001";
    const TWENTY_KEY = process.env.TWENTY_API_KEY || "";

    if (!TWENTY_KEY) {
      return res.status(503).json({ error: "Twenty CRM not configured" });
    }

    try {
      const response = await fetch(`${TWENTY_URL}/rest/workspaceMembers`, {
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return res.status(503).json({ error: "Twenty CRM unavailable" });
      }

      const data = await response.json();
      const members = data.data?.workspaceMembers || data.workspaceMembers || [];
      
      // Find member by email
      const lowerEmail = email.toLowerCase();
      const member = members.find((m: any) => {
        const memberEmail = (m.userEmail || m.email || "").toLowerCase();
        return memberEmail === lowerEmail;
      });

      if (!member) {
        return res.status(404).json({ error: "User not found in Twenty CRM" });
      }

      // Return user info
      res.json({
        success: true,
        user: {
          id: member.id,
          name: `${member.name?.firstName || ""} ${member.name?.lastName || ""}`.trim(),
          email: lowerEmail,
          role: member.role,
        }
      });
    } catch (error) {
      console.error("[Twenty Auth] Error:", error);
      res.status(503).json({ error: "Failed to connect to Twenty CRM" });
    }
  });



  // ============ CONTENT MANAGEMENT (Twenty CRM) ============
  const TWENTY_URL = process.env.TWENTY_CRM_URL || "http://localhost:3001";
  const TWENTY_KEY = process.env.TWENTY_API_KEY || "";

  // Get all content items
  app.get("/api/content", async (req, res) => {
    try {
      const response = await fetch(`${TWENTY_URL}/rest/studioContentItems`, {
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Twenty CRM returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data.data?.studioContentItems || []);
    } catch (error) {
      console.error("[Content] Error fetching:", error);
      res.status(503).json({ error: "Failed to fetch content items" });
    }
  });

  // Get single content item
  app.get("/api/content/:id", async (req, res) => {
    try {
      const response = await fetch(`${TWENTY_URL}/rest/studioContentItems/${req.params.id}`, {
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return res.status(404).json({ error: "Content item not found" });
      }

      const data = await response.json();
      res.json(data.data?.studioContentItem || data);
    } catch (error) {
      console.error("[Content] Error fetching single:", error);
      res.status(503).json({ error: "Failed to fetch content item" });
    }
  });

  // Create content item
  app.post("/api/content", async (req, res) => {
    try {
      const response = await fetch(`${TWENTY_URL}/rest/studioContentItems`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(400).json({ error: "Failed to create content", details: errorData });
      }

      const data = await response.json();
      res.status(201).json(data.data?.createStudioContentItem || data);
    } catch (error) {
      console.error("[Content] Error creating:", error);
      res.status(503).json({ error: "Failed to create content item" });
    }
  });

  // Update content item
  app.patch("/api/content/:id", async (req, res) => {
    try {
      const response = await fetch(`${TWENTY_URL}/rest/studioContentItems/${req.params.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        return res.status(404).json({ error: "Content item not found" });
      }

      const data = await response.json();
      res.json(data.data?.updateStudioContentItem || data);
    } catch (error) {
      console.error("[Content] Error updating:", error);
      res.status(503).json({ error: "Failed to update content item" });
    }
  });

  // Delete content item
  app.delete("/api/content/:id", async (req, res) => {
    try {
      const response = await fetch(`${TWENTY_URL}/rest/studioContentItems/${req.params.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
        },
      });

      if (!response.ok) {
        return res.status(404).json({ error: "Content item not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("[Content] Error deleting:", error);
      res.status(503).json({ error: "Failed to delete content item" });
    }
  });

  // ============ WEEKLY PLANS (Twenty CRM) ============

  // Get weekly plans
  app.get("/api/weekly-plans", async (req, res) => {
    try {
      const response = await fetch(`${TWENTY_URL}/rest/studioWeeklyPlans`, {
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Twenty CRM returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data.data?.studioWeeklyPlans || []);
    } catch (error) {
      console.error("[WeeklyPlan] Error fetching:", error);
      res.status(503).json({ error: "Failed to fetch weekly plans" });
    }
  });

  // Create weekly plan
  app.post("/api/weekly-plans", async (req, res) => {
    try {
      const response = await fetch(`${TWENTY_URL}/rest/studioWeeklyPlans`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(400).json({ error: "Failed to create weekly plan", details: errorData });
      }

      const data = await response.json();
      res.status(201).json(data.data?.createStudioWeeklyPlan || data);
    } catch (error) {
      console.error("[WeeklyPlan] Error creating:", error);
      res.status(503).json({ error: "Failed to create weekly plan" });
    }
  });

  // ============ MARKETING PROGRESSION (Twenty CRM) ============

  // Get marketing progression for user
  app.get("/api/progression", async (req, res) => {
    try {
      const email = req.query.email as string;

      const response = await fetch(`${TWENTY_URL}/rest/marketingProgressions?filter=${encodeURIComponent(JSON.stringify({ email: { eq: email } }))}`, {
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Twenty CRM returned ${response.status}`);
      }

      const data = await response.json();
      const progressions = data.data?.marketingProgressions || [];

      if (progressions.length === 0) {
        // Return default progression
        return res.json({
          email,
          totalXp: 0,
          currentLevel: 1,
          rank: "content-creator-1",
          badges: [],
          streakDays: 0,
          postsPublished: 0,
          videosCreated: 0,
        });
      }

      res.json(progressions[0]);
    } catch (error) {
      console.error("[Progression] Error fetching:", error);
      res.status(503).json({ error: "Failed to fetch progression" });
    }
  });

  // Update marketing progression
  app.patch("/api/progression/:id", async (req, res) => {
    try {
      const response = await fetch(`${TWENTY_URL}/rest/marketingProgressions/${req.params.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        return res.status(404).json({ error: "Progression not found" });
      }

      const data = await response.json();
      res.json(data.data?.updateMarketingProgression || data);
    } catch (error) {
      console.error("[Progression] Error updating:", error);
      res.status(503).json({ error: "Failed to update progression" });
    }
  });

  // Add XP to progression
  app.post("/api/progression/add-xp", async (req, res) => {
    try {
      const { email, xpAmount, eventType, details } = req.body;

      // First get current progression
      const getResponse = await fetch(`${TWENTY_URL}/rest/marketingProgressions?filter=${encodeURIComponent(JSON.stringify({ email: { eq: email } }))}`, {
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const getData = await getResponse.json();
      const progressions = getData.data?.marketingProgressions || [];

      if (progressions.length === 0) {
        // Create new progression
        const createResponse = await fetch(`${TWENTY_URL}/rest/marketingProgressions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${TWENTY_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            name: email,
            totalXp: xpAmount,
            currentLevel: 1,
            rank: "content-creator-1",
            badges: "[]",
            streakDays: 1,
          }),
        });

        const createData = await createResponse.json();
        return res.status(201).json(createData.data?.createMarketingProgression || createData);
      }

      // Update existing progression
      const current = progressions[0];
      const newXp = (current.totalXp || 0) + xpAmount;
      const newLevel = calculateLevel(newXp);

      const updateResponse = await fetch(`${TWENTY_URL}/rest/marketingProgressions/${current.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${TWENTY_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalXp: newXp,
          currentLevel: newLevel,
        }),
      });

      const updateData = await updateResponse.json();
      res.json({
        ...updateData.data?.updateMarketingProgression || updateData,
        xpGained: xpAmount,
        eventType,
      });
    } catch (error) {
      console.error("[Progression] Error adding XP:", error);
      res.status(503).json({ error: "Failed to add XP" });
    }
  });

  // Helper function for level calculation
  function calculateLevel(totalXp: number): number {
    const thresholds = [
      0, 100, 250, 500, 850, 1300, 1900, 2700, 3800, 5200,
      7000, 9200, 12000, 15500, 20000, 25000, 30000, 36000, 43000, 51000,
      60000, 70000, 82000, 96000, 112000
    ];

    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (totalXp >= thresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // ============ MARKETING AGENTS (MUSE + SARAI) ============
  const MUSE_URL = `http://${BACKEND_HOST_INTERNAL}:4066`;
  const SARAI_URL = `http://${BACKEND_HOST_INTERNAL}:4065`;

  app.post("/api/muse/chat", async (req, res) => {
    try {
      const response = await fetch(`${MUSE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[MUSE] Connection error:", error);
      res.status(503).json({ error: "MUSE agent not available", connected: false });
    }
  });

  app.get("/api/muse/health", async (req, res) => {
    try {
      const response = await fetch(`${MUSE_URL}/health`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ status: "offline", error: "Connection failed" });
    }
  });

  app.post("/api/sarai/chat", async (req, res) => {
    try {
      const response = await fetch(`${SARAI_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[SARAI] Connection error:", error);
      res.status(503).json({ error: "Sarai agent not available", connected: false });
    }
  });

  app.get("/api/sarai/health", async (req, res) => {
    try {
      const response = await fetch(`${SARAI_URL}/health`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ status: "offline", error: "Connection failed" });
    }
  });

  // ============ VIDEO GENERATOR API PROXY ============
  // Video generator runs on admiral-server:4200, connects to ComfyUI
  const VIDEO_GEN_URL = process.env.VIDEO_GEN_URL || "http://100.66.42.81:4200";

  // Generate video
  app.post("/api/video-gen/generate", async (req, res) => {
    try {
      console.log(`[VideoGen] Starting generation request`);
      const response = await fetch(`${VIDEO_GEN_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error(`Video generator returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[VideoGen] Generate error:", error);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Video generator unavailable",
        mode: "offline"
      });
    }
  });

  // Get job status
  app.get("/api/video-gen/status/:jobId", async (req, res) => {
    try {
      const response = await fetch(`${VIDEO_GEN_URL}/api/status/${req.params.jobId}`);

      if (!response.ok) {
        throw new Error(`Video generator returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[VideoGen] Status error:", error);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Video generator unavailable"
      });
    }
  });

  // List jobs
  app.get("/api/video-gen/jobs", async (req, res) => {
    try {
      const limit = req.query.limit || 20;
      const response = await fetch(`${VIDEO_GEN_URL}/api/jobs?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`Video generator returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[VideoGen] Jobs list error:", error);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Video generator unavailable",
        jobs: []
      });
    }
  });

  // Cancel job
  app.delete("/api/video-gen/jobs/:jobId", async (req, res) => {
    try {
      const response = await fetch(`${VIDEO_GEN_URL}/api/jobs/${req.params.jobId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(`Video generator returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[VideoGen] Cancel error:", error);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Video generator unavailable"
      });
    }
  });

  // Video generator health
  app.get("/api/video-gen/health", async (req, res) => {
    try {
      const response = await fetch(`${VIDEO_GEN_URL}/health`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        status: "offline",
        error: "Video generator not available",
        comfyui: { connected: false }
      });
    }
  });

  // ComfyUI status
  app.get("/api/video-gen/comfyui/status", async (req, res) => {
    try {
      const response = await fetch(`${VIDEO_GEN_URL}/api/comfyui/status`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        connected: false,
        error: "Video generator not available"
      });
    }
  });

  // ============ POSTIZ API PROXY (Social Media Scheduling) ============
  // Postiz runs on Oracle ARM via Docker, exposed on port 3200
  const POSTIZ_URL = process.env.POSTIZ_URL || "http://193.122.153.249:3200";
  const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY || "";

  // Helper for Postiz API calls
  async function postizFetch(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (POSTIZ_API_KEY) {
      headers["Authorization"] = `Bearer ${POSTIZ_API_KEY}`;
    }

    return fetch(`${POSTIZ_URL}${path}`, {
      ...options,
      headers,
    });
  }

  // Get connected social media integrations
  app.get("/api/postiz/integrations", async (req, res) => {
    try {
      console.log(`[Postiz] Fetching integrations from ${POSTIZ_URL}`);
      const response = await postizFetch("/public/v1/integrations");

      if (!response.ok) {
        throw new Error(`Postiz returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[Postiz] Integrations error:", error);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Postiz unavailable",
        integrations: []
      });
    }
  });

  // Check if Postiz is connected
  app.get("/api/postiz/is-connected", async (req, res) => {
    try {
      const response = await postizFetch("/public/v1/is-connected");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.json({ connected: false, error: "Connection failed" });
    }
  });

  // Get scheduled posts
  app.get("/api/postiz/posts", async (req, res) => {
    try {
      const response = await postizFetch("/public/v1/posts");

      if (!response.ok) {
        throw new Error(`Postiz returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[Postiz] Posts error:", error);
      res.status(503).json({ error: "Failed to fetch posts", posts: [] });
    }
  });

  // Create/Schedule a post
  app.post("/api/postiz/posts", async (req, res) => {
    try {
      console.log(`[Postiz] Creating post:`, req.body);
      const response = await postizFetch("/public/v1/posts", {
        method: "POST",
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Postiz returned ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Postiz] Post created:`, data.id || "success");
      res.status(201).json(data);
    } catch (error) {
      console.error("[Postiz] Create post error:", error);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Failed to create post"
      });
    }
  });

  // Delete a scheduled post
  app.delete("/api/postiz/posts/:id", async (req, res) => {
    try {
      const response = await postizFetch(`/public/v1/posts/${req.params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("[Postiz] Delete post error:", error);
      res.status(503).json({ error: "Failed to delete post" });
    }
  });

  // Find available time slot for a channel
  app.get("/api/postiz/find-slot/:channelId", async (req, res) => {
    try {
      const response = await postizFetch(`/public/v1/find-slot/${req.params.channelId}`);

      if (!response.ok) {
        throw new Error(`Postiz returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[Postiz] Find slot error:", error);
      res.status(503).json({ error: "Failed to find slot" });
    }
  });

  // Upload media file
  app.post("/api/postiz/upload", async (req, res) => {
    try {
      const response = await postizFetch("/public/v1/upload", {
        method: "POST",
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error(`Postiz returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[Postiz] Upload error:", error);
      res.status(503).json({ error: "Failed to upload media" });
    }
  });

  // Upload from URL
  app.post("/api/postiz/upload-from-url", async (req, res) => {
    try {
      console.log(`[Postiz] Uploading from URL:`, req.body.url);
      const response = await postizFetch("/public/v1/upload-from-url", {
        method: "POST",
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error(`Postiz returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[Postiz] Upload from URL error:", error);
      res.status(503).json({ error: "Failed to upload from URL" });
    }
  });

  // Generate video (Postiz built-in video generation)
  app.post("/api/postiz/generate-video", async (req, res) => {
    try {
      console.log(`[Postiz] Generating video:`, req.body);
      const response = await postizFetch("/public/v1/generate-video", {
        method: "POST",
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Postiz returned ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Postiz] Video generated:`, data);
      res.json(data);
    } catch (error) {
      console.error("[Postiz] Generate video error:", error);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Failed to generate video"
      });
    }
  });

  // Video function (additional video operations)
  app.post("/api/postiz/video/function", async (req, res) => {
    try {
      const response = await postizFetch("/public/v1/video/function", {
        method: "POST",
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error(`Postiz returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[Postiz] Video function error:", error);
      res.status(503).json({ error: "Failed to execute video function" });
    }
  });

  // Postiz health check
  app.get("/api/postiz/health", async (req, res) => {
    try {
      const start = Date.now();
      const response = await postizFetch("/public/v1/is-connected");
      const responseTime = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        res.json({
          status: "healthy",
          connected: data.connected || false,
          responseTime,
          url: POSTIZ_URL
        });
      } else {
        res.json({ status: "degraded", responseTime, error: `HTTP ${response.status}` });
      }
    } catch (error) {
      res.json({
        status: "offline",
        error: error instanceof Error ? error.message : "Connection failed",
        url: POSTIZ_URL
      });
    }
  });

  // ============ ADMIRAL CHAT PROXY (to ADS Dashboard) ============
  // Proxy chat requests to ADS Dashboard so all apps share the same chat
  const ADS_URL = process.env.ADS_DASHBOARD_URL || "http://localhost:3100";

  // Proxy all /api/chat/* requests to ADS Dashboard
  app.use("/api/chat", async (req, res) => {
    try {
      const targetUrl = `${ADS_URL}/api/chat${req.url}`;
      console.log(`[Chat Proxy] ${req.method} ${targetUrl}`);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Forward user headers
      if (req.headers["x-workspace-member-id"]) {
        headers["x-workspace-member-id"] = req.headers["x-workspace-member-id"] as string;
      }
      if (req.headers["x-workspace-member-name"]) {
        headers["x-workspace-member-name"] = req.headers["x-workspace-member-name"] as string;
      }

      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: ["POST", "PATCH", "PUT"].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("[Chat Proxy] Error:", error);
      res.status(503).json({ error: "Chat service unavailable" });
    }
  });

  return httpServer;
}
