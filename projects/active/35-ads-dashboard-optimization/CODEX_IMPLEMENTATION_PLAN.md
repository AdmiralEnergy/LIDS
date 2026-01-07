# Implementation Plan: ADS Dashboard Cleanup

**Project:** 35-ads-dashboard-optimization
**Objective:** Simplify codebase, enforce Twenty CRM SSOT, remove dead code.

## 1. Execution Steps

### Phase 1: Frontend Purge
1.  **Delete Legacy Phone UI:** Remove `client/src/components/phone`.
2.  **Verify Imports:** Run a build check to ensure no active files were referencing the deleted directory.

### Phase 2: Backend Refactor
1.  **Clean `server/routes.ts`:**
    *   Remove `storage` import.
    *   Remove `GET/POST/PATCH/DELETE /api/leads`.
    *   Remove `GET/POST /api/activities`.
    *   Refactor `/api/import/leads` to remove the `storage.createLead` fallback.
2.  **Delete Legacy Storage:** Remove `server/storage.ts` if no other routes use it (Chat routes might, need to check). *Self-correction: Check `chat-routes.ts` before deleting `storage.ts`.*

### Phase 3: Verification
1.  **Build Check:** `npm run build` within `apps/ads-dashboard`.
2.  **Manual Test:** Ensure Dashboard loads and Sync still attempts to connect.

---

## 2. Claude Code Prompt (Execution)

Copy and paste the following into the Claude Code Terminal Instance:

```bash
# Project: 35-ads-dashboard-optimization
# Target: apps/ads-dashboard

We are optimizing the ADS Dashboard to remove legacy code and enforce Twenty CRM as the single source of truth.

**Context:**
The application has "ghost" components (legacy phone UI) and "ghost" backend routes (local SQLite storage) that conflict with the active architecture (Twenty CRM + Dexie).

**Instructions:**

1.  **Analyze & Safety Check:**
    - Check `server/chat-routes.ts`. Does it import `storage` from `./storage`?
    - If YES: Do NOT delete `server/storage.ts` yet, but DO remove the lead/activity methods from it if possible, or just ignore the file deletion.
    - If NO: You can delete `server/storage.ts` after refactoring routes.

2.  **Frontend Cleanup:**
    - Delete the directory `client/src/components/phone`.
    - Check `client/src/App.tsx` and `client/src/pages/*` to ensure no imports from `@/components/phone` exist.

3.  **Backend Cleanup (`server/routes.ts`):**
    - Remove the `storage` import if feasible.
    - DELETE the following route blocks entirely:
        - `app.get("/api/leads" ...)`
        - `app.get("/api/leads/:id" ...)`
        - `app.post("/api/leads" ...)`
        - `app.patch("/api/leads/:id" ...)`
        - `app.delete("/api/leads/:id" ...)`
        - `app.get("/api/activities" ...)`
        - `app.post("/api/activities" ...)`
    - MODIFY `app.post("/api/import/leads")`:
        - Remove the `else { const lead = await storage.createLead(...) }` block.
        - If Twenty API keys are missing, it should return a 503 error instead of creating a local lead.

4.  **Verification:**
    - Run `npm run build` inside `apps/ads-dashboard` to verify no TypeScript errors remain.

**Constraint:**
- DO NOT touch `client/src/features/dialer` or `client/src/hooks/useDialer.ts`.
- DO NOT touch `twentySync.ts`.
```
