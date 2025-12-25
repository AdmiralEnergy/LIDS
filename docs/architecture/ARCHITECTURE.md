# LIDS Monorepo - Service Architecture

**Version:** 1.0 | **Updated:** December 24, 2025

---

## Overview

LIDS (Live Interactive Dashboard) is a monorepo containing three frontend applications that connect to backend services on admiral-server (192.168.1.23).

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLOUDFLARE TUNNEL                                   │
│                        (lifeos-tunnel via PM2)                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  helm.ripemerchant.host     → localhost:3100 (helm-dashboard)                   │
│  twenty.ripemerchant.host   → localhost:3001 (Twenty CRM)                       │
│  agents.ripemerchant.host   → localhost:4110 (Agent-Claude MCP)                 │
│  compass.ripemerchant.host  → localhost:3101 (Compass PWA)                      │
│  academy.ripemerchant.host  → localhost:3102 (RedHawk Academy)                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ADMIRAL-SERVER (192.168.1.23)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         HELM-DASHBOARD (:3100)                           │   │
│  │                   Express + React (Built from ads-dashboard)             │   │
│  │  Location: /home/edwardsdavid913/apps/helm-dashboard/dist/index.cjs      │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │   PROXY LAYER (http-proxy-middleware)                                   │   │
│  │   ├── /twenty-api → http://localhost:3001 (Twenty CRM)                  │   │
│  │   ├── /twilio-api → http://localhost:4115 (Twilio Service)              │   │
│  │   └── /voice-api  → http://localhost:4130 (Voice Service)               │   │
│  │                                                                          │   │
│  │   API ROUTES (server/routes.ts)                                         │   │
│  │   ├── /api/leads           → Local storage + Twenty sync                │   │
│  │   ├── /api/activities      → Activity logging                           │   │
│  │   ├── /api/twenty/graphql  → GraphQL passthrough to Twenty              │   │
│  │   ├── /api/twenty/status   → Twenty health check                        │   │
│  │   └── /api/import/leads    → CSV import pipeline                        │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│       ┌───────────────────────────────┼───────────────────────────────┐         │
│       ▼                               ▼                               ▼         │
│  ┌────────────┐                ┌────────────┐                ┌────────────┐    │
│  │ TWENTY CRM │                │  TWILIO    │                │   VOICE    │    │
│  │   (:3001)  │                │  SERVICE   │                │  SERVICE   │    │
│  │            │                │  (:4115)   │                │  (:4130)   │    │
│  ├────────────┤                ├────────────┤                ├────────────┤    │
│  │ Docker     │                │ Node.js    │                │ Python     │    │
│  │ Container  │                │ Express    │                │ FastAPI    │    │
│  │            │                │            │                │            │    │
│  │ PostgreSQL │                │ Endpoints: │                │ Endpoints: │    │
│  │ + Redis    │                │ POST/token │                │ /health    │    │
│  │            │                │ GET/history│                │ /transcribe│    │
│  │ GraphQL    │                │ GET/stats  │                │ /synthesize│    │
│  │ REST API   │                │ POST/voice │                │ /voices    │    │
│  └────────────┘                └────────────┘                └────────────┘    │
│                                       │                                          │
│                                       ▼                                          │
│                           ┌────────────────────┐                                │
│                           │     SUPABASE       │                                │
│                           │  (Cloud + Local)   │                                │
│                           │                    │                                │
│                           │ Tables:            │                                │
│                           │ - dial_attempts    │                                │
│                           │ - call_recordings  │                                │
│                           │ - voicemail_drops  │                                │
│                           └────────────────────┘                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
LIDS-monorepo/
├── apps/
│   ├── ads-dashboard/          # ADS Dashboard (HELM) - CRM, Dialer, Leads
│   │   ├── client/             # React frontend (Vite)
│   │   │   └── src/
│   │   │       ├── hooks/      # useDialer, useTranscription
│   │   │       ├── lib/        # db.ts, settings.ts, twentySync.ts
│   │   │       ├── pages/      # dashboard, dialer, crm, activity
│   │   │       └── providers/  # twentyDataProvider.ts
│   │   ├── server/             # Express backend
│   │   │   ├── index.ts        # Entry point, proxy setup
│   │   │   ├── routes.ts       # API routes
│   │   │   └── storage.ts      # Local persistence
│   │   └── shared/             # Drizzle schema
│   │
│   ├── compass/                # COMPASS PWA - Mobile Rep AI Partner
│   └── redhawk-academy/        # RedHawk Academy - Sales Training
│
├── packages/
│   └── shared/                 # (Empty - not currently used)
│
└── docs/
    └── architecture/           # This documentation
