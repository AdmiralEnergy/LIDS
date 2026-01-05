# Codex Implementation Plan - Project 32: LiveWire AutoGen Intelligence

**Status:** PROJECT COMPLETE | **Completed:** 2026-01-04

## Overview

LiveWire Intelligence is a self-optimizing lead intelligence system with a multi-agent AI pipeline for Reddit lead discovery and qualification. The system learns from human feedback to continuously improve intent detection and message drafting.

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

## Workflow Task List

### Phase 1: Python Intelligence Core ✅ COMPLETE

- [x] Initialize Python VirtualEnv in `agents/python/livewire_intel`
- [x] Implement `ProductSpecialist` with Knowledge Base ingestion
  - `product_specialist.py` - Parses NC battery storage showdown document
  - Extracts products, rebates, competitive insights from knowledge base
- [x] Implement `IntentAnalyst` (LeadScout)
  - `intent_agent.py` - Pattern matching (default) + optional LLM mode
  - Scores 0-100 with pain points, urgency, disqualifiers
  - LLM mode uses Claude 3.5 Sonnet for nuanced analysis
- [x] Implement `TerritoryAnalyst`
  - `territory_agent.py` - Location detection, rebate matching
  - EMPOWER states, NC PowerPair, utility programs
- [x] Implement `DraftingAgent`
  - `drafting_agent.py` - Personalized Reddit DM generation
  - Template-based with hooks, CTAs, personalization
- [x] Implement `Orchestrator`
  - `orchestrator.py` - Coordinates 4-agent pipeline
  - Early exit if intent < 60, builds thought trace
- [x] Expose FastAPI endpoints
  - `POST /analyze` - Full pipeline analysis
  - `POST /feedback` - Record approval/rejection
  - `GET /stats` - Feedback statistics
  - `GET /health` - Health check

### Phase 2: TypeScript Bridge ✅ COMPLETE

- [x] Add `LiveWireClient` to Command Dashboard
  - Location: `apps/command-dashboard/client/src/lib/livewireClient.ts`
  - Note: The plan originally mentioned `agents/apex/livewire/src/intelligence-bridge.ts` but the actual implementation is in the command-dashboard, which is the correct location since that's where the UI lives.
- [x] Implement server-side proxy routes
  - Location: `apps/command-dashboard/server/routes.ts`
  - Routes: `/api/livewire/analyze`, `/api/livewire/feedback`, `/api/livewire/stats`, `/api/livewire/health`
- [x] Add Twenty CRM GraphQL proxy for auth
  - Route: `/api/twenty/graphql`

### Phase 3: Message Learning ✅ COMPLETE

- [x] Create "Style memory" - Learn which openers get the most replies
  - `style_memory.py` - SQLite storage for message style tracking
  - Tracks: times_used, times_replied, times_converted, avg_reply_time
  - A/B testing: 70% best performer, 30% exploration
  - API endpoints:
    - `GET /styles/recommend/{category}` - Get recommended opener
    - `GET /styles/insights` - Learning insights
    - `GET /styles/stats` - Statistics by category
    - `POST /styles/sent` - Record message sent
    - `POST /styles/reply` - Record reply received
- [x] Add "Lead Data Parser" - Auto-detect Name/Phone/Address in replies
  - `lead_parser.py` - Regex + optional LLM parsing
  - Extracts: name, phone, email, address, appointment preferences
  - API endpoint: `POST /parse/reply`
- [x] Update TypeScript client with Phase 3 functions
  - `getRecommendedStyle()`, `getStyleInsights()`, `getStyleStats()`
  - `recordMessageSent()`, `recordReplyReceived()`
  - `parseReply()`

### Phase 4: UI & Access Control ✅ COMPLETE

- [x] **Sequential Thinking UI** - Visualizes agent reasoning chain
  - `SequentialThinking.tsx` - Shows ProductSpecialist → LeadScout → TerritoryAnalyst → DraftingAgent
- [x] **Lead Review Card** - Shows Lead + AI Analysis + Draft Message
  - `LeadReviewCard.tsx` - Split view with edit capability
- [x] **Action Buttons** - [Approve & Send], [Edit], [Reject (with feedback)]
  - Integrated in LeadReviewCard with feedback modal
- [x] **Auth Provider** - Twenty CRM integration with domain guard (@admiralenergy.ai)
  - `AuthProvider.tsx`, `auth.ts` - Role-based access control
