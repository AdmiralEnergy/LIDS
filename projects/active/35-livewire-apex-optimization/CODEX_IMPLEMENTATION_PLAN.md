# Codex Implementation Plan - Project 35

**STATUS: COMPLETE** (2026-01-06)

## System Prompt
```
You are the Lead AI Architect for LiveWire.
Your goal is to upgrade the system from "Functional" to "Apex Intelligence".
Focus on Semantic Search, Data Integrity, and Operator Visibility.
```

## Phase 1: Semantic Few-Shot Learning (Python) - COMPLETE

### Task 1: Semantic Search Engine - DONE
**File:** `LifeOS-Core/agents/python/livewire_intel/feedback_store.py`
- [x] Implemented `get_similar_examples(query_text, action, limit=2)`.
- [x] Used pure Python TF-IDF (no scikit-learn) with cosine similarity.
- [x] Added functions: `tokenize()`, `compute_tf()`, `compute_idf()`, `compute_tfidf_vector()`, `cosine_similarity()`
- [x] **Fallback:** Falls back to time-based sort on any error.

### Task 2: Update Intent Analyst - DONE
**File:** `LifeOS-Core/agents/python/livewire_intel/intent_agent.py`
- [x] Updated `_build_few_shot_section` to take `content` as an argument.
- [x] Calls `store.get_similar_examples(content, "approved")` for semantic matching.
- [x] Falls back to `get_few_shot_examples` if content is too short.

## Phase 2: "Honest" Attribution (Python) - COMPLETE

### Task 3: Diff-Based Recording - DONE
**File:** `LifeOS-Core/agents/python/livewire_intel/style_memory.py`
- [x] Added `compute_similarity_ratio()` using `difflib.SequenceMatcher`.
- [x] Updated `record_send` to accept `draft_text` and `final_text`.
- [x] If ratio < 0.7 (30% changed), swaps `style_id` to `"human-override"`.
- [x] Logs the "Human Rewrite" event with similarity ratio.
- [x] Constants: `HUMAN_OVERRIDE_THRESHOLD = 0.7`, `HUMAN_OVERRIDE_STYLE_ID = "human-override"`

### Task 4: API Update - DONE
**File:** `LifeOS-Core/agents/python/livewire_intel/main.py`
- [x] Updated `MessageSentRequest` model to include `draft_text` and `final_text`.
- [x] `/styles/sent` endpoint passes these to `style_memory.record_message_sent()`.

## Phase 3: Frontend Visibility (React) - COMPLETE

### Task 5: Client Update - DONE
**File:** `apps/command-dashboard/client/src/lib/livewireClient.ts`
- [x] Updated `recordMessageSent(styleId, leadId, draftText?, finalText?)`.
- [x] Added `markGhostedMessages(daysThreshold)` function.
- [x] Added `GhostedResult` interface.

### Task 6: Ghosted View - DONE
**File:** `apps/command-dashboard/client/src/components/livewire/LiveWireControl.tsx`
- [x] Added `StatusFilter` type: `'new' | 'contacted' | 'ghosted'`
- [x] Added Status filter bar with Ghost icon.
- [x] Filter logic: `no_reply` status = ghosted.
- [x] Uses existing leads API (no new endpoint needed).

## Verification - COMPLETE
1.  [x] **Test Semantic:** `get_similar_examples()` finds contextually relevant examples.
2.  [x] **Test Attribution:** `record_send()` detects rewrites and attributes to `human-override`.
3.  [x] **Test UI:** Ghosted filter button shows leads with `status === 'no_reply'`.
