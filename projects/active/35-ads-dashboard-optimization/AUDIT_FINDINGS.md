# Audit Findings: ADS Dashboard Optimization

**Project:** 35-ads-dashboard-optimization
**Date:** January 6, 2026
**Target:** `apps/ads-dashboard`

## 1. Executive Summary
The ADS Dashboard has accumulated technical debt in the form of unused components ("Phone" vs "Dialer") and legacy backend routes (Local Storage CRUD) that conflict with the "Twenty CRM as Source of Truth" architecture. The goal is to strip the application down to its core 4 functional areas: Dashboard, Leads, Dialer, and Settings.

## 2. Component Analysis

### A. Frontend (`client/src`)
*   **Redundancy Found:**
    *   `client/src/components/phone`: Contains `PhoneApp.tsx`, `KeypadTab.tsx`. These appear to be from a legacy implementation.
    *   `client/src/components/dialer`: Contains `MobileDialer.tsx`, `CallControls.tsx`. These are active and used in `pages/dialer.tsx`.
    *   **Action:** Verify redundancy and delete `components/phone`.
*   **Routing:**
    *   `App.tsx` correctly routes to `/`, `/leads`, `/dialer`, `/settings`.
    *   No dead pages found in `client/src/pages`.

### B. Backend (`server/routes.ts`)
*   **Legacy Storage Logic:**
    *   The server implements a full CRUD layer using `storage.ts` (SQLite/Memory) for Leads and Activities.
    *   Endpoints like `GET /api/leads`, `POST /api/leads` use this local storage.
    *   **Conflict:** The frontend uses `twentyDataProvider` to talk to Twenty CRM directly (or via proxy). Local storage leads are "ghost" data that won't sync.
*   **Import Logic:**
    *   `POST /api/import/leads` has a fallback: `if (TWENTY_API) { ... } else { storage.createLead ... }`.
    *   **Action:** Remove the fallback. If Twenty isn't connected, import should fail or queue, not create ghost data.

### C. Configuration (`vite.config.ts`)
*   **Proxies:**
    *   `/twenty-api` -> Correctly proxies to Twenty CRM.
    *   `/twilio-api` -> Correctly proxies to Admiral Server (:4115).
    *   **Status:** Healthy.

## 3. Risks & Constraints
*   **Dialer Stability:** Do not touch `hooks/useDialer.ts` or `components/dialer`. The dialing logic is complex and currently working.
*   **Sync:** Ensure `lib/twentySync.ts` remains the primary mechanism for offline capability. Removing server-side local storage does not affect client-side Dexie storage.

## 4. Conclusion
We can safely delete `components/phone` and strip `server/routes.ts` of all `storage.ts` dependencies (except maybe simple key-value store if used for settings, but settings seem client-side). This will reduce codebase size and eliminate confusion about where data lives.

---

## CORRECTION (January 6, 2026)

### Audit Error Identified
The original audit incorrectly stated that `MobileDialer` is "active and used in `pages/dialer.tsx`".

**Actual State:**
- `pages/dialer.tsx` imports `PhoneApp` from `../components/phone/PhoneApp`
- `MobileDialer` is **NOT imported or used anywhere** in the codebase
- `PhoneApp` is the **active, production dialer component**

### Impact
The recommendation to "delete `components/phone`" would **break the dialer page**. The phone/ directory should be kept as it contains the active dialer implementation.

### Backend Cleanup Completed
- Removed all local storage CRUD endpoints from `server/routes.ts`
- Deleted `server/storage.ts` (~105 lines)
- Refactored `/api/import/leads` to require Twenty CRM (no local fallback)
