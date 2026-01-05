# Codex Implementation Plan - Project 31

## 1. Python Infrastructure (The Intelligence Layer)

**File:** `agents/python/livewire-intel/main.py`
**Goal:** Create the FastAPI entry point for intelligence calls.

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="LiveWire Intelligence")

class IntentRequest(BaseModel):
    title: string
    content: string
    subreddit: string

@app.post("/analyze")
async def analyze_intent(req: IntentRequest):
    # Call AutoGen GroupChat here
    # Return {intent, score, reasoning, draft_message}
    pass

@app.post("/feedback")
async def process_feedback(post_id: str, feedback: str, approved: bool):
    # Teach TeachableAgent why this was good/bad
    pass
```

## 2. The AutoGen Team (The Deep Thinkers)

**File:** `agents/python/livewire_intel/team.py`

*   **LeadScout:** (TeachableAgent) Main intent analyzer.
*   **TerritoryAnalyst:** Expert in NC, FL, TX, etc. (Empower 23 states).
*   **DraftingAgent:** Specialized in conversion-copywriting.
*   **ProductSpecialist:** (New) Knowledge Base agent ingesting `North Carolina battery storage showdown.md`. Expert on Enphase/Tesla/FranklinWH comparisons and rebates.

## 3. The TypeScript Bridge (The Operator)

**File:** `agents/apex/livewire/src/intelligence-bridge.ts`

```typescript
export async function getDeepAnalysis(post: any) {
  const res = await fetch('http://localhost:5100/analyze', {
    method: 'POST',
    body: JSON.stringify(post)
  });
  return res.json();
}
```

## 4. Workflow Task List

### Phase 1: Python Intelligence Core
- [x] Initialize Python VirtualEnv in `agents/python/livewire_intel`.
- [x] Implement `ProductSpecialist` with Knowledge Base ingestion.
- [ ] Implement `IntentAnalyst` with Claude 3.5 Sonnet.
- [ ] Expose FastAPI endpoints for `/intent/analyze` and `/outreach/draft`.

### Phase 2: TypeScript Bridge
- [ ] Add `LiveWirev3Client` to TS Agent.
- [ ] Update scanning loop to call Python for "Second Opinion" scoring.
- [ ] Implement Nate's feedback relay (COMPASS -> TS -> Python).

### Phase 3: Message Learning
- [ ] Create "Style memory" - Learn which openers get the most replies.
- [ ] Add "Lead Data Parser" - Auto-detect Name/Phone/Address in replies.

### Phase 4: UI & Access Control (Command Dashboard) - COMPLETED
**Goal:** Create the interface for "Human-in-the-Loop" control and ensure strict security.

- [x] **Sequential Thinking UI:** Visualizes the agent reasoning chain (e.g., ProductSpecialist -> LeadScout -> TerritoryAnalyst).
- [x] **Lead Review Card:** Shows the Lead + AI Analysis + Draft Message.
- [x] **Action Buttons:** [Approve & Send], [Edit], [Reject (with feedback)].

**Access Control & Authentication:**
*   [x] **Auth Provider:** Twenty CRM integration with domain guard (@admiralenergy.ai).
*   [x] **Role-Based Config:** Implemented roles for owner, coo, admin, and standard users.
*   [x] **API Key (Twenty CRM):** Stored in `.env`.
*   [x] **Server Proxy:** GraphQL proxy implemented in `server/routes.ts`.
