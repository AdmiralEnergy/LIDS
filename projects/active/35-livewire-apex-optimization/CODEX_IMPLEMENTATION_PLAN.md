# Codex Implementation Plan - Project 35

## System Prompt
```
You are the Lead AI Architect for LiveWire.
Your goal is to upgrade the system from "Functional" to "Apex Intelligence".
Focus on Semantic Search, Data Integrity, and Operator Visibility.
```

## Phase 1: Semantic Few-Shot Learning (Python)

### Task 1: Semantic Search Engine
**File:** `LifeOS-Core/agents/python/livewire_intel/feedback_store.py`
- Implement `get_similar_examples(query_text, action, limit=2)`.
- Use `scikit-learn` (TfidfVectorizer) or a simple cosine similarity helper if avoiding heavy deps.
- **Fallback:** If deps missing, fall back to current time-based sort.

### Task 2: Update Intent Analyst
**File:** `LifeOS-Core/agents/python/livewire_intel/intent_agent.py`
- Update `_build_few_shot_section` to take `content` as an argument.
- Call `store.get_similar_examples(content, "approved")` instead of `get_few_shot_examples`.

## Phase 2: "Honest" Attribution (Python)

### Task 3: Diff-Based Recording
**File:** `LifeOS-Core/agents/python/livewire_intel/style_memory.py`
- Update `record_send` to accept `draft_text` and `final_text`.
- Calculate similarity ratio (using `difflib.SequenceMatcher`).
- If ratio < 0.7 (30% changed), swap `style_id` to `"human-override"`.
- Log the "Human Rewrite" event for future analysis.

### Task 4: API Update
**File:** `LifeOS-Core/agents/python/livewire_intel/main.py`
- Update `MessageSentRequest` model to include `draft_text` and `final_text`.
- Pass these to `style_memory`.

## Phase 3: Frontend Visibility (React)

### Task 5: Client Update
**File:** `apps/command-dashboard/client/src/lib/livewireClient.ts`
- Update `recordMessageSent` to send the text payloads.

### Task 6: Ghosted View
**File:** `apps/command-dashboard/client/src/components/livewire/LiveWireControl.tsx`
- Add "Ghosted" to the status filter.
- Fetch leads with `status=no_reply` (requires new endpoint or query param).

## Verification
1.  **Test Semantic:** Analyze a "High Bill" post. Verify logs show "High Bill" examples in prompt.
2.  **Test Attribution:** Draft a message, rewrite it completely, send. Verify DB records `style_id="human-override"`.
3.  **Test UI:** Mark a lead as Ghosted (via Admin). Verify it appears in Ghosted filter.
