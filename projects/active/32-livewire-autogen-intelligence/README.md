# Project 32: LiveWire AutoGen Intelligence

**Status:** PLANNING
**Goal:** Merge Project 23 (Multi-Agent) and Project 24 (Intent Learning) to create a high-performance lead generation agent with a recursive feedback loop.
**Human in the Loop:** Nate (Approver & Process Owner)

---

## 1. Merged Architecture (Hybrid Model)

We will use a **Hybrid Intelligence Architecture** where the existing TypeScript core handles "Heavy Lifting" (APIs, Database, Scanning) and a new Python AutoGen Team handles "Deep Thinking" (Intent, Message Tailoring, Pattern Learning).

### The Intelligence Stack
*   **Controller (TS):** LiveWire v7 Agent (Port 5000). Handles Reddit API (PRAW/MCP), Lead storage (SQLite).
*   **Intelligence Layer (Python):** AutoGen SelectorGroupChat (Port 5100).
*   **Executive Control Plane:** **Command Dashboard** (Oracle Cloud).
    *   **Sequential Thinking UI:** Visualizes the agent reasoning chain (Scout -> Analyst -> Architect).
    *   **Human-in-the-Loop:** Nate approves/rejects leads directly from the Command Tab.
*   **Persistent Memory:** Shared SQLite + TeachableAgent `text_analyzer` backend.

---

## 2. The Feedback Loop (Nate's Workflow)

1.  **Discovery:** TS Agent scans 50+ subreddits.
2.  **Analysis:** Python Agent scores posts 0-100 based on *Learned Intent*.
3.  **Human Review:** Nate sees leads in COMPASS with "Why this is a lead" reasoning.
4.  **Feedback:** 
    *   **Approved:** Python agent reinforces the matched pattern.
    *   **Rejected:** Nate provides a reason (e.g., "Too DIY focused"). Python agent updates its negative-intent model.
5.  **Recursive Update:** Python agent suggests new keywords or subreddits to the TS Scanner to refine the next run.

---

## 3. Lead Data Extraction Plan

Goal: Move from "Reddit Username" to "Twenty CRM Lead".

**Message Strategy (The "Value-First" Hook):**
1.  Acknowledges specific pain point (e.g., "Saw you're dealing with $400 bills in Charlotte").
2.  Offers a state-specific solution (e.g., "NC PowerPair rebate just opened").
3.  Asks for 1 piece of info to "verify eligibility" (Address/Zip).
4.  Once Nate approves the draft, it's sent.
5.  Replies are parsed by the **Scribe Agent** to extract Contact Info for Twenty CRM.

---

## 4. Implementation Phases

### Phase 1: Python Intelligence Core
- [ ] Setup `agents/python/livewire-intel/`
- [ ] Implement `SelectorGroupChat` with 3 specialized agents.
- [ ] Integrate `TeachableAgent` for long-term intent memory.
- [ ] Expose FastAPI endpoints for `/intent/analyze` and `/outreach/draft`.

### Phase 2: TypeScript Bridge
- [ ] Add `LiveWirev3Client` to TS Agent.
- [ ] Update scanning loop to call Python for "Second Opinion" scoring.
- [ ] Implement Nate's feedback relay (COMPASS -> TS -> Python).

### Phase 3: Message Learning
- [ ] Create "Style memory" - Learn which openers get the most replies.
- [ ] Add "Lead Data Parser" - Auto-detect Name/Phone/Address in replies.

---

## 5. Success Criteria
*   **Accuracy:** >85% agreement between Nate and AI Intent Analysis.
*   **Efficiency:** Reduce Nate's manual review time by 70%.
*   **Conversion:** 10% reply rate on outbound DMs.
*   **Coverage:** Active leads found in all 23 Empower states.
