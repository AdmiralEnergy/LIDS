# Audit Findings: LiveWire Frontend/Backend Mismatch

**Project:** 36-livewire-frontend-repair
**Date:** January 8, 2026
**Target:** `apps/command-dashboard` (Frontend) & `LifeOS-Core/agents/livewire` (Backend)

## 1. Executive Summary
The LiveWire dashboard in `command-dashboard` is broken because it relies on API endpoints that do not exist or are named differently in the actual running backend. A previous project (`35-livewire-apex-optimization`) claimed to update a Python backend (`agents/python/livewire_intel`), but this directory **does not exist**. The actual backend is TypeScript-based (`agents/livewire`).

## 2. The "Ghost Code" Incident
*   **Claim:** Project 35 implemented semantic search in `livewire_intel/feedback_store.py`.
*   **Reality:** `livewire_intel` directory is missing.
*   **Impact:** Any frontend logic relying on this "new" intelligence layer fails silently or 404s.

## 3. API Mismatch Analysis

| Action | Frontend Call (`LiveWireControl.tsx`) | Backend Handler (`agents/livewire/src/index.ts`) | Status |
| :--- | :--- | :--- | :--- |
| **Approve Lead** | `POST /leads/:id/feedback` | **MISSING** (Has `/leads/:id/outcome` or global `/feedback`) | ❌ BROKEN |
| **Reject Lead** | `POST /leads/:id/feedback` | **MISSING** | ❌ BROKEN |
| **Update Status** | `PATCH /leads/:id/status` | `PATCH /leads/:leadId/status` | ✅ MATCH |
| **Fetch Leads** | `GET /leads` | `GET /leads` | ✅ MATCH |

## 4. Root Cause
The frontend attempts to call `/leads/:id/feedback` to record approvals/rejections. The backend has no such route. It has `/leads/:id/outcome` (for recording final outcomes like 'converted', 'lost') and a global `/feedback` endpoint (for generic user feedback).

## 5. Remediation Plan
1.  **Backend:** Add `POST /leads/:leadId/feedback` to `agents/livewire/src/index.ts` to bridge the gap. It should call `FeedbackEngine.recordFeedback` or map to `OutcomeTracker`.
2.  **Frontend:** Verify `LiveWireControl.tsx` calls the proxy correctly.
3.  **Verification:** Test the Approve/Reject buttons again.

## 6. Files to Modify
*   `LifeOS-Core/agents/livewire/src/index.ts` - Add missing route.
*   `apps/command-dashboard/client/src/components/livewire/LiveWireControl.tsx` - (Optional) Update to use `outcome` endpoint if preferred.
