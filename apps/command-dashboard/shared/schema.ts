import { z } from "zod";

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  timestamp: Date;
}

export const chatRequestSchema = z.object({
  prompt: z.string().min(1),
  context: z.array(z.number()).optional(),
});

// ============================================
// Grid Engine Types
// ============================================

export type CountyStateLevel = "GREEN" | "YELLOW" | "RED" | "BLACK";

export interface CountyState {
  county: string;
  fips: string;
  level: CountyStateLevel;
  reason: string;
  customersOut: number;
  percentOut: number | null;
  nwsAlerts: string[];
  updatedAt: string;
}

export interface GridStatus {
  countyStates: CountyState[];
  feeds: FeedHealth[];
  safeMode: SafeModeState;
  lastEvaluation: string;
}

export interface FeedHealth {
  source: "NWS" | "DUKE_DEC" | "DUKE_DEP";
  lastSuccessAt: string | null;
  isStale: boolean;
  lastError: string | null;
}

export type SafeModeState = "NORMAL" | "DUKE_STALE" | "NWS_STALE" | "FULL_SAFE";

export interface NWSAlert {
  id: string;
  event: string;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  certainty: string;
  urgency: string;
  areaDesc: string;
  affectedCounties: string[];
  onset: string;
  expires: string;
  headline: string;
}

export interface OutageData {
  counties: Record<string, number>;
  totalCountiesAffected: number;
  totalCustomersAffected: number;
}

// ============================================
// Service Health Types
// ============================================

export type ServiceStatus = "healthy" | "degraded" | "offline" | "unknown";
export type ServiceLocation = "oracle-arm" | "admiral-server" | "droplet";

export interface ServiceHealthResult {
  name: string;
  status: ServiceStatus;
  host: string;
  port: string;
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

export interface HealthCheckSummary {
  services: ServiceHealthResult[];
  summary: {
    healthy: number;
    degraded: number;
    offline: number;
    total: number;
    overallHealth: "healthy" | "degraded" | "critical";
  };
  lastChecked: string;
}
