import Dexie, { Table } from 'dexie';

export interface EfficiencyMetricsData {
  sub30sDropRate: number;
  callToApptRate: number;
  twoPlusMinRate: number;
  showRate: number;
  smsEnrollmentRate: number;
  lastCalculated: Date;
}

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
  defeatedBosses: string[];
  passedExams: string[];
  bossAttempts: Record<string, number>;
  titles: string[];
  activeTitle?: string;
  completedModules: string[];
  efficiencyMetrics?: EfficiencyMetricsData;
  menteeCount?: number;
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

export interface BossHistoryEntry {
  id?: number;
  bossId: string;
  result: 'victory' | 'defeat';
  timestamp: Date;
}

export interface DailyMetrics {
  id?: number;
  date: string;
  dials: number;
  connects: number;
  callsUnder30s: number;
  callsOver2Min: number;
  appointments: number;
  shows: number;
  deals: number;
  smsEnrollments: number;
}

export interface SyncQueueItem {
  id?: number;
  operation: 'updateProgression' | 'recordXpEvent' | 'updateEfficiency';
  payload: Record<string, any>;
  createdAt: Date;
  attempts: number;
  lastAttempt?: Date;
}

export interface AutoDispositionLog {
  id?: number;
  leadId: string;
  autoDisposition: string;
  finalDisposition: string;
  wasOverridden: boolean;
  confidence: string;
  duration: number;
  reason: string;
  timestamp: Date;
}

class ProgressionDatabase extends Dexie {
  progression!: Table<UserProgression>;
  xpEvents!: Table<XPEvent>;
  badgeProgress!: Table<BadgeProgress>;
  progressionActivityLog!: Table<ActivityLogEntry>;
  bossHistory!: Table<BossHistoryEntry>;
  dailyMetrics!: Table<DailyMetrics>;
  syncQueue!: Table<SyncQueueItem>;
  autoDispositionLog!: Table<AutoDispositionLog>;

  constructor() {
    super('ADS_Progression');
    this.version(1).stores({
      progression: 'id',
      xpEvents: '++id, eventType, createdAt',
      badgeProgress: 'badgeId',
      progressionActivityLog: '++id, action, timestamp',
    });
    this.version(2).stores({
      progression: 'id',
      xpEvents: '++id, eventType, createdAt',
      badgeProgress: 'badgeId',
      progressionActivityLog: '++id, action, timestamp',
      bossHistory: '++id, bossId, result, timestamp',
    }).upgrade(tx => {
      return tx.table('progression').toCollection().modify(prog => {
        if (!prog.defeatedBosses) prog.defeatedBosses = [];
        if (!prog.passedExams) prog.passedExams = [];
        if (!prog.bossAttempts) prog.bossAttempts = {};
        if (!prog.titles) prog.titles = [];
      });
    });
    this.version(3).stores({
      progression: 'id',
      xpEvents: '++id, eventType, createdAt',
      badgeProgress: 'badgeId',
      progressionActivityLog: '++id, action, timestamp',
      bossHistory: '++id, bossId, result, timestamp',
      dailyMetrics: '++id, date',
    }).upgrade(tx => {
      return tx.table('progression').toCollection().modify(prog => {
        if (!prog.completedModules) prog.completedModules = [];
        if (!prog.efficiencyMetrics) prog.efficiencyMetrics = undefined;
        if (!prog.menteeCount) prog.menteeCount = 0;
      });
    });
    this.version(4).stores({
      progression: 'id',
      xpEvents: '++id, eventType, createdAt',
      badgeProgress: 'badgeId',
      progressionActivityLog: '++id, action, timestamp',
      bossHistory: '++id, bossId, result, timestamp',
      dailyMetrics: '++id, date',
      syncQueue: '++id, operation, createdAt, attempts, lastAttempt',
    });
    this.version(5).stores({
      progression: 'id',
      xpEvents: '++id, eventType, createdAt',
      badgeProgress: 'badgeId',
      progressionActivityLog: '++id, action, timestamp',
      bossHistory: '++id, bossId, result, timestamp',
      dailyMetrics: '++id, date',
      syncQueue: '++id, operation, createdAt, attempts, lastAttempt',
      autoDispositionLog: '++id, leadId, autoDisposition, timestamp',
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
      defeatedBosses: [],
      passedExams: [],
      bossAttempts: {},
      titles: [],
      completedModules: [],
    });
  }
  return progressionDb.progression.get('current');
}

