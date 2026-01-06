# Project 33: LiveWire Feedback Loop & Override System

## Executive Summary
The current LiveWire system has a "hard exit" logic where leads with an intent score < 60 are discarded immediately. This prevents humans from identifying "False Negatives" (good leads that the AI missed). We need to implement a "Force Override" capability that allows a human to force the agents to draft a message even for low-scoring leads, thereby teaching the system.

## Current State Analysis
### 1. Backend (`orchestrator.py`)
- **Logic:** `if not is_lead: return ...`
- **Issue:** No parameter exists to bypass this check.
- **Result:** Downstream agents (Territory, Drafting) never run for low scores.

### 2. Frontend (`LeadReviewCard.tsx`)
- **Logic:** If `draftMessage` is missing, it shows an "AlertCircle" icon.
- **Issue:** No buttons available to trigger an action.
- **Result:** User is dead-ended.

### 3. Persistence (`SQLite`)
- **Status:** Files live in `agents/python/livewire_intel/data/`.
- **Requirement:** Ensure these persist across deployments.

## Target State
1. **Backend:** Update `analyze` endpoint to accept `force_execution=boolean`.
2. **Frontend:** Add "Override Rejection & Draft" button to the "Filtered" state.
3. **Learning:** When an override happens, log it as a specific "Correction" event in `feedback.db`.

## Files to Modify
| File | Impact |
|------|--------|
| `LifeOS-Core/.../orchestrator.py` | Add `force` param to ignore threshold. |
| `LifeOS-Core/.../main.py` | Update API model to accept `force`. |
| `apps/command-dashboard/.../LeadReviewCard.tsx` | Add Override UI state. |
| `apps/command-dashboard/.../livewireClient.ts` | Update client to send `force` flag. |
