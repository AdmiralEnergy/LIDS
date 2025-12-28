# Project 8: LIDS Reorganization

## Status: COMPLETE

**Started:** December 28, 2025
**Completed:** December 28, 2025

---

## Summary

Reorganize the LIDS monorepo to support multiple dashboards by function (Sales, Studio, Training) with a shared COMPASS core that can be customized per dashboard context.

## Problem

1. **Leigh needs a Marketing Dashboard** - Currently forced to use ADS (sales-focused) to access Sarai/Muse agents
2. **COMPASS is monolithic** - No way to customize COMPASS for different user contexts (sales vs marketing)
3. **No Studio Dashboard** - Marketing team has no dedicated workspace for ComfyUI, content generation, campaigns

## Solution

### Target Architecture

```
LIDS/
├── apps/
│   ├── ads-dashboard/        # Sales (keep as-is, rename internally)
│   ├── studio-dashboard/     # Marketing (NEW for Leigh)
│   └── redhawk-academy/      # Training (keep as-is)
│
├── packages/
│   ├── compass-core/         # Shared: chat UI, agent connection, message handling
│   ├── compass-sales/        # Sales: objection handling, lead lookup, dialer
│   ├── compass-studio/       # Marketing: Sarai, Muse, ComfyUI prompts
│   └── twenty-integration/   # Shared CRM data layer
│
└── tools/
    └── twenty-crm/           # Central hub (Docker instance on droplet)
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| COMPASS as packages | Enables import into any dashboard with context-specific features |
| Twenty CRM as hub | All dashboards share customer/lead data |
| Studio separate from ADS | Marketing doesn't need dialer; Sales doesn't need ComfyUI |
| packages/compass-core | Reusable chat UI, agent WebSocket, message history |

---

## Phases

| Phase | Feature | Priority | Status |
|-------|---------|----------|--------|
| 1 | Extract compass-core package | HIGH | **COMPLETE** |
| 2 | Create studio-dashboard shell | HIGH | **COMPLETE** |
| 3 | Create compass-studio package | MEDIUM | **COMPLETE** |
| 4 | Wire compass-core into studio | MEDIUM | **COMPLETE** |
| 5 | Create compass-sales package | LOW | **COMPLETE** |
| 6 | Refactor ads-dashboard to use compass-core | LOW | Deferred (ADS works as-is) |

---

## Files

| File | Description |
|------|-------------|
| [AUDIT_FINDINGS.md](AUDIT_FINDINGS.md) | Current state analysis, files involved |
| [CODEX_IMPLEMENTATION_PLAN.md](CODEX_IMPLEMENTATION_PLAN.md) | Phased execution prompt |

---

## Dependencies

- Twenty CRM running on droplet (existing)
- COMPASS agents on admiral-server (existing: 4098)
- Sarai agent for Studio (existing: 4065)
- Muse agent for Studio (to be connected)

---

## User Impact

| User | Before | After |
|------|--------|-------|
| Leigh (Marketing) | Uses ADS, sees sales tools | Uses Studio, sees marketing tools |
| Edwin/Jonathan (Sales) | Uses ADS | Uses ADS (no change) |
| All users | COMPASS is single app | COMPASS is embedded in their dashboard |

---

*Created: December 28, 2025*
