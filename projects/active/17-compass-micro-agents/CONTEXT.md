# COMPASS Micro-Agents - Critical Context

**Saved:** December 29, 2025
**Source:** David's recurring explanation (exhausting to repeat)

---

## The Core Problem

Complex agents ≠ reliable agents during live sales calls.

Each human rep is paired with a FieldOps AI, but FieldOps have become too complex with too many tools to trust during high-pressure sales situations.

---

## The Two-Tier Solution

### Tier 1: COMPASS Micro-Agents (Simple, Reliable, Task-Specific)

**Purpose:** Useful during sales schedule
**Location:** COMPASS PWA
**Interaction:** User selects command, agent executes

Example: Lead Enrichment
- User sees lead list
- User says "enrich lead"
- Selects which enrichment command:
  - Estimate bill (from sq footage)
  - Find utility provider (from zip code)
  - Estimate roof age (from property records)
- Micro-agent attempts to gather info

**Key:** Pre-programmed commands, not conversational. Just works.

### Tier 2: Telegram FieldOps (Conversational, Relationship-Building)

**Purpose:** Build relationship over time, learn partner, coach on sales skills
**Location:** Telegram bots
**Interaction:** Conversation-first, memory agents

---

## Why This Split Matters

| Agent Type | Problem |
|------------|---------|
| Conversational but NOT useful | Human disengages quickly (like talking to someone who only knows shapes) |
| Useful but NOT conversational | Just a tool, no attachment (like a graphing calculator) |
| **BOTH useful AND conversational** | FieldOps goal - but TOO complex for live sales |

**Solution:**
- Micro-agents = useful (COMPASS, during sales)
- FieldOps = conversational first (Telegram, relationship building)

---

## Current State

### LifeOS-Core Micro-Agents (compass-agents package)

| Agent | File | Capabilities |
|-------|------|--------------|
| **Intel** | `intel.ts` | Property lookup (RentCast), solar potential, roof age estimate |
| **Coach** | `coach.ts` | Script coaching |
| **Guard** | `guard.ts` | Compliance checking |
| **Scribe** | `scribe.ts` | Documentation |

### COMPASS UI (already scaffolded)

- `EnrichButton.tsx` - Trigger enrichment
- `EnrichmentSummary.tsx` - Show results
- `LeadSelector.tsx` - Select lead to enrich
- `SuggestedActions.tsx` - Command options
- `ChatInterface.tsx` - Agent interaction

---

## What Needs to Happen

1. Wire COMPASS UI to micro-agents backend
2. Make "enrich lead" work end-to-end
3. Simple command selection, not complex conversation
4. Reliable during live sales calls

---

## FieldOps Evolution Note

FieldOps agents got developed MORE instead of stripped down:
- Scout has MLS Scanner
- Trainer has RedHawk Integration
- etc.

Decision: Keep them conversational-first in Telegram. Prove the relationship, then add utility later.

---

**This context is recurring and exhausting to repeat. Reference this file.**
