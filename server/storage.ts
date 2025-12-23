import { type User, type InsertUser, type Lead, type InsertLead, type Activity, type InsertActivity } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  getActivities(): Promise<Activity[]>;
  getActivitiesByLeadId(leadId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private leads: Map<string, Lead>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.activities = new Map();
    this.seedData();
  }

  private seedData() {
    const sampleLeads: Lead[] = [
      {
        id: "1",
        name: "Sarah Johnson",
        email: "sarah.johnson@techcorp.com",
        phone: "+1 (555) 123-4567",
        company: "TechCorp Inc",
        stage: "qualified",
        status: "qualified",
        icpScore: 87,
        source: "Website",
        createdAt: new Date("2024-12-15"),
      },
      {
        id: "2",
        name: "Michael Chen",
        email: "m.chen@innovate.io",
        phone: "+1 (555) 234-5678",
        company: "Innovate.io",
        stage: "contacted",
        status: "contacted",
        icpScore: 72,
        source: "LinkedIn",
        createdAt: new Date("2024-12-18"),
      },
      {
        id: "3",
        name: "Emily Rodriguez",
        email: "emily.r@startup.co",
        phone: "+1 (555) 345-6789",
        company: "StartupCo",
        stage: "new",
        status: "new",
        icpScore: 45,
        source: "Referral",
        createdAt: new Date("2024-12-20"),
      },
      {
        id: "4",
        name: "David Kim",
        email: "david.kim@enterprise.net",
        phone: "+1 (555) 456-7890",
        company: "Enterprise Networks",
        stage: "proposal",
        status: "qualified",
        icpScore: 93,
        source: "Trade Show",
        createdAt: new Date("2024-12-10"),
      },
      {
        id: "5",
        name: "Lisa Thompson",
        email: "lisa.t@growthtech.com",
        phone: "+1 (555) 567-8901",
        company: "GrowthTech",
        stage: "won",
        status: "converted",
        icpScore: 95,
        source: "Website",
        createdAt: new Date("2024-11-28"),
      },
    ];

    sampleLeads.forEach(lead => this.leads.set(lead.id, lead));

    const sampleActivities: Activity[] = [
      {
        id: "a1",
        leadId: "1",
        type: "call",
        description: "Discussed product requirements and pricing",
        createdAt: new Date(),
      },
      {
        id: "a2",
        leadId: "2",
        type: "email",
        description: "Sent follow-up proposal document",
        createdAt: new Date(),
      },
    ];

    sampleActivities.forEach(activity => this.activities.set(activity.id, activity));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = { 
      ...insertLead, 
      id, 
      createdAt: new Date(),
      phone: insertLead.phone || null,
      company: insertLead.company || null,
      source: insertLead.source || null,
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;
    const updatedLead = { ...lead, ...updates };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  async getActivitiesByLeadId(leadId: string): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(a => a.leadId === leadId);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: new Date(),
      description: insertActivity.description || null,
    };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
