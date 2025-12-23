import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertActivitySchema } from "@shared/schema";

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

  return httpServer;
}