export async function getTodayMetrics(): Promise<DailyMetrics> {
  const today = new Date().toISOString().split('T')[0];
  let metrics = await progressionDb.dailyMetrics.where('date').equals(today).first();
  
  if (!metrics) {
    const newMetrics: DailyMetrics = {
      date: today,
      dials: 0,
      connects: 0,
      callsUnder30s: 0,
      callsOver2Min: 0,
      appointments: 0,
      shows: 0,
      deals: 0,
      smsEnrollments: 0,
    };
    await progressionDb.dailyMetrics.add(newMetrics);
    metrics = await progressionDb.dailyMetrics.where('date').equals(today).first();
  }
  
  return metrics!;
}

export async function incrementDailyMetric(
  metric: keyof Omit<DailyMetrics, 'id' | 'date'>,
  amount: number = 1
): Promise<void> {
  const today = await getTodayMetrics();
  await progressionDb.dailyMetrics.update(today.id!, {
    [metric]: (today[metric] as number) + amount,
  });
}

export async function logAutoDisposition(entry: Omit<AutoDispositionLog, 'id'>): Promise<void> {
  await progressionDb.autoDispositionLog.add(entry as AutoDispositionLog);
}

export async function getAutoDispositionAccuracy(): Promise<{
  total: number;
  overridden: number;
  accuracy: number;
}> {
  const all = await progressionDb.autoDispositionLog.toArray();
  const overridden = all.filter(e => e.wasOverridden).length;
  const total = all.length;
  return {
    total,
    overridden,
    accuracy: total > 0 ? ((total - overridden) / total) * 100 : 100,
  };
}

export async function exportProgressionData() {
  return {
    progression: await progressionDb.progression.toArray(),
    xpEvents: await progressionDb.xpEvents.toArray(),
    badgeProgress: await progressionDb.badgeProgress.toArray(),
    progressionActivityLog: await progressionDb.progressionActivityLog.toArray(),
    bossHistory: await progressionDb.bossHistory.toArray(),
    dailyMetrics: await progressionDb.dailyMetrics.toArray(),
    autoDispositionLog: await progressionDb.autoDispositionLog.toArray(),
    exportedAt: new Date().toISOString(),
  };
}

export async function importProgressionData(data: {
  progression?: UserProgression[];
  xpEvents?: XPEvent[];
  badgeProgress?: BadgeProgress[];
  progressionActivityLog?: ActivityLogEntry[];
  bossHistory?: BossHistoryEntry[];
  dailyMetrics?: DailyMetrics[];
  autoDispositionLog?: AutoDispositionLog[];
}) {
  await progressionDb.progression.clear();
  await progressionDb.xpEvents.clear();
  await progressionDb.badgeProgress.clear();
  await progressionDb.progressionActivityLog.clear();
  await progressionDb.bossHistory.clear();
  await progressionDb.dailyMetrics.clear();
  await progressionDb.autoDispositionLog.clear();

  if (data.progression) await progressionDb.progression.bulkPut(data.progression);
  if (data.xpEvents) await progressionDb.xpEvents.bulkPut(data.xpEvents);
  if (data.badgeProgress) await progressionDb.badgeProgress.bulkPut(data.badgeProgress);
  if (data.progressionActivityLog) await progressionDb.progressionActivityLog.bulkPut(data.progressionActivityLog);
  if (data.bossHistory) await progressionDb.bossHistory.bulkPut(data.bossHistory);
  if (data.dailyMetrics) await progressionDb.dailyMetrics.bulkPut(data.dailyMetrics);
  if (data.autoDispositionLog) await progressionDb.autoDispositionLog.bulkPut(data.autoDispositionLog);
}
