# Command Dashboard

Infrastructure monitoring and AI chat interface for LifeOS operations.

**Production URL:** https://command.ripemerchant.host
**Port:** 3104 (dev) | Oracle ARM deployment
**Status:** LIVE

---

## Overview

Command Dashboard is a single-page application that provides:

1. **DeepSeek R1 Agent** - AI assistant with system awareness, code tools, and approval workflows
2. **NC Grid Engine Status** - Real-time Duke Energy outage monitoring for all 100 NC counties
3. **Infrastructure Health** - Status monitoring for all LifeOS services

---

## DeepSeek R1 Agent Integration

The DeepSeek R1 chat is not just a chatbot - it's a **full agent** with awareness of the entire LifeOS system and the ability to read/write code.

### Agent Capabilities

| Capability | Description |
|------------|-------------|
| **System Awareness** | Knows status of Grid Engine, LiveWire, Twenty CRM on first message |
| **Read Tools** | Read files, search code, list directories, query APIs (auto-executed) |
| **Write Tools** | Propose code edits with diff view (requires user approval) |
| **Context Memory** | Maintains conversation context across messages |

### How It Improves the Dashboard

1. **Self-Service Debugging** - Ask DeepSeek "Why is Grid Engine showing stale data?" and it can read server logs, check service status, and diagnose issues
2. **Code Assistance** - Ask "Add a filter for counties with >1000 customers" and it proposes the exact code change with diff preview
3. **System Documentation** - DeepSeek knows the architecture and can explain how services connect
4. **API Queries** - Query Grid Engine for specific county data or outage statistics directly through chat

### Available Tools

**Read Tools (auto-execute):**
- `readFile` - Read files from LIDS codebase (10KB limit)
- `listFiles` - List directory contents
- `searchCode` - Search for text patterns in code
- `getServiceStatus` - Check health of connected services
- `queryGridEngine` - Query Grid Engine API endpoints

**Write Tools (require approval):**
- `proposeEdit` - Propose code changes with search/replace diff
- `proposeNewFile` - Propose creating new files

### Security

- **Path restriction**: Only LIDS codebase accessible (`/home/ubuntu/lids`)
- **Sensitive files filtered**: `.env`, `credentials`, `secret` files blocked
- **Size limits**: 10KB per file read
- **Approval required**: Write operations show diff and require explicit approval

### UI Indicators

- **🟢 LIVE** - Connected to DeepSeek R1 on Oracle ARM
- **🔵 Context Aware** - System context injected (first message)
- **🟡 N Pending** - Edit proposals awaiting approval

