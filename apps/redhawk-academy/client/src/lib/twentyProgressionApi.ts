/**
 * Twenty CRM Progression API Client
 *
 * Syncs Academy progression data (XP, modules, certifications) to Twenty CRM
 * This creates a UNIFIED progression system shared between HELM and Academy
 *
 * Single Source of Truth: Twenty CRM repProgressions custom object
 */

// Twenty CRM API - uses external URL for production, internal for dev
function isExternalAccess(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('.ripemerchant.host');
}

const TWENTY_API_BASE = isExternalAccess()
  ? 'https://twenty.ripemerchant.host/rest'
  : `http://${import.meta.env.VITE_TWENTY_CRM_HOST || '192.168.1.23'}:${import.meta.env.VITE_TWENTY_CRM_PORT || '3001'}/rest`;

const TWENTY_API_KEY = import.meta.env.VITE_TWENTY_API_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NDUzNjgwLCJleHAiOjQ5MjAwNTM2ODEsImp0aSI6IjJmYTBiNzE5LTBjNDMtNDVkYy05YzA4LTY3MTNmOTZkZmRjYSJ9.cO3beouqdXpMWSTN-3JFZ7n1T0-GyhBLNxy5PI_YK18';

// Interface matching Twenty's repProgressions custom object
export interface RepProgression {
  id?: string;
  name: string;              // Rep's display name
  workspaceMemberId: string; // Twenty user ID (links to HELM_USERS)
  totalXp: number;
  currentLevel: number;
  currentRank: string;       // E-1 through E-7
  closedDeals: number;
  badges: string;            // JSON array of badge IDs
  streakDays: number;
  completedModules?: string; // JSON array of module IDs
  certifications?: string;   // JSON array of certification IDs
}

// XP Awards per the SalesOperativeProgression spec
export const MODULE_XP: Record<string, number> = {
  module_0: 50,   // Product Foundations
  module_1: 50,   // Opener Mastery
  module_2: 50,   // Timing Optimization
  module_3: 50,   // Cadence Excellence
  module_4: 75,   // Objection Exploration
  module_5: 100,  // TCPA Compliance
  module_6: 300,  // Full Framework Certification
};

// Battle XP calculation per spec
export function calculateBattleXP(
  outcome: 'win' | 'lose' | 'abandon',
  level: number,
  allObjectionsCleared: boolean = false
): number {
  switch (outcome) {
    case 'win':
      return allObjectionsCleared ? 150 * level : 100 * level;
    case 'lose':
      return 30 * level;
    case 'abandon':
      return 10;
  }
}

// Rank thresholds per SalesOperativeProgression spec
export const RANK_THRESHOLDS: Record<string, { xp: number; code: string }> = {
  sdr_1: { xp: 0, code: 'E-1' },
  sdr_2: { xp: 500, code: 'E-2' },
  sdr_3: { xp: 1500, code: 'E-3' },
  operative: { xp: 3000, code: 'E-4' },
  senior: { xp: 5000, code: 'E-5' },
  team_lead: { xp: 8000, code: 'E-6' },
  manager: { xp: 12000, code: 'E-7' },
};

// Calculate rank from XP
export function calculateRank(xp: number): { rank: string; code: string } {
  let currentRank = 'sdr_1';
  let currentCode = 'E-1';

  for (const [rank, { xp: threshold, code }] of Object.entries(RANK_THRESHOLDS)) {
    if (xp >= threshold) {
      currentRank = rank;
      currentCode = code;
    }
  }

  return { rank: currentRank, code: currentCode };
}

// Calculate level from XP (simple formula: level = floor(xp / 100) + 1)
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

const headers = {
  'Authorization': `Bearer ${TWENTY_API_KEY}`,
  'Content-Type': 'application/json',
};

// ============ PROGRESSION CRUD ============

