# Codex Implementation Plan - Project 34

## System Prompt
```
You are a Senior Full-Stack Engineer. Your goal is to "Close the Loop" on the LiveWire AI system.
Currently, it collects feedback but doesn't learn from it.
You will build the Admin Dashboard (Frontend) and inject feedback into the AI Prompt (Backend).
```

## Phase 1: Backend "Few-Shot" Injection (Python)

### Task 1: Update Intent Analyst
**File:** `LifeOS-Core/agents/python/livewire_intel/intent_agent.py`
- Import `get_feedback_store`.
- In `analyze_with_llm`, call `store.get_few_shot_examples("approved", limit=2)` and `get_few_shot_examples("rejected", limit=2)`.
- Format these examples into the System Prompt:
  ```text
  Here are examples of leads we APPROVED:
  ...
  Here are examples of leads we REJECTED:
  ...
  ```

### Task 2: Add Admin Endpoints
**File:** `LifeOS-Core/agents/python/livewire_intel/main.py`
- Ensure endpoints exist for:
    - `GET /stats` (Already exists, verify it returns what we need)
    - `GET /styles/stats` (Already exists)
    - `POST /styles/mark_ghosted` (New: mark messages > 7 days old as 'no_reply')

## Phase 2: Frontend Dashboard (React)

### Task 3: Create Admin Page
**File:** `apps/command-dashboard/client/src/pages/livewire-admin.tsx`
- **Layout:** 2-Column Grid.
- **Left Col (Style Intelligence):**
    - Table showing: Category | Opener | Sent | Replied | Rate %
    - Sortable headers.
- **Right Col (System Health & Feedback):**
    - "Recent Overrides" list (fetch from feedback store).
    - "Top Rejection Reasons" chart/list.

### Task 4: Route Registration
**File:** `apps/command-dashboard/client/src/App.tsx` (or `main.tsx` / `router.tsx`)
- Add route: `<Route path="/livewire/admin" element={<LiveWireAdmin />} />`
- Add link in the main Sidebar or Header.

## Phase 3: "No Reply" Cleanup

### Task 5: The "Ghostbuster" Button
**File:** `apps/command-dashboard/client/src/pages/livewire-admin.tsx`
- Add a button: "Run Cleanup (Mark old messages as No Reply)"
- Connects to `POST /styles/mark_ghosted`.
- This ensures our A/B test data remains accurate without complex cron jobs.

## Verification
1.  **Check Prompt:** Logs should show the LLM prompt now contains previous examples.
2.  **Check Dashboard:** Navigate to `/livewire/admin` and see real data.
3.  **Check Cleanup:** Click "Run Cleanup" and verify "Sent" counts decrease and "No Reply" counts increase in DB.
