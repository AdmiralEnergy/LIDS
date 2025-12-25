import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertActivitySchema } from "@shared/schema";

// Runtime env vars (dotenv loaded in index.ts)
const BACKEND_HOST = process.env.BACKEND_HOST;
const TWENTY_API_URL = process.env.TWENTY_API_URL || (BACKEND_HOST ? `http://${BACKEND_HOST}:3001` : "");
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

  app.post("/api/import/leads", async (req, res) => {
    const { rows, mappings } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No rows provided" });
    }

    if (!mappings || !Array.isArray(mappings)) {
      return res.status(400).json({ error: "No mappings provided" });
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

  return httpServer;
}
