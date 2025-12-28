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
│                                                                              │
│  ✅ Twenty CRM (twenty.ripemerchant.host) = single source of user access    │
│  ✅ Once invited to Twenty workspace → access to all LIDS dashboards         │
│  ✅ Revoke access via Twenty → user loses dashboard access                   │
│  ✅ Magic links for temporary/special access if needed                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Historical Context

**V1 (HELM)** used Supabase + HELM Registry + Vercel for auth. It was an **auth nightmare**:
- Users couldn't access ADS at all
- Weeks wasted on auth issues instead of building features
- Complex invite flows that broke constantly

**V2 (LIDS)** uses **Twenty CRM as the sole identity provider**:
- Users log into `twenty.ripemerchant.host` and accept workspace invite
- All LIDS dashboards check Twenty for auth (not HELM_USERS arrays!)
- Owner can revoke access directly in Twenty
- No complex flows, no admin approval required for dashboard access

### App-to-Auth Mapping

| App | Domain | Auth Method | Status |
|-----|--------|-------------|--------|
| ADS (Sales) | lids.ripemerchant.host | EXECUTIVE_EMAILS (hardcoded) | NEEDS FIX |
| Studio (Marketing) | studio.ripemerchant.host | `/api/twenty/auth` + `inferRole()` | WORKING |
| COMPASS (AI) | compass.ripemerchant.host | `/api/twenty/auth` + `inferRole()` | WORKING |
| Academy | academy.ripemerchant.host | HELM_USERS (hardcoded) | NEEDS FIX |

**Role Routing:** After Twenty auth, use `inferRole(email)` to route users to their appropriate dashboard.

**Reference pattern (Studio/COMPASS):**
```typescript
// Server: /api/twenty/auth
const member = members.find(m => m.userEmail?.toLowerCase() === email.toLowerCase());

// Client: inferRole()
function inferRole(email: string): "owner" | "coo" | "cmo" | "rep" {
  if (email === "davide@admiralenergy.ai") return "owner";
  if (email === "nathanielj@admiralenergy.ai") return "coo";
  if (email === "leighe@ripemerchant.host") return "cmo";
  return "rep";
}
```

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
│   └── 11-compass-auth-unification/ # COMPASS Twenty Auth
│
├── 4/                            # Professional Dialer System (PARTIAL)
├── 5/                            # REAL Sales Tool (IN PROGRESS)
├── 7-unified-progression/        # Unified Progression (PHASE A READY)
├── 9-studio-dashboard-launch/    # Studio Dashboard Launch (PLANNING)
├── 10-studio-consolidation/      # Studio Consolidation (IN PROGRESS)
├── 12-ads-auth-unification/      # ADS Twenty Auth (PENDING)
└── 13-academy-auth-unification/  # Academy Twenty Auth (PENDING)
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
│   │   └── server/         # Express proxy + API
│   │
│   ├── compass/            # COMPASS PWA - AI agent chat window
│   │   ├── client/src/
│   │   └── server/
│   │
│   ├── studio/             # Marketing dashboard v1 (LIVE)
│   │   ├── client/src/     # Sarai/Muse chat, quick post
│   │   └── server/
│   │
│   ├── studio-dashboard/   # Marketing dashboard v2 (IN DEV)
│   │   ├── client/src/     # Uses shared COMPASS packages
│   │   └── server/
│   │
│   └── redhawk-academy/    # Training gamification
│       ├── client/src/
│       └── server/
│
├── packages/               # Shared COMPASS components
│   ├── compass-core/       # ChatWindow, CompassProvider, hooks
│   ├── compass-studio/     # Studio-specific agents (Sarai, Muse)
│   └── compass-sales/      # Sales-specific agents
│
├── projects/               # Audit & implementation projects
│   ├── completed/          # Finished projects archive
│   └── ...                 # Active projects
│
└── docs/
    └── architecture/       # System truth documents
