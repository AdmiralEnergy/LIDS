/**
 * Mock Data for Command Dashboard
 * Used for frontend development before backend integration
 */

import type { ChatMessage, CountyState, NWSAlert, ServiceHealthResult } from "@shared/schema";
import { generateId } from "./utils";

// ============================================
// Mock Chat Data
// ============================================

export const MOCK_CHAT_RESPONSE = {
  thinking: `Let me analyze this request step by step:

1. First, I'll check the current system status
2. Then I'll review the NC county data
3. Finally, I'll provide recommendations

The Grid Engine is showing 100 NC counties monitored with 5 currently having elevated status due to weather conditions in the western part of the state.`,
  response: `Based on my analysis:

**Current Status:**
- 100 NC counties being monitored
- 5 counties with elevated alert status
- 2 active NWS weather alerts

**Key Observations:**
1. Western NC experiencing winter weather advisory
2. No major outages detected at this time
3. Duke Energy feeds are healthy and updating every 5 minutes

Would you like me to provide more details on any specific county or alert?`,
};

export function createMockChatMessage(role: "user" | "assistant", content: string, thinking?: string): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    thinking,
    timestamp: new Date(),
  };
}

// ============================================
// Mock Grid Engine Data
// ============================================

const NC_COUNTIES = [
  "Alamance", "Alexander", "Alleghany", "Anson", "Ashe", "Avery", "Beaufort", "Bertie",
  "Bladen", "Brunswick", "Buncombe", "Burke", "Cabarrus", "Caldwell", "Camden", "Carteret",
  "Caswell", "Catawba", "Chatham", "Cherokee", "Chowan", "Clay", "Cleveland", "Columbus",
  "Craven", "Cumberland", "Currituck", "Dare", "Davidson", "Davie", "Duplin", "Durham",
  "Edgecombe", "Forsyth", "Franklin", "Gaston", "Gates", "Graham", "Granville", "Greene",
  "Guilford", "Halifax", "Harnett", "Haywood", "Henderson", "Hertford", "Hoke", "Hyde",
  "Iredell", "Jackson", "Johnston", "Jones", "Lee", "Lenoir", "Lincoln", "Macon",
  "Madison", "Martin", "McDowell", "Mecklenburg", "Mitchell", "Montgomery", "Moore", "Nash",
  "New Hanover", "Northampton", "Onslow", "Orange", "Pamlico", "Pasquotank", "Pender",
  "Perquimans", "Person", "Pitt", "Polk", "Randolph", "Richmond", "Robeson", "Rockingham",
  "Rowan", "Rutherford", "Sampson", "Scotland", "Stanly", "Stokes", "Surry", "Swain",
  "Transylvania", "Tyrrell", "Union", "Vance", "Wake", "Warren", "Washington", "Watauga",
  "Wayne", "Wilkes", "Wilson", "Yadkin", "Yancey"
];

export function generateMockCountyStates(): CountyState[] {
  return NC_COUNTIES.map((county, i) => {
    // Add some variety - a few counties with elevated status
    let level: CountyState["level"] = "GREEN";
    let reason = "No active alerts or outages";
    let customersOut = 0;
    let percentOut: number | null = null;
    let nwsAlerts: string[] = [];

    // Make some counties have elevated status for demo
    if (county === "Buncombe" || county === "Henderson") {
      level = "YELLOW";
      reason = "Winter Storm Watch in effect";
      nwsAlerts = ["Winter Storm Watch"];
    } else if (county === "Avery" || county === "Mitchell") {
      level = "RED";
      reason = "Winter Storm Warning - High winds expected";
      nwsAlerts = ["Winter Storm Warning"];
    } else if (county === "Watauga") {
      level = "BLACK";
      reason = "2,341 customers without power due to ice storm";
      customersOut = 2341;
      percentOut = 4.3;
      nwsAlerts = ["Ice Storm Warning"];
    }

    return {
      county,
      fips: `37${String(i * 2 + 1).padStart(3, "0")}`,
      level,
      reason,
      customersOut,
      percentOut,
      nwsAlerts,
      updatedAt: new Date().toISOString(),
    };
  });
}

export const MOCK_NWS_ALERTS: NWSAlert[] = [
  {
    id: "urn:oid:2.49.0.1.840.0.mock1",
    event: "Winter Storm Warning",
    severity: "Severe",
    certainty: "Likely",
    urgency: "Expected",
    areaDesc: "Avery; Mitchell; Yancey",
    affectedCounties: ["Avery", "Mitchell", "Yancey"],
    onset: new Date(Date.now() - 3600000).toISOString(),
    expires: new Date(Date.now() + 86400000).toISOString(),
    headline: "WINTER STORM WARNING in effect until Friday evening",
  },
  {
    id: "urn:oid:2.49.0.1.840.0.mock2",
    event: "Winter Storm Watch",
    severity: "Moderate",
    certainty: "Possible",
    urgency: "Future",
    areaDesc: "Buncombe; Henderson; Transylvania",
    affectedCounties: ["Buncombe", "Henderson", "Transylvania"],
    onset: new Date(Date.now() + 7200000).toISOString(),
    expires: new Date(Date.now() + 172800000).toISOString(),
    headline: "WINTER STORM WATCH in effect from Friday morning through Saturday evening",
  },
];

export const MOCK_OUTAGES = {
  counties: {
    "Watauga": 2341,
    "Avery": 156,
    "Mitchell": 89,
    "Buncombe": 45,
  },
  totalCountiesAffected: 4,
  totalCustomersAffected: 2631,
};

// ============================================
// Mock Service Health Data
// ============================================

export const MOCK_SERVICE_HEALTH: ServiceHealthResult[] = [
  // Oracle ARM - all healthy
  {
    name: "grid-engine",
    status: "healthy",
    host: "193.122.153.249",
    port: "4120",
    responseTime: 45,
    lastChecked: new Date().toISOString(),
  },
  {
    name: "deepseek",
    status: "healthy",
    host: "193.122.153.249",
    port: "11434",
    responseTime: 123,
    lastChecked: new Date().toISOString(),
  },

  // Admiral-Server - mix of statuses
  {
    name: "livewire",
    status: "healthy",
    host: "192.168.1.23",
    port: "5000",
    responseTime: 28,
    lastChecked: new Date().toISOString(),
  },
  {
    name: "agent-claude",
    status: "healthy",
    host: "192.168.1.23",
    port: "4110",
    responseTime: 67,
    lastChecked: new Date().toISOString(),
  },
  {
    name: "oracle-memory",
    status: "degraded",
    host: "192.168.1.23",
    port: "4050",
    responseTime: 2345,
    error: "Slow response",
    lastChecked: new Date().toISOString(),
  },
  {
    name: "twilio-service",
    status: "healthy",
    host: "192.168.1.23",
    port: "4115",
    responseTime: 34,
    lastChecked: new Date().toISOString(),
  },
  {
    name: "n8n",
    status: "offline",
    host: "192.168.1.23",
    port: "5678",
    error: "Connection refused",
    lastChecked: new Date().toISOString(),
  },

  // Droplet
  {
    name: "twenty-crm",
    status: "healthy",
    host: "localhost",
    port: "3001",
    responseTime: 12,
    lastChecked: new Date().toISOString(),
  },
];

export function getMockServiceByName(name: string): ServiceHealthResult | undefined {
  return MOCK_SERVICE_HEALTH.find(s => s.name === name);
}
