# Project 35: ADS Dashboard Optimization

**Status:** BACKEND COMPLETE | FRONTEND BLOCKED
**Date Started:** January 6, 2026
**Last Updated:** January 6, 2026
**Memory ID:** `c6fefae7-ff5d-4de2-a6a0-0b25e934fdd9`

## Objective
Simplify the application by removing legacy code (Local Storage logic) to ensure **Twenty CRM** is the Single Source of Truth.

---

## Current State (For Any Instance Picking Up)

### What's Done ✅
- **Backend cleanup complete** - All local storage logic removed
- **Twenty CRM is now the sole data source** - No fallback to local storage
- **Build verification passed** - Server-side compiles with no errors

### What's Blocked ⚠️
- **Frontend cleanup blocked** - Audit was incorrect about phone/ vs dialer/ components
- **Cannot delete `components/phone/`** - It's actively used by the production dialer

### What's Next
1. **Decision needed:** Keep `PhoneApp` or migrate to `MobileDialer`?
2. Fix pre-existing TypeScript errors (optional, unrelated to this project)

---

## Completed Work

### Backend Cleanup ✅

**Files Deleted:**
| File | Lines Removed | Purpose |
|------|---------------|---------|
| `server/storage.ts` | 105 lines | In-memory lead/activity storage |

**Endpoints Removed from `server/routes.ts`:**
| Endpoint | Purpose |
|----------|---------|
| `GET /api/leads` | List local leads |
| `GET /api/leads/:id` | Get single local lead |
| `POST /api/leads` | Create local lead |
| `PATCH /api/leads/:id` | Update local lead |
| `DELETE /api/leads/:id` | Delete local lead |
| `GET /api/activities` | List local activities |
| `POST /api/activities` | Create local activity |

**Import Refactored:**
- `POST /api/import/leads` - Removed storage fallback
- Now returns 503 error if Twenty CRM not configured

**Total Lines Removed:** ~152 lines

### Build Verification ✅
```bash
# Server-side check (returns nothing = no errors)
cd apps/ads-dashboard && npx tsc --noEmit 2>&1 | grep "server/"

# Verify storage.ts deleted
ls apps/ads-dashboard/server/storage.ts
# Returns: No such file or directory

# Verify no storage import in routes.ts
grep "storage" apps/ads-dashboard/server/routes.ts
# Returns: nothing
```

---

## CRITICAL: Audit Error Found

### Original Audit Claimed:
- `components/phone/` = Legacy implementation (DELETE)
- `components/dialer/` = Active, used in `pages/dialer.tsx`

### Actual State:
- `pages/dialer.tsx` imports **`PhoneApp`** from `../components/phone/PhoneApp`
- `MobileDialer` from `components/dialer/` is **NOT USED ANYWHERE**
- `PhoneApp` IS the production dialer component

### Impact:
Deleting `components/phone/` would **break the dialer page**.

### Decision Required:
1. **Keep PhoneApp** - It works, just leave it
2. **Migrate to MobileDialer** - Requires significant refactor of `dialer.tsx` (different props interface)

---

## Files Modified in This Project

```
apps/ads-dashboard/
├── server/
│   ├── routes.ts          ← MODIFIED: Removed 7 endpoints + storage import
│   └── storage.ts         ← DELETED: 105 lines
│
projects/active/35-ads-dashboard-optimization/
├── README.md              ← CREATED: This file
├── AUDIT_FINDINGS.md      ← MODIFIED: Added correction section
└── CODEX_IMPLEMENTATION_PLAN.md  ← Unchanged
```

---

## Pre-existing TypeScript Errors (NOT from this project)

These errors existed before and are unrelated to the optimization:
- `components/dialer/LeadProfile.tsx` - useList result type
- `components/dialer/MobileDialer.tsx` - status type mismatch
- `components/phone/QRCodeModal.tsx` - missing qrcode.react module
- `components/phone/RecentsTab.tsx` - phoneNumber property issues
- `hooks/useDialer.ts` - callback signature
- `lib/fieldUtils.ts` - isPrimary property
- `pages/dashboard.tsx` - todayXp property
- `pages/dialer.tsx` - recordCall signature
- `pages/leads.tsx` - filter type
- `providers/twentyDataProvider.ts` - null vs undefined
- `shared/chat-schema.ts` - implicit any

---

## Verification Commands

```bash
# 1. Confirm backend changes work
cd C:\LifeOS\LIDS\apps\ads-dashboard
npx tsc --noEmit 2>&1 | grep "server/"
# Expected: Nothing (no errors)

# 2. Confirm storage.ts is gone
ls server/storage.ts
# Expected: No such file or directory

# 3. Confirm routes.ts has no storage references
grep -n "storage" server/routes.ts
# Expected: Nothing

# 4. Confirm dialer.tsx uses PhoneApp
grep -n "PhoneApp" client/src/pages/dialer.tsx
# Expected: Line 10: import { PhoneApp } from "../components/phone/PhoneApp"

# 5. Confirm MobileDialer is unused
grep -r "MobileDialer" client/src/pages/ client/src/App.tsx
# Expected: Nothing (it's only in its own definition)
```

---

## Core Routes Preserved

All 4 core app routes remain active and unchanged:
| Route | Page | Status |
|-------|------|--------|
| `/` | Dashboard | ✅ Working |
| `/leads` | CRM leads list | ✅ Working |
| `/dialer` | Phone dialer | ✅ Working (uses PhoneApp) |
| `/settings` | App settings | ✅ Working |

---

## Memory Reference

Query this from any Claude instance:
```bash
curl -X POST "http://192.168.1.23:4110/memory/recall" \
  -H "Content-Type: application/json" \
  -d '{"query": "Project 35 ADS Dashboard optimization status"}'
```
