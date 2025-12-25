import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

console.log("=== SERVER STARTING ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT || 5000);

// Backend service URLs from environment
const BACKEND_HOST = process.env.BACKEND_HOST;
if (!BACKEND_HOST) {
  console.error('FATAL: BACKEND_HOST environment variable is required');
  console.error('Set BACKEND_HOST to the admiral-server IP (e.g., your Tailscale IP)');
  process.exit(1);
}
const TWENTY_CRM_URL = process.env.TWENTY_CRM_URL || `http://${BACKEND_HOST}:3001`;
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || `http://${BACKEND_HOST}:4130`;
const TWILIO_SERVICE_URL = process.env.TWILIO_SERVICE_URL || `http://${BACKEND_HOST}:4115`;

console.log("TWENTY_CRM_URL:", TWENTY_CRM_URL);
console.log("VOICE_SERVICE_URL:", VOICE_SERVICE_URL);
console.log("TWILIO_SERVICE_URL:", TWILIO_SERVICE_URL);

const app = express();
const httpServer = createServer(app);

// API Proxies - MUST be BEFORE body parsing middleware
// These forward raw requests to backend services
app.use(
  "/twenty-api",
  createProxyMiddleware({
    target: TWENTY_CRM_URL,
    changeOrigin: true,
    pathRewrite: { "^/twenty-api": "" },
  })
);

app.use(
  "/voice-api",
  createProxyMiddleware({
    target: VOICE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/voice-api": "" },
  })
);

app.use(
  "/twilio-api",
  createProxyMiddleware({
    target: TWILIO_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/twilio-api": "" },
  })
);

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
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
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
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error("Express error:", err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      console.log("Production mode - serving static files");
      serveStatic(app);
    } else {
      console.log("Development mode - setting up Vite");
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);
    
    try {
      httpServer.listen(
        {
          port,
          host: "0.0.0.0",
          
        },
        () => {
          log(`serving on port ${port}`);
          console.log("=== SERVER READY ===");
        },
      );
    } catch (listenError) {
      console.error("FATAL: Server failed to start:", listenError);
      process.exit(1);
    }

    httpServer.on("error", (error: NodeJS.ErrnoException) => {
      console.error("FATAL: Server error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("FATAL: Server initialization failed:", error);
    process.exit(1);
  }
})();