```

### App Inventory

| App | Type | Domain | Port | Status |
|-----|------|--------|------|--------|
| **ADS** | Sales Dashboard | lids.ripemerchant.host | 5000 | LIVE |
| **Studio v1** | Marketing Dashboard | studio.ripemerchant.host | 3103 | LIVE |
| **Studio v2** | Marketing Dashboard | - | 3103 | IN DEV |
| **COMPASS** | AI Agent Window | compass.ripemerchant.host | 3101 | LIVE |
| **Academy** | Training Dashboard | academy.ripemerchant.host | 3102 | LIVE |

**Key Distinction:**
- **Dashboards** (ADS, Studio, Academy) = Full apps with features, tools, data
- **COMPASS** = AI chat interface that can be embedded in dashboards or standalone

---

## Current Project Status

| Project | Name | Status | Location |
|---------|------|--------|----------|
| 1 | Security & Configuration | **COMPLETED** | `projects/completed/1/` |
| 2 | Progression Fixes | **COMPLETED** | `projects/completed/2/` |
| 3 | Progression SSOT | **CODE READY** | `projects/completed/3/` |
| 7 | Unified Progression | **IN PROGRESS** | `projects/7-unified-progression/` |
| 9 | Studio Dashboard Launch | **COMPLETED** | `projects/completed/9-studio-dashboard-launch/` |
| 11 | COMPASS Auth Unification | **COMPLETED** | `projects/completed/11-compass-auth-unification/` |
| 12 | ADS Auth Unification | **PENDING** | `projects/12-ads-auth-unification/` |
| 13 | Academy Auth Unification | **PENDING** | `projects/13-academy-auth-unification/` |

### Project 1 Results (Completed Dec 25, 2025)
- Removed embedded API keys from client bundles
- Replaced hardcoded IPs with env vars
- Made `BACKEND_HOST` required with clear errors
- Added `.gitignore` and `.env.example` for all apps

### Project 2 Results (Completed Dec 25, 2025)
- Wired up daily metrics increment on all activities
- Passed efficiency metrics to rank eligibility checks
- Implemented streak tracking with bonus XP
- Fixed boss duplicate XP bug
- Added XP event type validation
- Fixed specialization alias matching

### Project 3 Results (Code Ready - Pending Deploy)
- Twenty CRM `repProgressions` object exists on droplet (verified via API)
- Sync code wired into `useProgression.ts` hook
- `initializeSync()` + `startPeriodicSync(5 min)` on app load
- `syncToTwenty()` called after XP changes (2s debounce)
- **Status:** Needs `git push` + deploy to droplet to activate

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

### Port Reference

| Service | Port | Location | Purpose |
|---------|------|----------|---------|
| ADS Dashboard | 3100 (dev) / 5000 (prod) | DO Droplet | Main HELM app |
| COMPASS | 3101 | DO Droplet | AI agents UI |
| RedHawk Academy | 3102 | DO Droplet | Training app |
| Twenty CRM | 3001 | **DO Droplet** | Lead management (Docker) |
| Twilio Service | 4115 | admiral-server | Voice SDK tokens |
| Voice Service | 4130 | admiral-server | Transcription |
| COMPASS Agents | 4098 | admiral-server | AI agent cluster |
| RedHawk Agent | 4096 | admiral-server | Training AI |
| N8N Workflows | 5678 | admiral-server | Automation |

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

### Project 9 Results (Completed Dec 28, 2025)
- Launched Studio at `studio.ripemerchant.host` (standalone, not embedded in ADS)
- Created Cloudflare DNS A record (proxied)
- Fixed PM2 cwd issue for dotenv to find `.env`
- Fixed branding: "MARKETING COMPASS" → "STUDIO"
- Full documentation in `apps/studio/README.md`

### Project 11 Results (Completed Dec 28, 2025)
- Added `/api/twenty/auth` endpoint to COMPASS server
- Replaced HELM_USERS with `fetchTwentyUser()` + `inferRole()`
- Updated LoginScreen to use email input form
- Deleted duplicate auth files
- Twenty API note: uses `userEmail` not `email` field

---

*Last Updated: December 28, 2025*
*Project 1: Security - COMPLETED*
*Project 2: Progression Fixes - COMPLETED*
*Project 3: Progression SSOT - CODE READY (pending deploy)*
*Project 7: Unified Progression - IN PROGRESS*
*Project 9: Studio Dashboard Launch - COMPLETED*
*Project 11: COMPASS Auth - COMPLETED*