```
┌──────────────────────────────────────────────────────────────────────────┐
│  COMMAND DASHBOARD                                          [MOCK/LIVE]  │
├────────────────────────────────────┬─────────────────────────────────────┤
│                                    │                                     │
│  DEEPSEEK R1 CHAT                  │  NC GRID ENGINE                     │
│  ┌──────────────────────────────┐  │  ┌─────────────────────────────────┐│
│  │ Chat with <think> blocks     │  │  │ 🏠 Cleveland County (Home)      ││
│  │ visible and collapsible      │  │  │    GREEN - 0 customers out     ││
│  │                              │  │  ├─────────────────────────────────┤│
│  │                              │  │  │ Summary: 97 GREEN | 3 YELLOW   ││
│  │                              │  │  ├─────────────────────────────────┤│
│  └──────────────────────────────┘  │  │ Active Outages:                 ││
│  [Input message...]         [Send] │  │  Wake: 162 | Macon: 96          ││
│                                    │  └─────────────────────────────────┘│
├────────────────────────────────────┴─────────────────────────────────────┤
│  INFRASTRUCTURE HEALTH                                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌───────────────────┐ │
│  │ Oracle ARM          │  │ Admiral-Server      │  │ Droplet           │ │
│  │ • Grid Engine  [OK] │  │ • LiveWire     [OK] │  │ • Twenty CRM [OK] │ │
│  │ • DeepSeek R1  [OK] │  │ • Agent-Claude [OK] │  │                   │ │
│  └─────────────────────┘  │ • Oracle Memory[OK] │  └───────────────────┘ │
│                           │ • Twilio       [OK] │                        │
│                           │ • n8n          [--] │                        │
│                           └─────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Deployment Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ORACLE ARM (193.122.153.249) - Command + Grid Engine                   │
│  24GB RAM | 4 ARM OCPUs | Ubuntu                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────┐│
│  │ command-dashboard :3104 │◄───│ nginx reverse proxy                 ││
│  │ (Node.js + Express)     │    │ command.ripemerchant.host           ││
│  └────────────┬────────────┘    │ SSL via Let's Encrypt               ││
│               │                 └─────────────────────────────────────┘│
│               │ localhost:4120                                         │
│               ▼                                                         │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────┐│
│  │ grid-engine :4120       │◄───│ Data Sources:                       ││
│  │ (Fastify + SQLite)      │    │ • NWS API (weather alerts)          ││
│  └─────────────────────────┘    │ • Duke DEC API (outages)            ││
│               │                 │ • Duke DEP API (outages)            ││
│               ▼                 └─────────────────────────────────────┘│
│  ┌─────────────────────────┐                                           │
│  │ ollama :11434           │                                           │
│  │ DeepSeek R1 14B         │                                           │
│  └─────────────────────────┘                                           │
│                                                                         │
│  PM2 Managed: command-dashboard, grid-engine                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | UI Framework |
| Styling | Tailwind CSS + shadcn/ui | Design System |
| State | TanStack Query | Data Fetching & Caching |
| Build | Vite | Development & Production Build |
| Server | Express.js | API Proxy & Static Serving |
| Bundler | esbuild | Server Bundle |
| Process | PM2 | Production Process Management |

### File Structure

```
apps/command-dashboard/
├── README.md                           # This file
├── package.json                        # @lids/command-dashboard
├── vite.config.ts                      # Vite configuration
├── tsconfig.json                       # TypeScript config
├── tailwind.config.js                  # Tailwind configuration
├── postcss.config.js
├── script/
│   └── build.ts                        # Production build script
│
├── client/                             # Frontend (React)
│   ├── index.html
│   └── src/
│       ├── main.tsx                    # Entry point
│       ├── App.tsx                     # Root component
│       ├── index.css                   # Global styles
│       │
│       ├── pages/
│       │   └── dashboard.tsx           # Main dashboard page
│       │
│       ├── components/
│       │   ├── chat/
│       │   │   ├── DeepSeekChat.tsx    # Chat container with proposals
│       │   │   ├── ChatInput.tsx       # Message input
│       │   │   ├── ThinkingBlock.tsx   # Collapsible <think> display
│       │   │   └── CodeEditProposal.tsx # Edit approval UI with diff view
│       │   ├── grid/
│       │   │   └── GridStatusPanel.tsx # County status + Cleveland focus
│       │   └── infra/
│       │       ├── InfraHealthPanel.tsx # Service health grid
│       │       └── ServiceCard.tsx      # Individual service card
│       │
│       ├── hooks/
│       │   ├── useDeepSeekChat.ts      # DeepSeek R1 agent with tools
│       │   ├── useGridEngine.ts        # Grid Engine data fetching
│       │   └── useServiceHealth.ts     # Service health checks
│       │
│       └── lib/
│           ├── settings.ts             # Configurable service URLs
│           ├── deepseekTools.ts        # Tool definitions and XML parsing
│           ├── mockData.ts             # Mock data for offline dev
│           ├── queryClient.ts          # TanStack Query setup
│           └── utils.ts                # Utility functions
│
├── server/                             # Backend (Express)
│   ├── index.ts                        # Server entry point
│   ├── routes.ts                       # API proxy routes
│   ├── static.ts                       # Static file serving
│   └── vite.ts                         # Vite dev middleware
│
├── shared/
│   └── schema.ts                       # Shared TypeScript types
│
├── dist/                               # Production build output
│   ├── index.cjs                       # Server bundle
│   └── public/                         # Client assets
│
└── docs/
    └── grid-engine/                    # Grid Engine documentation
        ├── README.md                   # Overview and quick start
        ├── ARCHITECTURE.md             # Technical deep dive
        ├── API_REFERENCE.md            # Complete REST API docs
        ├── STATE_MACHINE.md            # State transitions and Risk Brain
        ├── INTEGRATIONS.md             # Connections to other LIDS apps
        └── OPERATIONS.md               # Ops runbook and troubleshooting
```

---

## Services Monitored

### Oracle ARM (193.122.153.249)

| Service | Port | Health Endpoint | Purpose |
|---------|------|-----------------|---------|
| Grid Engine | 4120 | `/health` | NC county outage monitoring |
| DeepSeek R1 | 11434 | `/api/tags` | Self-hosted LLM (Ollama) |

### Admiral-Server (192.168.1.23)

| Service | Port | Health Endpoint | Purpose |
|---------|------|-----------------|---------|
| LiveWire | 5000 | `/health` | Reddit/lead scanner |
| Agent-Claude | 4110 | `/health` | MCP Server |
| Oracle Memory | 4050 | `/health` | Semantic memory |
| Twilio Service | 4115 | `/health` | Voice/SMS |
| n8n | 5678 | `/healthz` | Workflow automation |

### Droplet (localhost when on droplet)

| Service | Port | Health Endpoint | Purpose |
|---------|------|-----------------|---------|
| Twenty CRM | 3001 | `/healthz` | Lead management |

---

## API Routes

The Express server proxies requests to backend services:

### DeepSeek R1 (Ollama + Agent Tools)

```
POST /api/deepseek/generate
  Body: { prompt: string, context?: number[] }
  Returns: { response: string, thinking?: string, context: number[] }
  Timeout: 180s (ARM is slow)

GET /api/deepseek/health
  Returns: { status: string, models: string[] }

