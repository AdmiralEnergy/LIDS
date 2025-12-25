# LIDS - Live Interactive Dashboard System

User-facing applications for Admiral Energy: HELM Dashboard, Compass, RedHawk Academy, and Twenty CRM.

**Production:** https://helm.ripemerchant.host (DO Droplet)
**Repository:** github.com/AdmiralEnergy/LIDS

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DO DROPLET (165.227.111.24)                               │
│                    Tailscale: 100.94.207.1                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │ HELM        │  │ Twenty CRM  │  │ Compass     │  │ RedHawk     │       │
│   │ :5000       │  │ :3001       │  │ :3101       │  │ :3102       │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                              │
│   nginx (SSL termination) → Cloudflare Origin Certificate                   │
│   PM2 (process management) → HELM, Compass, RedHawk                         │
│   Docker → Twenty CRM (twenty-server, twenty-db, twenty-redis)              │
│                                                                              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ Tailscale VPN (100.66.42.81)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    admiral-server (AI/Agent Backend)                         │
│                    Tailscale: 100.66.42.81                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│   Twilio Service (:4115)  │  Voice Service (:4130)  │  Agent-Claude (:4110) │
│   n8n (:5678)             │  Oracle (:4050)         │  MCP Kernel (:4000)   │
│                                                                              │
│   NEVER EXPOSED TO INTERNET - All access via Tailscale                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Public URLs

| Service | URL | Port |
|---------|-----|------|
| **HELM Dashboard** | https://helm.ripemerchant.host | 5000 |
| **Twenty CRM** | https://twenty.ripemerchant.host | 3001 |
| **Compass** | https://compass.ripemerchant.host | 3101 |
| **RedHawk Academy** | https://academy.ripemerchant.host | 3102 |

---

## Backend Connection (Tailscale)

All apps connect to admiral-server via Tailscale private network:

```bash
# Backend host (Tailscale IP - never public)
BACKEND_HOST=100.66.42.81

# Services
VITE_TWILIO_HOST=100.66.42.81
VITE_TWILIO_PORT=4115
VITE_TRANSCRIPTION_HOST=100.66.42.81
VITE_TRANSCRIPTION_PORT=4130
VITE_AGENT_CLAUDE_HOST=100.66.42.81
VITE_AGENT_CLAUDE_PORT=4110
```

**Why Tailscale?**
- Backend services never exposed to internet
- No port forwarding or firewall rules needed
- Works across networks, survives IP changes
- Direct WireGuard tunnels for low latency

---

## Quick Start (Development)

```bash
# Clone repo
git clone git@github.com:AdmiralEnergy/LIDS.git
cd LIDS

# Install dependencies
npm install

# Start HELM Dashboard
cd apps/ads-dashboard
npm run dev  # http://localhost:3100

# Start Compass
cd ../compass
npm run dev  # http://localhost:3101

# Start RedHawk Academy
cd ../redhawk-academy
npm run dev  # http://localhost:3102
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
# Pull latest code
git pull origin main

# Rebuild and restart HELM
cd apps/ads-dashboard
npm run build
pm2 restart helm

# Rebuild and restart Compass
cd ../compass
npm run build
pm2 restart compass

# Rebuild and restart RedHawk
cd ../redhawk-academy
npm run build
pm2 restart redhawk
```

### Update Twenty CRM

```bash
cd /var/www/lids/apps/twenty-crm
docker compose pull
docker compose up -d
```

### Check Status

```bash
# PM2 apps
pm2 status

# Twenty CRM containers
docker ps | grep twenty

# nginx
systemctl status nginx
```

---

## Environment Configuration

### HELM (.env)

```bash
NODE_ENV=production
PORT=5000

# Twenty CRM (local on droplet)
VITE_TWENTY_CRM_HOST=localhost
VITE_TWENTY_CRM_PORT=3001

# Backend services (via Tailscale)
VITE_TWILIO_HOST=100.66.42.81
VITE_TWILIO_PORT=4115
VITE_TRANSCRIPTION_HOST=100.66.42.81
VITE_TRANSCRIPTION_PORT=4130
VITE_AGENT_CLAUDE_HOST=100.66.42.81
VITE_AGENT_CLAUDE_PORT=4110
```

### Twenty CRM (.env)

```bash
SERVER_URL=https://twenty.ripemerchant.host
FRONT_BASE_URL=https://twenty.ripemerchant.host
POSTGRES_PASSWORD=<generated>
APP_SECRET=<generated>
ACCESS_TOKEN_SECRET=<generated>
LOGIN_TOKEN_SECRET=<generated>
REFRESH_TOKEN_SECRET=<generated>
```

---

## nginx Configuration

Located at `/etc/nginx/sites-available/lids`:

```nginx
# HELM Dashboard
server {
    listen 443 ssl;
    server_name helm.ripemerchant.host;

    ssl_certificate /etc/ssl/cloudflare/origin.crt;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Similar blocks for twenty, compass, academy...
```

---

## Tailscale Setup

### On Droplet

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate (opens browser)
tailscale up

# Verify connection to admiral-server
ping 100.66.42.81
```

### Verify Backend Connection

```bash
# Test Twilio service
curl http://100.66.42.81:4115/health

# Test Voice service
curl http://100.66.42.81:4130/health

# Test Agent-Claude
curl http://100.66.42.81:4110/health
```

---

## Directory Structure

```
/var/www/lids/
├── apps/
│   ├── ads-dashboard/     # HELM Dashboard (:5000)
│   │   ├── client/        # React frontend
│   │   ├── server/        # Express backend
│   │   ├── dist/          # Production build
│   │   └── .env           # Environment config
│   │
│   ├── compass/           # Mobile PWA (:3101)
│   │   └── ...
│   │
│   ├── redhawk-academy/   # Training (:3102)
│   │   └── ...
│   │
│   └── twenty-crm/        # Docker Compose
│       ├── docker-compose.yml
│       └── .env
│
└── packages/              # Shared packages
```

---

## Troubleshooting

### App Not Responding

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs helm --lines 50

# Restart app
pm2 restart helm
```

### Twenty CRM Issues

```bash
# Check containers
docker ps -a | grep twenty

# View logs
docker logs twenty-server --tail 50

# Restart all containers
cd /var/www/lids/apps/twenty-crm
docker compose restart
```

### Backend Connection Failed

```bash
# Check Tailscale status
tailscale status

# Test connection to admiral-server
ping 100.66.42.81
curl http://100.66.42.81:4115/health
```

### nginx Issues

```bash
# Test config
nginx -t

# Reload config
systemctl reload nginx

# View error logs
tail -f /var/log/nginx/error.log
```

---

## Health Checks

```bash
# All services
curl -s https://helm.ripemerchant.host | head -1
curl -s https://twenty.ripemerchant.host | head -1
curl -s https://compass.ripemerchant.host | head -1
curl -s https://academy.ripemerchant.host | head -1
```

---

## Related Documentation

| Document | Location |
|----------|----------|
| LifeOS Architecture | LifeOS-Core/ARCHITECTURE.md |
| Agent Reference | LifeOS-Core/AGENTS.md |
| CLAUDE.md | LifeOS-Core/CLAUDE.md |

---

**Owner:** Admiral Energy LLC
**Contact:** david.edwards@reachsolar.com
