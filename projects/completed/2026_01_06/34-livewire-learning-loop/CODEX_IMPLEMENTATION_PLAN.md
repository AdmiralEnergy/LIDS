# Codex Implementation Plan - Project 34

## Status: ✅ COMPLETE
**Completed:** 2026-01-06

## System Prompt
```
You are a Senior Full-Stack Engineer. Your goal is to "Close the Loop" on the LiveWire AI system.
Currently, it collects feedback but doesn't learn from it.
You will build the Admin Dashboard (Frontend) and inject feedback into the AI Prompt (Backend).
```

---

## Phase 1: Backend "Few-Shot" Injection (Python) ✅

### Task 1: Update Intent Analyst ✅
**File:** `LifeOS-Core/agents/python/livewire_intel/intent_agent.py`
- [x] Import `get_feedback_store`.
- [x] Added `_build_few_shot_section()` method (lines 305-344)
- [x] In `analyze_with_llm`, call `store.get_few_shot_examples("approved", limit=2)` and `get_few_shot_examples("rejected", limit=2)`.
- [x] Format these examples into the System Prompt:
  ```text
  Here are examples of leads we APPROVED (these are GOOD leads):
  ...
  Here are examples of leads we REJECTED (avoid these patterns):
  ...
  ```

### Task 2: Add Admin Endpoints ✅
**File:** `LifeOS-Core/agents/python/livewire_intel/main.py`
- [x] `GET /stats` (Already exists, verified)
- [x] `GET /styles/stats` (Already exists, verified)
- [x] `POST /styles/mark_ghosted` (New endpoint, lines 376-441)
    - Accepts `days_threshold` parameter (default: 7)
    - Marks all `sent` outcomes older than threshold as `no_reply`
    - Returns count of marked messages

---

## Phase 2: Frontend Dashboard (React) ✅

### Task 3: Create Admin Page ✅
**File:** `apps/command-dashboard/client/src/pages/livewire-admin.tsx`
- [x] **Layout:** 2-Column Grid
- [x] **Left Col (Style Intelligence):**
    - Table showing: Category | Styles | Sent | Replied | Rate %
    - Color-coded rate badges (green ≥30%, yellow ≥15%, red <15%)
    - Ghostbuster cleanup button integrated
- [x] **Right Col (System Health & Feedback):**
    - Feedback Overview (Total, Approved, Rejected counts)
    - Approval Rate progress bar
    - "Top Rejection Reasons" list
    - "Recent Overrides" list (few-shot examples being used)

### Task 4: Route Registration ✅
**File:** `apps/command-dashboard/client/src/components/livewire/LiveWirePanel.tsx`
- [x] Added "ADMIN" tab to LiveWire panel navigation
- [x] Tab visible only to users with `canConfigure` permission
- [x] Renders `<LiveWireAdminPage />` component

---

## Phase 3: "No Reply" Cleanup ✅

### Task 5: The "Ghostbuster" Button ✅
**File:** `apps/command-dashboard/client/src/pages/livewire-admin.tsx`
- [x] Added "Run Cleanup" button with Ghost icon
- [x] Connects to `POST /styles/mark_ghosted`
- [x] Shows result message after cleanup
- [x] Auto-refreshes stats after cleanup completes

---

## Verification Steps

1. **Check Prompt:** Run `analyze_with_llm` - logs should show few-shot examples in the prompt when feedback exists
2. **Check Dashboard:** Navigate to LIVEWIRE INTEL → ADMIN tab to see real data
3. **Check Cleanup:** Click "Run Cleanup" button, verify message counts update

---

## Files Modified

| File | Changes |
|------|---------|
| `LifeOS-Core/agents/python/livewire_intel/intent_agent.py` | Added `_build_few_shot_section()`, modified `analyze_with_llm()` |
| `LifeOS-Core/agents/python/livewire_intel/main.py` | Added `POST /styles/mark_ghosted` endpoint |
| `LIDS/apps/command-dashboard/client/src/pages/livewire-admin.tsx` | New file - Admin dashboard |
| `LIDS/apps/command-dashboard/client/src/components/livewire/LiveWirePanel.tsx` | Added ADMIN tab |
