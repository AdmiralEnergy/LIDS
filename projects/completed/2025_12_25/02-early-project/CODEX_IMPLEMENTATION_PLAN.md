# Codex Implementation Plan - Project 2

**Progression System Fixes**
*For use with OpenAI Codex, Claude, or similar AI coding assistants*

---

## Status: COMPLETED

**Completed:** December 25, 2025
**Executor:** Codex

### Summary

Wired efficiency metrics into rank checks/promotions, added streak tracking + bonus XP, validated XP event types, incremented daily metrics (including shows), and returned recordCallMetrics for call-duration tracking. Specialization bonuses now resolve XP aliases reliably.

### Task Completion Status

| Task | Description | Status |
|------|-------------|--------|
| 1 | Wire up daily metrics increment | **COMPLETE** |
| 2 | Pass efficiency metrics to rank eligibility | **COMPLETE** |
| 3 | Implement streak tracking | **COMPLETE** |
| 4 | Fix boss defeat duplicate XP bug | **COMPLETE** |
| 5 | Add show rate tracking | **COMPLETE** |
| 6 | Add XP event type validation | **COMPLETE** |
| 7 | Fix specialization alias matching | **COMPLETE** |
| 8 | Export recordCallMetrics from hook | **COMPLETE** |

### Files Modified

| File | Changes |
|------|---------|
| `features/progression/hooks/useProgression.ts` | Daily metrics, streaks, efficiency gating, XP validation, recordCallMetrics |
| `features/progression/config/specializations.ts` | XP alias resolution for bonuses |

### Next Steps

1. Run in-browser dailyMetrics and streak checks from Verification Commands
2. Trigger boss defeat twice - verify XP only increments once
3. Confirm DialerHUD efficiency cards show non-zero after activity

---

## System Prompt

```
You are fixing the progression/gamification system in the LIDS ADS Dashboard.

Context:
- App: apps/ads-dashboard (React + TypeScript + Vite)
- Storage: Dexie (IndexedDB wrapper)
- Database file: client/src/lib/progressionDb.ts
- Main hook: client/src/features/progression/hooks/useProgression.ts
- Efficiency hook: client/src/features/progression/hooks/useEfficiencyMetrics.ts

The progression system has XP, levels, ranks, badges, and efficiency metrics.
The core logic works but data collection is broken. Fix the data flow issues.

Do not add comments explaining changes - just make the changes cleanly.
Do not modify any config files (xp.ts, ranks.ts, badges.ts, etc.) - they are correct.
```

---

## Task 1: Wire Up Daily Metrics Increment

**Problem:** `incrementDailyMetric()` exists but is never called. Efficiency metrics always show 0%.

**File:** `apps/ads-dashboard/client/src/features/progression/hooks/useProgression.ts`

**Add import at top:**
```typescript
import { incrementDailyMetric } from '@/lib/progressionDb';
```

**Find the `addXP` function and add metric tracking after XP is awarded.**

Look for a pattern like:
```typescript
const addXP = async (amount?: number, eventType?: string, ...) => {
  // ... existing XP logic
}
```

**Add after XP is saved (before return statement):**
```typescript
// Track daily metrics for efficiency calculations
if (eventType) {
  const metricMap: Record<string, string> = {
    'dial_made': 'dials',
    'call_connected': 'connects',
    'appointment_set': 'appointments',
    'deal_closed': 'deals',
    'sms_campaign_enrollment': 'smsEnrollments',
  };

  const metric = metricMap[eventType];
  if (metric) {
    await incrementDailyMetric(metric as any);
  }
}
```

**Additional:** Create a new function to track call duration metrics:

```typescript
export const recordCallMetrics = async (durationSeconds: number) => {
  if (durationSeconds < 30) {
    await incrementDailyMetric('callsUnder30s');
  } else if (durationSeconds >= 120) {
    await incrementDailyMetric('callsOver2Min');
  }
};
```

---

## Task 2: Pass Efficiency Metrics to Rank Eligibility Check

**Problem:** `checkRankEligibility()` is called with `undefined` for efficiency, bypassing E-4/E-5 gates.

**File:** `apps/ads-dashboard/client/src/features/progression/hooks/useProgression.ts`

**Find the eligibility check (around line 60-70):**
```typescript
// BEFORE (broken):
const eligibility = checkRankEligibility(progression, undefined);
```

**Replace with:**
```typescript
// Import at top of file
import { useEfficiencyMetrics } from './useEfficiencyMetrics';

// Inside the hook, add:
const efficiencyData = useEfficiencyMetrics(7);

// In the eligibility check:
const efficiencyMetrics = efficiencyData ? {
  sub30sDropRate: efficiencyData.sub30sDropRate,
  callToApptRate: efficiencyData.callToApptRate,
  twoPlusMinRate: efficiencyData.twoPlusMinRate,
  showRate: efficiencyData.showRate,
  smsEnrollmentRate: efficiencyData.smsEnrollmentRate,
} : undefined;

const eligibility = checkRankEligibility(progression, efficiencyMetrics);
```

---

## Task 3: Implement Streak Tracking

**Problem:** `streakDays` field exists but is never updated.

**File:** `apps/ads-dashboard/client/src/features/progression/hooks/useProgression.ts`

**Add helper function before the main hook:**
```typescript
function calculateStreak(lastActivityDate: Date | undefined, currentStreak: number): { streakDays: number; isNewDay: boolean } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!lastActivityDate) {
    return { streakDays: 1, isNewDay: true };
  }

  const lastDate = new Date(lastActivityDate);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  const diffTime = today.getTime() - lastDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day - no change
    return { streakDays: currentStreak, isNewDay: false };
  } else if (diffDays === 1) {
    // Consecutive day - increment
    return { streakDays: currentStreak + 1, isNewDay: true };
  } else {
    // Gap - reset to 1
    return { streakDays: 1, isNewDay: true };
  }
}
```