export async function getRepProgression(workspaceMemberId: string): Promise<RepProgression | null> {
  try {
    const response = await fetch(`${TWENTY_API_BASE}/repProgressions`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error(`Failed to fetch rep progressions: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const progressions = data.data?.repProgressions || [];

    return progressions.find((p: RepProgression) => p.workspaceMemberId === workspaceMemberId) || null;
  } catch (error) {
    console.error('Error fetching progression:', error);
    return null;
  }
}

export async function createRepProgression(progression: Omit<RepProgression, 'id'>): Promise<RepProgression | null> {
  try {
    const response = await fetch(`${TWENTY_API_BASE}/repProgressions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(progression),
    });

    if (!response.ok) {
      console.error(`Failed to create rep progression: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.data?.createRepProgression || null;
  } catch (error) {
    console.error('Error creating progression:', error);
    return null;
  }
}

export async function updateRepProgression(id: string, updates: Partial<RepProgression>): Promise<RepProgression | null> {
  try {
    const response = await fetch(`${TWENTY_API_BASE}/repProgressions/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      console.error(`Failed to update rep progression: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.data?.updateRepProgression || null;
  } catch (error) {
    console.error('Error updating progression:', error);
    return null;
  }
}

// ============ HIGH-LEVEL SYNC OPERATIONS ============

/**
 * Award XP for completing a module
 * Called when a rep passes a module quiz
 */
export async function awardModuleXP(
  workspaceMemberId: string,
  repName: string,
  moduleId: string
): Promise<{ success: boolean; newXp?: number; newRank?: string }> {
  const xpAward = MODULE_XP[moduleId] || 50;

  // Get current progression or create new one
  let progression = await getRepProgression(workspaceMemberId);

  if (!progression) {
    // Create new progression record
    progression = await createRepProgression({
      name: repName,
      workspaceMemberId,
      totalXp: xpAward,
      currentLevel: calculateLevel(xpAward),
      currentRank: calculateRank(xpAward).code,
      closedDeals: 0,
      badges: '[]',
      streakDays: 0,
      completedModules: JSON.stringify([moduleId]),
      certifications: '[]',
    });

    if (progression) {
      return { success: true, newXp: xpAward, newRank: progression.currentRank };
    }
    return { success: false };
  }

  // Update existing progression
  const completedModules: string[] = JSON.parse(progression.completedModules || '[]');
  if (!completedModules.includes(moduleId)) {
    completedModules.push(moduleId);
  }

  const newTotalXp = progression.totalXp + xpAward;
  const { code: newRank } = calculateRank(newTotalXp);
  const newLevel = calculateLevel(newTotalXp);

  const updated = await updateRepProgression(progression.id!, {
    totalXp: newTotalXp,
    currentLevel: newLevel,
    currentRank: newRank,
    completedModules: JSON.stringify(completedModules),
  });

  if (updated) {
    return { success: true, newXp: newTotalXp, newRank };
  }
  return { success: false };
}

/**
 * Award XP for completing a boss battle
 * Called when a battle ends (win, lose, or abandon)
 */
export async function awardBattleXP(
  workspaceMemberId: string,
  repName: string,
  outcome: 'win' | 'lose' | 'abandon',
  level: number,
  allObjectionsCleared: boolean = false
): Promise<{ success: boolean; xpAwarded: number; newXp?: number; newRank?: string }> {
  const xpAward = calculateBattleXP(outcome, level, allObjectionsCleared);

  let progression = await getRepProgression(workspaceMemberId);

  if (!progression) {
    // Create new progression record
    progression = await createRepProgression({
      name: repName,
      workspaceMemberId,
      totalXp: xpAward,
      currentLevel: calculateLevel(xpAward),
      currentRank: calculateRank(xpAward).code,
      closedDeals: 0,
      badges: '[]',
      streakDays: 0,
      completedModules: '[]',
      certifications: '[]',
    });

    if (progression) {
      return { success: true, xpAwarded: xpAward, newXp: xpAward, newRank: progression.currentRank };
    }
    return { success: false, xpAwarded: 0 };
  }

  // Update existing progression
  const newTotalXp = progression.totalXp + xpAward;
  const { code: newRank } = calculateRank(newTotalXp);
  const newLevel = calculateLevel(newTotalXp);

  const updated = await updateRepProgression(progression.id!, {
    totalXp: newTotalXp,
    currentLevel: newLevel,
    currentRank: newRank,
  });

  if (updated) {
    return { success: true, xpAwarded: xpAward, newXp: newTotalXp, newRank };
  }
  return { success: false, xpAwarded: 0 };
}

/**
 * Award certification badge
 * Called when rep passes the full framework certification exam
 */
export async function awardCertification(
  workspaceMemberId: string,
  repName: string,
  certificationId: string
): Promise<{ success: boolean }> {
  let progression = await getRepProgression(workspaceMemberId);

  if (!progression) {
    // Create with certification
    progression = await createRepProgression({
      name: repName,
      workspaceMemberId,
      totalXp: 0,
      currentLevel: 1,
      currentRank: 'E-1',
      closedDeals: 0,
      badges: '[]',
      streakDays: 0,
      completedModules: '[]',
      certifications: JSON.stringify([certificationId]),
    });

    return { success: !!progression };
  }

  // Update existing progression
  const certifications: string[] = JSON.parse(progression.certifications || '[]');
  if (!certifications.includes(certificationId)) {
    certifications.push(certificationId);
  }

  const updated = await updateRepProgression(progression.id!, {
    certifications: JSON.stringify(certifications),
  });

  return { success: !!updated };
}

/**
 * Get full progression for dashboard display
 * Returns both Twenty data and computed values
 */
export async function getFullProgression(workspaceMemberId: string): Promise<{
  xp: number;
  level: number;
  rank: string;
  rankCode: string;
  completedModules: string[];
  certifications: string[];
  badges: string[];
} | null> {
  const progression = await getRepProgression(workspaceMemberId);

  if (!progression) {
    return null;
  }

  const { rank } = calculateRank(progression.totalXp);

  return {
    xp: progression.totalXp,
    level: progression.currentLevel,
    rank,
    rankCode: progression.currentRank,
    completedModules: JSON.parse(progression.completedModules || '[]'),
    certifications: JSON.parse(progression.certifications || '[]'),
    badges: JSON.parse(progression.badges || '[]'),
  };
}
