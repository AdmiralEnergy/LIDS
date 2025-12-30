# Project 17: COMPASS Micro-Agents

## Status: PHASE 1 COMPLETE

**Started:** December 29, 2025
**Phase 1 Completed:** December 29, 2025

---

## Summary

Wire COMPASS PWA to micro-agents (Intel, Coach, Guard, Scribe) so reps can execute simple, reliable commands during live sales calls.

**Key Principle:** Simple commands that work > Complex conversations that fail

**Architecture Decision:** Inline micro-agent code into COMPASS (fewer network hops = more reliable during live sales)

---

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Coach agent (objection handling) | COMPLETE |
| Phase 2 | Intel agent (lead enrichment via Scout) | NEXT |
| Phase 3 | Guard agent (TCPA compliance) | PENDING |
| Phase 4 | Scribe agent (CRM logging) | PENDING |

---

## Phase 1: Coach Agent - COMPLETE

### Files Created
- `apps/compass/server/coach.ts` - Objection handling with fuzzy matching
- `apps/compass/server/data/objections.json` - 9 common objections with strategies

### Files Modified
- `apps/compass/server/routes.ts` - Wired `/api/objection` and `/api/suggest-action`

### API Endpoints
```
POST /api/objection
Request: { objection: "too expensive", context?: { previousAttempts: 0 } }
Response: {
  response: "I get that. Most homeowners felt...",
  technique: "Reframe",
  confidence: 0.86,
  followUp: "If the numbers showed a savings..."
}

POST /api/suggest-action
Request: { callState: "discovery", leadData: { status, attempts, lastOutcome } }
Response: {
  action: "probe_bill",
  script: "What did your last electric bill run you roughly?",
  tip: "Anchor on a simple, easy-to-answer question."
}
```

### Objections Supported
1. too_expensive - Reframe (0.86)
2. not_interested - Clarify (0.78)
3. already_have_solar - Expand (0.82)
4. need_to_talk_to_spouse - Schedule (0.80)
5. bad_credit - Reassure (0.74)
6. dont_own_home - Redirect (0.70)
7. roof_concern - Risk Reduce (0.76)
8. utility_rate - Future Pace (0.72)
9. need_to_think - Isolate (0.78)

---

## Phase 2: Intel Agent - NEXT

### Plan
- Call Scout MLS Scanner on admiral-server for property data
- EnrichButton → Scout → Property data (sqft, year built, roof type)
- Note: Scout has reliability issues but works

### Files to Create/Modify
- `apps/compass/server/intel.ts` - Property lookup via Scout
- `apps/compass/server/routes.ts` - Update `/api/enrichment/enrich`

---

## Architecture

```
COMPASS PWA (LIDS)
    │
    ├── LeadSelector → Select lead from Twenty CRM
    ├── EnrichButton → Trigger enrichment
    ├── SuggestedActions → Command options
    └── EnrichmentSummary → Show results
            │
            ▼
    COMPASS Server (LIDS) - INLINE AGENTS
    ├── Coach → Objection handling (WIRED)
    ├── Intel → Scout MLS Scanner (NEXT)
    ├── Guard → TCPA check (PENDING)
    └── Scribe → Twenty CRM logging (PENDING)
```

---

## Context

See: `CONTEXT.md` for the recurring explanation about FieldOps vs Micro-Agents

**Critical Context Saved To:** Guardian memory on admiral-server

---

*Last Updated: December 29, 2025 ~23:30 UTC*