**In the `addXP` function, before saving XP, add:**
```typescript
// Update streak
const { streakDays, isNewDay } = calculateStreak(
  currentProgression.lastActivityDate,
  currentProgression.streakDays
);

if (isNewDay) {
  currentProgression.streakDays = streakDays;
  currentProgression.lastActivityDate = new Date();

  // Award streak bonus XP
  if (streakDays > 1) {
    const streakBonus = XP_SOURCES.streak_day_bonus?.base || 10;
    // Note: Don't call addXP recursively - just add to total
    finalAmount += streakBonus;
  }
}
```

---

## Task 4: Fix Boss Defeat Duplicate XP Bug

**Problem:** Calling `defeatBoss()` twice awards XP twice.

**File:** `apps/ads-dashboard/client/src/features/progression/hooks/useProgression.ts`

**Find the `defeatBoss` function (around line 189-223):**

**Add early return after the already-defeated check:**
```typescript
const defeatBoss = async (bossId: string) => {
  const boss = BOSSES[bossId];
  if (!boss) return;

  const current = await progressionDb.progression.get('current');
  if (!current) return;

  // Check if already defeated - prevent duplicate rewards
  if (current.defeatedBosses?.includes(bossId)) {
    console.log(`Boss ${bossId} already defeated - no duplicate rewards`);
    return; // ADD THIS LINE - prevents duplicate XP
  }

  // ... rest of function
```

---

## Task 5: Add Show Rate Tracking

**Problem:** `shows` metric (appointment show-ups) is never tracked.

**File:** `apps/ads-dashboard/client/src/features/progression/hooks/useProgression.ts`

**Add to the metric map in Task 1:**
```typescript
const metricMap: Record<string, string> = {
  'dial_made': 'dials',
  'call_connected': 'connects',
  'appointment_set': 'appointments',
  'appointment_held': 'shows',  // ADD THIS
  'deal_closed': 'deals',
  'sms_campaign_enrollment': 'smsEnrollments',
};
```

---

## Task 6: Add XP Event Type Validation

**Problem:** Unknown event types silently return 0 XP.

**File:** `apps/ads-dashboard/client/src/features/progression/hooks/useProgression.ts`

**In the `addXP` function, add validation:**
```typescript
const addXP = async (amount?: number, eventType?: string, multipliers?: Record<string, number>) => {
  // Validate event type if provided without explicit amount
  if (eventType && !amount) {
    const resolvedType = resolveXPSource(eventType);
    if (!XP_SOURCES[resolvedType]) {
      console.warn(`Unknown XP event type: ${eventType}. No XP awarded.`);
      return;
    }
  }

  // ... rest of existing logic
```

---

## Task 7: Fix Specialization Alias Matching

**Problem:** Specialization multipliers don't apply when using aliases like 'dial' instead of 'dial_made'.

**File:** `apps/ads-dashboard/client/src/features/progression/config/specializations.ts`

**Find the `getSpecializationMultiplier` function:**

**Update to resolve aliases before matching:**
```typescript
import { resolveXPSource } from './xp';

export function getSpecializationMultiplier(
  specializationId: string | undefined,
  xpType: string
): number {
  if (!specializationId) return 1;

  const spec = SPECIALIZATIONS.find(s => s.id === specializationId);
  if (!spec) return 1;

  // Resolve alias to full event type
  const resolvedType = resolveXPSource(xpType);

  const bonus = spec.bonuses.find(b => b.xpType === resolvedType);
  return bonus?.multiplier || 1;
}
```

---

## Task 8: Export recordCallMetrics from Hook

**File:** `apps/ads-dashboard/client/src/features/progression/hooks/useProgression.ts`

**Ensure the function created in Task 1 is exported and accessible:**

At the end of the hook's return object, add:
```typescript
return {
  // ... existing returns
  addXP,
  recordCallMetrics,  // ADD THIS
  // ... rest
};
```

---

## Verification Commands

After implementation, test these scenarios:

```bash
# 1. Check daily metrics are being populated
# In browser console after making calls:
indexedDB.open('ADS_Progression').onsuccess = (e) => {
  e.target.result.transaction('dailyMetrics').objectStore('dailyMetrics').getAll().onsuccess = (r) => {
    console.log('Daily metrics:', r.target.result);
  };
};

# 2. Check streak is updating
# Make activity on consecutive days, verify streakDays increments

# 3. Check efficiency metrics display
# After populating dailyMetrics, DialerHUD should show non-zero percentages

# 4. Verify boss can't award duplicate XP
# Call defeatBoss('redhawk') twice, check XP only increases once
```

---

## Integration Points

After these fixes, the following integrations will work:

1. **DialerHUD efficiency cards** - Will show real percentages
2. **Rank gates** - E-4 sub_30s_drop and E-5 call_to_appt will enforce
3. **Streak badges** - Streak Warrior badge can be earned
4. **Specialization bonuses** - Will apply correctly with aliases
5. **Boss battles** - No duplicate reward exploits

---

## Files Modified

| File | Changes |
|------|---------|
| `hooks/useProgression.ts` | Tasks 1-6, 8 |
| `config/specializations.ts` | Task 7 |

---

## Dependencies

None - all changes are internal to the progression system.

---

## Rollback

If issues occur:
```bash
git checkout HEAD~1 -- apps/ads-dashboard/client/src/features/progression/
git checkout HEAD~1 -- apps/ads-dashboard/client/src/lib/progressionDb.ts
```

---

*Implementation plan ready for Codex execution*
