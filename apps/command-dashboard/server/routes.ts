import type { Express } from "express";
import { type Server } from "http";
import { log } from "./index";

// Service configurations - these are defaults, can be overridden by client settings
// When running on Oracle ARM, use localhost for local services
const ORACLE_ARM_HOST = process.env.ORACLE_ARM_HOST || "localhost";
// Use Tailscale IP for cross-network access from Oracle ARM
const ADMIRAL_SERVER_HOST = process.env.ADMIRAL_SERVER_HOST || "100.66.42.81";

// LiveWire services on admiral-server
const LIVEWIRE_V1_URL = process.env.LIVEWIRE_V1_URL || `http://${ADMIRAL_SERVER_HOST}:5000`;

// Twenty CRM configuration (via Tailscale or localhost on Droplet)
const TWENTY_API_URL = process.env.TWENTY_API_URL || "http://localhost:3001";
const TWENTY_API_KEY = process.env.VITE_TWENTY_API_KEY || "";

// Service ports
const SERVICES = {
  // Oracle ARM services
  gridEngine: { host: ORACLE_ARM_HOST, port: 4120, healthEndpoint: "/health" },
  deepSeek: { host: ORACLE_ARM_HOST, port: 11434, healthEndpoint: "/api/tags" },

  // Admiral-Server services
  liveWire: { host: ADMIRAL_SERVER_HOST, port: 5000, healthEndpoint: "/health" },
  agentClaude: { host: ADMIRAL_SERVER_HOST, port: 4110, healthEndpoint: "/health" },
  oracleMemory: { host: ADMIRAL_SERVER_HOST, port: 4050, healthEndpoint: "/health" },
  twilioService: { host: ADMIRAL_SERVER_HOST, port: 4115, healthEndpoint: "/health" },
  n8n: { host: ADMIRAL_SERVER_HOST, port: 5678, healthEndpoint: "/healthz" },

  // Droplet services via Tailscale (100.94.207.1)
  twentyCrm: { host: "100.94.207.1", port: 3001, healthEndpoint: "/healthz" },
};

