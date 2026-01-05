# Project 33: LiveWire Command Dashboard - Go Live

**Status:** COMPLETE
**Created:** 2026-01-04
**Completed:** 2026-01-05
**Owner:** David Edwards

## Objective

Activate LiveWire lead discovery on the Command Dashboard with full configuration UI, replacing mock data with real Reddit scanning.

## What Was Delivered

### Command Dashboard (Oracle ARM - command.ripemerchant.host)

**LIVE Features:**
- Real-time Reddit leads from LiveWire v1 backend
- Lead review with approve/reject functionality
- Sequential Thinking visualization showing agent reasoning
- Auto-refresh every 60 seconds
- Connection status indicator

**Configuration Tabs (for executives):**
- **LEADS** - Review and approve/reject discovered leads
- **KEYWORDS** - View/manage keyword weights and performance
- **SUBREDDITS** - Manage subreddit tiers (Active/Test/Retired)

### API Proxy Routes Added

All LiveWire v1 endpoints proxied through Command Dashboard server:
```
GET  /api/livewire/leads                    - Fetch all leads
GET  /api/livewire/settings                 - Get scanner settings
POST /api/livewire/settings                 - Update scanner settings
GET  /api/livewire/v2/keywords              - Get keywords with scores
POST /api/livewire/v2/keywords/:kw/reset    - Reset keyword weight
GET  /api/livewire/v2/subreddits            - Get subreddits with tiers
POST /api/livewire/v2/subreddits/:name/promote - Promote tier
POST /api/livewire/v2/subreddits/:name/demote  - Demote tier
POST /api/livewire/v2/subreddits/:name/retire  - Retire subreddit
PATCH /api/livewire/leads/:id/status        - Update lead status
POST /api/livewire/leads/:id/feedback       - Record feedback
POST /api/livewire/scan                     - Trigger manual scan
GET  /api/livewire/scanner-status           - Get scanner status
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMAND DASHBOARD (Oracle ARM - 100.125.221.62:3104)           │
│  https://command.ripemerchant.host                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ LiveWire Panel                                            │  │
│  │ ┌─────────┐ ┌──────────┐ ┌────────────┐                  │  │
│  │ │ LEADS   │ │ KEYWORDS │ │ SUBREDDITS │  (tab navigation)│  │
│  │ └─────────┘ └──────────┘ └────────────┘                  │  │
│  │                                                           │  │
│  │ ┌──────────────┐ ┌───────────────┐ ┌──────────────────┐ │  │
│  │ │ Discovery    │ │ Sequential    │ │ Lead Review      │ │  │
│  │ │ Queue        │ │ Thinking      │ │ Card             │ │  │
│  │ └──────────────┘ └───────────────┘ └──────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Tailscale (100.66.42.81)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ADMIRAL-SERVER                                                  │
│                                                                  │
│  LiveWire v1 (port 5000)                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Reddit scanning           • Keyword v2.0 scoring        │  │
│  │ • Lead storage              • Subreddit tier management   │  │
│  │ • Status tracking           • Feedback learning           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Phases Completed

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Add LiveWire v1 API proxy routes | COMPLETE |
| 2 | Connect LiveWireControl to live API | COMPLETE |
| 3 | Remove mock data mode | COMPLETE |
| 4 | Port KeywordManager component | COMPLETE |
| 5 | Port SubredditManager component | COMPLETE |
| 6 | Add tab navigation for configuration | COMPLETE |
| 7 | Deploy and verify | COMPLETE |

## Files Changed

### New Components
- `apps/command-dashboard/client/src/components/livewire/LiveWirePanel.tsx` - Tab container
- `apps/command-dashboard/client/src/components/livewire/KeywordManager.tsx` - Keyword management
- `apps/command-dashboard/client/src/components/livewire/SubredditManager.tsx` - Subreddit tiers

### Modified
- `apps/command-dashboard/server/routes.ts` - Added 15+ proxy routes
- `apps/command-dashboard/client/src/components/livewire/LiveWireControl.tsx` - Live API integration
- `apps/command-dashboard/client/src/pages/dashboard.tsx` - Use LiveWirePanel
- `apps/command-dashboard/client/src/components/chat/DeepSeekChat.tsx` - Removed mock mode
- `apps/command-dashboard/client/src/components/grid/GridStatusPanel.tsx` - Removed mock mode
- `apps/command-dashboard/client/src/components/infra/InfraHealthPanel.tsx` - Removed mock mode

## Success Criteria Met

- [x] Command Dashboard shows LIVE Reddit leads (not mock data)
- [x] Keywords tab shows all keywords with performance metrics
- [x] Subreddits tab shows tier management controls
- [x] Approve/Reject feedback updates lead status
- [x] New leads appear automatically via auto-refresh (60s)
- [x] Nate can use command.ripemerchant.host for LiveWire operations

## Future Work

- **LiveWire AutoGen Intelligence (port 5100)** - 4-agent pipeline for deeper analysis
  - Python codebase exists: `LifeOS-Core/agents/python/livewire_intel/`
  - Would add: ProductSpecialist, LeadScout, TerritoryAnalyst, DraftingAgent
  - This is a separate project when deeper AI reasoning is needed
