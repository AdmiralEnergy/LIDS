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

### Phase 4: UI & Access Control (Command Dashboard)
**Goal:** Create the interface for "Human-in-the-Loop" control and ensure strict security.

**UI Requirements:**
- [ ] **Sequential Thinking UI:** Visualizes the agent reasoning chain (e.g., ProductSpecialist -> LeadScout -> TerritoryAnalyst).
- [ ] **Lead Review Card:** Shows the Lead + AI Analysis + Draft Message.
- [ ] **Action Buttons:** [Approve & Send], [Edit], [Reject (with feedback)].

**Access Control & Authentication:**
*   **Auth Provider:** Twenty CRM (via `twenty-crm` app).
*   **Restricted Access:** Only users with `@admiralenergy.ai` email domains can access the dashboard.
*   **Role-Based Config:**
    *   Only specific users (e.g., `nathanielj@admiralenergy.ai`) can configure high-level settings like Lead Sources.
    *   Regular users can only view/approve leads.
*   **API Key (Twenty CRM):**
    *   Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8`
    *   *Security Note:* This key should be stored in `C:\LifeOS\LIDS\apps\command-dashboard\.env` as `VITE_TWENTY_API_KEY`.

**Authentication Logic (Reference `apps/ads-dashboard/twenty-crm`):**
1.  **Login:** User enters email.
2.  **Verification:** Check if email ends in `@admiralenergy.ai`.
3.  **Lookup:** Query Twenty CRM `workspaceMembers` to get `workspaceMemberId`.
4.  **Session:** Store `workspaceMemberId` and `role` in local session.
5.  **Guard:** Middleware prevents access to `/livewire/config` if `role != 'coo' | 'owner'`.
