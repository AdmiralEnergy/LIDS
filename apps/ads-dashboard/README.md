# ADS Dashboard (HELM)

Sales dialer and CRM integration dashboard for Admiral Energy.

---

## Vision: Why ADS Exists

**The Problem:** 70% of solar sales reps quit within the first month. Why? No leads, no structure, and no way to see their progression. A rep might not make their first sale until day 45 - and without visible progress, it feels like getting yelled at day over day with no income.

**The Solution:** ADS is built on three core pillars:

### Pillar 1: LEADS
PropStream imports with TCPA compliance. New reps have something to call on Day 1. No "find your own leads" barrier.

### Pillar 2: STRUCTURE
- Dialer with one-tap calling
- Agents tell you what zip code, what incentives, what to say
- Training via RedHawk Academy
- Just show up and press dial

### Pillar 3: PROGRESSION (The Glue)
The XP system shows improvement BEFORE the first sale:
- Rep at day 45 with no sales sees: "847 dials → 4,235 XP → Level 7 → Opener Elite badge"
- This isn't just gamification - it's **diagnostic data**

**Why Progression is Diagnostic:**
| Scenario | Naive Analysis | With Detailed Metrics |
|----------|---------------|----------------------|
| 100 calls, 20 conversations | "Needs closer training" | If calls > 10 sec = 0, needs OPENER training |
| High dials, low connects | "Bad leads" | If voicemails = 0, not leaving messages |
| Good conversations, no appts | "Needs closing help" | Correct - target closer training |

The badges and achievements tell BOTH the rep AND leadership where strengths and weaknesses are. **Opener Elite** badge = strong at starting conversations. No **Closer** badge = needs help closing. This turns engagement hooks into actionable sales metrics.

### The Integration: ADS + RedHawk

| System | Role |
|--------|------|
| **ADS Dashboard** | Track calls, dials, XP from activities |
| **RedHawk Academy** | Skill gates for rank promotion (exams, certifications) |

They MUST mirror each other. Same progression data, same ranks. RedHawk exams unlock rank promotions in ADS.

---

## Architecture

### Frontend (React + Vite)
- **Framework:** React 18 + TypeScript
- **UI Library:** Ant Design + shadcn/ui components + Framer Motion animations
- **State:** React Query + Refine.dev data providers
- **Offline:** Dexie.js (IndexedDB) for local-first storage

### Backend (Express)
- **Server:** Express.js serving static build + API proxies
- **Port:** 5000 (production), 3100 (development)
- **Proxies:**
  - `/twenty-api` → Twenty CRM (192.168.1.23:3001)
  - `/twilio-api` → Twilio Service (192.168.1.23:4115)
  - `/voice-api` → Voice Service (192.168.1.23:4130)

### External Services (admiral-server 192.168.1.23)

| Service | Port | Purpose |
|---------|------|---------|
| Twenty CRM | 3001 | CRM database (GraphQL + REST) |
| Twilio Service | 4115 | Click-to-dial, recordings |
| Voice Service | 4130 | Transcription (faster-whisper) |

---

## Data Flow

### Call Flow
```
1. User clicks dial → Twilio SDK initiates call
2. Call connects → Timer starts, transcription begins (WebSocket to voice-api)
3. User hangs up → Inline DispositionStrip appears
4. User selects disposition (one-click) → Activity logged to:
   - IndexedDB (immediate, offline-safe)
   - Twenty CRM Notes (synced when online)
5. Next lead auto-loaded (if auto-advance enabled)
```

### Stats Flow
```
Dashboard Stats Query
    │
    ├── getTodayStats() → Twenty CRM GraphQL
    │   └── Queries "notes" where title starts with "Call -"
    │       and createdAt is today
    │
    └── IndexedDB (fallback if offline)
```

### Lead Data Flow
```
Twenty CRM (people/companies)
    │
    ├── GraphQL API (/twenty-api/graphql)
    │   └── Query leads with pagination
    │
    └── Data Provider (twentyDataProvider.ts)
        └── useTable hook → Lead Queue UI
```

---

## Endpoints

### Express Proxies (server/index.ts)

| Route | Target | Purpose |
|-------|--------|---------|
| `/twenty-api/*` | http://192.168.1.23:3001/* | Twenty CRM GraphQL/REST |
| `/twilio-api/*` | http://192.168.1.23:4115/* | Twilio call service |
| `/voice-api/*` | http://192.168.1.23:4130/* | Voice transcription |

### Twenty CRM GraphQL Queries

| Query | Used By | Purpose |
|-------|---------|---------|
| `people` | Lead Queue | Fetch leads with name, phone, email |
| `notes` | Activity Log | Fetch call logs and notes |
| `tasks` | Task tracking | Scheduled callbacks |
| `workspaceMembers` | Stats | Identify current user |

