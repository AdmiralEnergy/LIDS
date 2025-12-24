import type { 
  Progression, 
  Module, 
  ExamSession, 
  ExamResult, 
  Certification,
  BattleSession,
  Persona,
  BattleScores,
  BattleStats,
  ModuleStatus
} from '../types';
import { mockApi } from './mockApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/redhawk';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_BASE_URL;

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    console.log(`[MOCK] ${options?.method || 'GET'} ${path}`);
    return mockApi<T>(path, options);
  }
  
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

// Progress
export async function getProgress(repId: string): Promise<Progression> {
  return fetchApi<Progression>(`/progress/${repId}`);
}

// Modules
export async function getModules(): Promise<Module[]> {
  return fetchApi<Module[]>('/modules');
}

export async function startModuleExam(repId: string, moduleId: string): Promise<ExamSession> {
  return fetchApi<ExamSession>('/cert/start', {
    method: 'POST',
    body: JSON.stringify({ repId, examType: moduleId }),
  });
}

export async function submitExam(examId: string, answers: Record<string, number>): Promise<ExamResult> {
  return fetchApi<ExamResult>('/cert/submit', {
    method: 'POST',
    body: JSON.stringify({ examId, answers }),
  });
}

export async function getCertifications(repId: string): Promise<{ 
  certifications: Certification[]; 
  modules: ModuleStatus[] 
}> {
  return fetchApi(`/cert/${repId}`);
}

// Boss Battle
export async function startBattle(repId: string, repName: string, level: number): Promise<{ 
  session: BattleSession; 
  persona: Persona 
}> {
  return fetchApi('/battle/start', {
    method: 'POST',
    body: JSON.stringify({ repId, repName, level }),
  });
}

export async function battleTurn(sessionId: string, repSpeech: string): Promise<{ 
  aiResponse: string; 
  scores: BattleScores; 
  status: string 
}> {
  return fetchApi('/battle/turn', {
    method: 'POST',
    body: JSON.stringify({ sessionId, repSpeech }),
  });
}

export async function endBattle(sessionId: string, outcome: 'win' | 'lose' | 'abandon'): Promise<{ 
  xpAwarded: number; 
  finalScores: BattleScores 
}> {
  return fetchApi('/battle/end', {
    method: 'POST',
    body: JSON.stringify({ sessionId, outcome }),
  });
}

export async function getBattleStats(repId: string): Promise<BattleStats> {
  return fetchApi<BattleStats>(`/battle/stats/${repId}`);
}

// Health check
export async function checkHealth(): Promise<{ status: string; version: string; uptime: number }> {
  return fetchApi('/health');
}