```

---

## Service Inventory (admiral-server)

### PM2 Managed Services (16 Active)

| Service | Port | Type | Purpose | Script Path |
|---------|------|------|---------|-------------|
| **helm-dashboard** | 3100 | Node.js | ADS Dashboard | `/apps/helm-dashboard/dist/index.cjs` |
| **compass-pwa** | 3101 | Node.js | Mobile PWA | `/apps/compass-pwa/dist/...` |
| **redhawk-academy** | 3102 | Node.js | Training PWA | `/apps/redhawk-academy/dist/...` |
| **twilio-service** | 4115 | Node.js | Click-to-dial | `/agents/twilio-service/src/index.js` |
| **voice-service** | 4130 | Python | STT/TTS | `/agents/voice-service/main.py` |
| **mcp-kernel** | 4000 | Node.js | Agent routing | `/agents-v7/kernel/dist/...` |
| **agent-claude** | 4110 | Node.js | Primary MCP | `/agents-v7/agent-claude/dist/...` |
| **oracle-v7** | 4050 | Node.js | Memory | `/agents-v7/oracle/dist/...` |
| **livewire-v7** | 5000 | Node.js | Sales AI | `/agents-v7/livewire/dist/...` |
| **gideon-v7** | 4100 | Node.js | Executive AI | `/agents-v7/gideon/dist/...` |
| **admiral-v7** | 4090 | Node.js | Operations | `/agents-v7/admiral/dist/...` |
| **redhawk** | 4096 | Node.js | Training AI | `/agents/redhawk/...` |
| **librarian** | 4080 | Node.js | TCPA Compliance | `/agents/librarian/...` |
| **lifeos-tunnel** | - | Bash | Cloudflare tunnel | `cloudflared tunnel run` |
| **leon-redhawk** | 1337 | Python | Voice training | `/apps/leon-redhawk/...` |
| **staging-api** | ? | Node.js | Staging | `/apps/staging-api/...` |

### Docker Containers (14 Active)

| Container | Port | Image | Purpose |
|-----------|------|-------|---------|
| **twenty-server** | 3001→3000 | twentycrm/twenty:latest | CRM UI + API |
| **twenty-worker** | - | twentycrm/twenty:latest | Background jobs |
| **twenty-db** | - | postgres:16 | Twenty's PostgreSQL |
| **twenty-redis** | - | redis:7 | Twenty's cache |
| **supabase_kong** | 54321→8000 | supabase/kong | API Gateway |
| **supabase_db** | 54322→5432 | supabase/postgres:17 | PostgreSQL |
| **supabase_studio** | 54323→3000 | supabase/studio | Dashboard |
| **supabase_auth** | - | supabase/gotrue | Auth |
| **supabase_rest** | - | supabase/postgrest | REST API |
| **supabase_realtime** | - | supabase/realtime | Websockets |
| **supabase_storage** | - | supabase/storage-api | File storage |
| **espocrm** | 8080→80 | espocrm/espocrm | Alt CRM |
| **espocrm-mysql** | - | mysql:8.0 | EspoCRM DB |

---

## Data Flow Architecture

### Local Persistence (Browser)

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER (IndexedDB)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   AdsDatabase       │    │   ADS_Progression               │ │
│  │   (Dexie)           │    │   (Dexie)                       │ │
│  ├─────────────────────┤    ├─────────────────────────────────┤ │
│  │ - activities        │    │ - progression (XP, rank, level) │ │
│  │ - leads (cached)    │    │ - xpEvents                      │ │
│  │ - syncQueue         │    │ - badgeProgress                 │ │
│  │                     │    │ - bossHistory                   │ │
│  │                     │    │ - dailyMetrics                  │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
│           │                              │                       │
│           └──────────────┬───────────────┘                       │
│                          ▼                                       │
│              ┌───────────────────────┐                          │
│              │   twentySync.ts       │                          │
│              │   Bidirectional sync  │                          │
│              │   Local ↔ Twenty CRM  │                          │
│              └───────────────────────┘                          │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           ▼
                  Twenty CRM (3001)
```

