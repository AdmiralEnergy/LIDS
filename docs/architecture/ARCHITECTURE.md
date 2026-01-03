# LIDS Monorepo - Service Architecture

**Version:** 3.2 | **Updated:** January 3, 2026

---

## Overview

LIDS (Live Interactive Dashboard) is a monorepo containing all user-facing applications for Admiral Energy. Core functionality runs on the DO Droplet standalone; admiral-server provides optional AI/voice enhancements.

---

## Infrastructure Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       ADMIRAL ENERGY INFRASTRUCTURE                               │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│                               INTERNET                                            │
│                                   │                                               │
│                     ┌─────────────┴─────────────┐                                │
│                     │                           │                                 │
│                     ▼                           ▼                                 │
│    ┌────────────────────────┐    ┌────────────────────────┐                      │
│    │    DO DROPLET          │    │   ORACLE CLOUD ARM     │                      │
│    │    165.227.111.24      │    │   193.122.153.249      │                      │
│    │    (LIDS Production)   │    │   (Compute + Postiz)   │                      │
│    │    4GB / 2 vCPU / $24  │    │   24GB / 4 OCPU / FREE │                      │
│    └───────────┬────────────┘    └───────────┬────────────┘                      │
│                │                             │                                    │
│   ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ HOME NETWORK ─ ─ ─ ─ ─ ─  │
│                │                             │                                    │
│                ▼                             ▼                                    │
│    ┌─────────────────────────────────────────────────────────────────────────┐   │
│    │                         admiral-server                                   │   │
│    │                         192.168.1.23                                     │   │
│    │                         (CANONICAL RUNTIME)                              │   │
│    │                                                                          │   │
│    │   Agent-Claude (4110) │ Oracle (4050) │ LiveWire (5000) │ n8n (5678)   │   │
│    └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Node Summary

| Node | IP | Role | Cost |
|------|-----|------|------|
| **DO Droplet** | 165.227.111.24 | LIDS Production (all apps + Twenty CRM) | $24/mo |
| **admiral-server** | 192.168.1.23 | AI agents, voice services, n8n | (local) |
| **lifeos-arm** | 193.122.153.249 | LLM (Ollama) + Postiz + Command Dashboard + Grid Engine | FREE |

---

## Three Pillars

LIDS is built on three core pillars that address why 70% of solar sales reps quit within the first month:

| Pillar | Purpose | Implementation |
|--------|---------|----------------|
| **LEADS** | Reps have something to call on Day 1 | PropStream imports with TCPA compliance |
| **STRUCTURE** | Just show up and press dial | Dialer, agents, training via RedHawk Academy |
| **PROGRESSION** | Show improvement BEFORE first sale | XP system with diagnostic metrics |

**Progression is diagnostic data, not gamification.** Efficiency badges tell both rep AND leadership where training focus is needed.

---

## Apps Inventory (7 total)

| App | Port (Dev/Prod) | URL | Status | Purpose |
|-----|-----------------|-----|--------|---------|
| **ads-dashboard** | 3100/5000 | helm.ripemerchant.host | LIVE | Sales CRM + Dialer |
| **studio** | 3103/3103 | studio.ripemerchant.host | LIVE | Marketing Dashboard |
| **compass** | 3101/3101 | compass.ripemerchant.host | LIVE | AI Rep Assistant (PWA) |
| **redhawk-academy** | 3102/3102 | academy.ripemerchant.host | LIVE | Sales Training |
| **twenty-crm** | -/3001 | twenty.ripemerchant.host | LIVE | CRM (Docker) |
| **admiral-chat** | - | (package) | Phase 4 | Team Messaging |
| **lids-unified** | 5001/5000 | (planned) | Phase 2 | Unified API Gateway |

### App Details

- **ads-dashboard**: Power dialer, lead management, progression system, call history
- **studio**: Marketing dashboard for CMO (Leigh), content calendar, MUSE/Sarai agents
- **compass**: Mobile PWA for field reps, AI coaching, objection handling
- **redhawk-academy**: Sales training, modules, exams, boss battles, certifications
- **twenty-crm**: Self-hosted CRM (Docker), single source of truth for auth and data
- **admiral-chat**: Shared package for team messaging across all apps
- **lids-unified**: (In Progress) Unified server to consolidate all apps into single process

