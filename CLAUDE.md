# LIDS - Live Interactive Dashboard

**Frontend-first sales software for solar reps in the field.**

**Terminology:**
- **LIDS** = Live Interactive Dashboard (the app you're working on)
- **ADS** = Admiral Dialer System (collection of backend tools: Twilio, Twenty CRM, n8n, etc.)

---

## 30-Second Overview

| What | Who | Where |
|------|-----|-------|
| CRM + Dialer + Gamified Progression | Solar sales reps at Admiral Energy | `apps/ads-dashboard/client/src/` |

**LIDS is a frontend experience that happens to have a backend.**

The backend is stable, documented, and rarely touched. Your work happens in the React frontend where reps live between doors.

---

## ⚠️ THE THREE PILLARS (WHY ADS EXISTS)

**The Problem:** 70% of solar sales reps quit within the first month. Why? No leads, no structure, and no way to see their progression. A rep might not make their first sale until day 45.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ADS IS BUILT ON THREE CORE PILLARS - ALL ARE ESSENTIAL                      │
│                                                                              │
│  1. LEADS      PropStream imports with TCPA compliance                       │
│                → Reps have something to call on Day 1                        │
│                                                                              │
│  2. STRUCTURE  Dialer, agents, training via RedHawk Academy                  │
│                → Just show up and press dial                                 │
│                                                                              │
│  3. PROGRESSION  XP system showing improvement BEFORE first sale             │
│                  → THE GLUE that keeps reps from quitting                    │
│                  → Also DIAGNOSTIC DATA for leadership                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Progression is NOT gamification.** It's diagnostic data:
- Rep has 100 calls, 20 conversations → naive: "needs closer training"
- But if Sub-30s Drop Rate is 65% → actually needs OPENER training
- Efficiency badges tell both rep AND leadership where to focus

**See:** `docs/PROGRESSION_SYSTEM.md` for complete system documentation.

---

## ⚠️ AUTHENTICATION ARCHITECTURE (CRITICAL - READ FIRST)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  TWENTY CRM IS THE CENTRAL AUTH LAYER - NO EXCEPTIONS                        │
│                                                                              │
│  ❌ DO NOT use Supabase for auth                                             │
│  ❌ DO NOT use HELM Registry (deprecated V1 system)                          │
│  ❌ DO NOT add complex auth flows that block users                           │
│  ❌ DO NOT require admin approval for dashboard access                       │
│  ❌ DO NOT use email as the user identifier (use workspaceMemberId)          │
│                                                                              │
│  ✅ Twenty CRM = single source of truth for user access                      │
│  ✅ workspaceMemberId = permanent user identifier (never changes)            │
│  ✅ Email = lookup key at login (can be changed by user)                     │
│  ✅ Revoke access via Twenty → user loses dashboard access                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Why This Exists

V1 (HELM) used Supabase + HELM Registry for auth. It was an **auth nightmare** - users couldn't access ADS at all. We wasted weeks on auth issues instead of building features.

V2 (LIDS) uses **Twenty CRM as the sole identity provider**:
- All LIDS dashboards (ADS, Studio, COMPASS, Academy) validate against Twenty
- Once invited to Twenty workspace → access to all dashboards
- Owner can revoke access directly in Twenty

### Login Flow (All LIDS Apps)

```
FIRST LOGIN:
┌─────────────────────────────────────────────────────────────────┐
│  1. User enters email on login screen                           │
│  2. Backend queries Twenty: GET /rest/workspaceMembers          │
│  3. Find member by email → get workspaceMemberId                │
│  4. Store workspaceMemberId in localStorage                     │
│  5. User is logged in                                           │
└─────────────────────────────────────────────────────────────────┘

SUBSEQUENT VISITS:
┌─────────────────────────────────────────────────────────────────┐
│  1. App loads → check localStorage for workspaceMemberId        │
│  2. Validate ID still exists in Twenty workspace                │
│  3. If valid → skip login, show app                             │
│  4. If invalid → clear storage, show login                      │
└─────────────────────────────────────────────────────────────────┘
```

### User Identity Architecture

```
Twenty CRM Workspace Member
    │
    ├── workspaceMemberId: "uuid-xxx" ← PERMANENT (never changes)
    ├── email: "user@example.com"     ← MUTABLE (can be changed)
    └── name: "John Doe"              ← MUTABLE
```

**Key Rules:**
- `workspaceMemberId` is the **permanent identifier** - use this for all data relationships
- `email` is just for **login lookup** - users can change it without losing data
- All progression, call logs, stats link to `workspaceMemberId`, NOT email

**If User Changes Email:**
1. User changes email in Twenty CRM
2. Their `workspaceMemberId` stays the same
3. localStorage still has valid `workspaceMemberId`
4. All their progression/stats remain intact
5. Next login: new email → same `workspaceMemberId` → same data

### Access Revocation

```
TO REVOKE A USER'S ACCESS:
┌─────────────────────────────────────────────────────────────────┐
│  1. Go to twenty.ripemerchant.host                              │
│  2. Settings → Members → Remove user                            │
│  3. User's workspaceMemberId is removed from workspace          │
│  4. Next time user loads ANY LIDS app:                          │
│     - App validates workspaceMemberId against Twenty            │
│     - Twenty says "not found"                                   │
│     - App clears localStorage, shows login                      │
│     - User can't login (email not in workspace)                 │
└─────────────────────────────────────────────────────────────────┘
```

**Single point of control:** Remove from Twenty = removed from ALL LIDS apps

### Data Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LIDS (Droplet) - Lightweight Data Layer                                    │
│  • Twenty CRM: Leads, contacts, deals, team members                         │
│  • Can hold ~5,000 active leads for daily operations                        │
│  • Employee-facing - no sensitive customer data                             │
└─────────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Sync when needed
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIRAL-SERVER - Secure Data Layer (192.168.1.23)                          │
│  • 100,000+ leads archive                                                    │
│  • Sensitive information, payment data, contracts                            │
│  • AI/Voice processing, transcription storage                               │
│  • See: docs/architecture/Admiral Energy Infrastructure Registry v2.1.md   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Rule:** LIDS is for employees. No sensitive data. Twenty CRM handles access control. Keep it simple.

---

## Production Architecture (Standalone Droplet)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DROPLET (165.227.111.24) - EVERYTHING REPS NEED                           │
│  Fully standalone - no backend dependencies for core functionality         │
├─────────────────────────────────────────────────────────────────────────────┤
│  LIDS Dashboard           https://helm.ripemerchant.host     :5000         │
│  Studio                   https://studio.ripemerchant.host   :3103         │
│  Twenty CRM (CANONICAL)   https://twenty.ripemerchant.host   :3001         │
│  COMPASS                  https://compass.ripemerchant.host  :3101         │
│  RedHawk Academy          https://academy.ripemerchant.host  :3102         │
│                                                                             │
│  Admiral Chat (embedded):  ADS /chat  |  Studio /team                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIRAL-SERVER (192.168.1.23) - OPTIONAL AI Enhancements                  │
│  Voice/AI services - LIDS works fine without these                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Voice Service            http://100.66.42.81:4130  (live transcription)   │
│  Twilio Service           http://100.66.42.81:4115  (browser calling)      │
│  Agent Claude             http://100.66.42.81:4110  (AI assistance)        │
│  Transcription            http://100.66.42.81:4097  (call transcripts)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Design:**
- **Reps can work with ONLY the droplet** - CRM, native dialing, lead management all work standalone
- **Twenty CRM is ONLY on the droplet** - `localhost:3001` (Docker), no admiral-server instance
- **Admiral-server is optional** - Adds browser-based Twilio calling, AI features, live transcription
- **If admiral-server is down:** Native phone mode still works, CRM still works, just no browser calling

```
┌────────────────────────────────────────────────────────────────┐
│                     WHERE WORK HAPPENS                          │
│                                                                 │
│   client/src/                                                   │
│   ├── pages/        ← User screens (dialer, dashboard, crm)   │
│   ├── components/   ← Reusable UI                              │
│   ├── features/     ← Progression system (XP, ranks, bosses)  │
│   └── hooks/        ← useDialer, useTranscription, useSms      │
│                                                                 │
├─────────────────── line of prominence ──────────────────────────┤
│                                                                 │
│   server/           ← Stable, documented (ARCHITECTURE.md)     │
│   shared/           ← Drizzle schema                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Priority Hierarchy

```
UI/UX Excellence          ← Where value is created
├── User feel
├── Visual polish
├── Interaction flow
├── Perceived performance
└── Progression dopamine

Frontend Code Quality     ← Where iteration happens
└── client/src/

─────────────────────────────────────────────────

Backend Services          ← Stable, documented
└── See docs/architecture/ARCHITECTURE.md

Infrastructure            ← Rarely touched
└── See docs/architecture/DEPLOYMENT_CHECKLIST.md
```

---

## Design System

### Brand Tokens

```css
--admiral-navy:   #0c2f4a;  /* Primary - headers, nav, buttons */
--admiral-gold:   #c9a648;  /* Accent - XP, wins, progression */
--admiral-white:  #f7f5f2;  /* Backgrounds, cards */
```

### UX Principles for Sales Software

| Principle | Why | Implementation |
|-----------|-----|----------------|
| **Instant** | Reps are between doors | Optimistic UI, local-first with Dexie |
| **Glanceable** | Check during calls | XP bar visible, rank in header |
| **Dopamine-driven** | Adoption is voluntary | Confetti on level-up, boss victory screens |
| **Forgiving** | Fat fingers on mobile | Large tap targets, undo on dispositions |
| **Offline-resilient** | Bad cell signal | IndexedDB sync queue |

### Component Patterns

```tsx
// Primary action - Navy background
<Button className="bg-[#0c2f4a] hover:bg-[#0c2f4a]/90">

// Success/Win state - Gold accent
<Badge className="bg-[#c9a648] text-white">

// Cards - White with subtle shadow
<Card className="bg-[#f7f5f2] shadow-sm">
```

---

## Where to Work

### Primary Work Area: `client/src/`

```
client/src/
├── pages/
│   ├── dashboard.tsx     ← Rep home screen
│   ├── dialer.tsx        ← Click-to-call interface
│   ├── crm.tsx           ← Lead management
│   └── activity.tsx      ← Call history
│
├── components/
│   ├── ui/               ← shadcn/ui primitives
│   ├── dialer/           ← Keypad, call controls
│   └── progression/      ← XP bar, rank display
│
├── features/
│   └── progression/
│       ├── config/       ← XP values, rank thresholds
│       ├── hooks/        ← useProgression, useXP
│       └── components/   ← LevelUpModal, BossCard
│
├── hooks/
│   ├── useDialer.ts      ← Twilio Voice SDK wrapper
│   ├── useTranscription.ts
│   └── useSms.ts         ← SMS send/receive with Dexie persistence
│
├── lib/
│   ├── db.ts             ← Dexie (IndexedDB) schema
│   ├── progressionDb.ts  ← XP/rank persistence
│   ├── settings.ts       ← App configuration
│   ├── twentySync.ts     ← CRM bidirectional sync
│   └── twentyStatsApi.ts ← Twenty GraphQL calls
│
└── providers/
    └── twentyDataProvider.ts  ← Refine.dev data layer
```

### File Importance Heat Map

```
🔴 HIGH TOUCH (iterate here)
   pages/*.tsx
   features/progression/*
   components/dialer/*

🟡 MEDIUM TOUCH (enhance carefully)
   lib/db.ts, lib/progressionDb.ts
   hooks/useDialer.ts, hooks/useSms.ts

🟢 LOW TOUCH (stable, documented)
   lib/settings.ts
   lib/twentySync.ts
   providers/*

⚪ DO NOT TOUCH (infrastructure)
   server/*
   shared/*
```

---

## Where NOT to Work

### Backend Stability Zone

The following are **stable and documented**. Modify only with explicit requirements and full understanding of downstream effects.

| Path | Why Protected | Documentation |
|------|---------------|---------------|
| `server/index.ts` | Proxy configuration for 3 services | ARCHITECTURE.md §Proxy Architecture |
| `server/routes.ts` | API contracts, Twenty integration | ARCHITECTURE.md §Backend Service Details |
| `shared/schema.ts` | Drizzle schema, migration required | ARCHITECTURE.md §Data Flow |
| `lib/settings.ts` | Contains hardcoded API key (security) | See Known Issues below |

### Infrastructure (admiral-server)

Do not modify without DevOps review:
- PM2 ecosystem configs
- Docker Compose files
- Cloudflare tunnel config
- Service .env files

Reference: `docs/architecture/DEPLOYMENT_CHECKLIST.md`

---

## Known Issues

### Security (Do Not Expose Further)

| Issue | Location | Severity | Status |
|-------|----------|----------|--------|
| API key in client bundle | `lib/settings.ts:47` | Medium | Key is workspace-scoped, forced via code |
| Credentials in .env | Droplet + admiral-server | Medium | Standard practice, access controlled |

**Note:** The Twenty API key is embedded in client code but is now forced (ignores localStorage). The key is workspace-scoped and read-only for CRM data. Still, avoid adding more secrets to client-side code.

**Authentication:** Twenty CRM IS the auth layer. See "Authentication Architecture" section above. DO NOT add Supabase, HELM Registry, or other auth systems.

**Rule:** Do not add more secrets to client-side code. Any new credentials must be server-side.

### Single Points of Failure

| Component | Impact if Down | Mitigation |
|-----------|----------------|------------|
| DO Droplet | LIDS, Twenty, COMPASS offline | None (but independent of home network) |
| admiral-server | Browser calling, AI, transcription unavailable | **Native phone mode still works**, CRM works |
| Tailscale | Droplet can't reach admiral-server | Voice/AI features unavailable, core app works |
| Twenty CRM (droplet) | No lead data | Dexie cache provides read-only |

**Resilience:**
- **Droplet is fully standalone** - Reps can do their job with zero admiral-server dependency
- **Admiral-server is a nice-to-have** - Adds browser calling and AI features
- **Native phone mode** - Uses device's phone app (`tel:` links), no backend needed

Reference: `docs/architecture/TROUBLESHOOTING.md`

---

## Documentation Map

```
LIDS-monorepo/
├── CLAUDE.md                           ← You are here
├── README.md                           ← User-facing overview
├── PORT_REFERENCE.md                   ← Quick port lookup
├── AI_CONTEXT.md                       ← Quick reference for AI agents
│
├── apps/
│   ├── ads-dashboard/
│   │   └── twenty-crm/
│   │       └── TWENTY_CRM_INTEGRATION.md  ← **CRITICAL** Twenty CRM reference
│   ├── admiral-chat/                   ← Team chat documentation
│   │   └── README.md                   ← Architecture, usage, roadmap
│   └── ...
│
├── packages/
│   └── admiral-chat/                   ← @lids/admiral-chat shared package
│       └── src/                        ← Components, hooks, services
│
└── docs/
    └── architecture/
        ├── ARCHITECTURE.md             ← Complete system truth (15KB)
        │   ├── Service inventory
        │   ├── Data flow diagrams
        │   ├── Proxy architecture
        │   └── Backend service details
        │
        ├── DEPLOYMENT_CHECKLIST.md     ← Operational procedures (8KB)
        │   ├── Prerequisites
        │   ├── Phase-by-phase setup
        │   └── Rollback procedures
        │
        ├── TROUBLESHOOTING.md          ← Issue resolution (10KB)
        │   ├── Quick diagnostics
        │   ├── Common issues + solutions
        │   └── Debug commands
        │
        ├── Admiral Energy Infrastructure Registry v2.5.md
        │   ├── Network topology (all nodes)
        │   ├── Hardware registry (specs)
        │   ├── Port allocation map
        │   ├── Remote access configuration
        │   └── Daily workflow examples
        │
        └── SSH_KEY_ARCHITECTURE.md (LifeOS-Core/docs/)
            └── Tailscale SSH commands, legacy keys, credentials
```

---

## Project Tracking

**Project Structure:** `projects/active/`, `projects/completed/YYYY_MM_DD/`, `projects/archive/YYYY_MM/`

### Active Projects
Check `projects/active/` for current work.

### Project Lifecycle
1. **Active** (`projects/active/XX-name/`) - Currently in progress
2. **Completed** (`projects/completed/YYYY_MM_DD/`) - Done within last 30 days
3. **Archive** (`projects/archive/YYYY_MM/`) - Done 30+ days ago

### Creating a New Project
```bash
mkdir -p projects/active/XX-project-name
touch projects/active/XX-project-name/README.md
touch projects/active/XX-project-name/CODEX_IMPLEMENTATION_PLAN.md
```

### Completing a Project
1. Update README.md with `## Status: COMPLETE` and `**Completed:** YYYY-MM-DD`
2. Move to `projects/completed/YYYY_MM_DD/`
3. After 30 days, move to `projects/archive/YYYY_MM/`

---

## Project Methodology (MANDATORY)

**All non-trivial work MUST follow this workflow.** No random coding. Each project creates an isolated context for focused execution.

### Why This Matters

- **Different AI instances have different context** - Without documentation, one instance goes left while another goes right
- **Isolated environments enable focus** - Each project has clear scope and boundaries
- **Executable prompts ensure consistency** - Any AI can pick up where another left off
- **Audit trails prevent rework** - Decisions are documented, not lost

### Project Structure

```
projects/<N>-<name>/
├── README.md                      # Status dashboard (updated as work progresses)
├── AUDIT_FINDINGS.md             # Deep analysis, current state, target state
└── CODEX_IMPLEMENTATION_PLAN.md  # Executable prompt for AI coding assistants
```

### Workflow Phases

```
1. PLAN          → Identify problem, define scope, create project folder
                   Output: projects/<N>-<name>/ created

2. AUDIT         → Deep analysis of current state, identify all files involved
                   Output: AUDIT_FINDINGS.md with issues, root causes, risks

3. ARCHITECT     → Define target state, phased implementation, rollback plan
                   Output: AUDIT_FINDINGS.md updated with target state

4. PROMPT        → Create executable instructions for AI coding assistant
                   Output: CODEX_IMPLEMENTATION_PLAN.md with system context + tasks

5. EXECUTE       → AI works through phased tasks, updates status
                   Output: Code changes, README.md updated with progress

6. VERIFY        → Test changes, document results
                   Output: README.md marked COMPLETE with verification notes
```

### AUDIT_FINDINGS.md Template

```markdown
# Project N: [Name]

## Executive Summary
[One paragraph: What's broken, why it matters, how we fix it]

## Current State Analysis
[Diagram or description of how it works NOW]

## Critical Issues
### C1: [Issue Name]
- **Severity:** CRITICAL | HIGH | MEDIUM | LOW
- **Location:** `file.tsx:line`
- **Impact:** [What breaks]
- **Evidence:** [Code snippet]

## Target State
[Diagram or description of how it SHOULD work]

## Files to Modify
| File | Changes |
|------|---------|
| `path/file.ts` | Description |

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Risk 1 | How to handle |
```

### CODEX_IMPLEMENTATION_PLAN.md Template

```markdown
# Codex Implementation Plan - Project N

## System Prompt
\`\`\`
You are implementing [feature] for [app].

Context:
- App: apps/[name] (React + TypeScript + Vite)
- Current problem: [description]
- Solution: [description]

Key files:
- file1.tsx - Purpose
- file2.ts - Purpose

Brand tokens:
- Navy: #0c2f4a
- Gold: #c9a648
- White: #f7f5f2
\`\`\`

## Phase 1: [Name] (CRITICAL)

### Task 1: [Description]
**File:** `apps/.../file.ts`

[Specific instructions with code snippets]

### Task 2: [Description]
...

## Verification Commands
[How to test]

## Rollback
[How to undo if broken]
```

### Rules

1. **No work without a project folder** - Create `projects/<N>-<name>/` first
2. **Audit before coding** - Understand current state fully before changes
3. **Phased execution** - Break work into testable chunks
4. **Update status in real-time** - README.md reflects current state
5. **Rollback plan required** - Every change must be reversible

### Reference Project

See `projects/4/` for a complete example:
- Professional Dialer System with 7 phases
- Full audit with code evidence
- Executable Codex prompt with verification

---

## Quick Commands

### Development

```bash
# Start local dev server (connects to admiral-server)
cd apps/ads-dashboard
npm run dev
# → http://localhost:3100
```

### Build

```bash
# Production build
npm run build
# → dist/index.cjs (server)
# → dist/public/ (client assets)
```

### Deploy (to Droplet)

```bash
# Push to GitHub, then via Tailscale SSH:
ssh root@100.94.207.1 "cd /var/www/lids && git pull && cd apps/ads-dashboard && npm run build && pm2 restart lids --update-env"

# Or for all apps:
ssh root@100.94.207.1 "cd /var/www/lids && git pull && npm run build:all && pm2 restart all --update-env"
```

**Note:** Uses Tailscale SSH (100.94.207.1) - no keys needed, auth via Tailscale identity.

### Health Check

```bash
# Droplet services status (via Tailscale SSH)
ssh root@100.94.207.1 "pm2 status"

# Twenty CRM connection
curl https://helm.ripemerchant.host/api/twenty/status

# Direct on droplet
ssh root@100.94.207.1 'curl -s http://localhost:5000/api/twenty/status'
```

---

## For Guardian MCP

### Repo Health Priorities

1. **Frontend UX** - If the UI doesn't feel fast and polished, nothing else matters
2. **Progression System** - XP/ranks drive adoption; protect the dopamine loop
3. **Dialer Reliability** - Core revenue generator; zero tolerance for call drops
4. **Data Sync** - Dexie ↔ Twenty must stay consistent
5. **Documentation** - Keep architecture docs current

### Orchestration Notes

```
Terminal Claude (Guardian MCP)
    │
    ├── Frontend work → Direct file edits in client/src/
    │
    ├── Production (Droplet) → Tailscale SSH (no keys needed)
    │   ssh root@100.94.207.1
    │   pm2 restart lids
    │   pm2 logs lids
    │
    ├── AI Services (admiral-server) → Tailscale SSH (no keys needed)
    │   ssh edwardsdavid913@100.66.42.81
    │   pm2 restart voice-service
    │   pm2 logs twilio-service
    │
    ├── Oracle ARM → Tailscale SSH (no keys needed)
    │   ssh ubuntu@100.125.221.62
    │
    └── Service URLs:
        Droplet: https://*.ripemerchant.host (helm, twenty, compass, academy, studio)
        Admiral: http://100.66.42.81:PORT (voice, twilio, agents)
```

**Tailscale SSH:** All 3 Linux servers have Tailscale SSH enabled. No traditional SSH keys needed - uses Tailscale identity for authentication. First connection requires browser auth popup.

### When to Escalate

- Any change to `server/index.ts` proxy config
- Any change to authentication flow (currently none)
- Any new environment variable or secret
- Any Docker or PM2 configuration change
- Any Cloudflare tunnel modification

### Testing Mental Model

```
Before: "Does the backend work?"
After:  "Does the REP see what they need to see?"

Frontend is the product.
Backend is infrastructure.
Test from the UI down.
```

---

## Target User Profile

**Name:** Field Sales Rep (Edwin, Jonathan, Kareem)
**Device:** Mobile phone, sometimes laptop
**Context:** Standing on a porch, 30 seconds between knocks
**Needs:**
- See the lead's name and phone
- One tap to dial
- Quick disposition after call
- Glance at XP to feel progress

**Never thinks about:**
- GraphQL queries
- Proxy middleware
- Sync logic
- Container orchestration

**Build for their reality, not ours.**

---

*Last Updated: January 4, 2026*
