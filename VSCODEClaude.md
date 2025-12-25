# VS Code Claude Protocol

**Operational Protocol for VS Code Claude Instance in LIDS Repository**

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

## Project Workflow

### Every Planned Task Requires a Project Folder

**Location:** `projects/<number>/`

**Required Files:**
```
projects/
├── 1/                          # Security & Configuration (COMPLETED)
│   ├── README.md               # Project status summary
│   ├── AUDIT_FINDINGS.md       # Detailed findings with file:line refs
│   └── CODEX_IMPLEMENTATION_PLAN.md  # Task-by-task instructions
│
├── 2/                          # Progression Fixes (COMPLETED)
│   ├── README.md
│   ├── AUDIT_FINDINGS.md
│   └── CODEX_IMPLEMENTATION_PLAN.md
│
├── 3/                          # Progression SSOT (READY)
│   ├── AUDIT_FINDINGS.md
│   └── CODEX_IMPLEMENTATION_PLAN.md
│
└── <next>/
    ├── AUDIT_FINDINGS.md       # What was found, severity, impact
    └── CODEX_IMPLEMENTATION_PLAN.md  # Executable tasks for Codex
```

### Codex Workflow

When Codex is working on a project:

1. **Codex updates the prompt** with completion status as it works
2. **Mark tasks as COMPLETE** when done
3. **Mark blockers** if something prevents completion
4. **Add "Changes" section** listing files modified
5. **Add "Next Steps"** for verification or follow-up

**Prompt Update Format:**
```markdown
## Status: IN PROGRESS / COMPLETED

### Task Completion Status
| Task | Description | Status |
|------|-------------|--------|
| 1 | Remove API key | **COMPLETE** |
| 2 | Fix hardcoded IP | **BLOCKED** - needs X |

### Changes
- `file.ts` - Description of change

### Next Steps
1. Run verification
2. Test startup
```

### Project Lifecycle

1. **Audit** - VS Code Claude explores, documents findings
2. **Plan** - Create CODEX_IMPLEMENTATION_PLAN.md with tasks
3. **Execute** - Codex works through tasks, updates prompt
4. **Complete** - Mark AUDIT_FINDINGS.md as complete, create README.md
5. **Archive** - Project folder remains as historical record

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
│   ├── ads-dashboard/      # Primary - HELM dialer + CRM
│   │   ├── client/src/     # React frontend (main work area)
│   │   └── server/         # Express proxy + API
│   │
│   ├── compass/            # AI agents for field ops
│   │   ├── client/src/
│   │   └── server/
│   │
│   └── redhawk-academy/    # Training gamification
│       ├── client/src/
│       └── server/
│
├── projects/               # Audit & implementation projects
│   ├── 1/                  # Security (COMPLETED)
│   ├── 2/                  # Progression Fixes (COMPLETED)
│   └── 3/                  # Progression SSOT (READY)
│
├── docs/
│   ├── architecture/       # System truth documents
│   └── Sales Framework/    # Business logic docs
│
└── packages/               # Shared packages (if any)
```

---

## Current Project Status

| Project | Name | Status | Location |
|---------|------|--------|----------|
| 1 | Security & Configuration | **COMPLETED** | `projects/1/` |
| 2 | Progression Fixes | **COMPLETED** | `projects/2/` |
| 3 | Progression SSOT | **COMPLETED** | `projects/3/` |

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

### Project 3 Results (Completed Dec 25, 2025)
- Twenty CRM is now Single Source of Truth for progression
- Full bidirectional sync for all progression fields
- Periodic sync every 5 minutes + debounced post-XP sync
- Offline queue with retry logic for sync failures
- Efficiency metrics synced to Twenty

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
| Twenty CRM | 3001 | admiral-server | Lead management |
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

**Project 3 (SSOT) - FIXED:**
1. ~~Two XP Totals~~ - **FIXED** - Twenty is SSOT, bidirectional sync
2. ~~Dialer XP Local Only~~ - **FIXED** - Syncs after every XP event
3. ~~No Periodic Sync~~ - **FIXED** - Every 5 minutes + post-XP debounce
4. ~~Boss/Exam Results Split~~ - **FIXED** - All fields synced to Twenty

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

*Last Updated: December 25, 2025*
*Project 1: Security - COMPLETED*
*Project 2: Progression Fixes - COMPLETED*
*Project 3: Progression SSOT - COMPLETED*
