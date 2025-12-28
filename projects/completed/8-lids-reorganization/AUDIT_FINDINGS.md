# Project 8: LIDS Reorganization Audit

**Multi-Dashboard Architecture with Shared COMPASS Core**
*Created: December 28, 2025*

---

## Executive Summary

LIDS currently has a monolithic structure where all users access the same ADS Dashboard regardless of their role. Marketing team members (Leigh) are forced to navigate sales tools (dialer, progression) to reach AI agents (Sarai, Muse) that are relevant to their work. The COMPASS app exists as a standalone PWA but isn't integrated into dashboards.

**Root Cause:** No role-based dashboard separation. COMPASS was built standalone instead of as embeddable packages.

**Fix:** Extract COMPASS into shared packages, create a Studio Dashboard for marketing, wire COMPASS variants into each dashboard context.

---

## Current State Analysis

### Repository Structure

```
LIDS/
├── apps/
│   ├── ads-dashboard/        # Sales + CRM + Dialer + Progression
│   │   ├── client/src/       # React frontend
│   │   │   ├── pages/        # dialer, dashboard, crm, activity
│   │   │   ├── components/   # UI components
│   │   │   ├── features/     # Progression system
│   │   │   └── hooks/        # useDialer, useSms, etc.
│   │   └── server/           # Express proxy
│   │
│   ├── compass/              # Standalone PWA (NOT integrated)
│   │   ├── client/src/
│   │   │   ├── pages/        # home, CommandsPage, livewire
│   │   │   └── components/   # Chat UI
│   │   └── server/           # Express + proxy to agents
│   │
│   ├── redhawk-academy/      # Training gamification
│   └── twenty-crm/           # CRM placeholder (actual CRM is Docker)
│
├── packages/
│   └── shared/               # EMPTY - no shared packages exist
│
└── docs/
```

### User Access Patterns

| User | Role | Needs | Current Experience |
|------|------|-------|-------------------|
| Leigh | Marketing | Sarai, Muse, ComfyUI, Campaigns | Must use ADS, sees dialer/XP |
| Edwin | Sales | Dialer, Leads, XP, COMPASS | Uses ADS (correct) |
| Jonathan | Sales | Dialer, Leads, XP | Uses ADS (correct) |
| Kareem | Sales | Dialer, Leads, XP | Uses ADS (correct) |

### COMPASS Current State

**Location:** `apps/compass/`

**Key Files:**
- `client/src/pages/home.tsx` - Chat interface
- `client/src/pages/CommandsPage.tsx` - Command list
- `client/src/pages/livewire.tsx` - Reddit lead scanner
- `server/routes.ts` - Proxy to agent backend

**Backend:** COMPASS Agent at `admiral-server:4098` (not yet deployed, currently mocked)

**Problem:** COMPASS is a standalone app, not importable as a package. Chat UI, agent connection, and message handling are tightly coupled to the app.

---

## Critical Issues

### C1: No Role-Based Dashboard Separation

**Severity:** HIGH
**Impact:** Marketing users see irrelevant sales tools; cognitive overhead

**Evidence:**
```
Current: All users → ADS Dashboard → Same UI
Target:  Sales users → ADS Dashboard → Sales tools
         Marketing users → Studio Dashboard → Marketing tools
```

### C2: COMPASS Not Modular

**Severity:** HIGH
**Location:** `apps/compass/client/src/`
**Impact:** Cannot embed COMPASS into other dashboards

**Evidence:**
```typescript
// apps/compass/client/src/pages/home.tsx
// Chat UI is a PAGE, not an importable component
export default function Home() {
  // All logic embedded here
  // Cannot be imported into ads-dashboard or studio-dashboard
}
```

### C3: No Shared Packages

**Severity:** MEDIUM
**Location:** `packages/shared/` (empty)
**Impact:** Code duplication across apps; no reusability

**Evidence:**
```bash
$ ls packages/shared/
# (empty directory)
```

### C4: Twenty Integration Duplicated

**Severity:** MEDIUM
**Location:** Multiple apps have their own Twenty integration
**Impact:** Sync logic repeated; maintenance burden

**Evidence:**
- `apps/ads-dashboard/client/src/lib/twentySync.ts`
- `apps/ads-dashboard/client/src/providers/twentyDataProvider.ts`
- Each new dashboard would need to duplicate this

---

## Target State

### Repository Structure

