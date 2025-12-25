import Dexie, { Table } from 'dexie';

export interface Activity {
  id: string;
  leadId: string;
  type: 'call' | 'sms' | 'email' | 'note' | 'voicemail';
  direction: 'outbound' | 'inbound';
  content: string;
  metadata: {
    duration?: number;
    disposition?: string;
    transcription?: string;
    subject?: string;
    status?: string;
    // Auto-disposition fields
    autoDetected?: boolean;
    confidence?: string;
    reason?: string;
  };
  createdAt: Date;
  syncedAt?: Date;
}

export interface SmsMessage {
  id?: number;
  leadId: string;
  phoneNumber: string;
  direction: 'sent' | 'received';
  text: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: Date;
  twilioSid?: string;
}

export interface CachedLead {
  id: string;
  twentyId?: string;
  name: string;
  phone?: string;
  email?: string;
  data: Record<string, any>;
  cachedAt: Date;
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: 'activities' | 'leads';
  data: any;
  createdAt: Date;
  attempts: number;
}

class AdsDatabase extends Dexie {
  activities!: Table<Activity>;
  leads!: Table<CachedLead>;
  syncQueue!: Table<SyncQueueItem>;
  smsMessages!: Table<SmsMessage>;

  constructor() {
    super('AdsDatabase');
    this.version(1).stores({
      activities: 'id, leadId, type, createdAt, syncedAt',
      leads: 'id, twentyId, phone, email, cachedAt',
      syncQueue: 'id, operation, table, createdAt',
    });
    this.version(2).stores({
      activities: 'id, leadId, type, createdAt, syncedAt',
      leads: 'id, twentyId, phone, email, cachedAt',
      syncQueue: 'id, operation, table, createdAt',
      smsMessages: '++id, leadId, phoneNumber, direction, timestamp',
    });
    // Version 3: Add twilioSid index for deduplication
    this.version(3).stores({
      activities: 'id, leadId, type, createdAt, syncedAt',
      leads: 'id, twentyId, phone, email, cachedAt',
      syncQueue: 'id, operation, table, createdAt',
      smsMessages: '++id, leadId, phoneNumber, direction, timestamp, twilioSid',
    });
  }
}

export const db = new AdsDatabase();
