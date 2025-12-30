# VS Code Claude Protocol

**Operational Protocol for VS Code Claude Instance in LIDS Repository**

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
│  ✅ Email = lookup key at login only (can be changed by user)               │
│  ✅ Revoke access via Twenty → user loses dashboard access                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### User Identity Architecture (Project 15 - IMPLEMENTED)

```
Twenty CRM Workspace Member
    │
    ├── workspaceMemberId: "uuid-xxx" ← PERMANENT (never changes)
    ├── email: "user@example.com"     ← MUTABLE (login lookup only)
    └── name: "John Doe"              ← MUTABLE
```

**Key Rules:**
- `workspaceMemberId` is the **permanent identifier** - use for all data relationships
- `email` is just for **login lookup** - users can change it without losing data
- All progression, call logs, stats link to `workspaceMemberId`, NOT email

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

### App-to-Auth Mapping

| App | Domain | Auth Method | Status |
|-----|--------|-------------|--------|
| ADS (Sales) | helm.ripemerchant.host | Email → workspaceMemberId | ✅ WORKING |
| Studio (Marketing) | studio.ripemerchant.host | Email → workspaceMemberId | ✅ WORKING |
| COMPASS (AI) | compass.ripemerchant.host | Email → workspaceMemberId | ✅ WORKING |
| Academy | academy.ripemerchant.host | Email → workspaceMemberId | ✅ WORKING |

**Role Routing:** After Twenty auth, use `inferRole(email)` to route users to their appropriate dashboard.

---

## Role Definition

**VS Code Claude** is the code-level executor working directly in the LIDS repository. Your partner is **Terminal Claude (Guardian MCP)** who handles orchestration, SSH connections, and MCP tool calls across multiple systems.

### What You Do
- Direct file edits in the LIDS codebase
- Code analysis and refactoring
- Implementation of features and fixes
- Documentation updates
- Local testing and validation
- Create project folders with audit findings and Codex prompts

### What Terminal Claude Does
- MCP tool coordination
- SSH to admiral-server (Tailscale IP from env)
- Multi-agent workflows and orchestration
- PM2 service management
- Cross-system operations

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

### Current Projects

```
projects/
├── completed/                    # Finished projects archive
│   ├── 1/                        # Security & Configuration
│   ├── 2/                        # Progression Fixes
│   ├── 3/                        # Progression SSOT
│   ├── 6-livewire-integration/   # LiveWire Reddit Leads
│   ├── 8-lids-reorganization/    # LIDS Reorganization
│   ├── 9-studio-dashboard-launch/# Studio Launch
│   ├── 10-studio-consolidation/  # SUPERSEDED by P9, P11, P15
│   └── 11-compass-auth-unification/ # COMPASS Twenty Auth
│
├── 4/                            # Professional Dialer System (PARTIAL)
├── 14-studio-dashboard-redesign/ # Studio Content Calendar (PHASE 1 COMPLETE)
├── 15-dialer-data-architecture/  # Login + Call History + Sync (ALL COMPLETE)
├── 16-admiral-chat/              # Admiral Chat Team Messaging (PHASE 4 COMPLETE)
├── 17-compass-micro-agents/      # COMPASS Agents (PHASE 1 COMPLETE)
├── 18-progression-system-fix/    # SUPERSEDED by Project 15
├── 19-unified-lids-architecture/ # Unified Architecture (PHASE 2 IN PROGRESS)
└── 20-lids-documentation-overhaul/ # Documentation (ALL COMPLETE)
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

### File Templates

#### README.md (Status Dashboard)

```markdown
# Project N: [Name]

## Status: [PLANNING | IN PROGRESS | COMPLETE]

**Started:** [Date]
**Completed:** [Date]

## Summary
[What this project does]

## Phases
| Phase | Feature | Status |
|-------|---------|--------|
| 1 | [Name] | ✅ COMPLETE |
| 2 | [Name] | ⏳ IN PROGRESS |