```
LIDS/
├── apps/
│   ├── ads-dashboard/          # Sales Dashboard (existing)
│   │   ├── client/src/
│   │   │   └── ... (uses compass-core + compass-sales)
│   │   └── server/
│   │
│   ├── studio-dashboard/       # Marketing Dashboard (NEW)
│   │   ├── client/src/
│   │   │   ├── pages/
│   │   │   │   ├── dashboard.tsx    # Marketing home
│   │   │   │   ├── content.tsx      # Sarai content generation
│   │   │   │   ├── campaigns.tsx    # Campaign management
│   │   │   │   └── comfy.tsx        # ComfyUI integration
│   │   │   └── ... (uses compass-core + compass-studio)
│   │   └── server/
│   │
│   └── redhawk-academy/        # Training (unchanged)
│
├── packages/
│   ├── compass-core/           # Shared COMPASS functionality
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ChatWindow.tsx    # Main chat UI
│   │   │   │   ├── MessageList.tsx   # Message display
│   │   │   │   ├── InputBar.tsx      # User input
│   │   │   │   └── AgentAvatar.tsx   # Agent display
│   │   │   ├── hooks/
│   │   │   │   ├── useAgent.ts       # WebSocket to agents
│   │   │   │   ├── useMessages.ts    # Message state
│   │   │   │   └── useCommands.ts    # Slash command parsing
│   │   │   ├── providers/
│   │   │   │   └── CompassProvider.tsx
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── compass-sales/          # Sales-specific COMPASS
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── lookup.ts         # /lookup <address>
│   │   │   │   ├── objection.ts      # /objection <type>
│   │   │   │   └── script.ts         # /script <name>
│   │   │   ├── agents/
│   │   │   │   └── index.ts          # Scout, Analyst, Caller, etc.
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── compass-studio/         # Marketing-specific COMPASS
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── generate.ts       # /generate <prompt>
│   │   │   │   ├── campaign.ts       # /campaign <action>
│   │   │   │   └── comfy.ts          # /comfy <workflow>
│   │   │   ├── agents/
│   │   │   │   └── index.ts          # Sarai, Muse
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── twenty-integration/     # Shared CRM layer
│       ├── src/
│       │   ├── client.ts             # Twenty API client
│       │   ├── sync.ts               # Bidirectional sync
│       │   ├── dataProvider.ts       # Refine.dev provider
│       │   └── types.ts
│       └── package.json
│
└── tools/
    └── twenty-crm/             # Docker reference (on droplet)
```

### Usage Pattern

```tsx
// In apps/studio-dashboard/client/src/pages/dashboard.tsx
import { CompassProvider, ChatWindow } from '@lids/compass-core';
import { studioCommands, studioAgents } from '@lids/compass-studio';

export default function StudioDashboard() {
  return (
    <CompassProvider agents={studioAgents} commands={studioCommands}>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1">
          <ContentArea />
        </main>
        <aside className="w-96">
          <ChatWindow title="Studio Assistant" />
        </aside>
      </div>
    </CompassProvider>
  );
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `packages/compass-core/package.json` | Package manifest |
| `packages/compass-core/src/components/ChatWindow.tsx` | Main chat UI |
| `packages/compass-core/src/components/MessageList.tsx` | Message display |
| `packages/compass-core/src/components/InputBar.tsx` | User input |
| `packages/compass-core/src/hooks/useAgent.ts` | Agent WebSocket |
| `packages/compass-core/src/hooks/useMessages.ts` | Message state |
| `packages/compass-core/src/providers/CompassProvider.tsx` | Context provider |
| `packages/compass-sales/package.json` | Sales package manifest |
| `packages/compass-sales/src/commands/*.ts` | Sales slash commands |
| `packages/compass-studio/package.json` | Studio package manifest |
| `packages/compass-studio/src/commands/*.ts` | Studio slash commands |
| `apps/studio-dashboard/` | Entire new dashboard app |

## Files to Modify

| File | Changes |
|------|---------|
| `apps/compass/` | Extract reusable code → compass-core |
| `apps/ads-dashboard/` | Import compass-core + compass-sales (Phase 5) |
| `package.json` (root) | Add workspaces configuration |

---

## Success Criteria

- [ ] `packages/compass-core` is importable from any app
- [ ] `apps/studio-dashboard` exists and runs on :3103
- [ ] Studio has ChatWindow powered by compass-studio agents
- [ ] Leigh can access Sarai/Muse without seeing sales tools
- [ ] ADS Dashboard still works (regression-free)
- [ ] Twenty CRM data accessible from both dashboards

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking ADS during refactor | Phase 5 is last; keep ADS working throughout |
| Package versioning complexity | Use workspace:* for local packages |
| COMPASS agent not deployed | Start with mocked responses (existing behavior) |
| ComfyUI integration complexity | Phase 4 can be deferred; start with Sarai only |

---

## Backend Agents (Reference)

| Agent | Port | Dashboard | Purpose |
|-------|------|-----------|---------|
| COMPASS Agents | 4098 | Both | General conversation |
| Sarai | 4065 | Studio | Content generation |
| Muse | TBD | Studio | Creative AI |
| Scout | 5001 | Sales | Lead research |
| Analyst | 5002 | Sales | Data analysis |
| Caller | 5003 | Sales | Call scripting |

---

*Audit completed: December 28, 2025*
