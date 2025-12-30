# LIDS Unified Server

Unified API gateway consolidating all LIDS apps into a single Node.js process.

**Port:** 5001 (dev), 5000 (prod - will replace current multi-process setup)
**Status:** Phase 2 In Progress (Project 19)

---

## Purpose

LIDS Unified consolidates 4 separate Node.js processes into a single server:

| Current Setup | Unified Setup |
|---------------|---------------|
| lids (5000) | |
| studio (3103) | → lids-unified (5000) |
| compass (3101) | |
| redhawk (3102) | |

**Benefits:**
- ~100MB RAM savings
- Single deployment
- Unified routing
- Shared state (Admiral Chat)

---

## Project Status (Project 19)

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Infrastructure optimization | COMPLETE |
| Phase 2 | Unified server scaffolding | IN PROGRESS |
| Phase 3 | ADS Dashboard migration | PENDING |
| Phase 4 | Studio migration | PENDING |
| Phase 5 | COMPASS migration | PENDING |
| Phase 6 | RedHawk migration | PENDING |
| Phase 7 | PM2 consolidation | PENDING |
| Phase 8 | Rollout & monitoring | PENDING |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LIDS Unified (Droplet :5000)                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express Server                                        │  │
│  │                                                        │  │
│  │  Routes:                                               │  │
│  │  ├── /api/twenty/*    → Twenty CRM proxy              │  │
│  │  ├── /api/chat/*      → Admiral Chat (unified)        │  │
│  │  ├── /api/email/*     → Email services                │  │
│  │  ├── /api/ads/dialer/sms/* → SMS via Twilio          │  │
│  │  ├── /twilio-api/*    → Twilio Service proxy         │  │
│  │  ├── /voice-api/*     → Voice Service proxy          │  │
│  │  └── /api/postiz/*    → Postiz proxy (planned)       │  │
│  │                                                        │  │
│  │  SPA Routing (Production):                            │  │
│  │  ├── studio.* → /dist/studio/index.html              │  │
│  │  ├── compass.* → /dist/compass/index.html            │  │
│  │  ├── academy.* → /dist/academy/index.html            │  │
│  │  └── default → /dist/ads/index.html                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Current Implementation

### Server Routes

| File | Purpose |
|------|---------|
| `server/index.ts` | Main Express server |
| `server/routes/twenty.ts` | Twenty CRM proxy |
| `server/routes/chat.ts` | Admiral Chat API |
| `server/routes/email.ts` | Email services |
| `server/routes/sms.ts` | SMS via Twilio |

### Proxy Configuration

```typescript
// Backend service proxies (admiral-server)
/twilio-api/*  → http://100.66.42.81:4115
/voice-api/*   → http://100.66.42.81:4130
/api/postiz/*  → http://100.66.42.81:3200 (planned)

// Local services (droplet)
/twenty-api/*  → http://localhost:3001
```

---

## Development

```bash
cd apps/lids-unified
npm install
npm run dev  # http://localhost:5001
```

**Note:** In development, use individual app dev servers for hot reload:
```bash
cd apps/ads-dashboard && npm run dev  # :3100
cd apps/studio && npm run dev         # :3103
cd apps/compass && npm run dev        # :3101
cd apps/redhawk-academy && npm run dev # :3102
```

---

## Production Build

```bash
# Build all apps
npm run build:all

# Structure:
# dist/
# ├── ads/       (ADS Dashboard)
# ├── studio/    (Studio)
# ├── compass/   (COMPASS)
# └── academy/   (RedHawk Academy)
```

---

## Environment Variables

```bash
# Required
NODE_ENV=production
PORT=5000
TWENTY_CRM_URL=http://localhost:3001
TWENTY_API_KEY=your_key

# Optional (admiral-server)
VOICE_SERVICE_URL=http://100.66.42.81:4130
TWILIO_SERVICE_URL=http://100.66.42.81:4115
```

---

## Health Check

```bash
curl http://localhost:5001/api/health
# {
#   "status": "healthy",
#   "services": {
#     "twenty": "configured",
#     "admiral": "configured"
#   }
# }
```

---

## Migration Plan

1. **Phase 3-6:** Move client builds and server logic from each app
2. **Phase 7:** Update PM2 to single process
3. **Phase 8:** Monitor and rollback if needed

---

## Related Projects

- **Project 19:** Unified LIDS Architecture (current work)
- **Project 16:** Admiral Chat (unified storage benefits)

---

*Last Updated: December 29, 2025*
