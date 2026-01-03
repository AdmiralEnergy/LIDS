# Project 19: Unified LIDS Architecture

## Status: PHASE 2 IN PROGRESS

**Started:** December 29, 2025
**Phase 1 Completed:** December 29, 2025 (Vault disabled, +400MB)
**Phase 2 Started:** December 29, 2025 (Unified server scaffolding)

---

## Summary

Consolidate LIDS from 4 separate Node.js servers into a unified architecture that leverages:
- **Droplet (3.8GB):** Lean frontend serving + proxy layer
- **Admiral-server (32GB):** AI agents, voice services
- **Oracle ARM (24GB):** Postiz, Ollama LLM, compute-intensive services (FREE tier)

---

## Problem Statement

Current state wastes RAM with 4 separate Node.js processes doing similar things:
- Each app has its own Express server
- Each serves static assets independently
- Each proxies to Twenty CRM independently
- Duplicated middleware, auth checks, etc.

**Current RAM (after Vault disabled):**
| Component | RAM |
|-----------|-----|
| Twenty CRM (Docker) | 1.4GB |
| PM2 Apps (4 servers) | 148MB |
| System | ~200MB |
| **Available** | **1.7GB** |

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DROPLET (165.227.111.24) - LEAN FRONTEND LAYER (3.8GB)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  nginx (reverse proxy)                                                      │
│  ├── helm.ripemerchant.host    → LIDS Unified :5000                        │
│  ├── studio.ripemerchant.host  → LIDS Unified :5000/studio                 │
│  ├── compass.ripemerchant.host → LIDS Unified :5000/compass                │
│  ├── academy.ripemerchant.host → LIDS Unified :5000/academy                │
│  └── twenty.ripemerchant.host  → Twenty CRM :3001                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LIDS Unified Server (:5000) - Single Node.js process               │   │
│  │                                                                      │   │
│  │  Static Assets (Vite build output)                                  │   │
│  │  ├── /           → ADS Dashboard SPA                                │   │
│  │  ├── /studio/*   → Studio SPA                                       │   │
│  │  ├── /compass/*  → COMPASS SPA                                      │   │
│  │  └── /academy/*  → Academy SPA                                      │   │
│  │                                                                      │   │
│  │  API Routes (lightweight proxy)                                     │   │
│  │  ├── /api/twenty/*   → localhost:3001 (Twenty CRM)                 │   │
│  │  ├── /api/chat/*     → In-memory (Admiral Chat)                    │   │
│  │  └── /api/heavy/*    → admiral-server (via Tailscale)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Twenty CRM (Docker) - Required for auth                                   │
│  ├── twenty-server   (822MB)                                               │
│  ├── twenty-worker   (506MB)                                               │
│  ├── twenty-db       (64MB)                                                │
│  └── twenty-redis    (20MB)                                                │
│                                                                             │
│  Target Available: ~2.0GB (for Postiz if needed)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              │ Tailscale VPN
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIRAL-SERVER (192.168.1.23) - HEAVY PROCESSING LAYER (32GB)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Heavy Services:                                                            │
│  ├── Postiz (:3200)           Social media scheduling                      │
│  ├── Voice Service (:4130)    Live transcription                           │
│  ├── Twilio Service (:4115)   Browser-based calling                        │
│  ├── Agent Claude (:4110)     AI assistance                                │
│  ├── n8n (:5678)              Workflow automation                          │
│  └── MUSE/Sarai agents        Marketing AI                                 │
│                                                                             │
│  Capacity: 32GB RAM - can host everything heavy                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Design unified server architecture | COMPLETE |
| Phase 2 | Create apps/lids-unified package | COMPLETE |
| Phase 3 | Migrate ADS Dashboard | PENDING |
| Phase 4 | Migrate Studio | PENDING |
| Phase 5 | Migrate COMPASS | PENDING |
| Phase 6 | Migrate Academy | PENDING |
| Phase 7 | Postiz on Oracle ARM | **COMPLETE (Jan 3, 2026)** |
| Phase 8 | Remove old PM2 apps | PENDING |

---

## Phase 1: Unified Server Design

### Directory Structure

```
apps/lids-unified/
├── package.json
├── server/
│   ├── index.ts              # Main Express server
│   ├── routes/
│   │   ├── twenty.ts         # Twenty CRM proxy
│   │   ├── chat.ts           # Admiral Chat (from ADS)
│   │   ├── content.ts        # Studio content API
│   │   └── heavy.ts          # Proxy to admiral-server
│   └── middleware/
│       ├── auth.ts           # Twenty auth validation
│       └── spa.ts            # SPA fallback handler
├── client/
│   ├── ads/                  # ADS Dashboard (copy from ads-dashboard)
│   ├── studio/               # Studio (copy from studio)
│   ├── compass/              # COMPASS (copy from compass)
│   └── academy/              # Academy (copy from academy)
└── dist/                     # Built output
    ├── index.cjs             # Server bundle
    └── public/
        ├── index.html        # ADS SPA
        ├── studio/
        │   └── index.html    # Studio SPA
        ├── compass/
        │   └── index.html    # COMPASS SPA
        └── academy/
            └── index.html    # Academy SPA
```

### Routing Strategy

| Domain | nginx Target | SPA Root |
|--------|--------------|----------|
| helm.ripemerchant.host | :5000/ | /public/index.html |
| studio.ripemerchant.host | :5000/studio | /public/studio/index.html |
| compass.ripemerchant.host | :5000/compass | /public/compass/index.html |
| academy.ripemerchant.host | :5000/academy | /public/academy/index.html |

### API Consolidation

**Currently duplicated in each app:**
- Twenty CRM proxy
- Auth validation
- Static file serving
- Error handling

**Unified:**
```typescript
// server/index.ts
import express from 'express';
import { twentyRoutes } from './routes/twenty';
import { chatRoutes } from './routes/chat';
import { heavyRoutes } from './routes/heavy';

const app = express();

// Shared middleware
app.use(express.json());
app.use(cors());

// API routes (shared across all SPAs)
app.use('/api/twenty', twentyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/heavy', heavyRoutes);  // Proxy to admiral-server

// Static assets
app.use('/studio', express.static('dist/public/studio'));
app.use('/compass', express.static('dist/public/compass'));
app.use('/academy', express.static('dist/public/academy'));
app.use('/', express.static('dist/public'));

// SPA fallback (based on path)
app.get('/studio/*', (req, res) => res.sendFile('dist/public/studio/index.html'));
app.get('/compass/*', (req, res) => res.sendFile('dist/public/compass/index.html'));
app.get('/academy/*', (req, res) => res.sendFile('dist/public/academy/index.html'));
app.get('*', (req, res) => res.sendFile('dist/public/index.html'));

app.listen(5000);
```

---

## Phase 7: Postiz on Oracle ARM ✅ COMPLETE

**Status:** Deployed to Oracle Cloud ARM (lifeos-arm) on January 3, 2026

**Why Oracle ARM (not admiral-server):**
- 24GB RAM (FREE tier) - even better than admiral-server for this use case
- ARM64 native Docker images available
- Keeps admiral-server for AI agents only
- Droplet just proxies `/api/postiz/*` → Oracle ARM

**Postiz Setup:**
```
Oracle ARM (193.122.153.249):
├── postiz (Docker)
│   ├── postiz-app     (:3200)
│   ├── postiz-db      (PostgreSQL 17)
│   └── postiz-redis   (Redis 7.2)
├── Ollama LLM         (:11434)
└── (planned) Command Dashboard, Grid Engine
```

**Studio Integration:**
```typescript
// Studio calls Postiz via proxy
app.use('/api/postiz', async (req, res) => {
  // Proxy to Oracle ARM
  const response = await fetch(`http://193.122.153.249:3200${req.path}`, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
  res.status(response.status).json(await response.json());
});
```

---

## RAM Projections

| State | Droplet RAM Used | Available |
|-------|------------------|-----------|
| Current (4 PM2 apps) | 1.9GB | 1.7GB |
| Phase 8 (Unified) | 1.7GB | 2.0GB |
| With Postiz on droplet | 2.7GB | 1.0GB (tight) |
| With Postiz on Oracle ARM | 1.7GB | 2.0GB (comfortable) |

**Result:** Postiz deployed to Oracle ARM - droplet stays lean at ~1.7GB used.

---

## Benefits

1. **RAM Savings:** ~100MB by consolidating 4 Node processes → 1
2. **Shared Code:** Auth, API clients, middleware used once
3. **Single Deployment:** One `pm2 restart lids-unified` updates everything
4. **Easier Debugging:** One log stream, one process
5. **Future-proof:** Easy to add new SPAs as subpaths

---

## Risks

| Risk | Mitigation |
|------|------------|
| Single point of failure | PM2 auto-restart, health checks |
| Large bundle size | Code splitting per app |
| Complex build | Turborepo or nx for orchestration |
| Breaking existing URLs | nginx rewrites preserve domains |

---

## Migration Strategy

**Non-breaking approach:**

1. Build `apps/lids-unified` alongside existing apps
2. Test on staging port (:5001)
3. Update nginx to route to unified server
4. Monitor for issues
5. Remove old PM2 apps once stable

**Rollback:** Just revert nginx config to point back to individual apps.

---

## Success Criteria

- [ ] Single Node.js process serves all 4 SPAs
- [ ] All existing URLs work without changes
- [ ] RAM usage reduced by ~100MB
- [ ] Admiral Chat works across all apps
- [x] Postiz running on Oracle ARM (deployed Jan 3, 2026)
- [ ] Studio can schedule TikTok posts via Postiz

---

## Related Projects

- [Project 14: Studio Dashboard](../14-studio-dashboard-redesign/README.md) - Phase 4 Postiz
- [Project 16: Admiral Chat](../16-admiral-chat/README.md) - Cross-app chat
- [Infrastructure Registry](../../docs/architecture/Admiral%20Energy%20Infrastructure%20Registry%20v2.3.md)

---

## Implementation Progress

### Phase 1: Infrastructure Optimization (COMPLETE)

**Vault Disabled:** December 29, 2025
- Removed unused HashiCorp Vault service
- Freed 428MB RAM
- Available RAM: 1.3GB → 1.7GB

### Phase 2: Unified Server Scaffolding (IN PROGRESS)

**Files Created:**

```
apps/lids-unified/
├── package.json              ✅ Created
├── tsconfig.json             ✅ Created
└── server/
    ├── index.ts              ✅ Created (main Express server)
    └── routes/
        ├── twenty.ts         ✅ Created (Twenty CRM proxy + auth)
        ├── chat.ts           ✅ Created (Admiral Chat - full implementation)
        ├── email.ts          ✅ Created (Resend email API)
        └── sms.ts            ✅ Created (Twilio SMS webhooks)
```

**Features Implemented:**

| Feature | Status | Notes |
|---------|--------|-------|
| Twenty CRM proxy | ✅ | GraphQL + REST + Auth |
| Admiral Chat | ✅ | Full in-memory implementation |
| Email API | ✅ | Resend integration |
| SMS webhooks | ✅ | Twilio inbound/status |
| Voice proxy | ✅ | Proxies to admiral-server |
| Twilio proxy | ✅ | Proxies to admiral-server |
| Postiz proxy | ✅ | Proxies to admiral-server:3200 |
| SPA routing | ✅ | Host-based + path-based |

### Next Steps

1. **Install dependencies:** `cd apps/lids-unified && npm install`
2. **Test locally:** `npm run dev` (runs on port 5001)
3. **Build SPAs:** Compile ADS, Studio, COMPASS, Academy to unified dist
4. **Deploy to droplet:** Test alongside existing apps
5. **Update nginx:** Switch domains to unified server
6. **Remove old apps:** Delete individual PM2 processes

---

*Last Updated: January 4, 2026 - Phase 7 complete (Postiz on Oracle ARM)*
