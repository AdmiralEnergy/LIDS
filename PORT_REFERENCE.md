# LIDS - Port Reference

## Production (DO Droplet - 165.227.111.24)

| App | Port | URL | PM2 Name |
|-----|------|-----|----------|
| **LIDS Dashboard** | 5000 | https://lids.ripemerchant.host | lids |
| **Twenty CRM** | 3001 | https://twenty.ripemerchant.host | Docker |
| **COMPASS** | 3101 | https://compass.ripemerchant.host | compass |
| **RedHawk Academy** | 3102 | https://academy.ripemerchant.host | redhawk |

**SSH:** `ssh root@165.227.111.24`

---

## Local Development (AdmiralEnergy Desktop)

| App | Port | URL | Description |
|-----|------|-----|-------------|
| **LIDS Dashboard** | 3100 | http://localhost:3100 | CRM, Dialer, Lead Management |
| **COMPASS** | 3101 | http://localhost:3101 | Mobile PWA, Rep AI Partner |
| **RedHawk Academy** | 3102 | http://localhost:3102 | Sales Training Platform |
| **n8n** | 5678 | http://localhost:5678 | Workflow Automation |

---

## Backend Services (admiral-server via Tailscale)

| Service | Port | Tailscale URL | Purpose |
|---------|------|---------------|---------|
| **Voice Service** | 4130 | http://100.66.42.81:4130 | STT (faster-whisper) + TTS (Piper) |
| **Twilio Service** | 4115 | http://100.66.42.81:4115 | Click-to-dial, call recording |
| **Agent-Claude** | 4110 | http://100.66.42.81:4110 | Primary MCP Server |
| **RedHawk Agent** | 4096 | http://100.66.42.81:4096 | Boss battles, exams |
| **MCP Kernel** | 4000 | http://100.66.42.81:4000 | Agent Routing |
| **Oracle** | 4050 | http://100.66.42.81:4050 | Memory Service |
| **GIDEON** | 4100 | http://100.66.42.81:4100 | Executive AI (David) |
| **LiveWire** | 5000 | http://100.66.42.81:5000 | Sales AI (Nate) |

**SSH:** `ssh edwardsdavid913@192.168.1.23`

---

## Quick Launch

```bash
# From LIDS directory - Local development
cd apps/ads-dashboard && npm run dev    # → localhost:3100
cd apps/compass && npm run dev          # → localhost:3101
cd apps/redhawk-academy && npm run dev  # → localhost:3102

# Production (Droplet)
ssh root@165.227.111.24 "pm2 status"
ssh root@165.227.111.24 "pm2 restart lids --update-env"
```

---

## App → Backend Dependencies

| App | Droplet Services | Admiral-Server Services |
|-----|------------------|------------------------|
| LIDS Dashboard | Twenty CRM (:3001) | Twilio (:4115), Voice (:4130) |
| COMPASS | - | Agent-Claude (:4110) |
| RedHawk Academy | - | RedHawk Agent (:4096) |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  USERS (Internet)                                             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  DO DROPLET (165.227.111.24)                                  │
│  nginx reverse proxy → *.ripemerchant.host                   │
├──────────────────────────────────────────────────────────────┤
│  lids:5000  │  twenty:3001  │  compass:3101  │  redhawk:3102 │
└──────────────────────────────────────────────────────────────┘
                              │ Tailscale (100.66.42.81)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  ADMIRAL-SERVER (192.168.1.23)                                │
├──────────────────────────────────────────────────────────────┤
│  voice:4130 │ twilio:4115 │ agent-claude:4110 │ redhawk:4096 │
└──────────────────────────────────────────────────────────────┘
```

---
*Updated: December 25, 2025*