## Files Modified
- `path/file.ts` - Description

## Verification
[How to test it works]
```

#### AUDIT_FINDINGS.md (Analysis)

```markdown
# Project N: [Name] Audit

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
```

#### CODEX_IMPLEMENTATION_PLAN.md (Execution Prompt)

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
\`\`\`

## Phase 1: [Name]

### Task 1: [Description]
**File:** `apps/.../file.ts`
[Specific instructions]

## Verification Commands
[How to test]

## Rollback
[How to undo if broken]
```

### Codex Execution Protocol

When AI is working on a project:

1. **Update status** in README.md as work progresses
2. **Mark tasks COMPLETE** immediately when done
3. **Mark BLOCKED** if something prevents completion
4. **Add Changes section** listing files modified
5. **Run verification** before marking phase complete

### Rules

1. **No work without a project folder** - Create `projects/<N>-<name>/` first
2. **Audit before coding** - Understand current state fully before changes
3. **Phased execution** - Break work into testable chunks
4. **Update status in real-time** - README.md reflects current state
5. **Rollback plan required** - Every change must be reversible

### Reference Project

**See `projects/4/` for a complete example:**
- Professional Dialer System with 7 phases
- Full audit with code evidence
- Executable Codex prompt with verification
- Status tracking throughout execution

---

## Coordination Protocol

### Handoff Triggers

**Escalate to Terminal Claude when:**
1. Task requires SSH to admiral-server
2. PM2 service restart needed
3. Docker/container operations required
4. Multi-repository coordination
5. MCP tool calls needed

**Handoff phrase:**
```
This needs Terminal Claude with MCP. Run: `cd ~/LifeOS-Core && claude`
```

### Information Sharing

When handing off, provide:
- What was attempted
- Current file state
- Specific service/command needed
- Expected outcome

---

## Repository Structure

```
LIDS/
├── apps/
│   ├── ads-dashboard/      # Sales dashboard (dialer, CRM, leads)
│   │   ├── client/src/     # React frontend
│   │   └── server/         # Express proxy + API + Chat backend
│   │
│   ├── admiral-chat/       # Team chat documentation (code in packages/)
│   │   └── README.md       # Architecture, usage, roadmap
│   │
│   ├── compass/            # COMPASS PWA - AI rep assistant
│   │   ├── client/src/     # Mobile-first PWA
│   │   └── server/         # Coach agent, enrichment
│   │
│   ├── studio/             # Marketing dashboard (LIVE)
│   │   ├── client/src/     # Dashboard, Calendar, Team Chat
│   │   └── server/         # Chat proxy to ADS
│   │
│   ├── redhawk-academy/    # Sales training platform
│   │   ├── client/src/     # Modules, quizzes, boss battles
│   │   └── server/         # Certification API
│   │
│   ├── lids-unified/       # Unified API gateway (Project 19)
│   │   └── server/         # Consolidates all apps into single process
│   │
│   └── twenty-crm/         # CRM (Docker on Droplet)
│       └── docker-compose.yml
│
├── packages/               # Shared components
│   ├── admiral-chat/       # Team chat UI (@lids/admiral-chat)
│   ├── compass-core/       # Base agent framework
│   ├── compass-sales/      # Sales agents (Coach, Intel, Guard)
│   ├── compass-studio/     # Marketing agents (Sarai, MUSE)
│   └── shared/             # Common utilities (placeholder)
│
├── projects/               # Audit & implementation projects
│   ├── completed/          # Finished projects archive
│   └── ...                 # Active projects
│
└── docs/
    └── architecture/       # System truth documents
```

### App Inventory

