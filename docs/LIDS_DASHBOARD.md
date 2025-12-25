# LIDS Dashboard

**Live Interactive Dashboard** - Full-featured SaaS platform for Admiral Energy teams.

**Updated:** December 25, 2025

**Terminology:**
- **LIDS** = Live Interactive Dashboard (the SaaS platform)
- **ADS** = Admiral Dialer System (sales-specific tools: dialer, progression, leads)

---

## Overview

LIDS is the primary operator interface for Admiral Energy. It provides role-based dashboards:
- **Sales Reps**: ADS features (dialer, leads, progression, leaderboard)
- **Executives**: Analytics, team management, pipeline view
- **Marketing** (future): Campaign management, content tools

```
Production:  https://lids.ripemerchant.host (DO Droplet)
Local Dev:   http://localhost:3100
Location:    apps/ads-dashboard/
Twenty CRM:  https://twenty.ripemerchant.host (same droplet)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  DO DROPLET (165.227.111.24)                                     │
├─────────────────────────────────────────────────────────────────┤
│                     LIDS DASHBOARD (:5000)                       │
│                   Express + React (Vite)                         │
├─────────────────────────────────────────────────────────────────┤
│  CLIENT (React)                                                  │
│  ├── pages/         9 user screens                              │
│  ├── features/      Progression system (XP, ranks, bosses)     │
│  ├── hooks/         useDialer, useTranscription                 │
│  └── lib/           Dexie (IndexedDB), settings, sync          │
├─────────────────────────────────────────────────────────────────┤
│  SERVER (Express)                                                │
│  ├── Proxies        /twenty-api, /twilio-api, /voice-api       │
│  ├── API Routes     /api/leads, /api/activities, /api/import   │
│  └── SMS Webhooks   /api/ads/dialer/sms/inbound, /status       │
└─────────────────────────────────────────────────────────────────┘
          │                                         │
          ▼ (localhost)                             ▼ (Tailscale)
   ┌──────────────┐                    ┌────────────────────────┐
   │  Twenty CRM  │                    │  ADMIRAL-SERVER        │
   │  (:3001)     │                    │  Twilio  (:4115)       │
   │  (Docker)    │                    │  Voice   (:4130)       │
   └──────────────┘                    └────────────────────────┘
```

**Key:** Twenty CRM runs on same droplet (localhost:3001). Voice/Twilio connect via Tailscale to admiral-server.

---

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `dashboard.tsx` | Rep home screen, stats, quick actions |
| `/leads` | `leads.tsx` | Lead list with CSV import wizard |
| `/crm` | `crm.tsx` | Twenty CRM integration view |
| `/pipeline` | `pipeline.tsx` | Kanban-style lead progression |
| `/dialer` | `dialer.tsx` | Mobile-first dialer with ICP-sorted lead queue |
| `/activity` | `activity.tsx` | Call history, transcriptions |
| `/leaderboard` | `leaderboard.tsx` | Team rankings, XP competition |
| `/settings` | `settings.tsx` | Backend configuration |
| `/not-found` | `not-found.tsx` | 404 page |

---

## Features

### Core CRM
- **Lead Management**: Import via CSV, TCPA classification
- **Pipeline View**: Kanban drag-and-drop stages
- **Activity Logging**: Automatic call logging with disposition
- **Twenty CRM Sync**: Bidirectional sync with Twenty

### ADS (Admiral Dialer System)
- **Click-to-Call**: Twilio Voice SDK integration
- **Real-time Transcription**: Voice service (faster-whisper)
- **Voicemail Drop**: Pre-recorded message templates
- **Call Recording**: Automatic recording with playback
- **Smart Lead Queue**: Filter to callable leads only, sorted by ICP score
- **Multi-Phone Support**: All 12 phone fields visible (cell1-4, landline1-4, phone1-2)
- **Caller ID Display**: Shows outbound number or "Using Device" for native mode
- **Auto-Disposition**: Automatic call tracking with XP awards
- **Inbound Call Handling**: Accept/reject/voicemail UI for incoming calls
- **Phone Mode Toggle**: Switch between Twilio browser calling and native device
- **Lead Profile View**: Full lead context with notes, call history, all phones
- **SMS with Toll-Free**: Send/receive SMS via +1 (833) 385-6399, messages persist to IndexedDB
- **SMS Threading**: Full conversation history with chat-style UI, inbound polling
- **Email Composer**: Template-based email composition with send capability
- **Phone Home Screen**: Calendar, contacts, and app shortcuts (COMPASS, Academy, CRM)
- **Skipped Leads**: Track and retrieve swiped-away leads

### Gamification (Progression System)
- **XP System**: Earn XP for calls, appointments, closes
- **Ranks**: E-1 through E-7 military-style progression
- **Badges**: Achievement unlocks
- **Boss Battles**: Skill challenges against AI opponents
- **Leaderboard**: Team competition

