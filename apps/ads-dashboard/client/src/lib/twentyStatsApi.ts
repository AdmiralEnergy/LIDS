/**
 * Twenty CRM Stats API Client
 *
 * Stores and retrieves call records and rep progression from Twenty CRM
 * Single source of truth for all stats - no more browser-local-only data
 */

import { getTwentyCrmUrl, getSettings } from './settings';

// Get Twenty REST API base URL - uses proxy in dev, HTTPS tunnel in production
function getTwentyRestApiBase(): string {
  return `${getTwentyCrmUrl()}/rest`;
}

// Get API key from settings
function getTwentyApiKey(): string {
  return getSettings().twentyApiKey || '';
}

interface CallRecord {
  id?: string;
  name: string;
  duration: number;          // seconds
  disposition: string;       // CONTACT, CALLBACK, VOICEMAIL, NO_ANSWER, NOT_INTERESTED, WRONG_NUMBER, DNC
  xpAwarded: number;
  wasSubThirty: boolean;
  wasTwoPlusMin: boolean;
  leadId: string;
  createdAt?: string;
  createdBy?: {
    workspaceMemberId: string | null;
    name: string;
  };
}

interface RepProgression {
  id?: string;
  name: string;              // Rep's name
  workspaceMemberId: string; // Twenty user ID
  totalXp: number;
  currentLevel: number;
  currentRank: string;       // E-1 through E-7
  closedDeals: number;
  badges: string;            // JSON array
  streakDays: number;
  completedModules?: string;
  certifications?: string;
  defeatedBosses?: string;
  passedExams?: string;
  efficiencyMetrics?: string;
  lastActivityDate?: string;
}

interface LeaderboardEntry {
  name: string;
  workspaceMemberId: string;
  totalXp: number;
  currentLevel: number;
  currentRank: string;
  todayDials?: number;
  todayAppointments?: number;
}

// Get headers dynamically to ensure API key is current
// (API key may not be available at module load time)
function getHeaders() {
  return {
    'Authorization': `Bearer ${getTwentyApiKey()}`,
    'Content-Type': 'application/json',
  };
}

// ============ CALL RECORDS ============

export async function createCallRecord(record: Omit<CallRecord, 'id' | 'createdAt' | 'createdBy'>): Promise<CallRecord> {
  const response = await fetch(`${getTwentyRestApiBase()}/callRecords`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error(`Failed to create call record: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.createCallRecord;
}

export async function getCallRecords(options?: {
  workspaceMemberId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<CallRecord[]> {
  let url = `${getTwentyRestApiBase()}/callRecords`;
  const params = new URLSearchParams();

  if (options?.limit) {
    params.set('limit', options.limit.toString());
  }

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch call records: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.callRecords || [];
}

export async function getTodayStats(workspaceMemberId?: string): Promise<{
  dials: number;
  connects: number;
  appointments: number;
  xpEarned: number;
  callsUnder30s: number;
  callsOver2Min: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const records = await getCallRecords({ startDate: today, limit: 500 });

  const filtered = workspaceMemberId
    ? records.filter(r => r.createdBy?.workspaceMemberId === workspaceMemberId)
    : records;

  return {
    dials: filtered.length,
    connects: filtered.filter(r => r.disposition === 'CONTACT').length,
    appointments: filtered.filter(r => r.disposition === 'CALLBACK').length,
    xpEarned: filtered.reduce((sum, r) => sum + (r.xpAwarded || 0), 0),
    callsUnder30s: filtered.filter(r => r.wasSubThirty).length,
    callsOver2Min: filtered.filter(r => r.wasTwoPlusMin).length,
  };
}

// ============ REP PROGRESSION ============

export async function getRepProgression(workspaceMemberId: string): Promise<RepProgression | null> {
  const response = await fetch(`${getTwentyRestApiBase()}/repProgressions`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch rep progressions: ${response.statusText}`);
  }

  const data = await response.json();
  const progressions = data.data.repProgressions || [];

  return progressions.find((p: RepProgression) => p.workspaceMemberId === workspaceMemberId) || null;
}

