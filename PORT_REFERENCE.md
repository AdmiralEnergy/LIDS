# LIDS Monorepo - Port Reference

## Local Development (AdmiralEnergy Desktop)

| App | Port | URL | Description |
|-----|------|-----|-------------|
| **ADS Dashboard** | 3100 | http://localhost:3100 | CRM, Dialer, Lead Management |
| **Compass** | 3101 | http://localhost:3101 | Mobile PWA, Rep AI Partner |
| **RedHawk Academy** | 3102 | http://localhost:3102 | Sales Training Platform |
| **n8n** | 5678 | http://localhost:5678 | Workflow Automation |

## Backend Services (admiral-server 192.168.1.23)

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Twenty CRM** | 3001 | http://192.168.1.23:3001 | CRM Interface + API (admin/LifeOS2025!) |
| **MCP Kernel** | 4000 | http://192.168.1.23:4000 | Agent Routing |
| **Oracle** | 4050 | http://192.168.1.23:4050 | Memory Service |
| **COMPASS agents** | 4098 | http://192.168.1.23:4098 | Mobile AI Partner |
| **REDHAWK** | 4096 | http://192.168.1.23:4096 | Sales Training AI |
| **GIDEON** | 4100 | http://192.168.1.23:4100 | Executive AI (David) |
| **Agent-Claude** | 4110 | http://192.168.1.23:4110 | Primary MCP Server |
| **Twilio Service** | 4115 | http://192.168.1.23:4115 | Click-to-dial |
| **LiveWire** | 5000 | http://192.168.1.23:5000 | Sales AI (Nate) |

## Quick Launch

```bash
# From LIDS-monorepo directory
cd apps/ads-dashboard && npm run dev    # → localhost:3100
cd apps/compass && npm run dev          # → localhost:3101
cd apps/redhawk-academy && npm run dev  # → localhost:3102
```

## App → Backend Dependencies

| App | Connects To |
|-----|-------------|
| ADS Dashboard | Twenty CRM (3001), Twilio (4115), n8n (5678) |
| Compass | COMPASS agents (4098) |
| RedHawk Academy | REDHAWK (4096) |

---
*Updated: December 24, 2025*