| App | Type | Domain | Port (Dev/Prod) | Status |
|-----|------|--------|-----------------|--------|
| **ADS Dashboard** | Sales CRM + Dialer | helm.ripemerchant.host | 3100/5000 | LIVE |
| **Studio** | Marketing Dashboard | studio.ripemerchant.host | 3103/3103 | LIVE |
| **COMPASS** | AI Rep Assistant (PWA) | compass.ripemerchant.host | 3101/3101 | LIVE |
| **RedHawk Academy** | Sales Training | academy.ripemerchant.host | 3102/3102 | LIVE |
| **Twenty CRM** | CRM (Docker) | twenty.ripemerchant.host | -/3001 | LIVE |
| **Admiral Chat** | Team Messaging | (embedded in apps) | - | LIVE |
| **lids-unified** | Unified API Gateway | (planned) | 5001/5000 | Phase 2 |

### Packages Inventory

| Package | Location | Purpose | Status |
|---------|----------|---------|--------|
| **@lids/admiral-chat** | `packages/admiral-chat/` | Team chat components + hooks | MVP Complete |
| **@lids/compass-core** | `packages/compass-core/` | Base agent framework | Stable |
| **@lids/compass-sales** | `packages/compass-sales/` | Sales agents (Coach, Intel, Guard) | Phase 1 Complete |
| **@lids/compass-studio** | `packages/compass-studio/` | Marketing agents (Sarai, MUSE) | Planning |
| **shared** | `packages/shared/` | Common utilities | Placeholder |

**Key Distinction:**
- **Dashboards** (ADS, Studio, Academy) = Full apps with features, tools, data
- **COMPASS** = Mobile PWA for field reps with AI micro-agents
- **Admiral Chat** = Team messaging (@lids/admiral-chat) embedded in ADS (/chat) and Studio (/team)
- **lids-unified** = Project 19 - consolidates 4 PM2 processes into single server

---

## Current Project Status

| Project | Name | Status | Location |
|---------|------|--------|----------|
| 1 | Security & Configuration | **COMPLETED** | `projects/completed/1/` |
| 2 | Progression Fixes | **COMPLETED** | `projects/completed/2/` |
| 3 | Progression SSOT | **COMPLETED** | `projects/completed/3/` |
| 9 | Studio Dashboard Launch | **COMPLETED** | `projects/completed/9-studio-dashboard-launch/` |
| 10 | Studio Consolidation | **SUPERSEDED** | `projects/completed/10-studio-consolidation/` |
| 11 | COMPASS Auth Unification | **COMPLETED** | `projects/completed/11-compass-auth-unification/` |
| 14 | Studio Dashboard Redesign | **Phase 1 COMPLETE** | `projects/14-studio-dashboard-redesign/` |
| 15 | Dialer Data Architecture | **ALL COMPLETE** | `projects/15-dialer-data-architecture/` |
| 16 | Admiral Chat | **Phase 4 COMPLETE** | `projects/16-admiral-chat/` |
| 17 | COMPASS Micro-Agents | **Phase 1 COMPLETE** | `projects/17-compass-micro-agents/` |
| 18 | Progression System Fix | **SUPERSEDED** | `projects/18-progression-system-fix/` |
| 19 | Unified Architecture | **Phase 2 IN PROGRESS** | `projects/19-unified-lids-architecture/` |
| 20 | Documentation Overhaul | **ALL COMPLETE** | `projects/20-lids-documentation-overhaul/` |

### Project 15 Results (Completed Dec 29, 2025)
- Implemented email → workspaceMemberId login flow
- Added Call History page (`/call-history`) with filters
- Fixed Twenty sync (removed invalid fields from payloads)
- User identity architecture: workspaceMemberId is permanent, email is mutable

### Project 16 Results (Phase 4 Complete Dec 29, 2025)
- Admiral Chat MVP with in-memory storage
- Embedded in ADS (`/chat`) and Studio (`/team`)
- Default channels: #general, #sales, #marketing, #sms-inbox
- SMS routing to #sms-inbox channel
- Ready for testing