// Helper to make requests with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============================================
  // Health Check - Self
  // ============================================
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "command-dashboard", timestamp: new Date().toISOString() });
  });

  // ============================================
  // Twenty CRM GraphQL Proxy (Authentication)
  // ============================================

  app.post("/api/twenty/graphql", async (req, res) => {
    if (!TWENTY_API_URL || !TWENTY_API_KEY) {
      log("[Twenty] API not configured");
      return res.status(503).json({
        error: "Twenty CRM API not configured",
        connected: false
      });
    }

    try {
      log(`[Twenty] GraphQL request to ${TWENTY_API_URL}/graphql`);

      const response = await fetchWithTimeout(
        `${TWENTY_API_URL}/graphql`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TWENTY_API_KEY}`,
          },
          body: JSON.stringify(req.body),
        },
        10000 // 10 second timeout
      );

      if (!response.ok) {
        const errorText = await response.text();
        log(`[Twenty] GraphQL error: ${response.status} - ${errorText}`);
        return res.status(response.status).json({
          error: `Twenty CRM returned ${response.status}`,
          connected: false
        });
      }

      const data = await response.json();
      res.json({ ...data, connected: true });
    } catch (error) {
      log(`[Twenty] Connection error: ${error}`);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
        connected: false
      });
    }
  });

  // Twenty CRM Health Check
  app.get("/api/twenty/health", async (_req, res) => {
    if (!TWENTY_API_URL || !TWENTY_API_KEY) {
      return res.json({
        status: "not_configured",
        error: "Twenty CRM API key not set"
      });
    }

    try {
      const start = Date.now();
      const response = await fetchWithTimeout(`${TWENTY_API_URL}/healthz`);
      const responseTime = Date.now() - start;

      if (response.ok) {
        res.json({
          status: "healthy",
          responseTime,
          url: TWENTY_API_URL
        });
      } else {
        res.json({
          status: "degraded",
          responseTime,
          error: `HTTP ${response.status}`
        });
      }
    } catch (error) {
      res.json({
        status: "offline",
        error: error instanceof Error ? error.message : "Connection failed"
      });
    }
  });

  // ============================================
  // DeepSeek R1 Proxy Routes (Oracle ARM)
  // ============================================

  // Generate response from DeepSeek R1
  app.post("/api/deepseek/generate", async (req, res) => {
    try {
      const { prompt, context, host, port } = req.body;
      const targetHost = host || SERVICES.deepSeek.host;
      const targetPort = port || SERVICES.deepSeek.port;

      log(`[DeepSeek] Generating response from ${targetHost}:${targetPort}`);

      const response = await fetchWithTimeout(
        `http://${targetHost}:${targetPort}/api/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "deepseek-r1:14b",
            prompt,
            stream: false,
            context,
          }),
        },
        180000 // 3 minute timeout for generation (14B model on ARM is slow)
      );

      if (!response.ok) {
        throw new Error(`DeepSeek API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      log(`[DeepSeek] Error: ${error}`);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // DeepSeek health check
  app.get("/api/deepseek/health", async (req, res) => {
    try {
      const host = (req.query.host as string) || SERVICES.deepSeek.host;
      const port = (req.query.port as string) || String(SERVICES.deepSeek.port);

      const start = Date.now();
      const response = await fetchWithTimeout(`http://${host}:${port}/api/tags`);
      const responseTime = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        res.json({
          status: "healthy",
          responseTime,
          models: data.models?.map((m: any) => m.name) || []
        });
      } else {
        res.json({ status: "degraded", responseTime, error: `HTTP ${response.status}` });
      }
    } catch (error) {
      res.json({
        status: "offline",
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // ============================================
  // Grid Engine Proxy Routes (Oracle ARM)
  // ============================================

  // Get system status
  app.get("/api/grid/status", async (req, res) => {
    try {
      const host = (req.query.host as string) || SERVICES.gridEngine.host;
      const port = (req.query.port as string) || String(SERVICES.gridEngine.port);

      const response = await fetchWithTimeout(`http://${host}:${port}/status`);

      if (!response.ok) {
        throw new Error(`Grid Engine returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      log(`[Grid] Status error: ${error}`);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // Get all counties
  app.get("/api/grid/counties", async (req, res) => {
    try {
      const host = (req.query.host as string) || SERVICES.gridEngine.host;
      const port = (req.query.port as string) || String(SERVICES.gridEngine.port);

      const response = await fetchWithTimeout(`http://${host}:${port}/api/counties`);

      if (!response.ok) {
        throw new Error(`Grid Engine returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      log(`[Grid] Counties error: ${error}`);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
        counties: []
      });
    }
  });

  // Get active alerts
  app.get("/api/grid/alerts", async (req, res) => {
    try {
      const host = (req.query.host as string) || SERVICES.gridEngine.host;
      const port = (req.query.port as string) || String(SERVICES.gridEngine.port);

      const response = await fetchWithTimeout(`http://${host}:${port}/api/alerts/active`);

      if (!response.ok) {
        throw new Error(`Grid Engine returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      log(`[Grid] Alerts error: ${error}`);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
        alerts: []
      });
    }
  });

  // Get current outages
  app.get("/api/grid/outages", async (req, res) => {
    try {
      const host = (req.query.host as string) || SERVICES.gridEngine.host;
      const port = (req.query.port as string) || String(SERVICES.gridEngine.port);

      const response = await fetchWithTimeout(`http://${host}:${port}/api/outages/current`);

      if (!response.ok) {
        throw new Error(`Grid Engine returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      log(`[Grid] Outages error: ${error}`);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
        counties: {},
        totalCountiesAffected: 0,
        totalCustomersAffected: 0
      });
    }
  });

  // ============================================
  // Bulk Health Check Route (MUST come before :service route)
  // ============================================

  app.get("/api/health/all", async (_req, res) => {
    const checks = Object.entries(SERVICES).map(async ([name, config]) => {
      try {
        const start = Date.now();
        const url = `http://${config.host}:${config.port}${config.healthEndpoint}`;
        const response = await fetchWithTimeout(url);
        const responseTime = Date.now() - start;

        return {
          name,
          status: response.ok ? "healthy" : "degraded",
          host: config.host,
          port: String(config.port),
          responseTime,
          lastChecked: new Date().toISOString(),
        };
      } catch (error) {
        return {
          name,
          status: "offline",
          host: config.host,
          port: String(config.port),
          error: error instanceof Error ? error.message : "Connection failed",
          lastChecked: new Date().toISOString(),
        };
      }
    });

    const results = await Promise.all(checks);
    const healthy = results.filter(r => r.status === "healthy").length;
    const total = results.length;

    res.json({
      services: results,
      summary: {
        healthy,
        degraded: results.filter(r => r.status === "degraded").length,
        offline: results.filter(r => r.status === "offline").length,
        total,
        overallHealth: healthy === total ? "healthy" : healthy > 0 ? "degraded" : "critical",
      },
      lastChecked: new Date().toISOString(),
    });
  });

  // ============================================
  // LiveWire Intelligence Proxy Routes
  // ============================================

  const LIVEWIRE_INTEL_URL = process.env.LIVEWIRE_INTEL_URL || "http://localhost:5100";

  // LiveWire Analyze - Proxy to Python intelligence core
  app.post("/api/livewire/analyze", async (req, res) => {
    try {
      log(`[LiveWire] Analyzing post: ${req.body.title?.substring(0, 50)}...`);

      const response = await fetchWithTimeout(
        `${LIVEWIRE_INTEL_URL}/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        },
        30000 // 30 second timeout for analysis
      );

      if (!response.ok) {
        const errorText = await response.text();
        log(`[LiveWire] Analysis error: ${response.status} - ${errorText}`);
        return res.status(response.status).json({
          error: `LiveWire Intelligence returned ${response.status}`,
          detail: errorText
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      log(`[LiveWire] Connection error: ${error}`);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // LiveWire Feedback - Record approval/rejection
  app.post("/api/livewire/feedback", async (req, res) => {
    try {
      log(`[LiveWire] Recording feedback: ${req.body.action} for ${req.body.post_id}`);

      const response = await fetchWithTimeout(
        `${LIVEWIRE_INTEL_URL}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        },
        10000
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `LiveWire Intelligence returned ${response.status}`,
          detail: errorText
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      log(`[LiveWire] Feedback error: ${error}`);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // LiveWire Stats - Get feedback statistics
  app.get("/api/livewire/stats", async (_req, res) => {
    try {
      const response = await fetchWithTimeout(`${LIVEWIRE_INTEL_URL}/stats`);

      if (!response.ok) {
        return res.status(response.status).json({
          error: `LiveWire Intelligence returned ${response.status}`
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // LiveWire Health Check
  app.get("/api/livewire/health", async (_req, res) => {
    try {
      const start = Date.now();
      const response = await fetchWithTimeout(`${LIVEWIRE_INTEL_URL}/health`);
      const responseTime = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        res.json({
          status: "healthy",
          responseTime,
          ...data
        });
      } else {
        res.json({
          status: "degraded",
          responseTime,
          error: `HTTP ${response.status}`
        });
      }
    } catch (error) {
      res.json({
        status: "offline",
        error: error instanceof Error ? error.message : "Connection failed"
      });
    }
  });

  // LiveWire Rejection Patterns
  app.get("/api/livewire/patterns/rejected", async (_req, res) => {
    try {
      const response = await fetchWithTimeout(`${LIVEWIRE_INTEL_URL}/patterns/rejected`);

      if (!response.ok) {
        return res.status(response.status).json({
          error: `LiveWire Intelligence returned ${response.status}`
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // ============================================
  // LiveWire v1 Proxy Routes (Backend on admiral-server:5000)
  // ============================================

  // Get all leads from LiveWire v1
  app.get("/api/livewire/leads", async (_req, res) => {
    try {
      log(`[LiveWire v1] Fetching leads from ${LIVEWIRE_V1_URL}/leads`);
      const response = await fetchWithTimeout(`${LIVEWIRE_V1_URL}/leads`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      log(`[LiveWire v1] Got ${data.leads?.length || 0} leads`);
      res.json(data);
    } catch (error) {
      log(`[LiveWire v1] Error: ${error}`);
      res.status(503).json({
        error: error instanceof Error ? error.message : "Connection failed",
        leads: []
      });
    }
  });

  // Get LiveWire settings
  app.get("/api/livewire/settings", async (_req, res) => {
    try {
      const response = await fetchWithTimeout(`${LIVEWIRE_V1_URL}/settings`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable" });
    }
  });

  // Update LiveWire settings
  app.post("/api/livewire/settings", async (req, res) => {
    try {
      const response = await fetchWithTimeout(`${LIVEWIRE_V1_URL}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable" });
    }
  });

  // v2.0 Keywords
  app.get("/api/livewire/v2/keywords", async (_req, res) => {
    try {
      const response = await fetchWithTimeout(`${LIVEWIRE_V1_URL}/v2/keywords`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable", keywords: [] });
    }
  });

  app.get("/api/livewire/v2/keywords/flagged", async (_req, res) => {
    try {
      const response = await fetchWithTimeout(`${LIVEWIRE_V1_URL}/v2/keywords/flagged`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable", keywords: [] });
    }
  });

  app.post("/api/livewire/v2/keywords/:keyword/reset", async (req, res) => {
    try {
      const { keyword } = req.params;
      const response = await fetchWithTimeout(
        `${LIVEWIRE_V1_URL}/v2/keywords/${encodeURIComponent(keyword)}/reset`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable" });
    }
  });

  // v2.0 Subreddits
  app.get("/api/livewire/v2/subreddits", async (_req, res) => {
    try {
      const response = await fetchWithTimeout(`${LIVEWIRE_V1_URL}/v2/subreddits`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable", subreddits: [] });
    }
  });

  app.post("/api/livewire/v2/subreddits/:name/promote", async (req, res) => {
    try {
      const { name } = req.params;
      const response = await fetchWithTimeout(
        `${LIVEWIRE_V1_URL}/v2/subreddits/${encodeURIComponent(name)}/promote`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable" });
    }
  });

  app.post("/api/livewire/v2/subreddits/:name/demote", async (req, res) => {
    try {
      const { name } = req.params;
      const response = await fetchWithTimeout(
        `${LIVEWIRE_V1_URL}/v2/subreddits/${encodeURIComponent(name)}/demote`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable" });
    }
  });

  app.post("/api/livewire/v2/subreddits/:name/retire", async (req, res) => {
    try {
      const { name } = req.params;
      const response = await fetchWithTimeout(
        `${LIVEWIRE_V1_URL}/v2/subreddits/${encodeURIComponent(name)}/retire`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable" });
    }
  });

  // Lead status and feedback (v1)
  app.patch("/api/livewire/leads/:leadId/status", async (req, res) => {
    try {
      const { leadId } = req.params;
      const response = await fetchWithTimeout(
        `${LIVEWIRE_V1_URL}/leads/${leadId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable" });
    }
  });

  app.post("/api/livewire/leads/:leadId/feedback", async (req, res) => {
    try {
      const { leadId } = req.params;
      const response = await fetchWithTimeout(
        `${LIVEWIRE_V1_URL}/leads/${leadId}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable" });
    }
  });

  // Scanner control endpoints
  app.post("/api/livewire/scan", async (req, res) => {
    try {
      log(`[LiveWire v1] Triggering manual scan`);
      const response = await fetchWithTimeout(
        `${LIVEWIRE_V1_URL}/scan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        },
        60000 // 60 second timeout for scan
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({ error: "LiveWire unavailable" });
    }
  });

  app.get("/api/livewire/scanner-status", async (_req, res) => {
    try {
      const response = await fetchWithTimeout(`${LIVEWIRE_V1_URL}/scanner-status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.json({
        isActive: false,
        lastScan: null,
        error: error instanceof Error ? error.message : "Connection failed"
      });
    }
  });

  // ============================================
  // Generic Health Check Route (for single service)
  // ============================================

  app.get("/api/health/:service", async (req, res) => {
    const { service } = req.params;
    const host = req.query.host as string;
    const port = req.query.port as string;

    // Get service config or use custom host/port
    const serviceConfig = SERVICES[service as keyof typeof SERVICES];
    const targetHost = host || serviceConfig?.host;
    const targetPort = port || (serviceConfig?.port ? String(serviceConfig.port) : undefined);
    const healthEndpoint = serviceConfig?.healthEndpoint || "/health";

    if (!targetHost || !targetPort) {
      return res.status(400).json({
        status: "error",
        error: `Unknown service: ${service}. Provide host and port query params.`
      });
    }

    try {
      const start = Date.now();
      const url = `http://${targetHost}:${targetPort}${healthEndpoint}`;
      const response = await fetchWithTimeout(url);
      const responseTime = Date.now() - start;

      if (response.ok) {
        res.json({
          status: "healthy",
          service,
          host: targetHost,
          port: targetPort,
          responseTime,
          lastChecked: new Date().toISOString()
        });
      } else {
        res.json({
          status: "degraded",
          service,
          host: targetHost,
          port: targetPort,
          responseTime,
          error: `HTTP ${response.status}`,
          lastChecked: new Date().toISOString()
        });
      }
    } catch (error) {
      res.json({
        status: "offline",
        service,
        host: targetHost,
        port: targetPort,
        error: error instanceof Error ? error.message : "Connection failed",
        lastChecked: new Date().toISOString()
      });
    }
  });

  return httpServer;
}