---

## Packages Inventory (5 total)

| Package | Location | Purpose | Status |
|---------|----------|---------|--------|
| **@lids/admiral-chat** | `packages/admiral-chat/` | Team chat components + hooks | MVP Complete |
| **@lids/compass-core** | `packages/compass-core/` | Base agent framework | Stable |
| **@lids/compass-sales** | `packages/compass-sales/` | Sales agents (Coach, Intel, Guard) | Phase 1 Complete |
| **@lids/compass-studio** | `packages/compass-studio/` | Marketing agents (Sarai, MUSE) | Planning |
| **shared** | `packages/shared/` | Common utilities | Placeholder |

---

## Service Inventory

### DO Droplet (165.227.111.24)

| Service | Port | Type | PM2 Name | Role |
|---------|------|------|----------|------|
| lids | 5000 | Node.js | lids | Sales dashboard |
| studio | 3103 | Node.js | studio | Marketing dashboard |
| compass | 3101 | Node.js | compass | AI chat PWA |
| redhawk | 3102 | Node.js | redhawk | Training academy |
| twenty-server | 3001 | Docker | - | Auth + CRM (SSOT) |
| twenty-db | - | Docker | - | PostgreSQL |
| twenty-redis | - | Docker | - | Redis cache |

**Note:** Postiz migrated to lifeos-arm (Oracle Cloud) on 2026-01-03 to free droplet memory.

### admiral-server (192.168.1.23) - OPTIONAL

| Service | Port | Tailscale | Purpose |
|---------|------|-----------|---------|
| twilio-service | 4115 | 100.66.42.81:4115 | Browser Twilio calling |
| voice-service | 4130 | 100.66.42.81:4130 | STT (faster-whisper) + TTS |
| agent-claude | 4110 | 100.66.42.81:4110 | Primary MCP server |
| redhawk-agent | 4096 | 100.66.42.81:4096 | Boss battles, exams |
| sarai | 4065 | 100.66.42.81:4065 | Content creation agent |
| muse | 4066 | 100.66.42.81:4066 | Strategy planning agent |
| gideon | 4100 | 100.66.42.81:4100 | Executive AI (David) |
| livewire | 5000 | 100.66.42.81:5000 | Sales AI (Nate) |

### lifeos-arm (193.122.153.249) - Oracle Cloud ARM

High-memory ARM compute node for LLM inference, Postiz social scheduling, and compute-intensive services.

| Service | Port | Type | Purpose |
|---------|------|------|---------|
| Ollama | 11434 | Native (systemd) | Self-hosted LLM inference |
| Postiz | 3200 | Docker | Social media scheduling |
| Command Dashboard | 3104 | (planned) | Fleet command center |
| Grid Engine | 4120 | (planned) | NC/Duke grid readiness |

**Docker Containers:**
```bash
# Postiz stack
postiz            # Main app (ghcr.io/gitroomhq/postiz-app:latest)
postiz-postgres   # PostgreSQL 17
postiz-redis      # Redis 7.2
```

**Ollama Models:**
- DeepSeek R1 14B (Q4_K_M, 9GB)

**Usage:**
```bash
# Ollama - Generate text
curl http://193.122.153.249:11434/api/generate \
  -d '{"model":"deepseek-r1:14b","prompt":"Hello","stream":false}'

# Ollama - OpenAI-compatible endpoint
curl http://193.122.153.249:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-r1:14b","messages":[{"role":"user","content":"Hello"}]}'

# Postiz
http://193.122.153.249:3200
```

**SSH Access:**
```bash
# From admiral-server only (key stored there)
ssh -i ~/.ssh/oci_arm ubuntu@193.122.153.249

# Docker management
sudo docker ps
sudo docker-compose -f ~/postiz/docker-compose.yml logs
```

---

## Key Architecture Decisions

### Twenty CRM Location

**Twenty CRM runs ONLY on the DO Droplet.** No admiral-server instance.

