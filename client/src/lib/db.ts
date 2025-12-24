import Dexie, { Table } from 'dexie';

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
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

class CompassDatabase extends Dexie {
  leads!: Table<Lead>;
  messages!: Table<ChatMessage>;

  constructor() {
    super('CompassOffline');
    this.version(1).stores({
      leads: 'id, name, phone, email, status, city, createdAt',
      messages: 'id, agentId, timestamp',
    });
  }
}

export const db = new CompassDatabase();

export async function seedDemoData() {
  const count = await db.leads.count();
  if (count > 0) return;

  const demoLeads: Lead[] = [
    {
      id: 'demo-1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(704) 555-0101',
      address: '123 Oak Street',
      city: 'Matthews',
      state: 'NC',
      status: 'new',
      source: 'PropStream',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'demo-2',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(704) 555-0102',
      address: '456 Pine Avenue',
      city: 'Mint Hill',
      state: 'NC',
      status: 'contacted',
      source: 'PropStream',
      enrichment: {
        propertyValue: 385000,
        sqft: 2400,
        yearBuilt: 2018,
        roofType: 'Composition Shingle',
        utilityProvider: 'Duke Energy Progress',
        monthlyBill: 195,
      },
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: 'demo-3',
      name: 'Michael Chen',
      email: 'm.chen@email.com',
      phone: '(704) 555-0103',
      address: '789 Maple Drive',
      city: 'Indian Trail',
      state: 'NC',
      status: 'qualified',
      source: 'Referral',
      enrichment: {
        propertyValue: 425000,
        sqft: 2800,
        yearBuilt: 2015,
        roofType: 'Metal',
        utilityProvider: 'Duke Energy Carolinas',
        monthlyBill: 220,
      },
      createdAt: Date.now() - 259200000,
      updatedAt: Date.now() - 7200000,
    },
    {
      id: 'demo-4',
      name: 'Jennifer Williams',
      phone: '(919) 555-0104',
      address: '321 Cedar Lane',
      city: 'Weddington',
      state: 'NC',
      status: 'appointment',
      source: 'PropStream',
      enrichment: {
        propertyValue: 520000,
        sqft: 3200,
        yearBuilt: 2020,
        roofType: 'Composition Shingle',
        utilityProvider: 'Duke Energy Progress',
        monthlyBill: 275,
      },
      createdAt: Date.now() - 345600000,
      updatedAt: Date.now() - 1800000,
    },
    {
      id: 'demo-5',
      name: 'Robert Davis',
      email: 'rdavis@email.com',
      phone: '(704) 555-0105',
      address: '567 Birch Court',
      city: 'Stallings',
      state: 'NC',
      status: 'new',
      source: 'PropStream',
      createdAt: Date.now() - 43200000,
      updatedAt: Date.now() - 43200000,
    },
  ];

  await db.leads.bulkAdd(demoLeads);
  console.log('Demo leads seeded');
}