### Project 17 Results (Phase 1 Complete Dec 29, 2025)
- Coach agent wired with fuzzy objection matching
- 9 objection types with rebuttals and techniques
- Intel, Guard, Scribe agents pending (Phase 2-4)

### Project 19 Status (Phase 2 In Progress)
- Unified server scaffolded at `apps/lids-unified/`
- Goal: Single Node.js process for all 4 SPAs
- Port: 5001 (dev), 5000 (prod - replaces current setup)
- ~100MB RAM savings target

---

## File Conventions

### High-Touch Files (Iterate Here)
- `apps/*/client/src/pages/*.tsx` - User screens
- `apps/*/client/src/features/` - Feature modules
- `apps/*/client/src/components/` - Reusable UI

### Medium-Touch Files (Enhance Carefully)
- `apps/*/client/src/lib/` - Utilities, settings, sync logic
- `apps/*/client/src/hooks/` - Custom hooks

### Low-Touch Files (Stable, Documented)
- `apps/*/server/routes.ts` - API contracts
- `apps/*/server/index.ts` - Proxy configuration
- `shared/schema.ts` - Database schema

### Do Not Touch (Infrastructure)
- PM2 configs (on admiral-server)
- Docker Compose files
- Cloudflare tunnel configs

---

## Service Architecture

### Port Reference (DO Droplet - 165.227.111.24)

| Service | Port | URL | PM2 Name |
|---------|------|-----|----------|
| LIDS Dashboard | 5000 | helm.ripemerchant.host | lids |
| Studio | 3103 | studio.ripemerchant.host | studio |
| Twenty CRM | 3001 | twenty.ripemerchant.host | Docker |
| COMPASS | 3101 | compass.ripemerchant.host | compass |
| RedHawk Academy | 3102 | academy.ripemerchant.host | redhawk |

### Backend Services (admiral-server via Tailscale - 100.66.42.81)

| Service | Port | Purpose |
|---------|------|---------|
| Voice Service | 4130 | STT (faster-whisper) + TTS (Piper) |
| Twilio Service | 4115 | Click-to-dial, call recording |
| Agent-Claude | 4110 | Primary MCP Server |
| RedHawk Agent | 4096 | Boss battles, exams |
| Sarai | 4065 | Content creation agent (Studio) |
| MUSE | 4066 | Strategy planning agent (Studio) |
| MCP Kernel | 4000 | Agent Routing |
| Oracle | 4050 | Memory Service |
| GIDEON | 4100 | Executive AI (David) |
| LiveWire | 5000 | Sales AI (Nate) |

### Proxy Architecture

```
Browser Request
     │
     ▼
Express Server (port 5000)
     │
     ├── /twenty-api/* → Twenty CRM (3001)
     ├── /voice-api/*  → Voice Service (4130)
     ├── /twilio-api/* → Twilio Service (4115)
     │
     └── /api/*        → Local routes.ts handlers
```

---

## Data Flow Patterns

### ADS Dashboard (Offline-First)
```
Browser (IndexedDB via Dexie)
     │
     ├── Local storage: Activities, Leads cache, Progression
     │
     ▼
Express Proxy → Twenty CRM REST API
     │
     ├── /rest/repProgressions - XP/Rank sync
     ├── /rest/callRecords - Call history
     └── /rest/notes - Activity sync
```

### Sync Queue Pattern
- Auto-sync every 30 seconds when online
- Pending operations stored in `syncQueue` table
- Retry logic on failure

---

## Quick Commands

### Development
```bash
cd apps/ads-dashboard && npm run dev   # http://localhost:3100
cd apps/compass && npm run dev         # http://localhost:3101
cd apps/redhawk-academy && npm run dev # http://localhost:3102
```

### Build
```bash
npm run build  # Outputs dist/index.cjs + dist/public/
```

### Health Check (via Terminal Claude)
```bash
ssh edwardsdavid913@<TAILSCALE_IP> "pm2 status"
curl http://<BACKEND_HOST>:3001/graphql -X POST -d '{"query":"{ __typename }"}'
```

