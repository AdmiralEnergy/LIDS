# Codex Implementation Plan - Project 3

**Progression System SSOT (Twenty CRM)**
*For use with OpenAI Codex, Claude, or similar AI coding assistants*

---

## Status: COMPLETED

**Completed:** December 25, 2025
**Executor:** Codex

### Summary

Implemented Twenty CRM as the Single Source of Truth for progression. Added sync queue for offline operations, expanded sync logic to handle all progression fields (XP, badges, bosses, exams, efficiency), implemented periodic sync every 5 minutes, and debounced post-XP sync triggers.

### Task Completion Status

| Task | Description | Status |
|------|-------------|--------|
| 1 | Add syncQueue table to Dexie | **COMPLETE** |
| 2 | Expand syncToTwenty for all fields | **COMPLETE** |
| 3 | Add periodic sync interval (5 min) | **COMPLETE** |
| 4 | Implement sync queue flush | **COMPLETE** |
| 5 | Update syncFromTwenty merge logic | **COMPLETE** |
| 6 | Trigger sync after XP events | **COMPLETE** |
| 7 | Start periodic sync on app load | **COMPLETE** |
| 8 | Add efficiency metrics sync | **COMPLETE** |
| 9 | Update twentyStatsApi for new fields | **COMPLETE** |
| 10 | Handle offline state | **COMPLETE** |

### Files Modified

| File | Changes |
|------|---------|
| `lib/progressionDb.ts` | syncQueue table + SyncQueueItem interface |
| `lib/twentySync.ts` | Full sync logic, periodic sync, queue flush, offline handling |
| `lib/twentyStatsApi.ts` | RepProgression interface + create/update helpers |
| `features/progression/hooks/useProgression.ts` | Debounced post-XP sync trigger |
| `App.tsx` | Periodic sync init on mount with cleanup |

### Next Steps

1. Run verification snippets from Verification Commands section
2. Toggle offline/online in browser to confirm queue flush
3. Verify XP matches between local Dexie and Twenty CRM

---

**Dependency:** Project 2 (Progression Fixes) - COMPLETED Dec 25, 2025

---

## Prerequisites

**Before running this implementation, add these custom fields in Twenty CRM:**

| Field Name | Field Type | Object |
|------------|------------|--------|
| defeatedBosses | Text | repProgressions |
| passedExams | Text | repProgressions |
| efficiencyMetrics | Text | repProgressions |
| lastActivityDate | DateTime | repProgressions |

---

## System Prompt

```
You are implementing Twenty CRM sync for the LIDS ADS Dashboard progression system.

Context:
- App: apps/ads-dashboard (React + TypeScript + Vite)
- Local storage: Dexie (IndexedDB wrapper) in client/src/lib/progressionDb.ts
- Remote API: Twenty CRM REST API in client/src/lib/twentyStatsApi.ts
- Sync logic: client/src/lib/twentySync.ts
- Main hook: client/src/features/progression/hooks/useProgression.ts

Background (Project 2 completed):
- Daily metrics now increment correctly on activity
- Streak tracking works with bonus XP
- Efficiency metrics are passed to rank eligibility checks
- Boss defeat duplicate XP bug is fixed
- Specialization alias matching works

The problem: XP earned in the dialer stays local in Dexie. XP earned in RedHawk
syncs to Twenty. Result: two different XP totals.

The fix: Make Twenty CRM the Single Source of Truth (SSOT). Dexie is only a
cache for offline use and UI performance. Sync after every XP event and
periodically every 5 minutes.

Do not add comments explaining changes - just make the changes cleanly.
Do not modify config files (xp.ts, ranks.ts, badges.ts) - they are correct.
Do not modify the XP/streak/efficiency logic from Project 2 - it works.
```

---

## Task 1: Add Sync Queue Table to Dexie

**File:** `apps/ads-dashboard/client/src/lib/progressionDb.ts`

**Find the Dexie schema definition and add a syncQueue table:**

```typescript
// Add to version upgrade or schema
progressionDb.version(X).stores({
  // ... existing tables
  syncQueue: '++id, operation, payload, createdAt, attempts, lastAttempt',
});

// Add interface
export interface SyncQueueItem {
  id?: number;
  operation: 'updateProgression' | 'recordXpEvent' | 'updateEfficiency';
  payload: Record<string, any>;
  createdAt: Date;
  attempts: number;
  lastAttempt?: Date;
}
```

