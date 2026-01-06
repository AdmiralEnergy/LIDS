# Codex Implementation Plan - Project 33

## System Prompt
```
You are an expert Full-Stack Architect specializing in "Human-in-the-Loop" AI systems.
Your goal is to fix a critical UX flaw where users cannot override AI false negatives.

Context:
- Backend: Python/FastAPI (LifeOS-Core)
- Frontend: React/Vite (Command Dashboard)
- Database: SQLite (Server-side)

Priority: Frontend User Experience (Clear buttons, immediate feedback).
```

## Phase 1: Backend Override Logic (Python)

### Task 1: Update Orchestrator
**File:** `LifeOS-Core/agents/python/livewire_intel/orchestrator.py`
- Modify `analyze_post` to accept `force_execution: bool = False`.
- Change logic: `if not is_lead and not force_execution: return ...`
- If forced, ensure `is_lead` is set to `True` in the final output (or a new `is_overridden` flag).

### Task 2: Update API Endpoint
**File:** `LifeOS-Core/agents/python/livewire_intel/main.py`
- Update `PostRequest` pydantic model to include `force: Optional[bool] = False`.
- Pass this flag to the orchestrator.

## Phase 2: Frontend Bridge (TypeScript)

### Task 3: Update Client
**File:** `apps/command-dashboard/client/src/lib/livewireClient.ts`
- Update `analyzePost` interface to accept `force?: boolean`.

## Phase 3: UX "Override" Features (React)

### Task 4: Enhance LeadReviewCard
**File:** `apps/command-dashboard/client/src/components/livewire/LeadReviewCard.tsx`
- **Current:** Shows "No draft generated" empty state.
- **New:**
    - If `!draftMessage`, show a prominent button: **[ ⚠️ Override AI & Generate Draft ]**
    - Clicking this triggers `onAnalyze(..., { force: true })`.
    - Add a loading state during this regeneration.

### Task 5: Learning Dashboard (The "Directory")
**File:** `apps/command-dashboard/client/src/pages/livewire-admin.tsx` (New Page)
- Create a simple admin view to see:
    1.  **Style Stats:** Which openers are working? (Table view).
    2.  **Feedback Log:** Recent overrides and rejections.
    3.  **Connection Status:** Verify backend DB is reachable.

## Verification
1. Open Command Dashboard.
2. Find a low-scoring lead (Score < 60).
3. Verify "Override" button appears.
4. Click "Override".
5. Verify Agents 3 (Territory) and 4 (Drafting) run.
6. Verify a Draft appears.
7. Approve the Draft.
8. Verify it saves to `feedback.db`.