### Data Storage Locations

| Data Type | Primary Storage | Secondary | Sync Mechanism |
|-----------|-----------------|-----------|----------------|
| **Users/Auth** | Twenty CRM | - | Manual (no auth yet) |
| **Leads** | Twenty CRM | IndexedDB (cache) | twentySync.ts |
| **Activities** | Twenty CRM | IndexedDB | On create |
| **Call Records** | Supabase | IndexedDB (summary) | recordCall() |
| **XP/Progression** | IndexedDB | Twenty CRM | syncToTwenty() |
| **Settings** | localStorage | - | None |
| **Daily Metrics** | IndexedDB | - | Local only |

---

## Authentication Status

**CRITICAL: No authentication is implemented.**

### Current State
- Twenty API key is **hardcoded** in `client/src/lib/settings.ts`
- No user login/logout flow
- No session management
- No role-based access control
- Workspace member ID stored in `localStorage`

### Security Implications
1. Anyone with the URL can access the dashboard
2. API key exposed in browser source code
3. No audit trail for user actions
4. No per-user data isolation

### Future Auth Plan (Not Implemented)
```
helm_registry (Supabase) → User identity, permissions
↓
Twenty CRM workspace members → Rep assignments
↓
LIDS dashboard → Role-based views (Owner/Manager/Rep)
```

---

## Proxy Architecture

### Request Flow (External Access)

```
User (Browser)
    │
    ▼
Cloudflare Edge
    │
    ▼
Cloudflare Tunnel (bc1135f2-...)
    │
    ▼
helm-dashboard (:3100)
    │
    ├── Static files → dist/public/
    │
    ├── /api/* → Express routes
    │
    └── /twenty-api/* → http://localhost:3001
        /twilio-api/* → http://localhost:4115
        /voice-api/*  → http://localhost:4130
```

### Request Flow (Local Development)

```
Browser (localhost:3100)
    │
    ▼
Vite Dev Server
    │
    ├── HMR WebSocket
    │
    └── Proxy (vite.config.ts)
        ├── /twenty-api → http://192.168.1.23:3001
        ├── /twilio-api → http://192.168.1.23:4115
        └── /voice-api  → http://192.168.1.23:4130
```

### URL Resolution Logic (settings.ts)

```typescript
// External (*.ripemerchant.host)
getTwentyCrmUrl() → 'https://twenty.ripemerchant.host'
getTwilioUrl()    → '/twilio-api' (via proxy)
getVoiceUrl()     → '/voice-api' (via proxy)

// Development (localhost:3100)
getTwentyCrmUrl() → '/twenty-api'
getTwilioUrl()    → '/twilio-api'
getVoiceUrl()     → '/voice-api'

// LAN Direct (192.168.1.x)
getTwentyCrmUrl() → 'http://192.168.1.23:3001'
getTwilioUrl()    → 'http://192.168.1.23:4115'
getVoiceUrl()     → 'http://192.168.1.23:4130'
```

---

## Backend Service Details

### Twilio Service (:4115)

**Location:** `/home/edwardsdavid913/LifeOS-Core/agents/twilio-service/`

**Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Service health check |
| `/token` | POST | Generate Twilio access token |
| `/history` | GET | Get call history for lead |
| `/stats/today` | GET | Today's call statistics |
| `/voicemail` | POST | Drop voicemail on active call |
| `/voice/outbound` | POST | TwiML for outbound calls |

**Dependencies:**
- Twilio API credentials (in `.env`)
- Supabase (dial_attempts, call_recordings tables)
- Twilio TwiML App configured

