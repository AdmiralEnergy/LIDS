# COMPASS

**Mobile PWA for field sales representatives** - AI-powered field assistant.

**Updated:** December 24, 2025

---

## Overview

COMPASS is a Progressive Web App designed for solar sales reps in the field. It provides conversational AI assistance, lead enrichment, and works offline between doors.

```
Production:  https://compass.ripemerchant.host
Local Dev:   http://localhost:3101
Location:    apps/compass/
PM2 Service: compass-pwa
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       COMPASS (:3101)                            │
│                   Express + React (Vite)                         │
│                        PWA Enabled                               │
├─────────────────────────────────────────────────────────────────┤
│  CLIENT (React)                                                  │
│  ├── pages/                                                      │
│  │   ├── home.tsx          Main interface                       │
│  │   └── CommandsPage.tsx  Available commands                   │
│  └── PWA                   Service worker, offline cache         │
├─────────────────────────────────────────────────────────────────┤
│  SERVER (Express)                                                │
│  └── Proxy to COMPASS Agent (:4098)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    COMPASS Agent (:4098)
                    (AI conversation engine)
```

---

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `home.tsx` | Main chat interface |
| `/commands` | `CommandsPage.tsx` | Available slash commands |
| `/not-found` | `not-found.tsx` | 404 page |

---

## Features

### Conversational AI
- **Agent Chat**: Natural language interface to LifeOS agents
- **Slash Commands**: Quick actions (/lookup, /objection, /script)
- **Context Awareness**: Remembers conversation history

### Field Tools
- **Lead Enrichment**: Property data lookup by address
- **Objection Handling**: AI-suggested responses
- **Script Assistance**: Pitch scripts on demand
- **Utility Lookup**: NC utility territory info

### PWA Capabilities
- **Installable**: Add to home screen on iOS/Android
- **Offline Mode**: Works without internet connection
- **Background Sync**: Queues requests for later
- **Push Notifications**: (Planned) Alert on hot leads

---

## Backend Services

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| COMPASS Agent | 4098 | AI conversation engine | **Not deployed** |
| Oracle | 4050 | Memory/context | Active |

### Current State

The COMPASS agent backend is **not yet deployed**. The app currently shows mocked responses.

**To enable real AI:**

1. Deploy COMPASS agent to port 4098
2. Update `server/routes.ts` to proxy to agent:

```javascript
app.use('/api/chat', createProxyMiddleware({
  target: 'http://192.168.1.23:4098',
  changeOrigin: true,
}));
```

---

## Data Layer

### Browser (Dexie/IndexedDB)

| Table | Purpose |
|-------|---------|
| `conversations` | Chat history |
| `enrichmentCache` | Property lookup cache |
| `commandHistory` | Recent commands |

### Integration Points

| System | Purpose |
|--------|---------|
| Oracle (4050) | Long-term memory, context |
| HELM Dashboard | Lead data sync |
| FieldOps Agents | Rep-specific AI partner |

---

## Configuration

### Environment Variables

```bash
PORT=3101
COMPASS_AGENT_URL=http://192.168.1.23:4098
```

### PWA Manifest

Located at `client/public/manifest.json`:

```json
{
  "name": "COMPASS",
  "short_name": "COMPASS",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0c2f4a"
}
```

---

## Development

```bash
# Start dev server
cd apps/compass
npm run dev
# → http://localhost:3101

# Build for production
npm run build

# Test PWA locally
npm run build && npm run start
```

---

## Deployment

```bash
# Build locally
npm run build

# Deploy to admiral-server
scp -r dist/* edwardsdavid913@192.168.1.23:~/apps/compass-pwa/
ssh edwardsdavid913@192.168.1.23 "pm2 restart compass-pwa"
```

**Production URL:** https://compass.ripemerchant.host

---

## Cloudflare Tunnel

Configured in `~/.cloudflared/config.yml`:

```yaml
- hostname: compass.ripemerchant.host
  service: http://localhost:3101
```

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Agent responses mocked | HIGH | Awaiting COMPASS agent deployment |
| No offline chat | Medium | Needs local LLM fallback |
| PWA install prompt missing | Low | Needs manifest tweaks |

---

## Roadmap

1. **Deploy COMPASS Agent** - Enable real AI conversations
2. **FieldOps Integration** - Connect to rep-specific AI partners
3. **Offline AI** - Local model for basic queries
4. **Push Notifications** - Hot lead alerts
5. **Voice Input** - Speak to ask questions

---

## Related Documentation

- [ADS_DASHBOARD.md](./ADS_DASHBOARD.md) - Main dashboard
- [REDHAWK_ACADEMY.md](./REDHAWK_ACADEMY.md) - Training platform
- [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - Full system architecture

---

*Last Updated: December 24, 2025*
