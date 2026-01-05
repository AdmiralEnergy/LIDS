# Project 33: LiveWire Command Dashboard - Go Live

**Status:** IN PROGRESS
**Created:** 2026-01-04
**Owner:** David Edwards

## Objective

Activate LiveWire lead discovery on the Command Dashboard with full AutoGen agent intelligence, replacing mock data with real Reddit scanning and AI-powered lead analysis.

## Current State

### Command Dashboard (Oracle ARM - command.ripemerchant.host)
- UI is complete with mock data
- Tab navigation working (SYSTEM HEALTH | LIVEWIRE INTEL)
- Authentication working via Twenty CRM
- Mock leads display in Discovery Queue
- Sequential Thinking visualization ready
- Lead Review Card with approve/reject ready

### COMPASS (DO Droplet - compass.ripemerchant.host)
- **LIVE** Reddit scanning via LiveWire v1 backend on admiral-server
- Full configuration UI (Settings, Keywords, Subreddits, Learning)
- v2.0 scoring with keyword weights and subreddit tiers
- Human-in-the-loop feedback learning
- 50+ leads already discovered

### LiveWire Backend (admiral-server:5000)
- **RUNNING** - LiveWire v1 MCP agent
- Reddit API integration active
- Lead storage and status tracking
- v2.0 endpoints for keywords, subreddits, context analysis

### LiveWire AutoGen Intelligence (NOT DEPLOYED)
- Python codebase exists: `C:\LifeOS\LifeOS-Core\agents\python\livewire_intel\`
- 4-agent pipeline: ProductSpecialist, LeadScout, TerritoryAnalyst, DraftingAgent
- Style learning and feedback store
- Needs deployment to admiral-server port 5100

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMAND DASHBOARD (Oracle ARM - 100.125.221.62:3104)           │
│  https://command.ripemerchant.host                              │
│                                                                  │
│  ┌──────────────┐  ┌───────────────────┐  ┌──────────────────┐ │
│  │ Discovery    │  │ Sequential        │  │ Lead Review      │ │
│  │ Queue        │  │ Thinking          │  │ Card             │ │
│  │ (leads list) │  │ (agent reasoning) │  │ (approve/reject) │ │
│  └──────────────┘  └───────────────────┘  └──────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ CONFIGURATION TABS (Port from COMPASS)                    │  │
│  │ • Settings: Scanner mode, intervals, notifications        │  │
│  │ • Keywords: Weight management, flagged keywords           │  │
│  │ • Subreddits: Tier management (Active/Test/Retired)       │  │
│  │ • Learning: Metrics, recommendations, thinking logs       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ADMIRAL-SERVER (100.66.42.81)                                  │
│                                                                  │
│  LiveWire v1 (port 5000)          LiveWire Intel (port 5100)   │
│  ┌───────────────────────┐        ┌───────────────────────┐    │
│  │ • Reddit scanning     │        │ • ProductSpecialist   │    │
│  │ • Lead storage        │   ──►  │ • LeadScout           │    │
│  │ • Keyword v2.0        │        │ • TerritoryAnalyst    │    │
│  │ • Subreddit tiers     │        │ • DraftingAgent       │    │
│  │ • Feedback loop       │        │ • Style learning      │    │
│  └───────────────────────┘        └───────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Port COMPASS Settings UI to Command Dashboard | NOT STARTED |
| 2 | Port KeywordManager and SubredditManager components | NOT STARTED |
| 3 | Deploy LiveWire AutoGen Intelligence to admiral-server | NOT STARTED |
| 4 | Connect Command Dashboard to live services | NOT STARTED |
| 5 | Remove mock data, test end-to-end flow | NOT STARTED |

## Key Files

### Command Dashboard (to modify)
- `apps/command-dashboard/client/src/components/livewire/LiveWireControl.tsx` - Main control panel
- `apps/command-dashboard/client/src/pages/dashboard.tsx` - Tab navigation
- `apps/command-dashboard/server/routes.ts` - API proxy routes

### Components to Port from COMPASS
- `apps/compass/client/src/pages/livewire-settings.tsx` - Settings page
- `apps/compass/client/src/components/livewire/KeywordManager.tsx` - Keyword management
- `apps/compass/client/src/components/livewire/SubredditManager.tsx` - Subreddit tier management
- `apps/compass/client/src/components/livewire/LearningDashboard.tsx` - Learning metrics

### Python AutoGen Service
- `LifeOS-Core/agents/python/livewire_intel/` - Full Python package
- `LifeOS-Core/agents/python/livewire_intel/api.py` - FastAPI server (port 5100)

## API Endpoints Needed

Command Dashboard server needs these proxy routes:

### LiveWire v1 (already exists on COMPASS)
```
GET  /api/livewire/leads           - Get all leads
GET  /api/livewire/settings        - Get scanner settings
POST /api/livewire/settings        - Update scanner settings
GET  /api/livewire/v2/keywords     - Get all keywords with scores
POST /api/livewire/v2/keywords/:kw/reset - Reset keyword weight
GET  /api/livewire/v2/subreddits   - Get all subreddits with tiers
POST /api/livewire/v2/subreddits/:name/promote - Promote tier
POST /api/livewire/v2/subreddits/:name/demote  - Demote tier
POST /api/livewire/v2/subreddits/:name/retire  - Retire subreddit
```

### LiveWire AutoGen Intelligence (port 5100)
```
POST /analyze                       - Analyze a post with 4-agent pipeline
POST /feedback                      - Record approval/rejection feedback
GET  /stats                         - Get feedback statistics
GET  /health                        - Service health check
```

## Success Criteria

1. Command Dashboard shows LIVE Reddit leads (not mock data)
2. Sequential Thinking shows REAL agent reasoning chain
3. Settings, Keywords, Subreddits tabs work like COMPASS
4. Approve/Reject feedback trains the system
5. New leads appear automatically via auto-refresh
6. Nate can use command.ripemerchant.host for all LiveWire operations

## Notes

- COMPASS will continue working - this is adding the same functionality to Command Dashboard
- Command Dashboard is for executives (David, Nate) - needs full control surface
- LiveWire v1 backend is already production-proven on COMPASS
- AutoGen Intelligence adds deeper AI reasoning (4-agent pipeline)