**Environment Variables:**
```
TWILIO_ACCOUNT_SID=ACcaae94abc3...
TWILIO_AUTH_TOKEN=e2ec73f780785a...
TWILIO_API_KEY=SK181ca3a39be6cf...
TWILIO_API_SECRET=akMXDzrTP8Rzu...
TWILIO_TWIML_APP_SID=AP005eac0c6ce...
TWILIO_PHONE_NUMBER=+17047414684
SUPABASE_URL=https://nezyalicdkjxiaxshkty.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Voice Service (:4130)

**Location:** `/home/edwardsdavid913/LifeOS-Core/agents/voice-service/`

**Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Service health + available voices |
| `/transcribe` | POST | Audio → Text (faster-whisper) |
| `/synthesize` | POST | Text → Audio (Piper TTS) |
| `/voices` | GET | List available voice models |

**Dependencies:**
- faster-whisper (Python package)
- Piper TTS executable
- Voice model files (`.onnx`)

**Environment Variables:**
```
WHISPER_MODEL=base
WHISPER_DEVICE=cpu
VOICE_SERVICE_PORT=4130
PIPER_EXECUTABLE=/path/to/piper
```

### Twenty CRM (:3001)

**Container:** `twenty-server` (Docker)

**Features:**
- Self-hosted CRM with PostgreSQL backend
- GraphQL API at `/graphql`
- REST API at `/rest`
- Custom objects: `callRecords`, `repProgressions`

**Admin Access:**
```
URL: http://192.168.1.23:3001
User: admin
Pass: LifeOS2025!
```

---

## Configuration Summary

### Hardcoded Values (Technical Debt)

| Value | Location | Risk |
|-------|----------|------|
| Twenty API Key | `settings.ts:46` | **HIGH** - Exposed in browser |
| Backend Host `192.168.1.23` | `settings.ts:49` | Medium - Hardcoded IP |
| Ports (3001, 4115, 4130) | `settings.ts:50-55` | Low - Standard ports |
| Supabase URL | Multiple files | Medium - Hardcoded |

### Environment Variables (Server-Side)

| Variable | Service | Required |
|----------|---------|----------|
| `TWILIO_ACCOUNT_SID` | twilio-service | Yes |
| `TWILIO_API_KEY` | twilio-service | Yes |
| `TWILIO_API_SECRET` | twilio-service | Yes |
| `TWILIO_TWIML_APP_SID` | twilio-service | Yes |
| `SUPABASE_URL` | twilio-service | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | twilio-service | Yes |
| `WHISPER_MODEL` | voice-service | No (default: base) |
| `WHISPER_DEVICE` | voice-service | No (default: cpu) |

### Client-Side Settings (localStorage)

Key: `ads_settings`

```json
{
  "backendHost": "192.168.1.23",
  "twentyCrmPort": "3001",
  "twentyApiKey": "...",
  "twilioPort": "4115",
  "transcriptionPort": "4130",
  "n8nPort": "5678",
  "smsEnabled": true,
  "emailEnabled": true
}
```

---

## Failure Modes

### Critical Failures

| Failure | Impact | Detection | Recovery |
|---------|--------|-----------|----------|
| admiral-server down | All services offline | Connection refused | Restart server |
| Twenty CRM down | No CRM data | `/api/twenty/status` | `docker restart twenty-server` |
| Cloudflare tunnel down | External access lost | `pm2 status` | `pm2 restart lifeos-tunnel` |

### Partial Failures

| Failure | Impact | Workaround |
|---------|--------|------------|
| Twilio service down | No dialer | Native phone (useNativePhone setting) |
| Voice service down | No transcription | Manual note-taking |
| Supabase down | No call history | Local IndexedDB continues working |
| Network latency high | Slow sync | Offline-first architecture handles it |

### Failure Detection

```bash
# Check all services
ssh edwardsdavid913@192.168.1.23 "pm2 status"

# Check specific service
curl http://192.168.1.23:4115/health
curl http://192.168.1.23:4130/health
curl http://192.168.1.23:3001/rest/health
```

---

## Dependencies Graph

```
helm-dashboard
├── REQUIRES: Twenty CRM (:3001)
│   ├── REQUIRES: PostgreSQL (Docker: twenty-db)
│   └── REQUIRES: Redis (Docker: twenty-redis)
├── REQUIRES: Twilio Service (:4115)
│   ├── REQUIRES: Twilio API (external)
│   └── REQUIRES: Supabase (cloud)
├── REQUIRES: Voice Service (:4130)
│   ├── REQUIRES: faster-whisper (Python)
│   └── OPTIONAL: Piper TTS
└── OPTIONAL: n8n (:5678)
    └── REQUIRES: Node.js
```

---

## Related Documentation

- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide
- `TROUBLESHOOTING.md` - Common issues and fixes
- `../../PORT_REFERENCE.md` - Quick port reference

---

*Last Updated: December 24, 2025*
