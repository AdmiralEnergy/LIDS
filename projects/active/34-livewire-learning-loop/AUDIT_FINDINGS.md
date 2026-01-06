# Project 34: LiveWire Learning Loop & Admin Dashboard

## Executive Summary
LiveWire Intelligence currently has a "Write-Only" memory for intent scoring. While we collect user feedback (Approvals/Rejections), the `IntentAnalyst` does not use this data to improve its decision-making. Furthermore, there is no visibility into the system's performance (no Admin Dashboard), and no way to record "No Reply" outcomes, potentially biasing the A/B testing data. This project closes these loops.

## Audit Findings

### 1. Missing Admin Dashboard
- **Status:** `livewire-admin.tsx` does not exist.
- **Impact:** Operators are flying blind. They cannot see which openers are working, what the rejection patterns are, or verify that the system is learning.

### 2. Broken Learning Loop (Intent)
- **Status:** `IntentAnalyst.analyze_with_llm` uses a static prompt.
- **Impact:** The system repeats the same mistakes. Rejected leads are stored but ignored.
- **Fix:** Inject `feedback_store.get_few_shot_examples()` into the LLM prompt.

### 3. Biased A/B Testing (Drafting)
- **Status:** `StyleMemory` tracks "Sent" and "Replied", but "No Reply" is only recorded via a theoretical background job that doesn't exist.
- **Impact:** Styles that are sent 100 times with 0 replies look the same as styles sent 1 second ago.
- **Fix:** Add a UI mechanism (or simple timeout check) to mark old messages as "No Reply".

## Target State
1.  **Frontend:** A new `/livewire-admin` page showing:
    *   Style Performance Table (Reply Rates)
    *   Recent Feedback Log (Approved/Rejected)
    *   System Health Status
2.  **Backend:** `IntentAnalyst` dynamically fetches 3 approved and 3 rejected examples to guide the LLM.
3.  **Data:** A "Mark Ghosted" button or auto-check to clean up old "Sent" records.

## Files to Modify
| File | Impact |
|------|--------|
| `apps/command-dashboard/client/src/pages/livewire-admin.tsx` | **NEW** Admin Dashboard |
| `apps/command-dashboard/client/src/App.tsx` | Add route for admin page |
| `LifeOS-Core/agents/python/livewire_intel/intent_agent.py` | Add few-shot injection |
| `LifeOS-Core/agents/python/livewire_intel/main.py` | Add endpoints for admin data |
