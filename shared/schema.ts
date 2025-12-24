import { z } from "zod";

// Agent definitions
export const AGENTS = {
  'fo-001': { id: 'fo-001', name: 'SCOUT', description: 'Lead discovery & research', color: '#3B82F6' },
  'fo-002': { id: 'fo-002', name: 'ANALYST', description: 'Data analysis & insights', color: '#10B981' },
  'fo-003': { id: 'fo-003', name: 'CALLER', description: 'Outbound communications', color: '#F59E0B' },
  'fo-004': { id: 'fo-004', name: 'SCRIBE', description: 'Documentation & notes', color: '#8B5CF6' },
  'fo-005': { id: 'fo-005', name: 'WATCHMAN', description: 'Pipeline monitoring', color: '#EF4444' },
  'fo-010': { id: 'fo-010', name: 'APEX', description: 'Strategic command', color: '#F59E0B' },
} as const;

export type AgentId = keyof typeof AGENTS;

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  color: string;
}

// Chat message types
export interface SuggestedAction {
  id: string;
  label: string;
  action: string;
  params: Record<string, unknown>;
  destructive?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  suggestedActions?: SuggestedAction[];
  timestamp: Date;
  enrichmentData?: EnrichmentResult;
}

export interface AgentResponse {
  message: string;
  suggestedActions?: SuggestedAction[];
  enrichmentData?: EnrichmentResult;
}

// Lead types
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  mortgageBalance?: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';
  createdAt: Date;
}

export const insertLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zip: z.string().min(5).max(10),
  county: z.string().optional(),
  mortgageBalance: z.number().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'closed']).default('new'),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;

// Property data types
export interface PropertyData {
  address: string;
  sqft: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
  estimatedValue: number | null;
  roofType: string | null;
  lotSize: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
}

// Utility provider types
export interface UtilityProvider {
  id: string;
  name: string;
  ratePerKwh: number;
  avgMonthlyUsage: number;
}

// Enrichment result types
export interface EnrichmentResult {
  property: PropertyData;
  utility: UtilityProvider;
  calculations: {
    estimatedValue: number;
    monthlyElectricBill: number;
    estimatedEquity: number | null;
  };
  source: 'scraped' | 'calculated';
}

// Chat request/response types
export const chatRequestSchema = z.object({
  message: z.string().min(1),
  context: z.object({
    leadId: z.string().optional(),
    callSid: z.string().optional(),
  }).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// Property lookup request
export const propertyLookupSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zip: z.string().min(5).max(10),
});

export type PropertyLookupRequest = z.infer<typeof propertyLookupSchema>;