- [x] **Role-Based Config** - owner/coo/admin/standard roles
  - nathanielj@admiralenergy.ai = COO (full access)
  - Other @admiralenergy.ai emails = standard (approve/reject only)

## File Structure

```
LifeOS-Core/agents/python/livewire_intel/
├── __init__.py              # Package exports
├── main.py                  # FastAPI application (port 5100)
├── orchestrator.py          # Multi-agent pipeline coordinator
├── intent_agent.py          # IntentAnalyst (LeadScout)
├── territory_agent.py       # TerritoryAnalyst
├── drafting_agent.py        # DraftingAgent
├── product_specialist.py    # ProductSpecialist (Knowledge Base)
├── knowledge_base.py        # Knowledge base loader
├── feedback_store.py        # Feedback SQLite storage
├── style_memory.py          # Style tracking SQLite storage (Phase 3)
├── lead_parser.py           # Lead data extraction (Phase 3)
├── requirements.txt         # Python dependencies
└── data/                    # SQLite databases (auto-created)
    ├── feedback.db
    └── style_memory.db

LIDS/apps/command-dashboard/
├── client/src/
│   ├── lib/
│   │   ├── livewireClient.ts    # TypeScript API client
│   │   └── auth.ts              # Auth utilities
│   ├── providers/
│   │   └── AuthProvider.tsx     # Auth context
│   ├── components/livewire/
│   │   ├── SequentialThinking.tsx
│   │   └── LeadReviewCard.tsx
│   └── pages/
│       ├── login.tsx
│       └── dashboard.tsx
└── server/
    └── routes.ts                # LiveWire proxy routes
```

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/analyze` | POST | Full agent pipeline analysis |
| `/feedback` | POST | Record approval/rejection |
| `/stats` | GET | Feedback statistics |
| `/patterns/rejected` | GET | Rejection patterns for learning |
| `/patterns/approved` | GET | Approval patterns |
| `/styles/recommend/{category}` | GET | Get recommended opener |
| `/styles/insights` | GET | Style learning insights |
| `/styles/stats` | GET | Style stats by category |
| `/styles/sent` | POST | Record message sent |
| `/styles/reply` | POST | Record reply received |
| `/parse/reply` | POST | Parse reply for contact data |

## Testing

```bash
# Start the Python service
cd C:\LifeOS\LifeOS-Core\agents\python
pip install -r livewire_intel/requirements.txt
uvicorn livewire_intel.main:app --host 0.0.0.0 --port 5100 --reload

# Test health check
curl http://localhost:5100/health

# Test analyze endpoint
curl -X POST http://localhost:5100/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Looking for solar recommendations in Charlotte",
    "content": "Just bought a home and Duke Energy bills are crazy high. Any suggestions?",
    "subreddit": "r/Charlotte",
    "author": "SolarSeeker704"
  }'

# Test style recommendation
curl http://localhost:5100/styles/recommend/high_bills

# Test reply parsing
curl -X POST http://localhost:5100/parse/reply \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hey! I am John Smith, you can reach me at (704) 555-1234 or john.smith@email.com",
    "use_llm": false
  }'
```

## Decision Log

### IntentAnalyst: Pattern Matching vs LLM

**Decision:** Pattern matching as default, LLM as optional enhancement

**Rationale:**
- Pattern matching is fast, deterministic, and cost-free
- Covers common solar buying intent signals effectively
- LLM mode available for borderline cases (scores around 55-65)
- LLM mode uses Claude 3.5 Sonnet when API key available
- Falls back to pattern matching if LLM unavailable

### TypeScript Bridge Location

**Decision:** `apps/command-dashboard/client/src/lib/livewireClient.ts`

**Rationale:**
- The plan mentioned `agents/apex/livewire/src/intelligence-bridge.ts`
- Actual implementation is in command-dashboard (correct location)
- This is where the UI lives, so the client belongs here
- Server proxies requests to Python service at port 5100

## Next Steps (Future Phases)

1. **Production Deployment**
   - Deploy Python service to admiral-server
   - Configure Tailscale for secure access
   - Add PM2 process management

2. **UI Enhancements**
   - Style insights dashboard
   - Reply parsing preview in UI
   - A/B test configuration panel

3. **Learning Improvements**
   - Integrate few-shot examples into LLM prompts
   - Auto-adjust intent thresholds based on feedback
   - Personalization based on subreddit patterns
