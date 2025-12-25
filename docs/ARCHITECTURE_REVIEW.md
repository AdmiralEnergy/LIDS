# LIDS Architecture Review

**Migration Audit & Security Assessment**
*December 25, 2025*

---

## Executive Summary

This document catalogs migration concerns, security issues, and architectural details discovered during the LIDS codebase review following migration from local hosting to Digital Ocean. It complements the existing `ARCHITECTURE.md` with actionable findings.

### Critical Findings

| Category | Count | Severity |
|----------|-------|----------|
| Exposed API Keys | 2 locations | **CRITICAL** |
| Hardcoded IPs | 9+ locations | **HIGH** |
| No Authentication | 3 apps | **HIGH** |
| Environment Gaps | 3 .env files | **MEDIUM** |

---

## 1. Service Inventory

### 1.1 Frontend Applications

| App | Dev Port | Prod Port | Primary Function |
|-----|----------|-----------|------------------|
| LIDS Dashboard | 3100 | 5000 | ADS dialer, CRM, progression |
| COMPASS | 3101 | 5000 | AI field agents UI |
| RedHawk Academy | 3102 | 5000 | Sales training, boss battles |

### 1.2 Backend Services (admiral-server)

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| Twenty CRM | 3001 | Lead management, GraphQL | `POST /graphql {"query":"{ __typename }"}` |
| Twilio Service | 4115 | Voice SDK token generation | `POST /token` |
| Voice Service | 4130 | Speech-to-text transcription | `GET /health` (planned) |
| COMPASS Agents | 4098 | AI agent cluster | `POST /agent/:id/chat` |
| RedHawk Agent | 4096 | Training AI backend | `GET /health` |
| N8N Workflows | 5678 | Automation, webhooks | `GET /` |

### 1.3 Network Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    Digital Ocean Droplet                         │
│                     165.227.111.24                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  LIDS Dashboard (5000)   │  COMPASS (5000) │  RedHawk    │   │
│  │  Express + React         │                  │  (5000)     │   │
│  └────────────┬─────────────┴──────────────────┴─────────────┘   │
│               │                                                   │
│               │ http-proxy-middleware                            │
│               ▼                                                   │
└───────────────┼──────────────────────────────────────────────────┘
                │ Tailscale VPN
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    admiral-server                                │
│            192.168.1.23 (LAN) / 100.66.42.81 (Tailscale)        │
│  ┌────────────┬───────────┬───────────┬───────────┬──────────┐  │
│  │ Twenty CRM │ Twilio    │ Voice     │ COMPASS   │ RedHawk  │  │
│  │ :3001      │ :4115     │ :4130     │ :4098     │ :4096    │  │
│  └────────────┴───────────┴───────────┴───────────┴──────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. API Endpoint Inventory

### 2.1 ADS Dashboard Endpoints