GET /api/deepseek/context
  Returns: { services: {...}, codebase: {...}, infrastructure: {...} }
  Purpose: System context for agent awareness

POST /api/deepseek/execute-tool
  Body: { tool: string, params: Record<string, string> }
  Returns: { result: any } or { error: string }
  Tools: readFile, listFiles, searchCode, getServiceStatus, queryGridEngine

POST /api/deepseek/apply-edit
  Body: { type: 'edit'|'newFile', path: string, search?: string, replace?: string, content?: string }
  Returns: { success: boolean, message: string }
  Purpose: Apply user-approved code edits
```

### Grid Engine

```
GET /api/grid/status
  Returns: Full system status (feeds, countyStates, subscribers)

GET /api/grid/counties
  Returns: { counties: CountyStatus[] }

GET /api/grid/alerts
  Returns: { alerts: NWSAlert[] }

GET /api/grid/outages
  Returns: { counties: Record<string, number>, totalCustomersAffected: number }
```

### Health Checks

```
GET /api/health
  Returns: { status: "ok", service: "command-dashboard" }

GET /api/health/all
  Returns: { services: ServiceHealth[], summary: { healthy, degraded, offline } }

GET /api/health/:service
  Returns: { status: string, responseTime: number }
```

---

## Cleveland County Focus

Cleveland County has special monitoring because:

1. **Buy-All-Sell-All Regulation** - Utility arrangement discourages residential solar
2. **High Outage Frequency** - Area experiences above-average grid instability
3. **Market Opportunity** - Untapped demand for battery backup and generators
4. **Home Base** - David Edwards lives here for real-world testing

The Grid Status Panel shows Cleveland County prominently at the top with:
- Current status (GREEN/YELLOW/RED/BLACK)
- Customer outage count
- Active NWS weather alerts
- Market opportunity reminder

---

## Development

### Local Development

```bash
cd apps/command-dashboard
npm install
npm run dev
# → http://localhost:3104
```

Default mode is MOCK data. Click the toggle to switch to LIVE.

### Environment Variables

```bash
# Optional - Override service hosts
ORACLE_ARM_HOST=193.122.153.249   # Default
ADMIRAL_SERVER_HOST=192.168.1.23   # Default

# Port
PORT=3104
```

### Build

```bash
npm run build
# Output:
#   dist/index.cjs (server)
#   dist/public/ (client assets)
```

---

## Production Deployment

### Oracle ARM (Current)

```bash
# SSH to Oracle ARM
ssh -i ~/.ssh/oci_arm ubuntu@193.122.153.249

# Check status
pm2 list

# View logs
pm2 logs command-dashboard --lines 50
pm2 logs grid-engine --lines 50

# Restart
pm2 restart command-dashboard
pm2 restart grid-engine

# Deploy update
cd ~/lids
git pull
cd apps/command-dashboard
npm run build
pm2 restart command-dashboard
```

### nginx Configuration

```nginx
# /etc/nginx/sites-available/command-dashboard
server {
    listen 80;
    server_name command.ripemerchant.host;

    location / {
        proxy_pass http://localhost:3104;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }
}
```

SSL is managed by Certbot (Let's Encrypt).

---

## Troubleshooting

### Grid Engine Not Responding

```bash
# Check if running
pm2 list

# If missing, start it
cd ~/grid-engine
PORT=4120 pm2 start 'npx tsx server/src/index.ts' --name grid-engine
pm2 save
```

### DeepSeek Slow/Timeout

The 14B model on ARM takes 60-120 seconds for complex responses. Timeout is set to 180s. If consistently timing out:

```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Check memory
free -h
```

### Command Dashboard Can't Reach Grid Engine

The dashboard uses `ORACLE_ARM_HOST=localhost` when running on Oracle ARM. If restarted without this:

```bash
pm2 delete command-dashboard
cd ~/lids/apps/command-dashboard
ORACLE_ARM_HOST=localhost pm2 start 'node dist/index.cjs' --name command-dashboard
pm2 save
```

---

## Related Documentation

| Document | Location |
|----------|----------|
| Grid Engine Documentation | `docs/grid-engine/` |
| Grid Engine Overview | `docs/grid-engine/README.md` |
| Grid Engine Architecture | `docs/grid-engine/ARCHITECTURE.md` |
| Grid Engine API Reference | `docs/grid-engine/API_REFERENCE.md` |
| Grid Engine State Machine | `docs/grid-engine/STATE_MACHINE.md` |
| Grid Engine Integrations | `docs/grid-engine/INTEGRATIONS.md` |
| Grid Engine Operations | `docs/grid-engine/OPERATIONS.md` |
| LIDS Architecture | `../../docs/architecture/ARCHITECTURE.md` |
| Infrastructure Registry | `../../docs/architecture/Admiral Energy Infrastructure Registry v2.1.md` |
| Port Reference | `../../PORT_REFERENCE.md` |

---

*Last Updated: January 6, 2026*
*Owner: Admiral Energy LLC*
