import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { enrichLead } from "./enrichment";
import { generateAgentResponse } from "./agent-responses";
import { z } from "zod";

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
  
  // Chat with a specific agent
  app.post("/api/agent/:agentId/chat", async (req, res) => {
    try {
      const { agentId } = req.params;
      const parseResult = chatRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }
      
      const { message, context } = parseResult.data;
      
      // Simulate some processing delay for realism
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
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
