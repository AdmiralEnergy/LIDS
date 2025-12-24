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
  };
  createdAt: Date;
  syncedAt?: Date;
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

  constructor() {
    super('AdsDatabase');
    this.version(1).stores({
      activities: 'id, leadId, type, createdAt, syncedAt',
      leads: 'id, twentyId, phone, email, cachedAt',
      syncQueue: 'id, operation, table, createdAt',
    });
  }
}

export const db = new AdsDatabase();
