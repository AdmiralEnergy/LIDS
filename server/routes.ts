import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertActivitySchema } from "@shared/schema";

const TWENTY_API_URL = process.env.VITE_TWENTY_API_URL || "";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY || "";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  return httpServer;
}
