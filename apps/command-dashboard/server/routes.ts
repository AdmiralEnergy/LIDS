import type { Express } from "express";
import { type Server } from "http";
import { log } from "./index";

// Service configurations - these are defaults, can be overridden by client settings
const ORACLE_ARM_HOST = process.env.ORACLE_ARM_HOST || "193.122.153.249";
const ADMIRAL_SERVER_HOST = process.env.ADMIRAL_SERVER_HOST || "192.168.1.23";

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

  // Droplet services (localhost when running on droplet)
  twentyCrm: { host: "localhost", port: 3001, healthEndpoint: "/healthz" },
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