| Property | Value |
|----------|-------|
| Host | localhost:3001 (on droplet) |
| External URL | https://twenty.ripemerchant.host |
| Docker containers | twenty-server, twenty-worker, twenty-db, twenty-redis |
| Config location | `/var/www/lids/apps/twenty-crm/` |
| Google Calendar | Enabled (OAuth via Google Cloud project "HELM") |

### Google OAuth Configuration

Twenty supports native Google Calendar sync via Google Cloud project `HELM` (helm-481601).

**Required Redirect URIs in Google Cloud Console:**
- `https://twenty.ripemerchant.host/auth/google/redirect` (SSO)
- `https://twenty.ripemerchant.host/auth/google-apis/get-access-token` (Calendar/Gmail)

**Environment Variables:**
```
AUTH_GOOGLE_ENABLED=true
AUTH_GOOGLE_CLIENT_ID=700941965486-...apps.googleusercontent.com
AUTH_GOOGLE_CLIENT_SECRET=GOCSPX-...
AUTH_GOOGLE_CALLBACK_URL=https://twenty.ripemerchant.host/auth/google/redirect
AUTH_GOOGLE_APIS_CALLBACK_URL=https://twenty.ripemerchant.host/auth/google-apis/get-access-token
CALENDAR_PROVIDER_GOOGLE_ENABLED=true
```

Users connect via **Settings → Accounts → Calendars → New account**.

### Standalone Operation

LIDS Dashboard works with ONLY the droplet:

| Feature | Standalone? | Notes |
|---------|------------|-------|
| Lead management | Yes | Twenty CRM on droplet |
| Native phone calls | Yes | Uses tel: links with timer tracking |
| Call disposition | Yes | Auto-disposition logs to Twenty CRM |
| XP/Progression | Yes | IndexedDB + Twenty sync |
| Team chat | Yes | Admiral Chat (in-memory) |
| Calendar sync | Yes | Google Calendar via OAuth |
| SMS (toll-free) | Yes* | Via twilio-service, messages persist locally |
| Browser calling | No | Requires Twilio Service |
| Live transcription | No | Requires Voice Service |

*SMS requires admiral-server for send, but messages persist in IndexedDB

---

## Authentication Architecture

**Twenty CRM is the single source of truth for authentication across all LIDS apps.**

See [AUTH.md](./AUTH.md) for full documentation.

### User Identity

| Identifier | Type | Purpose |
|------------|------|---------|
| `workspaceMemberId` | UUID | **Permanent** - never changes, links all data |
| `email` | string | **Mutable** - lookup key at login only |
| `name` | string | **Mutable** - display name |

### Login Flow

```
1. User enters email on login screen
2. App queries: GET /rest/workspaceMembers
3. Find member by email → extract workspaceMemberId
4. Store workspaceMemberId in localStorage
5. User is logged in across all LIDS apps
```

### Access Control

| Action | How |
|--------|-----|
| Grant access | Invite to Twenty workspace |
| Revoke access | Remove from Twenty workspace |

---

## Admiral Chat Architecture

Admiral Chat provides team messaging across all LIDS apps.

### Storage

- **MVP (Current)**: In-memory storage in ADS Dashboard backend
- **Planned**: PostgreSQL persistence (Project 16 Phase 8)

### Deployment