---

## Task 2: Expand syncToTwenty to Include All Fields

**File:** `apps/ads-dashboard/client/src/lib/twentySync.ts`

**Find the syncToTwenty function and update to sync all progression fields:**

```typescript
export async function syncToTwenty(): Promise<void> {
  const current = await progressionDb.progression.get('current');
  if (!current) return;

  const workspaceMemberId = localStorage.getItem('twentyWorkspaceMemberId');
  if (!workspaceMemberId) {
    console.warn('No workspaceMemberId - cannot sync to Twenty');
    return;
  }

  try {
    const existingProgression = await getRepProgression(workspaceMemberId);

    const updatePayload = {
      totalXp: current.totalXp,
      currentLevel: current.currentLevel,
      currentRank: current.rank,
      closedDeals: current.closedDeals,
      badges: JSON.stringify(current.badges || []),
      streakDays: current.streakDays,
      // NEW: Add missing fields
      defeatedBosses: JSON.stringify(current.defeatedBosses || []),
      passedExams: JSON.stringify(current.passedExams || []),
      completedModules: JSON.stringify(current.completedModules || []),
      lastActivityDate: current.lastActivityDate?.toISOString(),
    };

    if (existingProgression) {
      await updateRepProgression(existingProgression.id, updatePayload);
    } else {
      await createRepProgression({
        ...updatePayload,
        workspaceMemberId,
        name: current.name || 'Unknown Rep',
      });
    }
  } catch (error) {
    console.error('Failed to sync to Twenty:', error);
    // Queue for retry
    await progressionDb.table('syncQueue').add({
      operation: 'updateProgression',
      payload: current,
      createdAt: new Date(),
      attempts: 0,
    });
  }
}
```

---

## Task 3: Add Periodic Sync Interval

**File:** `apps/ads-dashboard/client/src/lib/twentySync.ts`

**Add function to start periodic sync:**

```typescript
let syncIntervalId: number | null = null;

export function startPeriodicSync(intervalMs: number = 5 * 60 * 1000): void {
  if (syncIntervalId) return; // Already running

  // Initial sync
  syncFromTwenty().catch(console.error);

  // Periodic sync
  syncIntervalId = window.setInterval(async () => {
    try {
      await flushSyncQueue();
      await syncFromTwenty();
    } catch (error) {
      console.error('Periodic sync failed:', error);
    }
  }, intervalMs);

  console.log(`Periodic sync started (every ${intervalMs / 1000}s)`);
}

export function stopPeriodicSync(): void {
  if (syncIntervalId) {
    window.clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}
```

---

## Task 4: Implement Sync Queue Flush

**File:** `apps/ads-dashboard/client/src/lib/twentySync.ts`

**Add function to process queued sync operations:**

```typescript
export async function flushSyncQueue(): Promise<void> {
  const queue = await progressionDb.table('syncQueue').toArray();
  if (queue.length === 0) return;

  console.log(`Flushing ${queue.length} queued sync operations`);

  for (const item of queue) {
    if (item.attempts >= 3) {
      console.error(`Sync item ${item.id} exceeded max attempts, removing`);
      await progressionDb.table('syncQueue').delete(item.id);
      continue;
    }

    try {
      if (item.operation === 'updateProgression') {
        await syncToTwenty();
      }
      // Add more operation types as needed

      await progressionDb.table('syncQueue').delete(item.id);
    } catch (error) {
      await progressionDb.table('syncQueue').update(item.id, {
        attempts: item.attempts + 1,
        lastAttempt: new Date(),
      });
    }
  }
}
```

---

## Task 5: Update syncFromTwenty to Merge All Fields

**File:** `apps/ads-dashboard/client/src/lib/twentySync.ts`

**Update syncFromTwenty to handle new fields with merge logic:**