### Offline-First
- **IndexedDB Storage**: Dexie for local persistence
- **Sync Queue**: Queued operations when offline
- **Optimistic UI**: Instant local updates

---

## Data Layer

### Browser (Dexie/IndexedDB)

| Database | Tables | Purpose |
|----------|--------|---------|
| `AdsDatabase` | activities, leads, syncQueue, smsMessages | CRM data cache + SMS threading |
| `ADS_Progression` | progression, xpEvents, badgeProgress, bossHistory, dailyMetrics, autoDispositionLog | Gamification state |

### Server (Supabase)

| Table | Purpose |
|-------|---------|
| `dial_attempts` | Call history |
| `call_recordings` | Recording URLs, transcriptions |
| `voicemail_drops` | Voicemail templates |

### CRM (Twenty)

| Object | Purpose |
|--------|---------|
| `Person` | Leads/contacts |
| `Activity` | Call/email logs |
| `callRecords` | XP tracking (custom) |
| `repProgressions` | Rank/level (custom) |

---

## Backend Services

### On Droplet (localhost)

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| Twenty CRM | 3001 | CRM data, GraphQL API | `/rest/health` |

### On Admiral-Server (via Tailscale 100.66.42.81)

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| Twilio Service | 4115 | Token gen, call history | `/health` |
| Voice Service | 4130 | STT/TTS | `/health` |

### Proxy Configuration (server/index.ts)

```javascript
/twenty-api/* → http://localhost:3001          // Same droplet
/twilio-api/* → http://100.66.42.81:4115       // Admiral-server via Tailscale
/voice-api/*  → http://100.66.42.81:4130       // Admiral-server via Tailscale
```

---

## Configuration

### Environment Variables (Droplet .env)

```bash
NODE_ENV=production
PORT=5000

# Twenty CRM - LOCAL on droplet
TWENTY_CRM_URL=http://localhost:3001
TWENTY_API_URL=http://localhost:3001
TWENTY_API_KEY=eyJhbGci...  # Droplet-specific key

# Voice/Twilio - admiral-server via Tailscale
VOICE_SERVICE_URL=http://100.66.42.81:4130
TWILIO_SERVICE_URL=http://100.66.42.81:4115

# Agent Claude
VITE_AGENT_CLAUDE_HOST=100.66.42.81
VITE_AGENT_CLAUDE_PORT=4110
```

### Client Settings (lib/settings.ts)

The Twenty API key is **embedded in client code** and forced (ignores localStorage).
This ensures consistent authentication across all clients.

```typescript
// TWENTY_API_KEY is embedded at build time
// getSettings() always uses the embedded key, not localStorage
```

### SMS Configuration

| Setting | Value |
|---------|-------|
| Default SMS Number | `+18333856399` (toll-free) |
| SMS Service | Proxied via `/twilio-api` to twilio-service:4115 |
| Inbound Webhook | `POST /api/ads/dialer/sms/inbound` |
| Status Callback | `POST /api/ads/dialer/sms/status` |

**Note:** The toll-free number doesn't require A2P 10DLC registration and is ready for immediate use.

---

## Development

```bash
# Start dev server
cd apps/ads-dashboard
npm run dev
# → http://localhost:3100

# Type check
npm run check

# Build for production
npm run build
# → dist/index.cjs + dist/public/
```

---

## Deployment

```bash
# Option 1: Push to GitHub, build on droplet (recommended)
git push origin main
ssh root@165.227.111.24 "cd /var/www/lids && git pull && cd apps/ads-dashboard && npm run build && pm2 restart lids --update-env"

# Option 2: Build locally, deploy via scp
npm run build
scp -r dist/* root@165.227.111.24:/var/www/lids/apps/ads-dashboard/dist/
ssh root@165.227.111.24 "pm2 restart lids --update-env"
```

**Production URL:** https://lids.ripemerchant.host
**PM2 Process Name:** `lids`
**Location on Droplet:** `/var/www/lids/apps/ads-dashboard/`

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| API key in client bundle | Medium | Key is forced/embedded, workspace-scoped |
| No authentication | HIGH | Planned for user registry integration |
| XP sync unreliable | Medium | IndexedDB → Twenty sync not implemented |
| Dialer requires admiral-server | Low | Native mode works standalone with timer-based tracking |
| Lead editing | Low | Can view but not edit lead details from dialer profile |

---

## Related Documentation

- [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - Full system architecture
- [TROUBLESHOOTING.md](./architecture/TROUBLESHOOTING.md) - Common issues
- [PROGRESSION_SYSTEM.md](./PROGRESSION_SYSTEM.md) - XP, ranks, badges
- [../CLAUDE.md](../CLAUDE.md) - Development guidelines
- [../PORT_REFERENCE.md](../PORT_REFERENCE.md) - Quick port lookup

---

*Last Updated: December 25, 2025*
