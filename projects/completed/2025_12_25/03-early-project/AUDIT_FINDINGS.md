# Project 3: Progression System SSOT

**Twenty CRM as Single Source of Truth**
*Created: December 25, 2025*

---

## Status: COMPLETED

**Completed:** December 25, 2025
**Executor:** Codex

---

## Executive Summary

The progression system currently has **two disconnected data stores**:
1. **Dexie (IndexedDB)** - Used by LIDS Dashboard dialer
2. **Twenty CRM** - Used by RedHawk Academy

XP earned in the dialer stays local. XP earned in RedHawk syncs to Twenty. Result: **two different XP totals** depending on where you look.

**Fix:** Make Twenty CRM the SSOT. Dexie becomes a cache/offline buffer only.

---

## Current Architecture (Broken)

```
LIDS Dashboard (Dialer)              RedHawk Academy
        │                                    │
        ▼                                    ▼
    Dexie (local)                    Twenty CRM (server)
        │                                    │
        │ ← NO SYNC →                        │
        │                                    │
    XP = 2,500                         XP = 1,800
    Level = 8                          Level = 6

    DIFFERENT TOTALS = BROKEN
```

---

## Data Flow Gaps

### Critical Issues

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| C1 | Dialer XP never syncs to Twenty | `dialer.tsx` → `addXP()` | XP earned calling stays local |
| C2 | Efficiency metrics never in Twenty | `useEfficiencyMetrics.ts` | Can't enforce rank gates server-side |
| C3 | No periodic sync | `twentySync.ts` | Changes in Twenty don't reach LIDS mid-session |
| C4 | Two XP totals | LIDS vs RedHawk | Rep sees different progress in each app |

### High Priority Issues

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| H1 | Boss defeats only in Dexie | `useProgression.defeatBoss()` | E-5 eligibility can't be verified |
| H2 | Exam passes only in Dexie | `useProgression.passExam()` | Certification gates are local-only |
| H3 | completedModules not bidirectional | Both apps write, neither reads the other | Module progress out of sync |
| H4 | Streak calculated locally | `calculateStreak()` | Streak wrong if rep uses both apps same day |

### Medium Priority Issues

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| M1 | User identification loose | `localStorage.twentyWorkspaceMemberId` | No auth means uncertain user mapping |
| M2 | Badge progress local-only | `progressionDb.badgeProgress` | Badge unlocks not in Twenty |
| M3 | XP events log local-only | `progressionDb.xpEvents` | No server-side audit trail |

---

## Current Sync Behavior

### What Syncs TO Twenty (Partial)

```typescript
// twentySync.ts:syncToTwenty()
// Called after dialer disposition
{
  totalXp,        // ✓
  currentLevel,   // ✓
  currentRank,    // ✓
  closedDeals,    // ✓
  badges,         // ✓
  streakDays,     // ✓
}
```

### What Does NOT Sync TO Twenty

```typescript
{
  defeatedBosses,     // ✗ Local only
  passedExams,        // ✗ Local only
  bossAttempts,       // ✗ Local only
  titles,             // ✗ Local only
  completedModules,   // ✗ Written by RedHawk, not LIDS
  efficiencyMetrics,  // ✗ Never synced
  dailyMetrics,       // ✗ Never synced
}
```

### What Syncs FROM Twenty (Startup Only)

```typescript
// twentySync.ts:syncFromTwenty()
// Called ONCE at app initialization
{
  totalXp,            // Overwrites local
  currentLevel,       // Overwrites local
  currentRank,        // Overwrites local
  closedDeals,        // Overwrites local
  badges,             // Overwrites local
  streakDays,         // Overwrites local
  completedModules,   // Overwrites local
}
```

---

## Twenty CRM Schema

### repProgressions Object