```typescript
export async function syncFromTwenty(): Promise<void> {
  const workspaceMemberId = localStorage.getItem('twentyWorkspaceMemberId');
  if (!workspaceMemberId) return;

  try {
    const remote = await getRepProgression(workspaceMemberId);
    if (!remote) return;

    const local = await progressionDb.progression.get('current');

    // Parse JSON fields
    const remoteBadges = JSON.parse(remote.badges || '[]');
    const remoteDefeatedBosses = JSON.parse(remote.defeatedBosses || '[]');
    const remotePassedExams = JSON.parse(remote.passedExams || '[]');
    const remoteCompletedModules = JSON.parse(remote.completedModules || '[]');

    // Merge strategy: Twenty wins for scalar values, union for arrays
    const merged = {
      id: 'current',
      name: remote.name,
      rank: remote.currentRank,
      totalXp: remote.totalXp,
      currentLevel: remote.currentLevel,
      closedDeals: remote.closedDeals,
      badges: remoteBadges,
      streakDays: remote.streakDays,
      // Merge arrays (union of local + remote)
      defeatedBosses: [...new Set([
        ...(local?.defeatedBosses || []),
        ...remoteDefeatedBosses,
      ])],
      passedExams: [...new Set([
        ...(local?.passedExams || []),
        ...remotePassedExams,
      ])],
      completedModules: [...new Set([
        ...(local?.completedModules || []),
        ...remoteCompletedModules,
      ])],
      // Keep local efficiency metrics (calculated locally)
      efficiencyMetrics: local?.efficiencyMetrics,
      lastActivityDate: remote.lastActivityDate
        ? new Date(remote.lastActivityDate)
        : local?.lastActivityDate,
      // Keep other local fields
      bossAttempts: local?.bossAttempts || {},
      titles: local?.titles || [],
      activeTitle: local?.activeTitle,
      menteeCount: local?.menteeCount || 0,
      graduationDate: local?.graduationDate,
    };

    await progressionDb.progression.put(merged);
    console.log('Synced from Twenty:', merged);
  } catch (error) {
    console.error('Failed to sync from Twenty:', error);
  }
}
```

---

## Task 6: Trigger Sync After XP Events

**File:** `apps/ads-dashboard/client/src/features/progression/hooks/useProgression.ts`

**Note:** This file was modified in Project 2. The addXP function now includes
daily metrics, streak tracking, and efficiency gating. Add the sync trigger
at the END of the addXP function, AFTER the existing Project 2 logic.

**Find the addXP function and add sync trigger at the very end (after all
existing logic including streak and daily metrics):**

```typescript
// At the end of addXP function, after all existing logic:
// Trigger sync to Twenty (debounced to avoid too many API calls)
if (typeof window !== 'undefined') {
  clearTimeout((window as any).__xpSyncTimeout);
  (window as any).__xpSyncTimeout = setTimeout(() => {
    import('@/lib/twentySync').then(({ syncToTwenty }) => {
      syncToTwenty().catch(console.error);
    });
  }, 2000); // Debounce 2 seconds
}
```

---

## Task 7: Start Periodic Sync on App Load

**File:** `apps/ads-dashboard/client/src/App.tsx` or `main.tsx`

**Add sync initialization:**

```typescript
import { startPeriodicSync } from '@/lib/twentySync';

// In useEffect or component mount:
useEffect(() => {
  // Start periodic sync (every 5 minutes)
  startPeriodicSync(5 * 60 * 1000);

  return () => {
    // Cleanup on unmount (optional, for HMR)
    import('@/lib/twentySync').then(({ stopPeriodicSync }) => {
      stopPeriodicSync();
    });
  };
}, []);
```

---

## Task 8: Add Efficiency Metrics Sync

**File:** `apps/ads-dashboard/client/src/lib/twentySync.ts`

**Add function to sync weekly efficiency metrics:**