---

## Known Issues Catalog

### Security (Project 1 - FIXED)
1. ~~API Key Exposure~~ - **FIXED** - Now env-driven
2. ~~Hardcoded IPs~~ - **FIXED** - Now env-driven
3. ~~Secrets in .env~~ - **FIXED** - .gitignore added
4. **No Auth Layer** - Still pending - All endpoints publicly accessible

### Progression System (Projects 2 & 3)
**Project 2 (Fixes) - FIXED:**
1. ~~Daily Metrics Not Populated~~ - **FIXED** - Now increments on activity
2. ~~Streak Tracking Broken~~ - **FIXED** - Updates daily with bonus XP
3. ~~Efficiency Gates Bypassed~~ - **FIXED** - Passed to rank checks
4. ~~Boss Duplicate XP~~ - **FIXED** - Early return prevents duplicates

**Project 3 (SSOT) - CODE READY:**
1. ~~Two XP Totals~~ - **CODE READY** - Twenty is SSOT, needs deploy
2. ~~Dialer XP Local Only~~ - **CODE READY** - Syncs after every XP event
3. ~~No Periodic Sync~~ - **CODE READY** - Every 5 minutes + post-XP debounce
4. ~~Boss/Exam Results Split~~ - **CODE READY** - All fields synced to Twenty

**Deploy Command:**
```bash
git add -A && git commit -m "feat: wire Twenty progression sync" && git push
ssh root@165.227.111.24 "cd /var/www/lids && git pull && cd apps/ads-dashboard && npm run build && pm2 restart lids"
```

### Architecture
1. **In-Memory Storage** - COMPASS/RedHawk use MemStorage, no persistence
2. **No Rate Limiting** - API endpoints unprotected
3. **Voice Service** - WebSocket transcription referenced but not implemented

---

## Environment Variables

### Required for ADS Dashboard
```env
PORT=5000
BACKEND_HOST=<tailscale_ip>     # REQUIRED - server fails without this
TWENTY_API_KEY=<jwt_token>      # Server-side only
```

### Client-Side (VITE_ prefix)
```env
VITE_BACKEND_HOST=<tailscale_ip>
VITE_TWENTY_CRM_HOST=<tailscale_ip>
VITE_TWENTY_CRM_PORT=3001
VITE_EXTERNAL_DOMAIN=ripemerchant.host
VITE_TWENTY_API_KEY=<jwt_token>  # Only if needed for direct calls
```

---

## Testing Mental Model

```
Before: "Does the backend work?"
After:  "Does the REP see what they need to see?"

Frontend is the product.
Backend is infrastructure.
Test from the UI down.
```

---

## MCP Network Access

You have access to persistent memory and agents via admiral-server:

| Resource | Port | Purpose |
|----------|------|---------|
| **Oracle** | 4050 | Semantic search across memories |
| **Guardian MCP** | - | Orchestration layer |
| **GIDEON** | 4100 | Executive AI context |
| **LiveWire** | 5000 | Sales AI context |

**SSH Access:**
- Droplet: `ssh root@165.227.111.24`
- admiral-server: `ssh edwardsdavid913@192.168.1.23`

Use these resources rather than guessing - you have access to multiple agent memories and semantic search.

---

*Last Updated: December 29, 2025*

**Active Projects:**
- *Project 14: Studio Dashboard Redesign - PHASE 1 COMPLETE*
- *Project 19: Unified Architecture - PHASE 2 IN PROGRESS*

**Recently Completed:**
- *Project 15: Dialer Data Architecture - ALL COMPLETE*
- *Project 16: Admiral Chat - PHASE 4 COMPLETE (ready for testing)*
- *Project 17: COMPASS Micro-Agents - PHASE 1 COMPLETE*
- *Project 20: Documentation Overhaul - ALL COMPLETE*
