# Project 32: LiveWire AutoGen Intelligence

**Status:** COMPLETE
**Completed:** 2026-01-04
**Goal:** Self-optimizing lead intelligence system with multi-agent AI pipeline for Reddit lead discovery and qualification.
**Human in the Loop:** Nate (Approver & Process Owner)

---

## Summary

LiveWire Intelligence is a self-optimizing lead intelligence system with a multi-agent AI pipeline for Reddit lead discovery and qualification. The system learns from human feedback to continuously improve intent detection and message drafting.

### Key Achievements

1. **Multi-Agent Pipeline** - 4-agent system (ProductSpecialist → LeadScout → TerritoryAnalyst → DraftingAgent)
2. **Pattern + LLM Hybrid** - Pattern matching default with optional Claude 3.5 Sonnet for nuanced analysis
3. **Self-Learning System** - Style memory tracks opener effectiveness with A/B testing
4. **Contact Extraction** - Lead parser auto-extracts name, phone, email, address from replies
5. **Full UI Integration** - SequentialThinking visualization, LeadReviewCard, role-based access

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMMAND DASHBOARD (React UI)                          │
│                    C:\LifeOS\LIDS\apps\command-dashboard                │
│  ├── SequentialThinking UI (visualizes agent reasoning)                 │
│  ├── LeadReviewCard (approve/edit/reject workflow)                      │
│  └── livewireClient.ts (TypeScript bridge to Python API)               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTP /api/livewire/*
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    LIVEWIRE INTELLIGENCE (Python/FastAPI)               │
│                    Port 5100 | C:\LifeOS\LifeOS-Core\agents\python\     │
│                              livewire_intel\                            │
│                                                                          │
│  AGENT PIPELINE:                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ ProductSpecialist│→ │   LeadScout      │→ │ TerritoryAnalyst │      │
│  │ (Knowledge Base) │  │ (Intent 0-100)   │  │ (Location/Rebates)│     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                    │                                     │
│                                    ▼ (if score >= 60)                   │
│                        ┌──────────────────┐                             │
│                        │  DraftingAgent   │                             │
│                        │ (Message Gen)    │                             │
│                        └──────────────────┘                             │
│                                                                          │
│  LEARNING SYSTEMS:                                                       │
│  ├── FeedbackStore (SQLite) - approval/rejection learning               │
│  ├── StyleMemory (SQLite) - message opener effectiveness                │
│  └── LeadParser - auto-extract contact info from replies                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phases Completed

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Python Intelligence Core (4 agents + orchestrator) | ✅ COMPLETE |
| Phase 2 | TypeScript Bridge (livewireClient.ts + proxy routes) | ✅ COMPLETE |
| Phase 3 | Message Learning (StyleMemory + LeadParser) | ✅ COMPLETE |
| Phase 4 | UI & Access Control (SequentialThinking + Auth) | ✅ COMPLETE |

---

## File Structure

### Python Backend (LifeOS-Core)
```
agents/python/livewire_intel/
├── __init__.py              # Package exports
├── main.py                  # FastAPI application (port 5100)
├── orchestrator.py          # Multi-agent pipeline coordinator
├── intent_agent.py          # IntentAnalyst (LeadScout)
├── territory_agent.py       # TerritoryAnalyst
├── drafting_agent.py        # DraftingAgent
├── product_specialist.py    # ProductSpecialist (Knowledge Base)
├── knowledge_base.py        # Knowledge base loader
├── feedback_store.py        # Feedback SQLite storage
├── style_memory.py          # Style tracking SQLite storage
├── lead_parser.py           # Lead data extraction
└── requirements.txt         # Python dependencies
```

### TypeScript Frontend (LIDS)
```
apps/command-dashboard/
├── client/src/
│   ├── lib/
│   │   ├── livewireClient.ts    # TypeScript API client
│   │   └── auth.ts              # Auth utilities
│   ├── providers/
│   │   └── AuthProvider.tsx     # Auth context
│   ├── components/livewire/
│   │   ├── SequentialThinking.tsx
│   │   ├── LeadReviewCard.tsx
│   │   └── LiveWireControl.tsx
│   └── pages/
│       ├── login.tsx
│       └── dashboard.tsx
└── server/
    └── routes.ts                # LiveWire proxy routes
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/analyze` | POST | Full agent pipeline analysis |
| `/feedback` | POST | Record approval/rejection |
| `/stats` | GET | Feedback statistics |
| `/styles/recommend/{category}` | GET | Get recommended opener |
| `/styles/insights` | GET | Style learning insights |
| `/styles/sent` | POST | Record message sent |
| `/styles/reply` | POST | Record reply received |
| `/parse/reply` | POST | Parse reply for contact data |

---

## Success Criteria Met

- [x] **Accuracy:** Pattern matching + optional LLM for >85% agreement target
- [x] **Efficiency:** Automated scoring reduces manual review
- [x] **Conversion:** Style memory tracks and optimizes for reply rates
- [x] **Coverage:** Territory analysis supports all 23 EMPOWER states

---

## Future Enhancements (Not in Scope)

1. **Production Deployment** - Deploy to admiral-server with PM2
2. **UI Enhancements** - Style insights dashboard, A/B test panel
3. **Learning Improvements** - Few-shot LLM prompts, auto-threshold adjustment

---

## Related Documents

- [CODEX_IMPLEMENTATION_PLAN.md](./CODEX_IMPLEMENTATION_PLAN.md) - Detailed implementation steps
