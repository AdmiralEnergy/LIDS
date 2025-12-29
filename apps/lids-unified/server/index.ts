import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=== LIDS UNIFIED SERVER STARTING ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT || 5000);

// ============ ENVIRONMENT CONFIGURATION ============

// Twenty CRM (on droplet)
const TWENTY_CRM_URL = process.env.TWENTY_CRM_URL || "http://localhost:3001";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY || "";

// Admiral-server services (via Tailscale)
const ADMIRAL_SERVER_URL = process.env.ADMIRAL_SERVER_URL || "http://100.66.42.81";
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || `${ADMIRAL_SERVER_URL}:4130`;
const TWILIO_SERVICE_URL = process.env.TWILIO_SERVICE_URL || `${ADMIRAL_SERVER_URL}:4115`;
const POSTIZ_URL = process.env.POSTIZ_URL || `${ADMIRAL_SERVER_URL}:3200`;

// Email
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

console.log("TWENTY_CRM_URL:", TWENTY_CRM_URL);
console.log("ADMIRAL_SERVER_URL:", ADMIRAL_SERVER_URL);

// ============ APP SETUP ============

const app = express();
const httpServer = createServer(app);

app.use(cors());

// ============ PROXY MIDDLEWARE (before body parsing) ============

// Twenty CRM proxy - direct passthrough
app.use(
  "/twenty-api",
  createProxyMiddleware({
    target: TWENTY_CRM_URL,
    changeOrigin: true,
    pathRewrite: { "^/twenty-api": "" },
  })
);

// Voice service proxy (admiral-server)
if (VOICE_SERVICE_URL) {
  app.use(
    "/voice-api",
    createProxyMiddleware({
      target: VOICE_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/voice-api": "" },
      onError: (err, req, res) => {
        console.warn("[voice-api] Admiral-server unreachable:", err.message);
        (res as Response).status(503).json({ error: "Voice service unavailable" });
      },
    })
  );
}

// Twilio service proxy (admiral-server)
if (TWILIO_SERVICE_URL) {
  app.use(
    "/twilio-api",
    createProxyMiddleware({
      target: TWILIO_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/twilio-api": "" },
      onError: (err, req, res) => {
        console.warn("[twilio-api] Admiral-server unreachable:", err.message);
        (res as Response).status(503).json({ error: "Twilio service unavailable" });
      },
    })
  );
}

// Postiz proxy (admiral-server) - for Studio social scheduling
if (POSTIZ_URL) {
  app.use(
    "/api/postiz",
    createProxyMiddleware({
      target: POSTIZ_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/postiz": "" },
      onError: (err, req, res) => {
        console.warn("[postiz] Admiral-server unreachable:", err.message);
        (res as Response).status(503).json({ error: "Postiz service unavailable" });
      },
    })
  );
}

// ============ BODY PARSING ============

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// ============ REQUEST LOGGING ============

function log(message: string, source = "unified") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// ============ SHARED API ROUTES ============

// Import route modules
import { twentyRoutes } from "./routes/twenty.js";
import { chatRoutes } from "./routes/chat.js";
import { emailRoutes } from "./routes/email.js";
import { smsRoutes } from "./routes/sms.js";

// Mount shared routes
app.use("/api/twenty", twentyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/ads/dialer/sms", smsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      twenty: TWENTY_CRM_URL ? "configured" : "not configured",
      admiral: ADMIRAL_SERVER_URL ? "configured" : "not configured",
    },
  });
});

// ============ STATIC FILE SERVING ============

// Determine which SPA to serve based on Host header
function getSpaRoot(host: string): string {
  if (host.includes("studio")) return "studio";
  if (host.includes("compass")) return "compass";
  if (host.includes("academy")) return "academy";
  return "ads"; // Default to ADS Dashboard
}

if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../dist/public");

  // Serve static assets for each app
  app.use("/studio", express.static(path.join(distPath, "studio")));
  app.use("/compass", express.static(path.join(distPath, "compass")));
  app.use("/academy", express.static(path.join(distPath, "academy")));
  app.use("/", express.static(path.join(distPath, "ads")));

  // SPA fallback - serve correct index.html based on Host or path
  app.get("*", (req, res) => {
    const host = req.hostname || req.headers.host || "";
    const spaRoot = getSpaRoot(host);

    // Check if path already indicates the SPA
    if (req.path.startsWith("/studio")) {
      return res.sendFile(path.join(distPath, "studio", "index.html"));
    }
    if (req.path.startsWith("/compass")) {
      return res.sendFile(path.join(distPath, "compass", "index.html"));
    }
    if (req.path.startsWith("/academy")) {
      return res.sendFile(path.join(distPath, "academy", "index.html"));
    }

    // Otherwise use host-based routing
    res.sendFile(path.join(distPath, spaRoot, "index.html"));
  });

  log("Production mode - serving static files");
} else {
  log("Development mode - SPAs served separately");

  // In dev, just return instructions
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.json({
      message: "LIDS Unified Server (Development Mode)",
      note: "In development, run individual apps with their own Vite dev servers",
      apps: {
        ads: "http://localhost:3100",
        studio: "http://localhost:3103",
        compass: "http://localhost:3101",
        academy: "http://localhost:3102",
      },
    });
  });
}

// ============ ERROR HANDLING ============

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error("Express error:", err);
});

// ============ START SERVER ============

const port = parseInt(process.env.PORT || "5000", 10);

httpServer.listen({ port, host: "0.0.0.0" }, () => {
  log(`LIDS Unified Server running on port ${port}`);
  console.log("=== SERVER READY ===");
});

httpServer.on("error", (error: NodeJS.ErrnoException) => {
  console.error("FATAL: Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use`);
  }
  process.exit(1);
});

export { app, log };
