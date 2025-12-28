import Dexie, { Table } from 'dexie';
import type { SuggestedAction, EnrichmentResult } from '@shared/schema';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  status: 'new' | 'contacted' | 'qualified' | 'appointment' | 'closed';
  source?: string;
  enrichment?: {
    propertyValue?: number;
    sqft?: number;
    yearBuilt?: number;
    roofType?: string;
    utilityProvider?: string;
    monthlyBill?: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  agentId: string;
  leadId?: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: SuggestedAction[];
  enrichmentData?: EnrichmentResult;
  timestamp: number;
}

class CompassDatabase extends Dexie {
  leads!: Table<Lead>;
  messages!: Table<ChatMessage>;

  constructor() {
    super('CompassOffline');
    this.version(2).stores({
      leads: 'id, name, phone, email, status, city, createdAt',
      messages: 'id, agentId, leadId, [agentId+leadId], timestamp',
    });
  }
}

export const db = new CompassDatabase();

// Force clear all mock data on production - run once
export async function clearDemoData() {
  // Clear ALL leads that look like demo data
  const allLeads = await db.leads.toArray();
  const mockLeads = allLeads.filter(lead => 
    lead.phone?.includes('555-') ||
    lead.email?.includes('@email.com') ||
    lead.email?.includes('@gmail.com') ||
    lead.email?.includes('@outlook.com') ||
    lead.name?.includes('Marcus Johnson') ||
    lead.name?.includes('Sarah Williams') ||
    lead.name?.includes('David Chen') ||
    lead.name?.includes('Jennifer Martinez') ||
    lead.name?.includes('Robert Thompson')
  );
  
  for (const lead of mockLeads) {
    await db.leads.delete(lead.id);
  }
  
  if (mockLeads.length > 0) {
    console.log('[COMPASS] Cleared', mockLeads.length, 'mock leads');
  }
}

// Run clear on load for production
export async function seedDemoData() {
  // Production mode - always clear demo data
  await clearDemoData();
}
