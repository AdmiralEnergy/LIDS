# Project 35: LiveWire "Apex" Optimization

## Executive Summary
LiveWire is operational but lacks the "Apex" intelligence required for high-efficiency scaling. The current few-shot learning is static (last 2 examples) rather than semantic (most relevant examples). The style attribution is naive (crediting the AI even if the human rewrote the message). The UI obscures "Ghosted" leads, making pipeline management difficult. This project introduces Vector Search for prompts, Diff-based attribution, and full pipeline visibility.

## Audit Findings

### 1. Static Few-Shot Selection (Prompt Bloat)
- **Current:** Fetches the last 2 approved/rejected leads regardless of context.
- **Problem:** If analyzing a "High Bill" post, showing "Battery Backup" examples wastes tokens and distracts the LLM.
- **Solution:** Implement lightweight TF-IDF or Vector embedding similarity to find the *most relevant* past examples.

### 2. Naive Style Attribution
- **Current:** `record_message_sent` blindly credits the style ID associated with the draft.
- **Problem:** If Nate rewrites the entire message, the original style gets credit for a success it didn't earn.
- **Solution:** Calculate Levenshtein distance (or simple diff ratio) between `draft_message` and `final_message`. If similarity < 70%, record as `style-custom` instead of the AI style.

### 3. "Ghosted" Visibility Gap
- **Current:** "No Reply" is a backend status. The UI only shows "New" or "Processed".
- **Problem:** Operators cannot see which leads have ghosted them to decide on follow-up vs. archive.
- **Solution:** Add a "Ghosted" filter to the Lead Queue and a visual indicator for leads that have aged out.

## Target State
1.  **Semantic Prompting:** "This post talks about high bills in Charlotte; here are 2 past Charlotte high-bill approvals."
2.  **Honest Attribution:** "Human rewrote this draft; do not boost the AI style's score."
3.  **Full Pipeline View:** New/Drafted/Sent/Replied/Ghosted status pipeline.

## Files to Modify
| File | Impact |
|------|--------|
| `LifeOS-Core/.../feedback_store.py` | Add similarity search (TF-IDF/Cosine). |
| `LifeOS-Core/.../intent_agent.py` | Use similar examples instead of recent ones. |
| `LifeOS-Core/.../style_memory.py` | Add diff logic to `record_send`. |
| `apps/command-dashboard/.../LiveWireControl.tsx` | Add "Ghosted" filter/view. |