```typescript
export async function syncEfficiencyMetrics(): Promise<void> {
  const workspaceMemberId = localStorage.getItem('twentyWorkspaceMemberId');
  if (!workspaceMemberId) return;

  // Get last 7 days of daily metrics
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = sevenDaysAgo.toISOString().split('T')[0];

  const dailyMetrics = await progressionDb.dailyMetrics
    .where('date')
    .aboveOrEqual(dateStr)
    .toArray();

  if (dailyMetrics.length === 0) return;

  // Aggregate metrics
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
    dials: 0, connects: 0, callsUnder30s: 0, callsOver2Min: 0,
    appointments: 0, shows: 0, deals: 0, smsEnrollments: 0,
  });

  // Calculate rates
  const efficiencyMetrics = {
    periodStart: dateStr,
    periodEnd: new Date().toISOString().split('T')[0],
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
    ...totals,
  };

  // Update local progression
  await progressionDb.progression.update('current', { efficiencyMetrics });

  // Sync to Twenty
  try {
    const existingProgression = await getRepProgression(workspaceMemberId);
    if (existingProgression) {
      await updateRepProgression(existingProgression.id, {
        efficiencyMetrics: JSON.stringify(efficiencyMetrics),
      });
    }
  } catch (error) {
    console.error('Failed to sync efficiency metrics:', error);
  }
}
```

---

## Task 9: Update twentyStatsApi for New Fields

**File:** `apps/ads-dashboard/client/src/lib/twentyStatsApi.ts`

**Ensure API functions handle new fields:**

```typescript
// Update the RepProgression interface
export interface RepProgression {
  id: string;
  name: string;
  workspaceMemberId: string;
  totalXp: number;
  currentLevel: number;
  currentRank: string;
  closedDeals: number;
  badges: string; // JSON
  streakDays: number;
  completedModules?: string; // JSON
  certifications?: string; // JSON
  // NEW FIELDS
  defeatedBosses?: string; // JSON
  passedExams?: string; // JSON
  efficiencyMetrics?: string; // JSON
  lastActivityDate?: string; // ISO datetime
}

// Update createRepProgression and updateRepProgression to accept new fields
```

---

## Task 10: Handle Offline State

**File:** `apps/ads-dashboard/client/src/lib/twentySync.ts`

**Add online/offline detection:**

```typescript
let isOnline = navigator.onLine;

window.addEventListener('online', async () => {
  isOnline = true;
  console.log('Back online - flushing sync queue');
  await flushSyncQueue();
  await syncFromTwenty();
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('Offline - sync operations will be queued');
});

export function getOnlineStatus(): boolean {
  return isOnline;
}
```

**Update syncToTwenty to check online status:**

```typescript
export async function syncToTwenty(): Promise<void> {
  if (!isOnline) {
    // Queue for later
    const current = await progressionDb.progression.get('current');
    await progressionDb.table('syncQueue').add({
      operation: 'updateProgression',
      payload: current,
      createdAt: new Date(),
      attempts: 0,
    });
    return;
  }

  // ... existing sync logic
}
```

---

## Verification Commands

```bash
# 1. Test sync to Twenty after dialer call
# In browser console after making a call:
localStorage.getItem('twentyWorkspaceMemberId')
# Should return a UUID

# 2. Check sync queue
indexedDB.open('ADS_Progression').onsuccess = (e) => {
  e.target.result.transaction('syncQueue').objectStore('syncQueue').getAll().onsuccess = (r) => {
    console.log('Sync queue:', r.target.result);
  };
};

# 3. Force sync and check Twenty
import { syncToTwenty, syncFromTwenty } from '@/lib/twentySync';
await syncToTwenty();
await syncFromTwenty();

# 4. Verify XP matches
# Check local:
progressionDb.progression.get('current').then(console.log);
# Check Twenty (via API or Twenty UI)
```

---

## Files Modified

| File | Changes | Notes |
|------|---------|-------|
| `lib/progressionDb.ts` | Task 1 - syncQueue table | Add new table |
| `lib/twentySync.ts` | Tasks 2-5, 8, 10 - Full sync | Major changes |
| `lib/twentyStatsApi.ts` | Task 9 - New fields | Interface update |
| `features/progression/hooks/useProgression.ts` | Task 6 - Sync trigger | **Modified by P2** - append only |
| `App.tsx` or `main.tsx` | Task 7 - Periodic sync init | Add useEffect |

---

## Rollback

If issues occur:
```bash
git checkout HEAD~1 -- apps/ads-dashboard/client/src/lib/
git checkout HEAD~1 -- apps/ads-dashboard/client/src/features/progression/
```

---

*Implementation plan ready for Codex execution*