| App | Route | Backend |
|-----|-------|---------|
| ADS Dashboard | `/chat` | Direct (chat-routes.ts) |
| Studio | `/team` | Proxy to ADS |
| Academy | (v2) | Proxy to ADS |
| COMPASS | (v2) | Proxy to ADS |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat/channels` | GET/POST | List/create channels |
| `/api/chat/channels/:id/messages` | GET/POST | Get/send messages |
| `/api/chat/channels/:id/read` | POST | Mark as read |
| `/api/chat/poll` | GET | Poll for updates |
| `/api/chat/sms/inbound` | POST | Route SMS to chat |
| `/api/chat/sequence/notification` | POST | n8n cadence notifications |

### Default Channels

Auto-seeded: #general, #sales, #marketing, #sms-inbox

---

## Dialer Component Architecture

The mobile-first dialer uses a component hierarchy optimized for sales rep workflow:

```
MobileDialer.tsx              <- Main container, state management
├── CompactHUD.tsx            <- XP bar, rank, streak, caller ID
├── LeadCardStack.tsx         <- Swipeable card stack
│   └── LeadCard.tsx          <- Individual lead with multi-phone
├── CallControls.tsx          <- Dial/mute/hangup buttons
├── MobileDispositionPanel.tsx <- Post-call disposition
├── ActionPanel.tsx           <- SMS drawer with message history
├── LeadProfile.tsx           <- Full lead view (notes, history)
└── EmailComposer.tsx         <- Email composition
```

### Key Features

| Feature | Implementation |
|---------|---------------|
| Lead filtering | Only leads WITH phone numbers shown |
| ICP sorting | Highest score first (descending) |
| Multi-phone | All 12 fields: cell1-4, landline1-4, phone1-2 |
| Phone mode toggle | Switch between Twilio (browser) and Device (native) |
| Auto-disposition | Duration + transcription analysis |
| Call history | `/call-history` page with filters |

---

## SMS Architecture

### Configuration

| Setting | Value |
|---------|-------|
| Default Number | +1 (833) 385-6399 (toll-free) |
| Send Endpoint | `/twilio-api/sms/send` -> twilio-service:4115 |
| Persistence | Dexie smsMessages table (IndexedDB) |

### Flow

```
Client (useSms.ts) -> LIDS Server -> twilio-service:4115 -> Twilio API -> Phone
```

---

## Studio Dashboard Architecture

Studio is the marketing dashboard for Leigh (CMO).

### Twenty CRM Custom Objects

| Object | Purpose |
|--------|---------|
| `studioContentItem` | Content pieces to create/post |
| `studioWeeklyPlan` | MUSE weekly suggestions |
| `marketingProgression` | Marketing XP, ranks, badges |

### Agents

| Agent | Port | Purpose |
|-------|------|---------|
| Sarai | 4065 | Content creation (TikTok, LinkedIn) |
| MUSE | 4066 | Strategy planning, content calendar |

### Planned: Postiz Integration

Postiz (self-hosted social scheduler) will run on admiral-server at port 3200, proxied via Studio.

---

## Progression System

See [PROGRESSION_SYSTEM.md](../PROGRESSION_SYSTEM.md) for complete documentation.

### Twenty CRM Schema (repProgressions)

| Field | Type | Synced to Twenty |
|-------|------|------------------|
| id | UUID | Yes |
| workspaceMemberId | UUID | Yes |
| totalXp | number | Yes |
| currentLevel | number | Yes |
| currentRank | string | Yes (E-1 to E-7) |
| badges | JSON | Yes |
| streakDays | number | Yes |
| defeatedBosses | JSON | No (local only) |
| completedModules | JSON | No (local only) |
| efficiencyMetrics | JSON | No (local only) |

---

## Project Status Summary

| Project | Status | Notes |
|---------|--------|-------|
| 15: Dialer Data | **COMPLETE** | Login + Call History + Progression Sync |
| 16: Admiral Chat | **Phase 4** | Ready for testing |
| 17: COMPASS Agents | Phase 1 | Coach wired, Intel next |
| 19: Unified Architecture | Phase 2 | Server scaffolded |

---

## Failure Modes

### admiral-server Down (Graceful Degradation)

When admiral-server is unreachable:
1. Dialer switches to tel: links (native phone)
2. No live transcription (manual notes)
3. CRM, XP, and team chat continue working

---

## Environment Configuration

### Required (.env)

```bash
NODE_ENV=production
PORT=5000
TWENTY_CRM_URL=http://localhost:3001
TWENTY_API_KEY=your_api_key_here
```

### Optional (for AI/voice features)

```bash
VOICE_SERVICE_URL=http://100.66.42.81:4130
TWILIO_SERVICE_URL=http://100.66.42.81:4115
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [AUTH.md](./AUTH.md) | Complete authentication architecture |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Deployment procedures |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Issue resolution |
| [PROGRESSION_SYSTEM.md](../PROGRESSION_SYSTEM.md) | XP/rank system |
| [../../CLAUDE.md](../../CLAUDE.md) | Development guidelines |

---

*Last Updated: January 2, 2026*
