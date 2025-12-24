import { randomUUID } from "crypto";

// Lead interface
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

export interface InsertLead {
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
  status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';
}

// Storage interface
export interface IStorage {
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
}

// Sample data for NC leads
const sampleLeads: Lead[] = [
  {
    id: randomUUID(),
    firstName: "Marcus",
    lastName: "Johnson",
    email: "marcus.j@email.com",
    phone: "(704) 555-0123",
    address: "1234 Oak Street",
    city: "Charlotte",
    state: "NC",
    zip: "28202",
    county: "Mecklenburg",
    mortgageBalance: 285000,
    status: "new",
    createdAt: new Date(),
  },
  {
    id: randomUUID(),
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.w@gmail.com",
    phone: "(919) 555-0456",
    address: "567 Pine Avenue",
    city: "Raleigh",
    state: "NC",
    zip: "27601",
    county: "Wake",
    mortgageBalance: 320000,
    status: "contacted",
    createdAt: new Date(),
  },
  {
    id: randomUUID(),
    firstName: "David",
    lastName: "Chen",
    email: "dchen@outlook.com",
    phone: "(704) 555-0789",
    address: "890 Maple Drive",
    city: "Concord",
    state: "NC",
    zip: "28027",
    county: "Cabarrus",
    mortgageBalance: 195000,
    status: "qualified",
    createdAt: new Date(),
  },
  {
    id: randomUUID(),
    firstName: "Jennifer",
    lastName: "Martinez",
    email: "jmartinez@email.com",
    phone: "(336) 555-0321",
    address: "234 Elm Court",
    city: "Greensboro",
    state: "NC",
    zip: "27401",
    county: "Guilford",
    status: "new",
    createdAt: new Date(),
  },
  {
    id: randomUUID(),
    firstName: "Robert",
    lastName: "Thompson",
    phone: "(919) 555-0654",
    address: "678 Birch Lane",
    city: "Durham",
    state: "NC",
    zip: "27701",
    county: "Durham",
    mortgageBalance: 275000,
    status: "proposal",
    createdAt: new Date(),
  },
];

export class MemStorage implements IStorage {
  private leads: Map<string, Lead>;

  constructor() {
    this.leads = new Map();
    // Initialize with sample data
    sampleLeads.forEach(lead => this.leads.set(lead.id, lead));
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      ...insertLead,
      id,
      status: insertLead.status || 'new',
      createdAt: new Date(),
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const updatedLead: Lead = { ...lead, ...updates };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }
}

export const storage = new MemStorage();
