# LiveWire v3 - Session Notes (December 30, 2025)

## Critical Insight: LiveWire STAYS, Agents EXTEND

**DO NOT replace LiveWire scanner.** The 4 agents extend LiveWire's capabilities:

```
LiveWire (scan) → Intent Analyst (qualify) → DM Crafter (reach out) → Outcomes → ALL agents learn
```

## The 4 Agents + Their Learning Loops

### 1. LIVEWIRE (Existing TypeScript Scanner)
- **Job:** Find Reddit posts matching keywords
- **Learns from:** Which keywords + subreddits produce leads that CONVERT (not just get approved)
- **Feedback:** Conversion data traced back to what LiveWire originally flagged

### 2. INTENT ANALYST (New Python Agent)
- **Job:** Research post context, guess intent, provide reasoning
- **Learns from:** Nate's corrections when AI guesses wrong
- **Feedback:** Phrase → intent mappings ("just installed" = already_bought)

### 3. DM CRAFTER (New Python Agent)
- **Job:** Generate personalized outreach messages for approved leads
- **Learns from:** Reply rates and conversion rates per template/style
- **Feedback:** "Value-add opener + state incentive mention = 25% reply rate"

### 4. SUBREDDIT RESEARCHER (New Python Agent)
- **Job:** Discover goldmine subreddits, track performance
- **Learns from:** Conversion rates by subreddit (not just post volume)
- **Feedback:** "r/homeowners converts 5x better than r/solar"

## The Aggregate Data Store

```sql
lead_journey (
  -- LiveWire found it
  reddit_id, subreddit, matched_keywords, found_at,

  -- Intent Analyst analyzed it
  ai_intent, ai_confidence, ai_reasoning,

  -- Nate reviewed it
  nate_decision,  -- 'approved' | 'denied'
  nate_intent_correction,  -- if AI was wrong
  problem_phrase,  -- if denied, what PHRASE (not keyword)

  -- DM Crafter (only if approved)
  dm_template_used, dm_personalization_style, dm_sent_at,

  -- Outcomes (feeds ALL agents)
  reply_received, converted, deal_value
)
```

## Iron-Clad Feedback Loop

1. Nate sees post + AI research + AI intent guess
2. Approves or Denies
3. If denied: Selects problem PHRASE (not keyword) + correct intent
4. System learns CONTEXT, not just keyword weights
5. Each agent queries aggregate data to improve

## Key Corrections Made This Session

| What I Got Wrong | Correct Understanding |
|------------------|----------------------|
| Replace LiveWire with Python scanner | LiveWire STAYS, agents extend it |
| Only scanner learns | ALL 4 agents have learning loops |
| DM Crafter is "later" | DM Crafter is integral - learns from reply/conversion rates |
| Penalize keywords | Learn PHRASES in context |
| Focus on approval rate | Focus on CONVERSION rate (end of funnel) |

## Empower Context (Secondary)

The Empower product/territory knowledge (from EMPOWER_STUDY_GUIDE.md and PDF) is useful for:
- Territory filtering (23 covered states)
- DM personalization (state-specific incentives)
- Intent refinement (product-aware categories)

But it's NOT the core system - the learning loops are.

## Tomorrow's Task

Rewrite CODEX_IMPLEMENTATION_PLAN.md with:
1. LiveWire integration (not replacement)
2. All 4 agents with their learning loops
3. Aggregate data store schema
4. Iron-clad feedback UI flow
5. How each agent queries data to improve

## Files Referenced

- `C:\LifeOS\Personal-Drive\OneDrive\Shared Resources\Books and Research\Deep Research\Admiral Energy\EMPOWER_STUDY_GUIDE.md`
- `C:\LifeOS\Personal-Drive\OneDrive\Shared Resources\Books and Research\Deep Research\Admiral Energy\Renewable Energy Products 101.pdf`
- Existing LiveWire v2: `/agents/apex/livewire/` on admiral-server:5000
- Frontend: `apps/compass/client/src/pages/livewire.tsx`
