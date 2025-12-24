import type { 
  Progression, 
  BattleStats, 
  BattleSession, 
  ExamSession,
  BattleHistoryItem,
  Certification,
  Badge,
  Rank
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Progression
  getProgression(repId: string): Promise<Progression>;
  updateProgression(repId: string, updates: Partial<Progression>): Promise<Progression>;
  addXP(repId: string, xp: number): Promise<Progression>;
  
  // Exam sessions
  createExamSession(session: ExamSession): Promise<ExamSession>;
  getExamSession(examId: string): Promise<ExamSession | undefined>;
  deleteExamSession(examId: string): Promise<void>;
  
  // Battle sessions
  createBattleSession(session: BattleSession): Promise<BattleSession>;
  getBattleSession(sessionId: string): Promise<BattleSession | undefined>;
  updateBattleSession(sessionId: string, updates: Partial<BattleSession>): Promise<BattleSession | undefined>;
  deleteBattleSession(sessionId: string): Promise<void>;
  
  // Battle stats
  getBattleStats(repId: string): Promise<BattleStats>;
  updateBattleStats(repId: string, updates: Partial<BattleStats>): Promise<BattleStats>;
  addBattleToHistory(repId: string, battle: BattleHistoryItem): Promise<void>;
}

function createDefaultProgression(): Progression {
  return {
    xp: 0,
    level: 1,
    rank: 'sdr_1' as Rank,
    badges: [],
    completedModules: [],
    certifications: [],
  };
}

function createDefaultBattleStats(): BattleStats {
  return {
    wins: 0,
    losses: 0,
    abandoned: 0,
    avgScore: 0,
    highestLevel: 0,
    history: [],
  };
}

function calculateRank(xp: number, completedModules: string[]): Rank {
  const ranks: { id: Rank; xp: number; modules: string[] }[] = [
    { id: 'manager', xp: 30000, modules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6'] },
    { id: 'team_lead', xp: 15000, modules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6'] },
    { id: 'senior', xp: 8000, modules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6'] },
    { id: 'operative', xp: 3000, modules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5'] },
    { id: 'sdr_3', xp: 1500, modules: ['module_0', 'module_1', 'module_2', 'module_3'] },
    { id: 'sdr_2', xp: 500, modules: ['module_0', 'module_1'] },
    { id: 'sdr_1', xp: 0, modules: [] },
  ];

  for (const rank of ranks) {
    if (xp >= rank.xp && rank.modules.every(m => completedModules.includes(m))) {
      return rank.id;
    }
  }
  return 'sdr_1';
}

export class MemStorage implements IStorage {
  private progressions: Map<string, Progression>;
  private examSessions: Map<string, ExamSession>;
  private battleSessions: Map<string, BattleSession>;
  private battleStats: Map<string, BattleStats>;

  constructor() {
    this.progressions = new Map();
    this.examSessions = new Map();
    this.battleSessions = new Map();
    this.battleStats = new Map();
  }

  // Progression methods
  async getProgression(repId: string): Promise<Progression> {
    if (!this.progressions.has(repId)) {
      this.progressions.set(repId, createDefaultProgression());
    }
    return this.progressions.get(repId)!;
  }

  async updateProgression(repId: string, updates: Partial<Progression>): Promise<Progression> {
    const current = await this.getProgression(repId);
    const updated = { ...current, ...updates };
    updated.rank = calculateRank(updated.xp, updated.completedModules);
    updated.level = Math.floor(updated.xp / 100) + 1;
    this.progressions.set(repId, updated);
    return updated;
  }

  async addXP(repId: string, xp: number): Promise<Progression> {
    const current = await this.getProgression(repId);
    return this.updateProgression(repId, { xp: current.xp + xp });
  }

  // Exam session methods
  async createExamSession(session: ExamSession): Promise<ExamSession> {
    this.examSessions.set(session.examId, session);
    return session;
  }

  async getExamSession(examId: string): Promise<ExamSession | undefined> {
    return this.examSessions.get(examId);
  }

  async deleteExamSession(examId: string): Promise<void> {
    this.examSessions.delete(examId);
  }

  // Battle session methods
  async createBattleSession(session: BattleSession): Promise<BattleSession> {
    this.battleSessions.set(session.id, session);
    return session;
  }

  async getBattleSession(sessionId: string): Promise<BattleSession | undefined> {
    return this.battleSessions.get(sessionId);
  }

  async updateBattleSession(sessionId: string, updates: Partial<BattleSession>): Promise<BattleSession | undefined> {
    const current = this.battleSessions.get(sessionId);
    if (!current) return undefined;
    const updated = { ...current, ...updates };
    this.battleSessions.set(sessionId, updated);
    return updated;
  }

  async deleteBattleSession(sessionId: string): Promise<void> {
    this.battleSessions.delete(sessionId);
  }

  // Battle stats methods
  async getBattleStats(repId: string): Promise<BattleStats> {
    if (!this.battleStats.has(repId)) {
      this.battleStats.set(repId, createDefaultBattleStats());
    }
    return this.battleStats.get(repId)!;
  }

  async updateBattleStats(repId: string, updates: Partial<BattleStats>): Promise<BattleStats> {
    const current = await this.getBattleStats(repId);
    const updated = { ...current, ...updates };
    this.battleStats.set(repId, updated);
    return updated;
  }

  async addBattleToHistory(repId: string, battle: BattleHistoryItem): Promise<void> {
    const stats = await this.getBattleStats(repId);
    stats.history.unshift(battle);
    if (stats.history.length > 50) {
      stats.history = stats.history.slice(0, 50);
    }
    
    const scores = stats.history.map(h => h.score);
    stats.avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    stats.highestLevel = Math.max(stats.highestLevel, battle.level);
    
    this.battleStats.set(repId, stats);
  }
}

export const storage = new MemStorage();