export async function updateRepProgression(id: string, updates: Partial<RepProgression>): Promise<RepProgression> {
  const response = await fetch(`${getTwentyRestApiBase()}/repProgressions/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update rep progression: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.updateRepProgression;
}

export async function createRepProgression(progression: Omit<RepProgression, 'id'>): Promise<RepProgression> {
  const response = await fetch(`${getTwentyRestApiBase()}/repProgressions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(progression),
  });

  if (!response.ok) {
    throw new Error(`Failed to create rep progression: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.createRepProgression;
}

export async function createOrUpdateRepProgression(progression: Omit<RepProgression, 'id'>): Promise<RepProgression> {
  const existing = await getRepProgression(progression.workspaceMemberId);

  if (existing?.id) {
    return updateRepProgression(existing.id, progression);
  }
  return createRepProgression(progression);
}

// ============ LEADERBOARD ============

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${getTwentyRestApiBase()}/repProgressions`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
  }

  const data = await response.json();
  const progressions: RepProgression[] = data.data.repProgressions || [];

  return progressions
    .map(p => ({
      name: p.name,
      workspaceMemberId: p.workspaceMemberId,
      totalXp: p.totalXp || 0,
      currentLevel: p.currentLevel || 1,
      currentRank: p.currentRank || 'E-1',
    }))
    .sort((a, b) => b.totalXp - a.totalXp);
}

// ============ WORKSPACE MEMBERS ============

export async function getWorkspaceMembers(): Promise<Array<{
  id: string;
  name: { firstName: string; lastName: string };
  userEmail: string;
}>> {
  const response = await fetch(`${getTwentyRestApiBase()}/workspaceMembers`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workspace members: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.workspaceMembers || [];
}

export async function getCurrentWorkspaceMember(): Promise<{
  id: string;
  name: { firstName: string; lastName: string };
  userEmail: string;
} | null> {
  try {
    const response = await fetch(`${getTwentyCrmUrl()}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getTwentyApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query { currentWorkspaceMember { id name { firstName lastName } userEmail } }`,
      }),
    });

    if (!response.ok) {
      console.error('[Twenty] Failed to get current workspace member:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.errors) {
      console.error('[Twenty] GraphQL errors:', data.errors);
      return null;
    }

    return data.data?.currentWorkspaceMember || null;
  } catch (error) {
    console.error('[Twenty] Error fetching current workspace member:', error);
    return null;
  }
}

// ============ USER ROLE DETECTION ============

const EXECUTIVE_EMAILS: Record<string, {
  role: 'owner' | 'coo' | 'cmo' | 'rep';
  agentId: string;
  name: string;
  features: string[];
}> = {
  'davide@admiralenergy.ai': {
    role: 'owner',
    agentId: 'APEX-001',
    name: 'David Edwards',
    features: ['livewire', 'gideon', 'admin', 'analytics']
  },
  'nathanielj@admiralenergy.ai': {
    role: 'coo',
    agentId: 'APEX-003',
    name: 'Nathaniel Jenkins',
    features: ['livewire', 'analytics', 'team-management']
  },
  'leighe@ripemerchant.host': {
    role: 'cmo',
    agentId: 'APEX-002',
    name: 'Leigh Edwards',
    features: ['sarai', 'marketing', 'analytics']
  },
};

export function getUserRole(email: string): {
  role: 'owner' | 'coo' | 'cmo' | 'rep';
  agentId: string;
  name: string;
  features: string[];
} | null {
  const normalizedEmail = email.toLowerCase().trim();
  return EXECUTIVE_EMAILS[normalizedEmail] || null;
}

export function isExecutive(email: string): boolean {
  return getUserRole(email) !== null;
}

export function isLiveWireUser(email: string): boolean {
  const userInfo = getUserRole(email);
  return userInfo?.features.includes('livewire') || false;
}

export function hasFeatureAccess(email: string, feature: string): boolean {
  const userInfo = getUserRole(email);
  if (!userInfo) return false;
  if (userInfo.role === 'owner') return true;
  return userInfo.features.includes(feature);
}

// ============ EFFICIENCY METRICS ============

export async function calculateEfficiencyMetrics(workspaceMemberId: string, daysBack: number = 7): Promise<{
  sub30sDropRate: number;
  callToApptRate: number;
  twoPlusMinRate: number;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const records = await getCallRecords({
    workspaceMemberId,
    startDate: startDate.toISOString(),
    limit: 1000,
  });

  const connects = records.filter(r => r.disposition === 'CONTACT').length;
  const appointments = records.filter(r => r.disposition === 'CALLBACK').length;
  const sub30s = records.filter(r => r.wasSubThirty).length;
  const twoPlusMin = records.filter(r => r.wasTwoPlusMin).length;

  return {
    sub30sDropRate: connects > 0 ? sub30s / connects : 0,
    callToApptRate: connects > 0 ? appointments / connects : 0,
    twoPlusMinRate: connects > 0 ? twoPlusMin / connects : 0,
  };
}
