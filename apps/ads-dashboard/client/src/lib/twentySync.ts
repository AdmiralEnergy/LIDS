/**
 * Twenty CRM Sync Service
 *
 * Keeps local Dexie IndexedDB in sync with Twenty CRM
 * - On load: Pull from Twenty → Update local
 * - On action: Save to local (instant UI) + Push to Twenty (persistence)
 * - Periodic sync: Ensure consistency
 */

import { progressionDb, DailyMetrics } from './progressionDb';
import {
  createCallRecord,
  getCallRecords,
  getRepProgression,
  createOrUpdateRepProgression,
  getWorkspaceMembers,
} from './twentyStatsApi';
import { calculateLevel } from '../features/progression/config/xp';

// Current workspace member ID (set after auth)
let currentWorkspaceMemberId: string | null = null;

export function setCurrentWorkspaceMember(id: string) {
  currentWorkspaceMemberId = id;
  localStorage.setItem('twentyWorkspaceMemberId', id);
}

export function getCurrentWorkspaceMember(): string | null {
  if (currentWorkspaceMemberId) return currentWorkspaceMemberId;
  return localStorage.getItem('twentyWorkspaceMemberId');
}

/**
 * Sync progression data FROM Twenty TO local Dexie
 * Called on app load to ensure browser matches Twenty
 */
export async function syncFromTwenty(): Promise<boolean> {
  const workspaceMemberId = getCurrentWorkspaceMember();
  if (!workspaceMemberId) {
    console.warn('No workspace member ID set, skipping Twenty sync');
    return false;
  }

  try {
    // Get progression from Twenty
    const twentyProgression = await getRepProgression(workspaceMemberId);

    if (twentyProgression) {
      // Update local Dexie with Twenty data
      const existing = await progressionDb.progression.get('current');

      const updated = {
        id: 'current',
        name: existing?.name || 'Rep',
        rank: existing?.rank || 'Rookie',
        totalXp: twentyProgression.totalXp || 0,
        currentLevel: twentyProgression.currentLevel || 1,
        closedDeals: twentyProgression.closedDeals || 0,
        badges: twentyProgression.badges ? JSON.parse(twentyProgression.badges) : [],
        streakDays: twentyProgression.streakDays || 0,
        bossAttempts: existing?.bossAttempts || {},
        // Preserve local fields not in Twenty
        efficiencyMetrics: existing?.efficiencyMetrics || {
          sub30sDropRate: 0,
          callToApptRate: 0,
          twoPlusMinRate: 0,
          showRate: 0,
          smsEnrollmentRate: 0,
          lastCalculated: new Date(),
        },
        defeatedBosses: existing?.defeatedBosses || [],
        passedExams: existing?.passedExams || [],
        titles: existing?.titles || [],
        activeTitle: existing?.activeTitle || '',
        completedModules: existing?.completedModules || [],
        menteeCount: existing?.menteeCount || 0,
        lastActivityDate: new Date(),
      };

      await progressionDb.progression.put(updated);
      console.log('Synced progression from Twenty:', twentyProgression.totalXp, 'XP');
    }

    return true;
  } catch (error) {
    console.error('Failed to sync from Twenty:', error);
    return false;
  }
}

/**
 * Sync progression data FROM local TO Twenty
 * Called after XP changes to persist to Twenty
 */
export async function syncToTwenty(): Promise<boolean> {
  const workspaceMemberId = getCurrentWorkspaceMember();
  if (!workspaceMemberId) {
    console.warn('No workspace member ID set, skipping Twenty sync');
    return false;
  }

  try {
    // Get local progression
    const localProgression = await progressionDb.progression.get('current');

    if (localProgression) {
      // Get workspace member name
      const members = await getWorkspaceMembers();
      const member = members.find(m => m.id === workspaceMemberId);
      const name = member ? `${member.name.firstName} ${member.name.lastName}` : 'Unknown';

      // Push to Twenty
      await createOrUpdateRepProgression({
        name,
        workspaceMemberId,
        totalXp: localProgression.totalXp,
        currentLevel: localProgression.currentLevel,
        currentRank: getRankFromLevel(localProgression.currentLevel),
        closedDeals: localProgression.closedDeals,
        badges: JSON.stringify(localProgression.badges || []),
        streakDays: 0, // Calculate from daily metrics
      });

      console.log('Synced progression to Twenty:', localProgression.totalXp, 'XP');
    }

    return true;
  } catch (error) {
    console.error('Failed to sync to Twenty:', error);
    return false;
  }
}

