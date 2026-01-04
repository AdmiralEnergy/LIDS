/**
 * Command Dashboard Settings
 * All service URLs and polling intervals are configurable from the UI
 * Stored in localStorage for persistence
 */

export interface ServiceSettings {
  // Oracle ARM Services
  gridEngineUrl: string;
  deepSeekUrl: string;

  // Admiral-Server Services
  liveWireUrl: string;
  liveWireIntelUrl: string;
  agentClaudeUrl: string;
  oracleMemoryUrl: string;
  twilioServiceUrl: string;
  n8nUrl: string;

  // Droplet Services
  twentyCrmUrl: string;

  // Polling Settings
  healthCheckInterval: number; // ms
  gridRefreshInterval: number; // ms
}

// Default settings
const DEFAULT_SETTINGS: ServiceSettings = {
  // Oracle ARM (193.122.153.249)
  gridEngineUrl: "http://193.122.153.249:4120",
  deepSeekUrl: "http://193.122.153.249:11434",

  // Admiral-Server (192.168.1.23)
  liveWireUrl: "http://192.168.1.23:5000",
  liveWireIntelUrl: "http://192.168.1.23:5100",
  agentClaudeUrl: "http://192.168.1.23:4110",
  oracleMemoryUrl: "http://192.168.1.23:4050",
  twilioServiceUrl: "http://192.168.1.23:4115",
  n8nUrl: "http://192.168.1.23:5678",

  // Droplet (localhost)
  twentyCrmUrl: "http://localhost:3001",

  // Polling intervals
  healthCheckInterval: 30000, // 30 seconds
  gridRefreshInterval: 60000, // 60 seconds
};

const STORAGE_KEY = "command-dashboard-settings";

/**
 * Get current settings from localStorage or defaults
 */
export function getSettings(): ServiceSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new fields
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: Partial<ServiceSettings>): ServiceSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
  return updated;
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): ServiceSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to reset settings:", error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Parse URL into host and port
 */
export function parseUrl(url: string): { host: string; port: string } {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
    };
  } catch {
    // Fallback for malformed URLs
    const match = url.match(/\/\/([^:]+):(\d+)/);
    if (match) {
      return { host: match[1], port: match[2] };
    }
    return { host: url, port: "80" };
  }
}

/**
 * Service configuration for the health panel
 */
export interface ServiceConfig {
  id: string;
  name: string;
  location: "oracle-arm" | "admiral-server" | "droplet";
  settingsKey: keyof ServiceSettings;
  healthEndpoint: string;
  description: string;
}

export const SERVICE_CONFIGS: ServiceConfig[] = [
  // Oracle ARM
  {
    id: "grid-engine",
    name: "NC Grid Engine",
    location: "oracle-arm",
    settingsKey: "gridEngineUrl",
    healthEndpoint: "/health",
    description: "NC Duke outage monitoring & county state machine",
  },
  {
    id: "deepseek",
    name: "DeepSeek R1",
    location: "oracle-arm",
    settingsKey: "deepSeekUrl",
    healthEndpoint: "/api/tags",
    description: "DeepSeek R1 14B LLM via Ollama",
  },

  // Admiral-Server
  {
    id: "livewire",
    name: "LiveWire",
    location: "admiral-server",
    settingsKey: "liveWireUrl",
    healthEndpoint: "/health",
    description: "Reddit lead scanner",
  },
  {
    id: "agent-claude",
    name: "Agent-Claude",
    location: "admiral-server",
    settingsKey: "agentClaudeUrl",
    healthEndpoint: "/health",
    description: "MCP server with persistent memory",
  },
  {
    id: "oracle-memory",
    name: "Oracle Memory",
    location: "admiral-server",
    settingsKey: "oracleMemoryUrl",
    healthEndpoint: "/health",
    description: "Semantic memory system",
  },
  {
    id: "twilio-service",
    name: "Twilio Service",
    location: "admiral-server",
    settingsKey: "twilioServiceUrl",
    healthEndpoint: "/health",
    description: "Browser calling & SMS",
  },
  {
    id: "n8n",
    name: "n8n",
    location: "admiral-server",
    settingsKey: "n8nUrl",
    healthEndpoint: "/healthz",
    description: "Workflow automation",
  },

  // Droplet
  {
    id: "twenty-crm",
    name: "Twenty CRM",
    location: "droplet",
    settingsKey: "twentyCrmUrl",
    healthEndpoint: "/healthz",
    description: "CRM & auth layer",
  },
];

/**
 * Get services grouped by location
 */
export function getServicesByLocation() {
  return {
    "oracle-arm": SERVICE_CONFIGS.filter(s => s.location === "oracle-arm"),
    "admiral-server": SERVICE_CONFIGS.filter(s => s.location === "admiral-server"),
    "droplet": SERVICE_CONFIGS.filter(s => s.location === "droplet"),
  };
}
