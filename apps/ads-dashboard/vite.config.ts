import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3100,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      // Twenty CRM API proxy to avoid CORS
      '/twenty-api': {
        target: process.env.VITE_TWENTY_CRM_URL || `http://${process.env.VITE_BACKEND_HOST || 'localhost'}:3001`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/twenty-api/, ''),
      },
      // Voice service for transcription
      '/voice-api': {
        target: process.env.VITE_VOICE_SERVICE_URL || `http://${process.env.VITE_BACKEND_HOST || 'localhost'}:4130`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/voice-api/, ''),
      },
      // Twilio service
      '/twilio-api': {
        target: process.env.VITE_TWILIO_SERVICE_URL || `http://${process.env.VITE_BACKEND_HOST || 'localhost'}:4115`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/twilio-api/, ''),
      },
    },
  },
});
