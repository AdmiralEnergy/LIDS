# LIDS - Live Interactive Dashboard

User-facing applications for Admiral Energy: LIDS Dashboard, Compass, RedHawk Academy, and Twenty CRM.

**Terminology:**
- **LIDS** = Live Interactive Dashboard (the SaaS platform)
- **ADS** = Admiral Dialer System (sales-specific tools within LIDS)

**Production:** https://lids.ripemerchant.host (DO Droplet)
**Repository:** github.com/AdmiralEnergy/LIDS

---

## Architecture Overview (Standalone Droplet)

**Key Design:** LIDS works FULLY STANDALONE on the droplet. No backend required for core functionality.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DO DROPLET (165.227.111.24) - EVERYTHING REPS NEED                         │
│  Fully standalone - no backend dependencies for core functionality          │
├─────────────────────────────────────────────────────────────────────────────┤
│   LIDS Dashboard :5000    │  Studio :3103         │  Twenty CRM :3001       │
│   COMPASS :3101           │  RedHawk Academy :3102│  (Docker, CANONICAL)    │
│                                                                              │
│   nginx (SSL) → Cloudflare   │   PM2 (LIDS, Compass, RedHawk, Studio)      │
│   Docker → Twenty CRM (twenty-server, twenty-db, twenty-redis)              │
│                                                                              │
│   ✅ Native phone calling (tel: links)  │  ✅ Admiral Chat (team messaging) │
│   ✅ Lead management via Twenty CRM     │  ✅ XP/Progression (IndexedDB)    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │ Tailscale VPN (OPTIONAL)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  admiral-server (192.168.1.23) - OPTIONAL AI Enhancements                   │
│  LIDS works fine WITHOUT these services                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│   Twilio Service :4115    │  Voice Service :4130    │  Agent-Claude :4110   │
│   (Browser calling)       │  (Live transcription)   │  (AI assistance)      │
│                                                                              │
│   ⚠️  If admiral-server is down: Native phone mode still works!             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### What Works Without admiral-server

| Feature | Works? | Notes |
|---------|--------|-------|
| Lead viewing/editing | ✅ Yes | Twenty CRM on droplet |
| Native phone calls | ✅ Yes | Uses tel: links |
| Call disposition | ✅ Yes | Logs to Twenty CRM |
| XP/Progression | ✅ Yes | IndexedDB local |
| Browser-based calling | ❌ No | Requires Twilio Service |
| Live transcription | ❌ No | Requires Voice Service |

---

## Public URLs

| Service | URL | Port | Location |
|---------|-----|------|----------|
| **LIDS Dashboard** | https://helm.ripemerchant.host | 5000 | Droplet |
| **Studio** | https://studio.ripemerchant.host | 3103 | Droplet |
| **Twenty CRM** | https://twenty.ripemerchant.host | 3001 | Droplet (Docker) |
| **Compass** | https://compass.ripemerchant.host | 3101 | Droplet |
| **RedHawk Academy** | https://academy.ripemerchant.host | 3102 | Droplet |

**Note:** Twenty CRM is ONLY on the droplet. There is no admiral-server instance.

### Team Chat (Admiral Chat)

Admiral Chat provides team messaging across LIDS apps:

| App | Route | Purpose |
|-----|-------|---------|
| **ADS Dashboard** | `/chat` | Sales team chat + cadence notifications |
| **Studio** | `/team` | Marketing team chat |

See [apps/admiral-chat/README.md](apps/admiral-chat/README.md) for full documentation.

---

## Packages

Shared packages for cross-app functionality:

| Package | Location | Purpose | Status |
|---------|----------|---------|--------|
| **@lids/admiral-chat** | `packages/admiral-chat/` | Team chat components + hooks | MVP Complete |
| **@lids/compass-core** | `packages/compass-core/` | Base agent framework | Stable |
| **@lids/compass-sales** | `packages/compass-sales/` | Sales agents (Coach, Intel, Guard) | Phase 1 Complete |
| **@lids/compass-studio** | `packages/compass-studio/` | Marketing agents (Sarai, MUSE) | Planning |
| **shared** | `packages/shared/` | Common utilities | Placeholder |

---

## Backend Connection (Optional - Tailscale)

For AI/voice features, apps can connect to admiral-server via Tailscale:

```bash
# Optional - Backend services (via Tailscale)
VOICE_SERVICE_URL=http://100.66.42.81:4130
TWILIO_SERVICE_URL=http://100.66.42.81:4115
```

These are OPTIONAL. LIDS works without them using native phone mode.

---

## Quick Start (Development)

```bash
git clone git@github.com:AdmiralEnergy/LIDS.git
cd LIDS && npm install

cd apps/ads-dashboard && npm run dev  # http://localhost:3100
cd ../compass && npm run dev           # http://localhost:3101
cd ../redhawk-academy && npm run dev   # http://localhost:3102
```

---

## Deployment (DO Droplet)

### SSH Access

```bash
ssh root@165.227.111.24
cd /var/www/lids
```

### Update Apps

```bash
git pull origin main

cd apps/ads-dashboard && npm run build && pm2 restart lids
cd ../compass && npm run build && pm2 restart compass
cd ../redhawk-academy && npm run build && pm2 restart redhawk
```

### Update Twenty CRM

```bash
cd /var/www/lids/apps/twenty-crm
docker compose pull && docker compose up -d
```

### Check Status

```bash
pm2 status
docker ps | grep twenty
systemctl status nginx
```

---

## Environment Configuration

### LIDS (.env) - Minimal Required

```bash
NODE_ENV=production
PORT=5000

# Twenty CRM (local on droplet - REQUIRED)
TWENTY_CRM_URL=http://localhost:3001
TWENTY_API_KEY=your_api_key_here
```

### With Optional AI Services

```bash
# Optional - Backend services via Tailscale
VOICE_SERVICE_URL=http://100.66.42.81:4130
TWILIO_SERVICE_URL=http://100.66.42.81:4115
```

---

## Troubleshooting

### App Not Responding

```bash
pm2 status
pm2 logs lids --lines 50
pm2 restart lids
```

### Twenty CRM Issues

```bash
docker ps -a | grep twenty
docker logs twenty-server --tail 50
cd /var/www/lids/apps/twenty-crm && docker compose restart
```

### Backend Connection Failed (Optional Services)

```bash
tailscale status
ping 100.66.42.81
curl http://100.66.42.81:4115/health
```

**Note:** If backend unreachable, LIDS still works with native phone mode.

---

## Health Checks

```bash
curl -s https://lids.ripemerchant.host | head -1
curl -s https://twenty.ripemerchant.host | head -1
curl -s https://compass.ripemerchant.host | head -1
curl -s https://academy.ripemerchant.host | head -1
```

---

## Related Documentation

| Document | Location |
|----------|----------|
| LIDS CLAUDE.md | ./CLAUDE.md |
| Architecture Details | ./docs/architecture/ARCHITECTURE.md |
| LifeOS Core | LifeOS-Core/CLAUDE.md |

---

*Last Updated: December 29, 2025*

**Owner:** Admiral Energy LLC
**Contact:** david.edwards@reachsolar.com
