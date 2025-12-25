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

### What Terminal Claude Does
- MCP tool coordination
- SSH to admiral-server (192.168.1.23 / 100.66.42.81)
- Multi-agent workflows and orchestration
- PM2 service management
- Cross-system operations

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
├── docs/
│   ├── architecture/       # System truth documents
│   └── Sales Framework/    # Business logic docs
│
└── packages/               # Shared packages (if any)
```

---

## Current Focus: Migration & Security

The LIDS system recently migrated from local hosting to Digital Ocean. Key issues identified:

### Critical Security Issues

| Issue | File | Line | Action Required |
|-------|------|------|-----------------|
| API key in client bundle | `apps/ads-dashboard/client/src/lib/settings.ts` | 47 | Move to server-side |
| API key in client bundle | `apps/redhawk-academy/client/src/lib/twentyProgressionApi.ts` | 21 | Move to server-side |
| No authentication | All apps | - | Implement auth layer |

### Hardcoded Values to Fix

| Pattern | Location | Recommended Fix |
|---------|----------|-----------------|
| `192.168.1.23` | settings.ts:50, vite.config.ts, routes.ts | Use `VITE_BACKEND_HOST` env var |
| `100.66.42.81` | server/index.ts:13 | Use `BACKEND_HOST` env var |
| `ripemerchant.host` | settings.ts:30, 36 | Extract to `VITE_EXTERNAL_DOMAIN` |

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
ssh edwardsdavid913@192.168.1.23 "pm2 status"
curl http://192.168.1.23:3001/graphql -X POST -d '{"query":"{ __typename }"}'
```

---

## Known Issues Catalog

### Security
1. **API Key Exposure** - JWT tokens embedded in client bundles
2. **No Auth Layer** - All endpoints publicly accessible
3. **Secrets in .env** - Some .env files committed to repo

### Configuration
1. **Hardcoded IPs** - LAN and Tailscale IPs in source code
2. **Inconsistent Env Vars** - Different naming across apps
3. **Missing .env.example** - Some required vars undocumented

### Architecture
1. **In-Memory Storage** - COMPASS/RedHawk use MemStorage, no persistence
2. **No Rate Limiting** - API endpoints unprotected
3. **Voice Service** - WebSocket transcription referenced but not implemented

---

## Environment Variables

### Required for ADS Dashboard
```env
PORT=5000
BACKEND_HOST=100.66.42.81        # or 192.168.1.23 for LAN
TWENTY_CRM_URL=http://...        # Override default
VOICE_SERVICE_URL=http://...
TWILIO_SERVICE_URL=http://...
TWENTY_API_KEY=eyJhbGci...       # Server-side only
```

### Client-Side (VITE_ prefix)
```env
VITE_TWENTY_CRM_HOST=192.168.1.23
VITE_TWENTY_CRM_PORT=3001
VITE_TWILIO_PORT=4115
VITE_TRANSCRIPTION_PORT=4130
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
*Review: Architecture audit completed*
