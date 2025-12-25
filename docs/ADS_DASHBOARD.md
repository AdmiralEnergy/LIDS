# ADS Dashboard (HELM)

**Admiral Dialer System** - Full-featured CRM and dialer dashboard for solar sales teams.

**Updated:** December 24, 2025

---

## Overview

HELM is the primary operator interface for Admiral Energy sales operations. It combines CRM functionality, click-to-call dialing, gamified progression, and team management.

```
Production:  https://helm.ripemerchant.host
Local Dev:   http://localhost:3100
Location:    apps/ads-dashboard/
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADS DASHBOARD (:3100)                        │
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
│  └── API Routes     /api/leads, /api/activities, /api/import   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   Twenty CRM            Twilio Service        Voice Service
   (:3001)               (:4115)               (:4130)
```

---

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `dashboard.tsx` | Rep home screen, stats, quick actions |
| `/leads` | `leads.tsx` | Lead list with CSV import wizard |
| `/crm` | `crm.tsx` | Twenty CRM integration view |
| `/pipeline` | `pipeline.tsx` | Kanban-style lead progression |
| `/dialer` | `dialer.tsx` | Click-to-call with Twilio Voice SDK |
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

### Dialer
- **Click-to-Call**: Twilio Voice SDK integration
- **Real-time Transcription**: Voice service (faster-whisper)
- **Voicemail Drop**: Pre-recorded message templates
- **Call Recording**: Automatic recording with playback

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
| `AdsDatabase` | activities, leads, syncQueue | CRM data cache |
| `ADS_Progression` | progression, xpEvents, badgeProgress, bossHistory, dailyMetrics | Gamification state |

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

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| Twenty CRM | 3001 | CRM data, GraphQL API | `/rest/health` |
| Twilio Service | 4115 | Token gen, call history | `/health` |
| Voice Service | 4130 | STT/TTS | `/health` |

### Proxy Configuration (server/index.ts)

```javascript
/twenty-api/* → http://localhost:3001
/twilio-api/* → http://localhost:4115
/voice-api/*  → http://localhost:4130
```

---

## Configuration

### Environment Variables (Server)

```bash
PORT=3100
VITE_TWENTY_API_URL=http://localhost:3001
TWENTY_API_KEY=eyJhbGci...
```

### Settings (localStorage)

Key: `ads_settings`

```typescript
{
  backendHost: "192.168.1.23",
  twentyCrmPort: "3001",
  twilioPort: "4115",
  transcriptionPort: "4130",
  n8nPort: "5678",
  // ... see lib/settings.ts
}
```

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
# Build locally
npm run build

# Deploy to admiral-server
scp -r dist/* edwardsdavid913@192.168.1.23:~/apps/helm-dashboard/
ssh edwardsdavid913@192.168.1.23 "pm2 restart helm-dashboard"
```

**Production URL:** https://helm.ripemerchant.host

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| API key in client bundle | HIGH | Needs server-side migration |
| No authentication | HIGH | Planned |
| XP sync unreliable | Medium | Needs retry logic |
| Dialer fails silently | Medium | Needs error UI |

---

## Related Documentation

- [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - Full system architecture
- [TROUBLESHOOTING.md](./architecture/TROUBLESHOOTING.md) - Common issues
- [../CLAUDE.md](../CLAUDE.md) - Development guidelines

---

*Last Updated: December 24, 2025*
