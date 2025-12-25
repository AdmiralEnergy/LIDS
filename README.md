# HELM - Admiral Dialer System (ADS)

Sales power dialer with CRM integration, real-time transcription, and gamification progression system for Admiral Energy.

**Production:** https://helm.ripemerchant.host (Cloudflare Tunnel)
**Local Dev:** http://localhost:3100

---

## Quick Start

```bash
# Prerequisites: Node.js 20+, access to admiral-server (192.168.1.23)

# Clone and install
cd LIDS-monorepo/apps/ads-dashboard
npm install

# Start development server (port 3100)
npm run dev

# Production build
npm run build
npm start  # Serves on port 5000
```

**First-time setup:** Open http://localhost:3100/settings and configure:
1. Backend Host: `192.168.1.23` (admiral-server IP)
2. Twenty API Key: Get from Twenty CRM admin panel
3. Verify connection status shows "Connected"

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HELM Dashboard (Browser)                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   React + Vite   │  │   Dexie.js       │  │   IndexedDB      │  │
│  │   Refine.dev     │  │   (Offline-First)│  │   (Local Cache)  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────────┘  │
│           │                     │ Sync                              │
└───────────┼─────────────────────┼───────────────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Express Server (Port 5000 prod / 3100 dev)             │
│                                                                      │
│   API Proxies (avoid CORS, hide backend):                           │
│   /twenty-api/* ──▶ Twenty CRM (192.168.1.23:3001)                  │
│   /twilio-api/* ──▶ Twilio Service (192.168.1.23:4115)              │
│   /voice-api/*  ──▶ Voice/Transcription (192.168.1.23:4130)         │
│                                                                      │
│   Internal API:                                                      │
│   /api/leads, /api/activities, /api/import/leads                    │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  admiral-server (192.168.1.23)                       │
│                                                                      │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│   │ Twenty CRM  │   │ Twilio Svc  │   │ Voice Svc   │              │
│   │ :3001       │   │ :4115       │   │ :4130       │              │
│   │ GraphQL/REST│   │ Token/Dial  │   │ Whisper STT │              │
│   └─────────────┘   └─────────────┘   └─────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Environment Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | `development` or `production` | Yes | `development` |
| `PORT` | Server port | No | `5000` (prod), `3100` (dev) |
| `VITE_TWENTY_CRM_URL` | Twenty CRM URL for Cloudflare Tunnel | Prod only | - |
| `VITE_TWENTY_CRM_HOST` | Twenty CRM hostname | No | `192.168.1.23` |
| `VITE_TWENTY_CRM_PORT` | Twenty CRM port | No | `3001` |
| `VITE_TWENTY_API_KEY` | Twenty CRM API key (JWT) | Yes | - |
| `VITE_TWILIO_PORT` | Twilio service port | No | `4115` |
| `VITE_TRANSCRIPTION_PORT` | Voice service port | No | `4130` |
| `VITE_N8N_PORT` | n8n workflow port | No | `5678` |

### Example .env (Development)

```bash
# Backend Services (admiral-server)
VITE_TWENTY_CRM_HOST=192.168.1.23
VITE_TWENTY_CRM_PORT=3001
VITE_TWILIO_PORT=4115
VITE_TRANSCRIPTION_PORT=4130
VITE_N8N_PORT=5678

# Twenty CRM API Key (get from Twenty admin → API Keys)
VITE_TWENTY_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example .env (Production - Cloudflare Tunnel)

```bash
# External URLs via Cloudflare Tunnel
VITE_TWENTY_CRM_URL=https://twenty.ripemerchant.host
VITE_TWENTY_CRM_HOST=twenty.ripemerchant.host
VITE_TWENTY_CRM_PORT=443

# Twilio/Voice still use Express proxy (no dedicated tunnel)
VITE_TWILIO_PORT=4115
VITE_TRANSCRIPTION_PORT=4116

# Twenty CRM API Key
VITE_TWENTY_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Environment-Specific URL Resolution

The app auto-detects environment and uses appropriate URLs (see `client/src/lib/settings.ts`):

| Environment | Detection | Twenty URL | Twilio/Voice URL |
|-------------|-----------|------------|------------------|
| **External (*.ripemerchant.host)** | `hostname.endsWith('.ripemerchant.host')` | `https://twenty.ripemerchant.host` | `/twilio-api` (proxy) |
| **Development (localhost:3100)** | `port === '3100'` | `/twenty-api` (proxy) | `/twilio-api` (proxy) |
| **LAN (192.168.x.x)** | Default | `http://192.168.1.23:3001` | `http://192.168.1.23:4115` |

---

## Authentication

### Current State (v1.0)

**WARNING: No server-side authentication is implemented.**

Current flow:
1. App loads → Checks localStorage for `ads_settings`
2. If `twentyApiKey` present → Uses it for all API calls
3. Workspace member stored in `twentyWorkspaceMemberId` localStorage

This means:
- Anyone with the URL can access the app
- API key is visible in browser dev tools
- No user isolation

### Planned Authentication (v2.0)

- Passport.js with Twenty CRM OAuth
- Session-based with HttpOnly cookies
- API key fetched after authentication

---

## Core Features

### Dialer System

**File:** `client/src/pages/dialer.tsx`

Three-column layout:
1. **Lead Queue** (left) - Scrollable list from Twenty CRM
2. **Dialer** (center) - Keypad, call controls, disposition buttons
3. **Communication** (right) - Transcription, SMS, Email, Activity tabs

**Twilio Integration:**
```
1. App requests token from /twilio-api/token (POST)
2. Twilio Voice SDK initializes with token
3. User clicks dial → SDK connects via WebRTC
4. Call events trigger: connecting → connected → disconnect
5. After call → Disposition modal appears
6. Disposition saved to: IndexedDB + Twenty CRM Notes
```

**Files:**
- `client/src/hooks/useDialer.ts` - Call state management
- `client/src/hooks/useTranscription.ts` - Post-call transcription

### Transcription Service

**Current Status:** Post-call transcription only

The voice service at `192.168.1.23:4130` provides:
- POST `/transcribe` - Upload audio file → Returns text
- Real-time WebSocket transcription NOT implemented

```typescript
// Usage (client/src/hooks/useTranscription.ts)
await transcribeAudio(audioBlob, 'recording.webm');
await transcribeFromUrl('https://api.twilio.com/recordings/...');
```

### Progression/Gamification System

**Files:** `client/src/features/progression/`

**XP Sources:**
| Action | XP | Multipliers |
|--------|-----|-------------|
| Dial Made | 2 | - |
| Call Connected | 5 | - |
| 2+ Minute Call | 15 | Specialization bonus |
| Callback Scheduled | 25 | - |
| Appointment Set | 100 | - |
| Deal Closed | 300 | - |

**Level System:** 25 levels (0 → 112,000 XP)

**Rank System:** E-1 through E-7 based on level

**Storage:**
- **Local:** IndexedDB via Dexie.js (`ADS_Progression` database)
- **Remote:** Twenty CRM custom objects (`callRecords`, `repProgressions`)

**Sync Flow:**
```
On App Load: syncFromTwenty() → Pull XP from Twenty → Update local
After Action: recordCall() → Save local + Push to Twenty
Periodic: fullSync() → Compare timestamps, higher XP wins
```

### Twenty CRM Integration

**Data Provider:** `client/src/providers/twentyDataProvider.ts`

Implements Refine.dev DataProvider interface:
- `getList` - Fetch people, companies, notes, tasks, opportunities
- `getOne` - Fetch single record
- `create` - Create person, note, task
- `update` - Update person, company, note
- `deleteOne` - Delete records

**GraphQL Queries Used:**
```graphql
query GetPeople($first: Int) {
  people(first: $first) {
    edges { node { id, name, emails, phones, company } }
  }
}
```

**Stats Tracking:**
- Dials counted as Notes with title starting "Call -"
- Today's stats: Query notes filtered by `createdAt` = today
- Conversion rate: Notes with "CONTACT" or "CALLBACK" / all call notes

---

## Deployment

### Local Development

```bash
cd apps/ads-dashboard
npm install
npm run dev
# Open http://localhost:3100
```

### Production Build

```bash
npm run build
npm start  # Starts on PORT (default 5000)
```

### Cloudflare Tunnel Deployment

**Requirements:**
- `cloudflared` installed on admiral-server
- Tunnels configured for helm.ripemerchant.host → localhost:5000

**Setup:**
```bash
# On admiral-server
cloudflared tunnel create helm
cloudflared tunnel route dns helm helm.ripemerchant.host

# Run tunnel (add to systemd for persistence)
cloudflared tunnel run --url http://localhost:5000 helm
```

**Note:** Twenty CRM has its own tunnel at `twenty.ripemerchant.host`. Twilio and Voice services are proxied through the HELM Express server.

### Known Environment Differences

| Issue | Local | Cloudflare Tunnel | Resolution |
|-------|-------|-------------------|------------|
| **WebSocket HMR** | Works | Laggy/Broken | Use production build |
| **Cookie domain** | localhost | .ripemerchant.host | Set `domain` in session config |
| **CORS** | Via proxy | Via proxy | Both work |
| **X-Forwarded headers** | Not set | Set by CF | Trust proxy in Express |

---

## API Reference

### Express Routes (server/routes.ts)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/leads` | GET | List all leads |
| `/api/leads/:id` | GET | Get single lead |
| `/api/leads` | POST | Create lead |
| `/api/leads/:id` | PATCH | Update lead |
| `/api/leads/:id` | DELETE | Delete lead |
| `/api/activities` | GET | List activities |
| `/api/activities` | POST | Create activity |
| `/api/twenty/graphql` | POST | Proxy GraphQL to Twenty |
| `/api/twenty/status` | GET | Check Twenty connection |
| `/api/import/leads` | POST | Bulk import from CSV |

### Proxy Routes (server/index.ts)

| Route | Target | Purpose |
|-------|--------|---------|
| `/twenty-api/*` | http://192.168.1.23:3001/* | Twenty CRM |
| `/twilio-api/*` | http://192.168.1.23:4115/* | Twilio Service |
| `/voice-api/*` | http://192.168.1.23:4130/* | Voice/Transcription |

---

## Middleware Chain

```
Request
  │
  ├─▶ Proxy Middleware (BEFORE body parsing)
  │     /twenty-api, /twilio-api, /voice-api
  │
  ├─▶ Body Parsing
  │     express.json(), express.urlencoded()
  │
  ├─▶ Logging Middleware
  │     Logs /api/* requests with timing
  │
  ├─▶ Route Handlers
  │     registerRoutes()
  │
  ├─▶ Error Handler
  │     Catches all errors, returns JSON
  │
  └─▶ Static/Vite
        Production: express.static(dist/public)
        Development: vite.middlewares + HMR
```

---

## Troubleshooting

### Leads Not Loading

1. **Check Twenty connection:**
   - Go to Settings → Verify API key is set
   - Check browser console for GraphQL errors

2. **Verify proxy:**
   - DevTools → Network → Look for `/twenty-api/graphql`
   - Response should contain `data.people`

3. **Check server logs:**
   ```bash
   # Watch Express logs
   npm run dev  # Logs show in terminal
   ```

### Dials Not Being Tracked

Stats query uses `notes` where title starts with "Call -":
```typescript
// client/src/providers/twentyDataProvider.ts:929
const callsToday = notesData.notes.edges.filter((edge) => {
  const isCall = edge.node.title?.startsWith('Call -');
  return noteDate === today && isCall;
}).length;
```

**Debug:**
1. Make a call and disposition it
2. Go to Twenty CRM → Notes
3. Verify note was created with title "Call - CONTACT" or similar

### Transcription Not Working

1. **Check Voice Service:**
   ```bash
   curl http://192.168.1.23:4130/health
   ```

2. **Verify proxy:**
   - DevTools → Network → `/voice-api/transcribe`
   - Should return JSON with `text` field

3. **Note:** Real-time transcription is NOT implemented. Only post-call transcription works.

### Progression Not Syncing to Twenty

1. **Check workspace member ID:**
   ```javascript
   localStorage.getItem('twentyWorkspaceMemberId')
   ```

2. **Verify repProgressions object exists in Twenty:**
   - Twenty CRM → Settings → Data model → repProgressions

3. **Check for sync errors:**
   - Browser console for "Failed to sync" messages

---

## Health Checks

| Service | Endpoint | Expected |
|---------|----------|----------|
| HELM Dashboard | `http://localhost:3100/` | HTML page |
| Twenty CRM | `/api/twenty/status` | `{"connected": true}` |
| Twilio | `/twilio-api/health` | `{"status": "ok"}` |
| Voice | `/voice-api/health` | `{"status": "ok"}` |

### Quick Health Script

```bash
# Check all services
curl -s http://localhost:3100/api/twenty/status | jq .
curl -s http://192.168.1.23:4115/health | jq .
curl -s http://192.168.1.23:4130/health | jq .
```

---

## Dependencies

### Critical Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `express` | ^4.21.2 | HTTP server |
| `@twilio/voice-sdk` | ^2.10.2 | Browser calling |
| `dexie` | ^4.2.1 | IndexedDB offline storage |
| `@refinedev/core` | ^5.0.7 | Data provider framework |
| `antd` | ^5.29.3 | UI component library |
| `http-proxy-middleware` | ^3.0.5 | API proxying |
| `graphql-request` | ^7.4.0 | GraphQL client |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^7.3.0 | Build tool + dev server |
| `tsx` | ^4.20.5 | TypeScript execution |
| `typescript` | 5.6.3 | Type checking |
| `drizzle-kit` | ^0.31.8 | Database migrations |

---

## Security Considerations

### Current Issues

1. **API Key Exposure**
   - Twenty API key in client-side code
   - Visible in browser dev tools
   - **Mitigation:** Treat key as read-only, limit scope in Twenty

2. **No Authentication**
   - All routes publicly accessible
   - **Mitigation:** Deploy behind VPN or add auth

3. **CORS Bypass via Proxy**
   - Express proxies all requests
   - **This is intentional** for the architecture

### Recommendations

1. Implement authentication before production
2. Move API keys to server-side only
3. Add rate limiting to prevent abuse
4. Use HTTPS for all production deployments
5. Audit Twenty CRM API key permissions

---

## Directory Structure

```
apps/ads-dashboard/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── ui/            # shadcn/ui base components
│   │   │   ├── ApexKeypad.tsx # Phone keypad
│   │   │   ├── DispositionModal.tsx
│   │   │   └── ...
│   │   ├── features/
│   │   │   └── progression/   # XP/gamification
│   │   │       ├── config/    # XP values, ranks, badges
│   │   │       ├── hooks/     # useProgression
│   │   │       └── components/
│   │   ├── hooks/
│   │   │   ├── useDialer.ts   # Twilio call management
│   │   │   ├── useTranscription.ts
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── settings.ts    # App configuration
│   │   │   ├── progressionDb.ts # Dexie schema
│   │   │   ├── twentySync.ts  # CRM sync
│   │   │   └── twentyStatsApi.ts
│   │   ├── pages/
│   │   │   ├── dashboard.tsx  # Stats overview
│   │   │   ├── dialer.tsx     # Power dialer (main)
│   │   │   ├── leads.tsx      # Lead list
│   │   │   ├── crm.tsx        # Twenty CRM view
│   │   │   └── settings.tsx   # Configuration
│   │   ├── providers/
│   │   │   └── twentyDataProvider.ts
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   └── index.html
├── server/
│   ├── index.ts               # Express entry + proxies
│   ├── routes.ts              # API routes
│   ├── static.ts              # Production static serving
│   ├── storage.ts             # In-memory storage
│   └── vite.ts                # Dev server setup
├── shared/
│   └── schema.ts              # Drizzle schema
├── .env                       # Environment config
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## Related Apps (Monorepo)

| App | Port | Purpose |
|-----|------|---------|
| **ads-dashboard** (this) | 3100 | Power dialer, CRM integration |
| **compass** | 3101 | Mobile PWA, rep AI partner |
| **redhawk-academy** | 3102 | Sales training platform |

---

## Changelog

### v1.0.0 (December 2025)
- Initial release
- Twilio Voice SDK integration
- Twenty CRM data provider
- Gamification progression system
- Offline-first with Dexie.js
- Cloudflare Tunnel deployment

---

## Support

- **Docs:** See `/docs/` in monorepo
- **Issues:** Report to development team
- **Logs:** Check browser console + server terminal

---

*Admiral Energy LLC - HELM Dialer System v1.0*
