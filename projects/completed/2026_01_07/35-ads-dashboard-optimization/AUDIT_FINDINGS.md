# Audit Findings: ADS Dashboard Optimization

**Project:** 35-ads-dashboard-optimization
**Date:** January 6, 2026
**Target:** `apps/ads-dashboard`

## 1. Executive Summary
The ADS Dashboard has accumulated technical debt in the form of unused components ("Phone" vs "Dialer") and legacy backend routes (Local Storage CRUD) that conflict with the "Twenty CRM as Source of Truth" architecture. The goal is to strip the application down to its core 4 functional areas: Dashboard, Leads, Dialer, and Settings.

## 2. Component Analysis

### A. Frontend (`client/src`)

#### CORRECTED ANALYSIS (January 6, 2026)

| Directory | Component | Status | Evidence |
|-----------|-----------|--------|----------|
| `components/phone/` | `PhoneApp.tsx` | **ACTIVE** | Imported by `pages/dialer.tsx` line 10 |
| `components/dialer/` | `MobileDialer.tsx` | **LEGACY/UNUSED** | Not imported by any page or component |

**Original Audit Error:**
The initial audit incorrectly stated that `MobileDialer` was active and `PhoneApp` was legacy. This was backwards.

**Evidence:**
```typescript
// pages/dialer.tsx line 10
import { PhoneApp } from "../components/phone/PhoneApp";
```

**Verification Command:**
```bash
grep -rn "MobileDialer" client/src/pages/ client/src/App.tsx
# Returns: Nothing (MobileDialer is not used)
```

### B. Backend (`server/routes.ts`) - CLEANED

*   **Legacy Storage Logic:** ✅ REMOVED
    *   Deleted `server/storage.ts` (105 lines)
    *   Removed all CRUD endpoints for local leads/activities
    *   Refactored `/api/import/leads` to require Twenty CRM

### C. Configuration (`vite.config.ts`)
*   **Proxies:**
    *   `/twenty-api` -> Correctly proxies to Twenty CRM.
    *   `/twilio-api` -> Correctly proxies to Admiral Server (:4115).
    *   **Status:** Healthy.

## 3. Risks & Constraints
*   **Dialer Stability:** The ACTIVE dialer is `components/phone/PhoneApp.tsx`. DO NOT DELETE.
*   **Sync:** `lib/twentySync.ts` remains the primary mechanism for offline capability.
*   **Pre-existing TS Errors:** Multiple TypeScript errors exist unrelated to this optimization.

## 4. Conclusion

### Phase 1: Backend (COMPLETE ✅)
- Deleted `server/storage.ts`
- Removed 7 local CRUD endpoints
- Twenty CRM is now the sole data source

### Phase 2: Frontend (PENDING)
- Delete `components/dialer/` directory (true legacy code)
- Verify no stray references
- Run final build check

---

## Gemini's Review (January 6, 2026)

> Excellent catch by the execution agent. This is a perfect example of why the Audit -> Plan -> Execute workflow includes a safety check during implementation.
>
> Since PhoneApp is actually the production dialer and MobileDialer is the unused legacy component, we need to correct our project documentation and finish the cleanup by removing the actual dead code.

### Key Takeaway:
The execution agent correctly identified during implementation that the audit had the active/legacy components reversed. This prevented breaking the production dialer and redirected the cleanup to the actual dead code.

---

## Files to Delete (Phase 2)

```
client/src/components/dialer/
├── index.ts
├── MobileDialer.tsx         ← Primary target - definitely unused
├── PhoneScreen.tsx          ← Verify not used by phone/
├── LeadCard.tsx
├── LeadCardStack.tsx
├── CallControls.tsx         ← Verify not used by phone/
├── MobileDispositionPanel.tsx
├── ActionPanel.tsx
├── CompactHUD.tsx
├── PhoneHomeScreen.tsx
├── LeadProfile.tsx
├── EmailComposer.tsx
├── ContactList.tsx
└── DialpadSheet.tsx
```

### Before Deleting Each File:
```bash
# Check if file is imported anywhere
grep -rn "ComponentName" client/src/
```

---

## Success Criteria

- [x] All local storage CRUD endpoints removed
- [x] `server/storage.ts` deleted
- [x] `/api/import/leads` requires Twenty CRM
- [x] Audit findings corrected
- [x] `components/dialer/` directory deleted (14 files removed)
- [x] No stray references to deleted code (verified via grep)
- [ ] Project moved to completed

**Note:** npm build verification blocked by pre-existing issue in `command-dashboard` (vite ^7.3.0 causes semver parse failure). This is unrelated to ads-dashboard cleanup.

---

## Risk Assessment

| Risk | Mitigation | Status |
|------|------------|--------|
| Delete wrong component | Verify imports before deletion | ✅ Caught during execution |
| Break dialer page | PhoneApp identified as active | ✅ Protected |
| Stray references after deletion | Run `npx tsc` after cleanup | Pending |