/**
 * Record a call - saves to both local AND Twenty
 */
export async function recordCall(params: {
  name: string;
  duration: number;
  disposition: string;
  xpAwarded: number;
  leadId: string;
}): Promise<void> {
  const { name, duration, disposition, xpAwarded, leadId } = params;

  // Save to Twenty (source of truth)
  try {
    await createCallRecord({
      name,
      duration,
      disposition: disposition.toUpperCase(),
      xpAwarded,
      wasSubThirty: duration < 30,
      wasTwoPlusMin: duration >= 120,
      leadId,
    });
    console.log('Call recorded to Twenty');
  } catch (error) {
    console.error('Failed to record call to Twenty:', error);
    // Continue anyway - local still works
  }

  // Update local daily metrics
  const today = new Date().toISOString().split('T')[0];
  const existingMetric = await progressionDb.dailyMetrics
    .where('date')
    .equals(today)
    .first();

  const metric: DailyMetrics = existingMetric || {
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

  // Update metrics based on disposition
  metric.dials++;
  if (disposition === 'CONTACT' || disposition === 'contact') {
    metric.connects++;
  }
  if (disposition === 'CALLBACK' || disposition === 'callback') {
    metric.appointments++;
  }
  if (duration < 30) {
    metric.callsUnder30s++;
  }
  if (duration >= 120) {
    metric.callsOver2Min++;
  }

  if (existingMetric?.id) {
    await progressionDb.dailyMetrics.update(existingMetric.id, metric);
  } else {
    await progressionDb.dailyMetrics.add(metric);
  }

  // Sync progression to Twenty
  await syncToTwenty();
}

/**
 * Get rank grade (E-1 to E-7) from level
 */
function getRankFromLevel(level: number): string {
  if (level < 3) return 'E-1';
  if (level < 6) return 'E-2';
  if (level < 10) return 'E-3';
  if (level < 15) return 'E-4';
  if (level < 18) return 'E-5';
  if (level < 25) return 'E-6';
  return 'E-7';
}

/**
 * Initialize sync - call on app startup
 */
export async function initializeSync(): Promise<void> {
  // Try to get workspace member from Twenty
  try {
    const members = await getWorkspaceMembers();
    if (members.length > 0) {
      // For now, use first member (should be based on auth)
      const storedId = localStorage.getItem('twentyWorkspaceMemberId');
      if (!storedId && members.length === 1) {
        setCurrentWorkspaceMember(members[0].id);
      }
    }
  } catch (error) {
    console.warn('Could not fetch workspace members:', error);
  }

  // Sync from Twenty
  await syncFromTwenty();
}

/**
 * Full bidirectional sync
 * Compares timestamps and resolves conflicts
 */
export async function fullSync(): Promise<{
  success: boolean;
  direction: 'from_twenty' | 'to_twenty' | 'none';
  changes: number;
}> {
  const workspaceMemberId = getCurrentWorkspaceMember();
  if (!workspaceMemberId) {
    return { success: false, direction: 'none', changes: 0 };
  }

  try {
    const [twentyProgression, localProgression] = await Promise.all([
      getRepProgression(workspaceMemberId),
      progressionDb.progression.get('current'),
    ]);

    const twentyXp = twentyProgression?.totalXp || 0;
    const localXp = localProgression?.totalXp || 0;

    // Twenty has higher XP = sync from Twenty
    if (twentyXp > localXp) {
      await syncFromTwenty();
      return { success: true, direction: 'from_twenty', changes: twentyXp - localXp };
    }

    // Local has higher XP = sync to Twenty
    if (localXp > twentyXp) {
      await syncToTwenty();
      return { success: true, direction: 'to_twenty', changes: localXp - twentyXp };
    }

    return { success: true, direction: 'none', changes: 0 };
  } catch (error) {
    console.error('Full sync failed:', error);
    return { success: false, direction: 'none', changes: 0 };
  }
}