| Field | Type | Current Usage | Needed |
|-------|------|---------------|--------|
| id | UUID | Primary key | ✓ |
| name | string | Rep display name | ✓ |
| workspaceMemberId | string | Links to user | ✓ |
| totalXp | number | XP total | ✓ |
| currentLevel | number | Level 1-25 | ✓ |
| currentRank | string | E-1 to E-7 | ✓ |
| closedDeals | number | Deal count | ✓ |
| badges | JSON string | Badge array | ✓ |
| streakDays | number | Activity streak | ✓ |
| completedModules | JSON string | Module IDs | ✓ |
| certifications | JSON string | Cert IDs | ✓ |
| **defeatedBosses** | JSON string | Boss IDs | **ADD** |
| **passedExams** | JSON string | Exam IDs | **ADD** |
| **efficiencyMetrics** | JSON string | Weekly stats | **ADD** |
| **lastActivityDate** | datetime | Last activity | **ADD** |

---

## Target Architecture (Fixed)

```
LIDS Dashboard (Dialer)              RedHawk Academy
        │                                    │
        ▼                                    ▼
    Dexie (CACHE)                    Twenty CRM (SSOT)
        │                                    ▲
        │ ─────────── SYNC ─────────────────►│
        │◄─────────── SYNC ──────────────────│
        │                                    │
    Cache: XP, leads, drafts         Truth: XP, ranks, badges

    SINGLE TOTAL = WORKING
```

---

## Sync Strategy

### Write Path (Dialer Action → Twenty)

```
Rep makes call → disposition selected
    │
    ├─ [1] Optimistic UI update (Dexie)
    │      └─ progressionDb.progression.update()
    │
    ├─ [2] Queue sync operation
    │      └─ syncQueue.add({ op: 'updateProgression', payload })
    │
    └─ [3] Flush queue → Twenty API
           └─ PATCH /rest/repProgressions/{id}
```

### Read Path (App Startup + Periodic)

```
App loads / every 5 minutes
    │
    ├─ [1] Fetch from Twenty
    │      └─ GET /rest/repProgressions?workspaceMemberId=X
    │
    ├─ [2] Merge with local (Twenty wins)
    │      └─ progressionDb.progression.put(twentyData)
    │
    └─ [3] Update UI
```

### Conflict Resolution

- **Twenty wins** for: totalXp, level, rank, deals, badges, streak
- **Merge arrays** for: defeatedBosses, passedExams, completedModules
- **Local only** for: dailyMetrics (aggregate weekly, sync as efficiencyMetrics)

---

## Files to Modify

| File | Changes |
|------|---------|
| `lib/progressionDb.ts` | Add syncQueue table |
| `lib/twentySync.ts` | Add periodic sync, full field sync |
| `lib/twentyStatsApi.ts` | Add new fields to API calls |
| `features/progression/hooks/useProgression.ts` | Queue writes instead of direct Dexie |
| `pages/dialer.tsx` | Trigger sync after disposition |
| `App.tsx` or root | Start periodic sync interval |

### Twenty CRM Custom Fields (Add via UI or API)

- `defeatedBosses` - Text (JSON)
- `passedExams` - Text (JSON)
- `efficiencyMetrics` - Text (JSON)
- `lastActivityDate` - DateTime

---

## Success Criteria

1. [x] XP earned in dialer appears in RedHawk within 5 minutes - **Periodic sync + debounced post-XP sync**
2. [x] XP earned in RedHawk appears in dialer within 5 minutes - **syncFromTwenty() every 5 min**
3. [x] Boss defeat in LIDS unlocks E-5 eligibility in Twenty - **defeatedBosses synced**
4. [x] Efficiency metrics visible in Twenty for rank gates - **efficiencyMetrics synced**
5. [x] App works offline, syncs when online - **syncQueue + online/offline handlers**
6. [x] No duplicate XP from race conditions - **Twenty wins for scalars, merge for arrays**

---

## Dependencies

- Twenty CRM must have custom fields added
- BACKEND_HOST env var must be set (Project 1 completed)
- User must have workspaceMemberId set

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Sync conflicts | Twenty wins, timestamps compared |
| Offline period | syncQueue buffers, retries on connect |
| API failure | Retry with exponential backoff |
| Missing user ID | Prompt for login, block progression until set |

---

*Audit completed: December 25, 2025*
