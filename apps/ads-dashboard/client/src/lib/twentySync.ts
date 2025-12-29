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
  getRepProgression,
  createRepProgression,
  updateRepProgression,
  getWorkspaceMembers,
  getCurrentWorkspaceMember as fetchCurrentWorkspaceMember,
} from './twentyStatsApi';
import { getTwentyCrmUrl, getSettings } from './settings';

// Current workspace member ID (set after auth)
let currentWorkspaceMemberId: string | null = null;
let syncIntervalId: number | null = null;
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

export function setCurrentWorkspaceMember(id: string) {
  currentWorkspaceMemberId = id;
  localStorage.setItem('twentyWorkspaceMemberId', id);
}

export function getCurrentWorkspaceMember(): string | null {
  if (currentWorkspaceMemberId) return currentWorkspaceMemberId;
  return localStorage.getItem('twentyWorkspaceMemberId');
}

export function getOnlineStatus(): boolean {
  return isOnline;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    isOnline = true;
    await flushSyncQueue();
    await syncFromTwenty();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

/**
 * Sync progression data FROM Twenty TO local Dexie
 * Called on app load to ensure browser matches Twenty
 */
export async function syncFromTwenty(): Promise<void> {
  console.log('[syncFromTwenty] Starting sync...');
  const workspaceMemberId = getCurrentWorkspaceMember();
  console.log('[syncFromTwenty] Workspace member ID:', workspaceMemberId);

  if (!workspaceMemberId) {
    console.warn('[syncFromTwenty] ✗ No workspace member ID set, skipping Twenty sync');
    return;
  }

  try {
    console.log('[syncFromTwenty] Fetching progression from Twenty...');
    const remote = await getRepProgression(workspaceMemberId);
    console.log('[syncFromTwenty] Remote progression:', remote);

    if (!remote) {
      console.log('[syncFromTwenty] No remote progression found for this user');
      return;
    }

    const local = await progressionDb.progression.get('current');

    const remoteBadges = JSON.parse(remote.badges || '[]');
    const remoteDefeatedBosses = JSON.parse(remote.defeatedBosses || '[]');
    const remotePassedExams = JSON.parse(remote.passedExams || '[]');
    const remoteCompletedModules = JSON.parse(remote.completedModules || '[]');

    const merged = {
      id: 'current',
      name: remote.name || local?.name || 'Rep',
      rank: remote.currentRank || local?.rank || 'sdr_1',
      totalXp: remote.totalXp,
      currentLevel: remote.currentLevel,
      closedDeals: remote.closedDeals,
      badges: remoteBadges,
      streakDays: remote.streakDays,
      defeatedBosses: Array.from(new Set([
        ...(local?.defeatedBosses || []),
        ...remoteDefeatedBosses,
      ])),
      passedExams: Array.from(new Set([
        ...(local?.passedExams || []),
        ...remotePassedExams,
      ])),
      completedModules: Array.from(new Set([
        ...(local?.completedModules || []),
        ...remoteCompletedModules,
      ])),
      efficiencyMetrics: local?.efficiencyMetrics,
      lastActivityDate: remote.lastActivityDate
        ? new Date(remote.lastActivityDate)
        : (local?.lastActivityDate || new Date()),
      bossAttempts: local?.bossAttempts || {},
      titles: local?.titles || [],
      activeTitle: local?.activeTitle,
      menteeCount: local?.menteeCount || 0,
      graduationDate: local?.graduationDate,
      specialization: local?.specialization,
    };

    await progressionDb.progression.put(merged);
    console.log('[syncFromTwenty] ✓ Synced from Twenty - XP:', merged.totalXp, 'Level:', merged.currentLevel);
  } catch (error) {
    console.error('[syncFromTwenty] ✗ Failed to sync from Twenty:', error);
  }
}

/**
 * Sync progression data FROM local TO Twenty
 * Called after XP changes to persist to Twenty
 */
export async function syncToTwenty(): Promise<void> {
  console.log('[syncToTwenty] Starting sync to Twenty...');

  const current = await progressionDb.progression.get('current');
  console.log('[syncToTwenty] Local progression:', current ? { totalXp: current.totalXp, level: current.currentLevel } : 'NONE');

  if (!current) {
    console.log('[syncToTwenty] No local progression found, nothing to sync');
    return;
  }

  if (!isOnline) {
    console.log('[syncToTwenty] Offline - queueing sync operation');
    await progressionDb.syncQueue.add({
      operation: 'updateProgression',
      payload: current,
      createdAt: new Date(),
      attempts: 0,
    });
    return;
  }

  const workspaceMemberId = getCurrentWorkspaceMember();
  console.log('[syncToTwenty] Workspace member ID:', workspaceMemberId);

  if (!workspaceMemberId) {
    console.warn('[syncToTwenty] ✗ No workspace member ID set, skipping Twenty sync');
    return;
  }

  try {
    console.log('[syncToTwenty] Checking for existing progression in Twenty...');
    const existingProgression = await getRepProgression(workspaceMemberId);
    console.log('[syncToTwenty] Existing progression:', existingProgression ? { id: existingProgression.id, totalXp: existingProgression.totalXp } : 'NONE');

    const updatePayload = {
      totalXp: current.totalXp,
      currentLevel: current.currentLevel,
      currentRank: current.rank || getRankFromLevel(current.currentLevel),
      closedDeals: current.closedDeals,
      badges: JSON.stringify(current.badges || []),
      streakDays: current.streakDays,
      defeatedBosses: JSON.stringify(current.defeatedBosses || []),
      passedExams: JSON.stringify(current.passedExams || []),
      completedModules: JSON.stringify(current.completedModules || []),
      lastActivityDate: current.lastActivityDate?.toISOString(),
    };

    console.log('[syncToTwenty] Update payload:', JSON.stringify(updatePayload, null, 2));

    if (existingProgression?.id) {
      console.log('[syncToTwenty] Updating existing progression:', existingProgression.id);
      await updateRepProgression(existingProgression.id, updatePayload);
      console.log('[syncToTwenty] ✓ Updated progression');
    } else {
      console.log('[syncToTwenty] Creating new progression record...');
      const members = await getWorkspaceMembers();
      const member = members.find(m => m.id === workspaceMemberId);
      const name = member ? `${member.name.firstName} ${member.name.lastName}` : (current.name || 'Unknown Rep');
      console.log('[syncToTwenty] Creating for user:', name);
      await createRepProgression({
        ...updatePayload,
        workspaceMemberId,
        name,
      });
      console.log('[syncToTwenty] ✓ Created new progression');
    }

    console.log('[syncToTwenty] ✓ Synced progression to Twenty - XP:', current.totalXp);
  } catch (error) {
    console.error('[syncToTwenty] ✗ Failed to sync to Twenty:', error);
    await progressionDb.syncQueue.add({
      operation: 'updateProgression',
      payload: current,
      createdAt: new Date(),
      attempts: 0,
    });
    console.log('[syncToTwenty] Queued for retry');
  }
}

export async function flushSyncQueue(): Promise<void> {
  const queue = await progressionDb.syncQueue.toArray();
  if (queue.length === 0) return;

  console.log(`Flushing ${queue.length} queued sync operations`);

  for (const item of queue) {
    if (item.attempts >= 3) {
      if (item.id) {
        console.error(`Sync item ${item.id} exceeded max attempts, removing`);
        await progressionDb.syncQueue.delete(item.id);
      }
      continue;
    }

    try {
      if (item.operation === 'updateProgression') {
        await syncToTwenty();
      }

      if (item.id) {
        await progressionDb.syncQueue.delete(item.id);
      }
    } catch (error) {
      if (item.id) {
        await progressionDb.syncQueue.update(item.id, {
          attempts: item.attempts + 1,
          lastAttempt: new Date(),
        });
      }
    }
  }
}

export function startPeriodicSync(intervalMs: number = 5 * 60 * 1000): void {
  if (syncIntervalId || typeof window === 'undefined') return;

  syncFromTwenty().catch(console.error);

  syncIntervalId = window.setInterval(async () => {
    try {
      await flushSyncQueue();
      await syncFromTwenty();
      await syncEfficiencyMetrics();
    } catch (error) {
      console.error('Periodic sync failed:', error);
    }
  }, intervalMs);

  console.log(`Periodic sync started (every ${intervalMs / 1000}s)`);
}

export function stopPeriodicSync(): void {
  if (syncIntervalId && typeof window !== 'undefined') {
    window.clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

export async function syncEfficiencyMetrics(): Promise<void> {
  const workspaceMemberId = getCurrentWorkspaceMember();
  if (!workspaceMemberId) return;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = sevenDaysAgo.toISOString().split('T')[0];

  const dailyMetrics = await progressionDb.dailyMetrics
    .where('date')
    .aboveOrEqual(dateStr)
    .toArray();

  if (dailyMetrics.length === 0) return;

  const totals = dailyMetrics.reduce((acc, day) => ({
    dials: acc.dials + (day.dials || 0),
    connects: acc.connects + (day.connects || 0),
    callsUnder30s: acc.callsUnder30s + (day.callsUnder30s || 0),
    callsOver2Min: acc.callsOver2Min + (day.callsOver2Min || 0),
    appointments: acc.appointments + (day.appointments || 0),
    shows: acc.shows + (day.shows || 0),
    deals: acc.deals + (day.deals || 0),
    smsEnrollments: acc.smsEnrollments + (day.smsEnrollments || 0),
  }), {
    dials: 0,
    connects: 0,
    callsUnder30s: 0,
    callsOver2Min: 0,
    appointments: 0,
    shows: 0,
    deals: 0,
    smsEnrollments: 0,
  });

  const efficiencyMetrics = {
    sub30sDropRate: totals.connects > 0
      ? (totals.callsUnder30s / totals.connects) * 100
      : 0,
    callToApptRate: totals.connects > 0
      ? (totals.appointments / totals.connects) * 100
      : 0,
    twoPlusMinRate: totals.connects > 0
      ? (totals.callsOver2Min / totals.connects) * 100
      : 0,
    showRate: totals.appointments > 0
      ? (totals.shows / totals.appointments) * 100
      : 0,
    smsEnrollmentRate: totals.connects > 0
      ? (totals.smsEnrollments / totals.connects) * 100
      : 0,
    lastCalculated: new Date(),
  };

  await progressionDb.progression.update('current', { efficiencyMetrics });

  try {
    const existingProgression = await getRepProgression(workspaceMemberId);
    if (existingProgression?.id) {
      await updateRepProgression(existingProgression.id, {
        efficiencyMetrics: JSON.stringify(efficiencyMetrics),
      });
    }
  } catch (error) {
    console.error('Failed to sync efficiency metrics:', error);
  }
}

/**
 * Record a call - saves to both local AND Twenty
 * Creates a Note in Twenty CRM with a parseable format for call tracking
 */
export async function recordCall(params: {
  name: string;
  duration: number;
  disposition: string;
  xpAwarded: number;
  leadId: string;
}): Promise<void> {
  console.log('[recordCall] ===== RECORDING CALL =====');
  console.log('[recordCall] Params:', JSON.stringify(params, null, 2));

  const { name, duration, disposition, xpAwarded, leadId } = params;

  const dispositionUpper = disposition.toUpperCase();
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const wasSubThirty = duration < 30;
  const wasTwoPlusMin = duration >= 120;

  console.log('[recordCall] Formatted duration:', durationStr, '- SubThirty:', wasSubThirty, '- TwoPlusMin:', wasTwoPlusMin);

  // Save to Twenty as a Note (Notes are the standard way to track activities)
  // Format: "Call - DISPOSITION" so dashboard can count calls
  try {
    const settings = getSettings();
    const apiUrl = getTwentyCrmUrl();
    console.log('[recordCall] API URL:', apiUrl);
    console.log('[recordCall] Has API key:', !!settings.twentyApiKey);

    if (!apiUrl) {
      console.error('[recordCall] ✗ No Twenty API URL configured');
    }
    if (!settings.twentyApiKey) {
      console.error('[recordCall] ✗ No Twenty API key configured');
    }

    if (apiUrl && settings.twentyApiKey) {
      const mutation = `
        mutation CreateCallNote($data: NoteCreateInput!) {
          createNote(data: $data) {
            id
            body
            createdAt
          }
        }
      `;

      const noteBody = [
        `Call - ${dispositionUpper}`,
        `Lead: ${name}`,
        `Duration: ${durationStr}`,
        `XP Awarded: ${xpAwarded}`,
        wasSubThirty ? 'Sub-30s call' : '',
        wasTwoPlusMin ? '2+ minute call' : '',
      ].filter(Boolean).join('\n');

      const requestBody = {
        query: mutation,
        variables: {
          data: {
            body: noteBody,
            personId: leadId,
          },
        },
      };

      console.log('[recordCall] Sending GraphQL request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${apiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.twentyApiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[recordCall] Response status:', response.status, response.statusText);

      const result = await response.json();
      console.log('[recordCall] Response body:', JSON.stringify(result, null, 2));

      if (result.data?.createNote?.id) {
        console.log('[recordCall] ✓ Call recorded as Note:', result.data.createNote.id);
      } else if (result.errors) {
        console.error('[recordCall] ✗ GraphQL errors:', result.errors);
      }
    } else {
      console.error('[recordCall] ✗ Skipping Twenty API call - missing URL or key');
    }
  } catch (error) {
    console.error('[recordCall] ✗ Failed to record call:', error);
    // Continue anyway - local still works
  }

  // Update local daily metrics
  console.log('[recordCall] Updating local daily metrics...');
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
  if (dispositionUpper === 'CONTACT') {
    metric.connects++;
  }
  if (dispositionUpper === 'CALLBACK') {
    metric.appointments++;
  }
  if (wasSubThirty) {
    metric.callsUnder30s++;
  }
  if (wasTwoPlusMin) {
    metric.callsOver2Min++;
  }

  console.log('[recordCall] Updated metric:', JSON.stringify(metric, null, 2));

  if (existingMetric?.id) {
    await progressionDb.dailyMetrics.update(existingMetric.id, metric);
    console.log('[recordCall] ✓ Updated existing daily metrics');
  } else {
    await progressionDb.dailyMetrics.add(metric);
    console.log('[recordCall] ✓ Created new daily metrics entry');
  }

  // Sync progression to Twenty
  console.log('[recordCall] Syncing progression to Twenty...');
  await syncToTwenty();
  console.log('[recordCall] ===== RECORD CALL COMPLETE =====');
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
 * Uses the API key to identify the current user and sync their progression
 */
export async function initializeSync(): Promise<void> {
  console.log('[Twenty Sync] ===== INITIALIZATION STARTED =====');

  // First, try to get the CURRENT workspace member from the API key
  // This is the most reliable way to identify the user
  try {
    console.log('[Twenty Sync] Fetching current workspace member from API...');
    const currentMember = await fetchCurrentWorkspaceMember();
    console.log('[Twenty Sync] API response:', currentMember);

    if (currentMember?.id) {
      console.log('[Twenty Sync] ✓ Identified current user:', currentMember.name?.firstName, currentMember.name?.lastName, '- ID:', currentMember.id);
      setCurrentWorkspaceMember(currentMember.id);
    } else {
      console.log('[Twenty Sync] API returned no user, checking fallbacks...');
      // Fallback: Check localStorage or use first member if only one exists
      const storedId = localStorage.getItem('twentyWorkspaceMemberId');
      if (storedId) {
        console.log('[Twenty Sync] Using stored workspace member ID:', storedId);
        setCurrentWorkspaceMember(storedId);
      } else {
        console.log('[Twenty Sync] No stored ID, fetching workspace members...');
        const members = await getWorkspaceMembers();
        console.log('[Twenty Sync] Found', members.length, 'workspace members');
        if (members.length === 1) {
          console.log('[Twenty Sync] Using single member:', members[0].id);
          setCurrentWorkspaceMember(members[0].id);
        } else if (members.length > 1) {
          console.warn('[Twenty Sync] ✗ Multiple workspace members found. User identification required.');
          console.log('[Twenty Sync] Members:', members.map(m => `${m.id}: ${m.name?.firstName} ${m.name?.lastName}`));
        }
      }
    }
  } catch (error) {
    console.error('[Twenty Sync] ✗ Could not identify current user:', error);
  }

  const finalId = getCurrentWorkspaceMember();
  console.log('[Twenty Sync] Final workspace member ID:', finalId);

  // Sync from Twenty - this will pull the user's progression
  console.log('[Twenty Sync] Starting sync from Twenty...');
  await syncFromTwenty();
  console.log('[Twenty Sync] ===== INITIALIZATION COMPLETE =====');
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
