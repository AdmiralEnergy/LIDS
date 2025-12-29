# Codex Implementation Plan - Project 18: Progression System Fix

## System Prompt

```
You are fixing the MOST CRITICAL feature of ADS Dashboard: the Progression System.

## READ FIRST: Why This Matters

70% of solar sales reps quit within the first month because they can't see their progress. The Progression System is one of THREE CORE PILLARS of ADS:

1. LEADS - PropStream imports (reps have something to call)
2. STRUCTURE - Dialer, training, agents (just show up and press dial)
3. PROGRESSION - XP system showing improvement BEFORE first sale (THE GLUE)

This is also DIAGNOSTIC DATA:
- Rep has 100 calls, 20 conversations → naive: "needs closer training"
- But if Sub-30s Drop Rate is 65% → actually needs OPENER training
- The efficiency badges tell both rep AND leadership where to focus

## AUTHORITATIVE DOCUMENTATION (DO NOT INVENT REQUIREMENTS)

All requirements are already documented. Reference these files:

1. **SalesOperativeProgression.md** (LifeOS-Core)
   Path: docs/_SYSTEMS/LIDS/RedHawk_Training_Academy/Admiral Energy Sales Academy/
   Contains: Complete rank requirements, XP sources, badge tiers, level thresholds

2. **redhawk.md** (LifeOS-Core)
   Path: agents/apex/redhawk/
   Contains: RedHawk API endpoints, module structure, exam system

3. **PROGRESSION_SYSTEM.md** (LIDS)
   Path: docs/
   Contains: Twenty CRM schema, sync strategy, integration architecture

4. **REDHAWK_ACADEMY.md** (LIDS)
   Path: docs/
   Contains: RedHawk Academy app, twentyProgressionApi.ts reference

## CURRENT STATE (BROKEN)

From PROGRESSION_SYSTEM.md Known Issues:
1. Sync not implemented in ADS - Currently IndexedDB only, no Twenty sync
2. No repProgressions object in Twenty - May need to create custom object
3. Badge/Exam sync gap - RedHawk badges not appearing in ADS

The progression system tracks locally in IndexedDB but NEVER PERSISTS TO TWENTY CRM.

## WHAT NEEDS TO BE FIXED

### Task 1: Verify/Create repProgressions in Twenty CRM

Check if custom object exists. Schema from PROGRESSION_SYSTEM.md:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| workspaceMemberId | UUID | Links to Twenty user (PERMANENT ID) |
| name | string | Rep display name |
| totalXp | number | Cumulative XP |
| currentLevel | number | Calculated from XP |
| currentRank | string | E-1 through E-7 |
| closedDeals | number | Deal counter |
| badges | JSON | Array of badge IDs |
| streakDays | number | Consecutive activity days |
| completedModules | JSON | Array of module IDs |
| certifications | JSON | Array of certification IDs |
| defeatedBosses | JSON | Array of boss IDs |
| passedExams | JSON | Array of exam IDs |

Twenty CRM: http://localhost:3001 (droplet) or https://twenty.ripemerchant.host
API Key: In client/.env as VITE_TWENTY_API_KEY

### Task 2: Implement Twenty Sync in twentySync.ts

Reference RedHawk Academy's twentyProgressionApi.ts for pattern:
Location: apps/redhawk-academy/client/src/lib/twentyProgressionApi.ts

Sync Strategy (from PROGRESSION_SYSTEM.md):
1. On Activity: Update IndexedDB immediately, queue sync to Twenty
2. On Login: Pull from Twenty, merge with local (Twenty wins conflicts)
3. Periodic: Every 5 minutes, push local changes
4. On Logout: Force sync pending changes

Conflict Rules:
- Twenty CRM is SSOT - if conflict, Twenty wins
- XP is additive - never subtract
- Badges are append-only - once earned, never removed

### Task 3: Connect Existing Progression Features

ADS already has progression features built:
- features/progression/config/ranks.ts - Rank definitions
- features/progression/config/xp.ts - XP sources and thresholds
- features/progression/hooks/useProgression.ts - Main state hook
- lib/progressionDb.ts - IndexedDB cache

These need to sync to Twenty, not just store locally.

### Task 4: Mirror RedHawk Academy

RedHawk Academy (apps/redhawk-academy) provides skill gates:
- Module completions stored in RedHawk agent (port 4096)
- Certifications from exams
- Boss battle results

RedHawk writes to Twenty CRM. ADS reads from same repProgressions object.

RedHawk API endpoints:
GET  /cert/:repId           # Certifications and exam results
GET  /progress/:repId       # Module completion status
GET  /battle/stats/:repId   # Boss battle history

### Task 5: Calculate Efficiency Metrics

These are calculated from call data in Twenty CRM (Notes with "Call -" prefix):

| Metric | Formula | Used For |
|--------|---------|----------|
| Sub-30s Drop Rate | calls < 30s / total calls | Opener Elite badge, E-4 gate |
| Call-to-Appt Rate | appointments / total calls | Conversion Champion badge, E-5 gate |
| 2+ Min Rate | calls > 2min / total calls | Engagement Master badge |
| Show Rate | held appointments / set appointments | Show Rate Champion badge |

## RANK REQUIREMENTS (FROM DOCUMENTATION)

| Rank | XP | Requirements (Reference SalesOperativeProgression.md) |
|------|-----|--------------------------------------------------------|
| SDR I (E-1) | 0 | Starting rank |
| SDR II (E-2) | 500+ | Modules 0-1 passed, 100+ dials |
| SDR III (E-3) | 1,500+ | Modules 0-3 passed, 2 badges, 3+ appointments |
| Operative (E-4) | 3,000+ | Sub-30s Drop <50%, Modules 0-5, 5 deals, exam 80% |
| Senior (E-5) | 8,000+ | Call-to-Appt >5%, Full Cert, 10 deals, exam 85% |
| Team Lead (E-6) | 15,000+ | Cadence Completion >70%, 25 deals, mentored 2+ reps |

## LEVEL THRESHOLDS (FROM DOCUMENTATION)

| Level | XP | Level | XP |
|-------|-----|-------|-----|
| 1 | 0 | 9 | 5,500 |
| 2 | 100 | 10 | 7,500 |
| 3 | 250 | 11 | 10,000 |
| 4 | 500 | 12 | 13,000 |
| 5 | 1,000 | 13 | 16,500 |
| 6 | 1,750 | 14 | 20,500 |
| 7 | 2,750 | 15 | 25,000 |
| 8 | 4,000 | 16+ | +5,000/level |

## SUCCESS CRITERIA

1. [ ] repProgressions custom object exists in Twenty CRM
2. [ ] XP earned in ADS syncs to Twenty within 5 seconds
3. [ ] Closing browser preserves progression (from Twenty)
4. [ ] RedHawk badges/certifications appear in ADS
5. [ ] Efficiency metrics calculated from call data
6. [ ] workspaceMemberId (not email) links all data

## FILES TO MODIFY

| File | Changes |
|------|---------|
| lib/twentySync.ts | Add progression sync functions |
| lib/progressionDb.ts | Add Twenty sync on write |
| features/progression/hooks/useProgression.ts | Add sync triggers |
| contexts/user-context.tsx | Ensure workspaceMemberId available |

## DO NOT

- Do not invent new requirements - reference the documentation
- Do not use email as identifier - use workspaceMemberId
- Do not make progression local-only - it MUST sync to Twenty
- Do not break existing IndexedDB caching - it's for offline, Twenty is SSOT
- Do not change rank thresholds, XP values, or badge requirements - they're documented
```

