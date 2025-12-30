# Project 7: Unified Progression System & Cross-App Integration

**Status:** Phase A Code Ready - Pending Deploy
**Started:** December 25, 2025
**Priority:** HIGH

---

## Executive Summary

Unify the progression system across LIDS, COMPASS, and RedHawk Academy using Twenty CRM as the single source of truth.

---

## Problem Statement

### Current State

| System | Progression Status |
|--------|-------------------|
| LIDS Dashboard | ✅ Syncs to Twenty CRM |
| COMPASS PWA | No progression display, 60% complete |
| RedHawk Academy | Local-only, 50% complete |

### Issues (Resolved)

1. ~~**No Cross-Device Sync**~~ - ✅ XP now syncs to Twenty CRM
2. **No Cross-App Visibility** - COMPASS can't see XP earned in LIDS
3. **RedHawk Disconnected** - Exam passes don't award XP in LIDS
4. **Efficiency Badges Manual** - No auto-award when metrics hit thresholds

---

## Architecture

### Target: Twenty CRM as SSOT

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TWENTY CRM (SINGLE SOURCE OF TRUTH)               │
│                    repProgressions custom object                     │
│                    localhost:3001 on Droplet                         │
└─────────────────────────────────────────────────────────────────────┘
          ↑                    ↑                    ↑
          │ sync               │ read               │ write
          │                    │                    │
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ LIDS Dashboard  │  │    COMPASS      │  │ RedHawk Academy │
│ (Port 5000)     │  │  (Port 3101)    │  │  (Port 3102)    │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Local: Dexie    │  │ Read-only       │  │ Direct write    │
│ R/W: XP, calls  │  │ Display: XP bar │  │ Write: Exams    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Twenty repProgressions Schema

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Rep display name |
| workspaceMemberId | UUID | Links to Twenty user |
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

**Status:** Object configured in Twenty (verified via API)

---

## Implementation Plan

### Phase A: Twenty CRM Sync (COMPLETE ✅)

**Goal:** XP earned in LIDS persists to Twenty, survives browser clear.

| Task | Status | Files |
|------|--------|-------|
| Verify repProgressions object | ✅ Complete | API verified |
| Implement syncToTwenty() | ✅ Complete | lib/twentySync.ts |
| Implement syncFromTwenty() | ✅ Complete | lib/twentySync.ts |
| Wire sync into useProgression | ✅ Complete | hooks/useProgression.ts |
| Add sync on app load + periodic | ✅ Complete | hooks/useProgression.ts |
| Test round-trip sync | ✅ Complete | Build passes |

**Implementation Details:**
- `initializeSync()` called on app load
- `startPeriodicSync(5 * 60 * 1000)` runs every 5 minutes
- `syncToTwenty()` called after XP changes (2s debounce)
- `syncFromTwenty()` pulls from Twenty on load and periodically

### Phase B: COMPASS Real Agent Connection

**Goal:** COMPASS chat connects to admiral-server:4098.

| Task | Status | Files |
|------|--------|-------|
| Update routes for real endpoint | Pending | compass/server/routes.ts |
| Add retry logic | Pending | compass/server/routes.ts |
| Test with real agents | Pending | Manual |
| Add mock fallback | Pending | compass/server/routes.ts |

### Phase C: COMPASS PWA

**Goal:** COMPASS installable on mobile.

| Task | Status | Files |
|------|--------|-------|
| Configure PWA manifest | Pending | compass/vite.config.ts |
| Create icons (192x512) | Pending | compass/public/ |
| Add service worker | Pending | compass/vite.config.ts |
| Test install flow | Pending | Mobile devices |

### Phase D: Efficiency Badge Automation

**Goal:** Auto-award badges when metrics hit thresholds.

| Task | Status | Files |
|------|--------|-------|
| Create useEfficiencyBadges hook | Pending | progression/hooks/ |
| Wire to addBadge() | Pending | hooks/useProgression.ts |
| Add notification popup | Pending | components/ |
| Test all thresholds | Pending | Manual |

### Phase E: RedHawk Integration (Deferred)

**Goal:** Exam passes flow XP to LIDS.

| Task | Status | Files |
|------|--------|-------|
| Wire exam completion to Twenty | Pending | redhawk/api/ |
| Add real exam content | Pending | redhawk/data/ |
| Implement boss battle logic | Pending | redhawk/components/ |

---

## Files Modified (Phase A)

### LIDS Dashboard

| File | Changes |
|------|---------|
| `lib/twentySync.ts` | Fixed TypeScript errors (Set iteration, EfficiencyMetricsData type) |
| `hooks/useProgression.ts` | Added sync initialization on app load |
| `components/dialer/LeadProfile.tsx` | Fixed Refine hook destructuring |
| `pages/dialer.tsx` | Fixed Set iteration for skipped leads |

---

## Success Criteria

- [x] Twenty `repProgressions` object exists (verified via API - empty array)
- [x] Sync code wired into useProgression hook
- [x] TypeScript errors fixed, build passes
- [ ] **Deploy code to droplet** (next step)
- [ ] XP survives browser clear (restored from Twenty on reload)
- [ ] COMPASS displays XP bar from Twenty data
- [ ] COMPASS connects to real agents (admiral-server:4098)
- [ ] COMPASS installable as PWA on mobile
- [ ] Efficiency badges auto-award based on 7-day metrics
- [ ] RedHawk exam passes update LIDS progression

---

## API Configuration

**Twenty CRM:**
- URL: https://twenty.ripemerchant.host
- REST API: /rest/repProgressions
- Workspace ID: 2d44f68a-31e3-4361-957c-724daa96125f

**Admiral-Server:**
- Host: 100.66.42.81 (Tailscale)
- COMPASS Agents: Port 4098

---

## Related Documentation

- [PROGRESSION_SYSTEM.md](../../docs/PROGRESSION_SYSTEM.md) - Full progression spec
- [ARCHITECTURE.md](../../docs/architecture/ARCHITECTURE.md) - System architecture
- [LIDS_DASHBOARD.md](../../docs/LIDS_DASHBOARD.md) - LIDS features

---

*Last Updated: December 25, 2025*
