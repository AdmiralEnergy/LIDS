import Dexie, { Table } from 'dexie';

export interface UserProgression {
  id: string;
  name: string;
  rank: string;
  totalXp: number;
  currentLevel: number;
  closedDeals: number;
  graduationDate?: Date;
  badges: string[];
  specialization?: string;
  streakDays: number;
  lastActivityDate: Date;
}

export interface XPEvent {
  id?: number;
  eventType: string;
  xpAmount: number;
  multipliers: Record<string, number>;
  createdAt: Date;
}

export interface BadgeProgress {
  badgeId: string;
  currentTier?: string;
  progress: Record<string, number>;
  earnedAt?: Date;
}

export interface ActivityLogEntry {
  id?: number;
  action: string;
  details: string;
  xpEarned: number;
  timestamp: Date;
}

class ProgressionDatabase extends Dexie {
  progression!: Table<UserProgression>;
  xpEvents!: Table<XPEvent>;
  badgeProgress!: Table<BadgeProgress>;
  progressionActivityLog!: Table<ActivityLogEntry>;

  constructor() {
    super('ADS_Progression');
    this.version(1).stores({
      progression: 'id',
      xpEvents: '++id, eventType, createdAt',
      badgeProgress: 'badgeId',
      progressionActivityLog: '++id, action, timestamp',
    });
  }
}

export const progressionDb = new ProgressionDatabase();

export async function initProgression(name: string = 'Sales Rep'): Promise<UserProgression | undefined> {
  const existing = await progressionDb.progression.get('current');
  if (!existing) {
    await progressionDb.progression.put({
      id: 'current',
      name,
      rank: 'sdr_1',
      totalXp: 0,
      currentLevel: 1,
      closedDeals: 0,
      badges: [],
      streakDays: 0,
      lastActivityDate: new Date(),
    });
  }
  return progressionDb.progression.get('current');
}

export async function exportProgressionData() {
  return {
    progression: await progressionDb.progression.toArray(),
    xpEvents: await progressionDb.xpEvents.toArray(),
    badgeProgress: await progressionDb.badgeProgress.toArray(),
    progressionActivityLog: await progressionDb.progressionActivityLog.toArray(),
    exportedAt: new Date().toISOString(),
  };
}

export async function importProgressionData(data: {
  progression?: UserProgression[];
  xpEvents?: XPEvent[];
  badgeProgress?: BadgeProgress[];
  progressionActivityLog?: ActivityLogEntry[];
}) {
  await progressionDb.progression.clear();
  await progressionDb.xpEvents.clear();
  await progressionDb.badgeProgress.clear();
  await progressionDb.progressionActivityLog.clear();

  if (data.progression) await progressionDb.progression.bulkPut(data.progression);
  if (data.xpEvents) await progressionDb.xpEvents.bulkPut(data.xpEvents);
  if (data.badgeProgress) await progressionDb.badgeProgress.bulkPut(data.badgeProgress);
  if (data.progressionActivityLog) await progressionDb.progressionActivityLog.bulkPut(data.progressionActivityLog);
}