---

## Phase 1: Verify Twenty CRM Setup

### Task 1.1: Check if repProgressions exists

Query Twenty CRM to see if the custom object exists:

```bash
curl -X GET "https://twenty.ripemerchant.host/rest/repProgressions" \
  -H "Authorization: Bearer $TWENTY_API_KEY"
```

If 404, the object needs to be created via Twenty's Settings > Data Model.

### Task 1.2: Create repProgressions if needed

In Twenty CRM UI (https://twenty.ripemerchant.host):
1. Settings → Data Model → Create Custom Object
2. Name: `repProgressions`
3. Add fields per schema above

---

## Phase 2: Implement Sync Functions

### Task 2.1: Read twentyProgressionApi.ts from RedHawk Academy

```
apps/redhawk-academy/client/src/lib/twentyProgressionApi.ts
```

Use this as the pattern for ADS sync.

### Task 2.2: Add sync functions to twentySync.ts

```typescript
// In apps/ads-dashboard/client/src/lib/twentySync.ts

export async function syncProgressionToTwenty(
  workspaceMemberId: string,
  progression: ProgressionData
): Promise<void> {
  // Implementation here
}

export async function getProgressionFromTwenty(
  workspaceMemberId: string
): Promise<ProgressionData | null> {
  // Implementation here
}
```

---

## Phase 3: Connect to Existing Features

### Task 3.1: Update useProgression hook

Add sync triggers when XP changes.

### Task 3.2: Update progressionDb.ts

Add Twenty sync on write operations.

---

## Phase 4: Calculate Efficiency Metrics

### Task 4.1: Query call data from Twenty

```typescript
// Query Notes with "Call -" prefix
// Parse duration from "Call - DISPOSITION | M:SS | Lead Name"
// Calculate metrics
```

### Task 4.2: Store calculated metrics

Update repProgressions with efficiency data for badge calculation.

---

## Verification

After implementation:

1. Make a test call in ADS → disposition as "Contacted"
2. Check browser console for sync logs
3. Query Twenty: `GET /rest/repProgressions`
4. Verify totalXp increased
5. Close browser, reopen → verify data persists
6. Complete a module in RedHawk Academy
7. Verify badge appears in ADS

---

## Rollback

If sync causes issues:
1. Comment out sync calls in useProgression.ts
2. Keep IndexedDB as fallback
3. Debug sync functions separately

---

*Created: December 29, 2025*