### API Routes (server/routes.ts)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/activities` | POST | Log call activity |
| `/api/settings` | GET/POST | App configuration |
| `/api/sms/send` | POST | Send SMS via Twilio |
| `/api/email/send` | POST | Send email |

---

## Directory Structure

```
apps/ads-dashboard/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── dialer.tsx         # Power dialer page
│   │   │   ├── dashboard.tsx      # Stats dashboard
│   │   │   ├── leads.tsx          # Lead list view
│   │   │   └── settings.tsx       # Configuration
│   │   ├── components/
│   │   │   ├── DispositionStrip.tsx  # Inline one-click disposition
│   │   │   ├── ApexKeypad.tsx     # Phone keypad
│   │   │   ├── ActivityTimeline.tsx  # Call history
│   │   │   └── VoicemailDropButton.tsx
│   │   ├── hooks/
│   │   │   ├── useDialer.ts       # Twilio call management
│   │   │   ├── useTranscription.ts # WebSocket transcription
│   │   │   ├── useActivityLog.ts  # Activity logging
│   │   │   └── useProgression.ts  # XP/gamification
│   │   ├── providers/
│   │   │   └── twentyDataProvider.ts # CRM data provider
│   │   ├── lib/
│   │   │   ├── settings.ts        # App settings management
│   │   │   ├── twentySync.ts      # CRM sync utilities
│   │   │   └── twentyStatsApi.ts  # Stats API client
│   │   └── features/
│   │       └── progression/       # XP/rank system
├── server/
│   ├── index.ts                   # Express server
│   ├── routes.ts                  # API routes
│   ├── static.ts                  # Static file serving
│   └── vite.ts                    # Vite dev server
└── shared/
    └── schema.ts                  # Shared types
```

---

## Configuration

Settings stored in browser localStorage (`ads_settings`):

| Setting | Default | Purpose |
|---------|---------|---------|
| `backendHost` | 192.168.1.23 | Admiral server IP |
| `twentyApiKey` | (JWT) | Twenty CRM API key |
| `twentyCrmPort` | 3001 | Twenty CRM port |
| `twilioPort` | 4115 | Twilio service port |
| `transcriptionPort` | 4130 | Voice service port |
| `useNativePhone` | false | Use device phone instead of Twilio |
| `smsEnabled` | true | Enable SMS features |
| `emailEnabled` | true | Enable email features |

### URL Resolution (settings.ts)

```typescript
// External access (*.ripemerchant.host)
getTwentyCrmUrl() → 'https://twenty.ripemerchant.host'

// Development (localhost:3100)
getTwentyCrmUrl() → '/twenty-api' (Express proxy)

// LAN access
getTwentyCrmUrl() → 'http://192.168.1.23:3001'
```

---

## Key Components

### DispositionStrip (One-Click Flow)
Inline disposition UI that appears after call ends:
- Single row of disposition chips (Contact, CB, VM, NA, NI, WN, DNC)
- One-click: Select → Save → Auto-advance to next lead
- Optional "Add Note" expands notes input
- Skip button advances without logging

### Power Dialer
Three-column layout:
1. **Lead Queue** (left) - Scrollable list of leads from Twenty CRM
2. **Dialer** (center) - Phone keypad, call controls, disposition
3. **Communication** (right) - Tabs for transcription, SMS, email, activity

### Progression System
Gamification features:
- XP for dials, connects, appointments
- Rank progression (E-1 through E-7)
- 2+ minute call bonuses
- Stats HUD overlay

---

## Deployment

### Production (admiral-server)
```bash
# SSH to server
ssh edwardsdavid913@192.168.1.23

# Build and restart
cd /path/to/ads-dashboard
npm run build
pm2 restart helm-dashboard
```

### Cloudflare Tunnel
Production URL: `helm.ripemerchant.host` → `localhost:3100`

### Development
```bash
cd LIDS-monorepo/apps/ads-dashboard
npm install
npm run dev  # Starts on localhost:3100
```

---

## Troubleshooting

### Leads not loading
1. Check Twenty CRM connection: Settings → Twenty API Key
2. Verify proxy: Browser DevTools → Network → `/twenty-api/graphql`
3. Check console for GraphQL errors

### Dials not tracked
- Stats query `notes` where title starts with "Call -"
- Verify `logActivity()` creates Notes in Twenty CRM
- Check `getLeadsStats()` in twentyDataProvider.ts

### Transcription not working
1. Check Voice Service: `curl http://192.168.1.23:4130/health`
2. Verify WebSocket connection in useTranscription.ts
3. Check browser console for WS errors

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI Framework | React 18 |
| Build | Vite |
| State | React Query + Refine.dev |
| UI Components | Ant Design, shadcn/ui |
| Animations | Framer Motion |
| Offline Storage | Dexie.js (IndexedDB) |
| Server | Express.js |
| CRM | Twenty CRM (self-hosted) |
| Phone | Twilio Voice SDK |
| Transcription | faster-whisper (self-hosted) |