**Server Routes** (`apps/ads-dashboard/server/routes.ts`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/leads` | GET | Fetch all leads |
| `/api/leads/:id` | GET | Get single lead |
| `/api/leads` | POST | Create lead |
| `/api/leads/:id` | PATCH | Update lead |
| `/api/leads/:id` | DELETE | Delete lead |
| `/api/activities` | GET | Fetch activities (filter by leadId) |
| `/api/activities` | POST | Create activity |
| `/api/twenty/graphql` | POST | Proxy to Twenty GraphQL |
| `/api/twenty/status` | GET | Twenty health check |
| `/api/import/leads` | POST | Bulk CSV import |

**Proxy Routes** (`apps/ads-dashboard/server/index.ts`)

| Route Pattern | Target |
|---------------|--------|
| `/twenty-api/*` | Twenty CRM (3001) |
| `/voice-api/*` | Voice Service (4130) |
| `/twilio-api/*` | Twilio Service (4115) |

### 2.2 COMPASS Endpoints

**Server Routes** (`apps/compass/server/routes.ts`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agent/:agentId/chat` | POST | Chat with AI agent |
| `/api/leads` | GET | Fetch leads |
| `/api/leads/:id` | GET | Get single lead |
| `/api/leads` | POST | Create lead |
| `/api/leads/:id` | PATCH | Update lead |
| `/api/leads/:id` | DELETE | Delete lead |
| `/api/enrichment/enrich` | POST | Enrich lead with property data |
| `/api/lookup` | POST | Property data lookup |
| `/api/objection` | POST | Handle sales objections |
| `/api/tcpa/:leadId` | GET | TCPA compliance check |
| `/api/suggest-action` | POST | Get sales scripts |
| `/api/telegram-push` | POST | Send to Telegram bot |
| `/api/actions/execute` | POST | Execute suggested actions |

### 2.3 RedHawk Academy Endpoints

**Server Routes** (`apps/redhawk-academy/server/routes.ts`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/redhawk/health` | GET | Health check + version |
| `/api/redhawk/modules` | GET | List training modules |
| `/api/redhawk/progress/:repId` | GET | Get rep progression |
| `/api/redhawk/cert/:repId` | GET | Get certifications |
| `/api/redhawk/cert/start` | POST | Start exam session |
| `/api/redhawk/cert/submit` | POST | Submit exam answers |
| `/api/redhawk/battle/stats/:repId` | GET | Get battle statistics |
| `/api/redhawk/battle/start` | POST | Start boss battle |
| `/api/redhawk/battle/turn` | POST | Process battle turn |
| `/api/redhawk/battle/end` | POST | End battle, award XP |

---

## 3. Data Flow Architecture

### 3.1 ADS Dashboard (Offline-First)

```
┌───────────────────────────────────────────────────────────────┐
│                        Browser                                 │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  IndexedDB (Dexie)                                            │
│  ├── AdsDatabase                                               │
│  │   ├── activities (calls, sms, emails, notes)               │
│  │   ├── leads (cache of Twenty data)                         │
│  │   └── syncQueue (pending operations)                       │
│  │                                                             │
│  └── ADS_Progression                                           │
│      ├── progression (XP, rank, badges)                       │
│      ├── xpEvents (history)                                    │
│      ├── dailyMetrics (dials, connects, deals)                │
│      └── bossHistory (battle results)                         │
│                                                                │
│  localStorage                                                  │
│  └── ads_settings, twentyWorkspaceMemberId                    │
│                                                                │
└────────────────────────┬──────────────────────────────────────┘
                         │ twentySync.ts
                         ▼
┌───────────────────────────────────────────────────────────────┐
│                    Twenty CRM REST API                         │
│  ├── /rest/repProgressions (XP/rank sync)                     │
│  ├── /rest/callRecords (call logging)                         │
│  ├── /rest/notes (activity sync)                              │
│  └── /rest/workspaceMembers (user list)                       │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 Sync Patterns

**Auto-Sync Timer**: Every 30 seconds when `navigator.onLine === true`

**Sync Flow**:
1. `initializeSync()` - Fetch workspace members, load current rep
2. `syncFromTwenty()` - Pull progression from Twenty → merge to IndexedDB
3. `syncToTwenty()` - Push local XP/rank → Twenty
4. `recordCall()` - After each call, create CallRecord + update metrics

**Conflict Resolution**: Higher `totalXp` wins (timestamps compared)

### 3.3 COMPASS Data Flow

```
Browser → Express (3101)
    │
    ├── /api/agent/:id/chat → COMPASS micro-agents (4098)
    │                         Returns AI response
    │
    └── /api/leads → MemStorage (in-memory, session-based)
                     No persistence between restarts
```

### 3.4 RedHawk Academy Data Flow

```
Browser → Express (3102)
    │
    ├── /api/redhawk/* → MemStorage (in-memory)
    │                    Exam sessions, battle state
    │
    └── Progression sync → Twenty CRM (3001)
                           /rest/repProgressions
```

---

## 4. Dependency Map

### What Breaks If Service X Is Down

| Service Down | Impact | Mitigation |
|--------------|--------|------------|
| **Twenty CRM** | No lead data, no progression sync, CRM page broken | IndexedDB provides read-only cache |
| **Twilio Service** | No outbound calls, dialer completely broken | None - core function lost |
| **Voice Service** | No post-call transcription | Calls still work, no transcript |
| **COMPASS Agents** | No AI chat responses | Mock responses available |
| **RedHawk Agent** | No battle AI responses | Mock API fallback |
| **N8N** | No email sending, no webhook automations | Manual fallback required |
| **admiral-server** | All backend services offline | App runs offline-only from cache |

### Critical Path

```
Dialer Call Flow (MUST ALL BE UP):
  Browser → Express → Twilio Service (4115) → Twilio Cloud

Progression Sync (GRACEFUL DEGRADATION):
  Browser → IndexedDB → [if online] → Twenty CRM (3001)
```

---

## 5. Migration Concerns

### 5.1 Hardcoded IP Addresses

| IP | Purpose | Locations | Fix Priority |
|----|---------|-----------|--------------|
| `192.168.1.23` | LAN admiral-server | 7+ files | **HIGH** |
| `100.66.42.81` | Tailscale VPN | 2 files | **HIGH** |
| `165.227.111.24` | DO Droplet | Docs only | LOW |

**Specific Files Requiring Changes:**

```
apps/ads-dashboard/client/src/lib/settings.ts:50
  backendHost: "192.168.1.23"
  → Use: VITE_BACKEND_HOST

apps/ads-dashboard/server/index.ts:13
  BACKEND_HOST = process.env.BACKEND_HOST || "100.66.42.81"
  → Require env var, fail startup if missing

apps/ads-dashboard/vite.config.ts:44,50,56
  target: 'http://192.168.1.23:3001/4130/4115'
  → Use: VITE_BACKEND_HOST env var

apps/compass/server/routes.ts:9-10
  COMPASS_HOST = process.env.COMPASS_HOST || '192.168.1.23'
  → Require env var

apps/compass/client/src/lib/settings.ts:11
  backendHost: '192.168.1.23'
  → Use: VITE_BACKEND_HOST

apps/compass/client/src/lib/user-context.tsx:36
  `http://${...VITE_TWENTY_CRM_HOST || '192.168.1.23'}:${...}`
  → Require VITE_TWENTY_CRM_HOST

apps/redhawk-academy/client/src/lib/twentyProgressionApi.ts:18
  VITE_TWENTY_CRM_HOST || '192.168.1.23'
  → Require VITE_TWENTY_CRM_HOST
```

### 5.2 Hardcoded Domain

```
apps/ads-dashboard/client/src/lib/settings.ts:30
  window.location.hostname.endsWith('.ripemerchant.host')
  → Extract to: VITE_EXTERNAL_DOMAIN

apps/redhawk-academy/client/src/lib/twentyProgressionApi.ts:13-17
  hostname.endsWith('.ripemerchant.host')
  → Extract to: VITE_EXTERNAL_DOMAIN
```

### 5.3 Environment Variable Gaps

**Missing from .env.example files:**

| Variable | Used In | Required For |
|----------|---------|--------------|
| `BACKEND_HOST` | server/index.ts | Proxy configuration |
| `VITE_EXTERNAL_DOMAIN` | (proposed) | Domain detection |
| `TWENTY_API_KEY` | Server-side | CRM authentication |

---

## 6. Security Issues

### 6.1 Critical: API Keys in Client Bundle

**Issue**: Twenty CRM JWT tokens are hardcoded in client-side source code, visible in browser DevTools and minified bundles.

| File | Line | Token Preview |
|------|------|---------------|
| `apps/ads-dashboard/client/src/lib/settings.ts` | 47 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `apps/redhawk-academy/client/src/lib/twentyProgressionApi.ts` | 21 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**Risk**: Anyone inspecting network traffic or bundle can extract and use these tokens.

**Remediation**:
1. Move API keys to server-side only
2. Create `/api/twenty/token` endpoint that returns short-lived tokens
3. Rotate current keys immediately after fix deployed

### 6.2 High: No Authentication Layer

**Issue**: All three applications have no user authentication. Anyone with the URL can access all features.

**Affected**:
- All API endpoints unprotected
- No session validation
- `repId` passed as client parameter (unverified)

**Remediation**:
1. Implement OAuth/OIDC via Twenty workspace
2. Add session middleware to Express apps
3. Validate repId against authenticated user

### 6.3 Medium: Secrets in Committed Files

**Issue**: Some `.env` files contain secrets and are committed to repository.

| File | Contains |
|------|----------|
| `apps/ads-dashboard/.env` | `VITE_TWENTY_API_KEY` |
| `apps/redhawk-academy/.env` | `VITE_TWENTY_API_KEY` |

**Remediation**:
1. Add `.env` to `.gitignore` (keep `.env.example`)
2. Remove secrets from git history
3. Use secrets manager in production

---

## 7. Architectural Observations

### 7.1 In-Memory Storage

COMPASS and RedHawk Academy use `MemStorage` class - data is lost on restart.

```typescript
// apps/compass/server/storage.ts
export class MemStorage implements IStorage {
  private leads: Map<string, Lead> = new Map();
  // ... no persistence
}
```

**Impact**: Exam progress, battle state, lead data lost on server restart.

**Recommendation**: Implement PostgreSQL or SQLite persistence for production.

### 7.2 Missing Rate Limiting

No rate limiting on any API endpoints. Vulnerable to:
- Brute force attacks
- DoS attacks
- API abuse

**Recommendation**: Add `express-rate-limit` middleware.

### 7.3 WebSocket Transcription Not Implemented

`getTranscriptionWsUrl()` returns WebSocket URL but no WebSocket handler exists on Voice Service.

```typescript
// apps/ads-dashboard/client/src/lib/settings.ts:124
export function getTranscriptionWsUrl(): string {
  return `ws://${s.backendHost}:${s.transcriptionPort}/ws`;
  // Handler doesn't exist on port 4130
}
```

**Status**: POST `/transcribe` works for post-call transcription. Real-time streaming not implemented.

---

## 8. Recommended Action Plan

### Phase 1: Security (Do Immediately)

1. **Move API keys server-side**
   - Remove from `settings.ts` and `twentyProgressionApi.ts`
   - Create server endpoint to provide tokens
   - Rotate Twenty CRM API keys

2. **Secure .env files**
   - Add to `.gitignore`
   - Remove from git history
   - Document required vars in `.env.example`

### Phase 2: Configuration (Before Next Deploy)

1. **Remove hardcoded IPs**
   - Make `BACKEND_HOST` required (fail on missing)
   - Update all fallback defaults to use env vars

2. **Standardize environment variables**
   - Create unified naming: `VITE_BACKEND_HOST`, `VITE_TWENTY_HOST`, etc.
   - Update all three apps consistently

3. **Complete .env.example files**
   - Document every required variable
   - Add startup validation

### Phase 3: Architecture (Strategic)

1. **Implement authentication**
   - OAuth via Twenty workspace
   - Session middleware
   - Protected API routes

2. **Add persistence to COMPASS/RedHawk**
   - PostgreSQL or SQLite
   - Migration scripts

3. **Add rate limiting**
   - `express-rate-limit` on all endpoints
   - Stricter limits on auth-related endpoints

---

## 9. Quick Reference

### Service URLs

```bash
# Twenty CRM
http://192.168.1.23:3001/rest
http://192.168.1.23:3001/graphql

# Twilio (token generation)
http://192.168.1.23:4115/token

# Voice (transcription)
http://192.168.1.23:4130/transcribe

# COMPASS Agents
http://192.168.1.23:4098/agent/:id/chat

# RedHawk Agent
http://192.168.1.23:4096/...
```

### Health Checks

```bash
# Twenty CRM
curl -X POST http://192.168.1.23:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# All PM2 services
ssh edwardsdavid913@192.168.1.23 "pm2 status"
```

---

*Document generated: December 25, 2025*
*Review scope: apps/ads-dashboard, apps/compass, apps/redhawk-academy*
