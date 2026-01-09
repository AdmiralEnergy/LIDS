# LiveWire System Audit

**Date:** January 8, 2026
**Subject:** LiveWire Architecture & Frontend/Backend Mismatch

## 1. Executive Summary
LiveWire is a sophisticated AI Sales Agent designed to monitor social platforms (Reddit), qualify leads, and manage a workforce of virtual sub-agents. However, the current implementation suffers from a critical disconnection between the frontend dashboard (`LiveWireControl.tsx`) and the backend service (`agents/livewire`).

The primary issue is a "Ghost Code" incident where a previous optimization project targeted a non-existent Python backend, leaving the actual TypeScript backend out of sync with the frontend's expectations for feedback loops.

## 2. Methodology
*   **Directory Scanning:** Recursive listing of `apps/command-dashboard` and `LifeOS-Core/agents` to map the physical structure.
*   **Code Analysis:** Inspection of `LiveWireControl.tsx` (Frontend), `index.ts` (Backend Entry), and `agent.ts` (Core Logic).
*   **Route Mapping:** Tracing API calls from the React components to the Express backend routes.

## 3. Architecture Overview

### A. Frontend (`apps/command-dashboard`)
*   **Component:** `LiveWireControl.tsx`
*   **Role:** Operator interface for reviewing leads, viewing AI reasoning (Sequential Thinking), and providing feedback.
*   **State:** Relies on a proxy (`/api/livewire/*`) to communicate with the backend.
*   **Key Issue:** Calls specific endpoints (`/leads/:id/feedback`) that do not exist on the backend.

### B. Backend (`LifeOS-Core/agents/livewire`)
*   **Type:** TypeScript / Node.js Service (Port 5000).
*   **Core:** `LiveWireAgent` (extends `APEXBaseAgent`).
*   **Capabilities:**
    *   **Reddit Monitoring:** `reddit-monitor.ts` & `reddit-scanner.ts`
    *   **Lead Scoring:** `lead-scoring.ts`
    *   **Enrichment:** `enrichment/` (Email discovery)
    *   **Social Scanning:** `social/` (Multi-platform support)
*   **Persistence:** Hybrid model using SQLite (`livewire-leads.db`) as SSOT and Supabase/JSONL for legacy support.

## 4. The Mismatch (Root Cause of Broken Feedback)

| Feature | Frontend Call | Backend Reality | Result |
| :--- | :--- | :--- | :--- |
| **Approve Lead** | `POST /leads/:id/feedback` | Endpoint Missing | 404 Error |
| **Reject Lead** | `POST /leads/:id/feedback` | Endpoint Missing | 404 Error |
| **Lead Status** | `PATCH /leads/:id/status` | `PATCH /leads/:leadId/status` | ✅ Compatible |
| **Outcome** | N/A | `POST /leads/:id/outcome` | Unused by UI |

The backend *has* a robust outcome tracking system (`OutcomeTracker`), but the frontend is trying to use a simplified "feedback" endpoint that was likely hallucinated or deprecated.

## 5. Directory Layout & Key Files

```
LifeOS-Core/agents/livewire/
├── src/
│   ├── index.ts              # API Server & Route Definitions
│   ├── agent.ts              # Core Agent Logic & Workforce Management
│   ├── reddit-monitor.ts     # 24/7 Scanning Loop
│   ├── lead-scoring.ts       # Intent & Quality Scoring
│   ├── outcome-tracker.ts    # Learning System (The real feedback engine)
│   ├── persistence/          # Database Layer (SQLite)
│   └── intelligence/         # (Legacy/Confusing) Python scripts mixed in?
└── data/                     # Local SQLite Databases
```

**Note on `intelligence/`:** There is a `livewire/intelligence` folder with Python scripts (`intent_agent.py`, `feedback_store.py`). This suggests a hybrid architecture where TypeScript might call out to Python for ML tasks, or it's a vestige of a previous version. The active server (`index.ts`) is definitely TypeScript.

## 6. Recommendations
1.  **Bridge the API:** Implement the `POST /leads/:leadId/feedback` endpoint in `index.ts` to map the frontend's "Approve/Reject" actions to the backend's `OutcomeTracker`.
2.  **Unify Logic:** Ensure that "Approved" leads are marked as `qualified` in the outcome tracker to train the scoring model.
3.  **Clean Up:** Clarify the role of the Python scripts in `intelligence/`. If they are unused by the TS server, they should be archived to avoid future confusion.
