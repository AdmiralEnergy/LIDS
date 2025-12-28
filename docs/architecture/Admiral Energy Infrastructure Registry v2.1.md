Admiral Energy Infrastructure Registry v2.1
Updated: December 24, 2025
Status: Post-Restructure | Mobile Command Architecture
Owner: David Edwards | Admiral Energy LLC + Studio Admiral

Network Topology
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       ADMIRAL ENERGY INFRASTRUCTURE                               │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│                               INTERNET                                            │
│                                   │                                               │
│                     ┌─────────────┴─────────────┐                                │
│                     │                           │                                 │
│                     ▼                           ▼                                 │
│    ┌────────────────────────┐    ┌────────────────────────┐                      │
│    │    DO DROPLET          │    │   CLOUDFLARE TUNNELS   │                      │
│    │    165.227.111.24      │    │   *.ripemerchant.host  │                      │
│    │    (Cloud Edge)        │    └───────────┬────────────┘                      │
│    └───────────┬────────────┘                │                                   │
│                │                             │                                    │
│                │    ┌────────────────────────┘                                   │
│                │    │                                                             │
│   ─ ─ ─ ─ ─ ─ ─│─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ HOME NETWORK ─ ─ ─ ─  │
│                │    │                                                             │
│                ▼    ▼                                                             │
│    ┌─────────────────────────────────────────────────────────────────────────┐   │
│    │                         admiral-server                                   │   │
│    │                         192.168.1.23                                     │   │
│    │                         (CANONICAL RUNTIME)                              │   │
│    │                                                                          │   │
│    │    ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐          │   │
│    │    │MCP Kernel │  │  Oracle   │  │  Agent-   │  │ LiveWire  │          │   │
│    │    │   4000    │  │   4050    │  │  Claude   │  │   5000    │          │   │
│    │    └───────────┘  └───────────┘  │ 4110/4111 │  └───────────┘          │   │
│    │                                   └───────────┘                          │   │
│    │    GitHub ◄──── git push/pull ────► LOCAL REPO (CANONICAL)              │   │
│    └─────────────────────────────────────────────────────────────────────────┘   │
│                          ▲                         ▲                              │
│                          │ SSH                     │ SSH + Deploy                 │
│                          │                         │                              │
│    ┌─────────────────────┴───┐    ┌───────────────┴─────────────────┐           │
│    │   AdmiralEnergy         │◄───│       DavidME-Flow              │           │
│    │   (GPU Workstation)     │    │       (Command Node)            │           │
│    │                         │    │                                  │           │
│    │   ComfyUI, Rendering    │    │   VS Code, Claude Code          │           │
│    │   Ollama, Local LLM     │    │   SSH to all nodes              │           │
│    │   Dev Testing           │    │   Mobile Operations             │           │
│    │                    Parsec│    │                                  │           │
│    │   ◄──────────────────────────│   "The Controller"              │           │
│    └─────────────────────────┘    └─────────────────────────────────┘           │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘

Mobile Command Architecture
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      MOBILE COMMAND CONFIGURATION                                 │
│                      "Work from anywhere in the house"                            │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│    ┌─────────────────────────┐                                                   │
│    │     DavidME-Flow        │                                                   │
│    │     (Surface Pro 9)     │                                                   │
│    │                         │                                                   │
│    │     "The Controller"    │                                                   │
│    │     Couch / Kitchen /   │                                                   │
│    │     Office / Anywhere   │                                                   │
│    └───────────┬─────────────┘                                                   │
│                │                                                                  │
│      ┌─────────┼─────────┬─────────────┬─────────────┐                          │
│      │         │         │             │             │                          │
│      ▼         ▼         ▼             ▼             ▼                          │
│   Parsec    SSH      VS Code      Claude.ai     Tailscale                       │
│      │         │      Remote          │          (VPN Mesh)                      │
│      │         │         │             │             │                          │
│      ▼         ▼         ▼             ▼             ▼                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐                    │
│  │Admiral-│ │admiral-│ │admiral-│ │  Any   │ │ All nodes  │                    │
│  │Energy  │ │server  │ │server  │ │ Node   │ │ from any-  │                    │
│  │Desktop │ │Terminal│ │ Code   │ │via NLP │ │ where      │                    │
│  │ (GPU)  │ │        │ │ Edit   │ │        │ │            │                    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘                    │
│                                                                                   │
│   KEY PRINCIPLE: Nothing stops when you disconnect                               │
│   • Parsec disconnect → Desktop keeps rendering                                  │
│   • SSH disconnect → PM2 keeps agents alive                                      │
│   • You're viewing/controlling, not hosting                                      │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘

Hardware Registry
1. admiral-server (CANONICAL RUNTIME)
PropertyValueDevice Nameadmiral-serverHardwareACEMAGIC AD08 Mini PCRoleCanonical code repository + Agent runtimeIP Address192.168.1.23 (LAN)Tailscale IP100.x.x.3 (after setup)OSUbuntu Server 24.04.3 LTSKernelLinux 6.8.xCPUIntel Core i9-11900H (8c/16t, 4.9GHz turbo)RAM32GB DDR4 (Dual-Channel)Storage1TB NVMe SSD (~15% used)GPUIntel UHD (Integrated) - No dedicated GPUAccessSSH (key auth + password fallback)Status✅ Production-ready, 16 agents online
Hosts:

LifeOS-Core (CANONICAL SOURCE OF TRUTH)
All MCP agents via PM2
Twenty CRM (3000/3001)
n8n workflows (5678)
Cloudflare tunnels
Voice/transcription services
Leon AI (1337)

Architectural Role:

Code lives HERE (canonical)
GitHub is backup, not source
Windows pulls FROM here for dev
Deploys come TO here


2. DO Droplet (CLOUD EDGE)
PropertyValueNameubuntu-s-1vcpu-2gb-nyc3-01RoleCloud Edge (To Be Configured)ProviderDigitalOceanRegionNYC3IP Address165.227.111.24 (Public Static)Private IP10.108.0.2Tailscale IP100.x.x.4 (after setup)OSUbuntu 22.04 LTS x64CPU1 vCPU (shared)RAM2GBStorage50GB SSDBandwidth~15 kb/s typicalCPU Usage~1-2% idleCost~$7.68/monthStatus⚠️ Active but underutilized
Planned Uses:

Public webhook receiver (Twilio, Stripe - static IP, no tunnel flakiness)
LIDS production hosting (alternative to Replit)
Disaster recovery / hot standby
Geographic redundancy (if home internet fails)
Public API gateway


3. AdmiralEnergy (GPU WORKSTATION)
PropertyValueDevice NameAdmiralEnergyRoleGPU-accelerated workloads, Heavy computeForm FactorFull Desktop PCOSWindows 11CPUAMD Ryzen 7 5700 (3.70 GHz)RAM16GB (15.9GB usable)GPUNVIDIA GeForce RTX 4060 Ti (Dedicated)Tailscale IP100.x.x.2 (after setup)Status✅ Active
Hosts:

ComfyUI (8188) - video/image generation
Ollama - local LLM experiments
Development clones for testing
Heavy rendering tasks

Architectural Role:

GPU compute resource
Controlled via Parsec from Surface Pro
Renders continue when disconnected
NOT the canonical code location


4. DavidME-Flow (COMMAND NODE / CONTROLLER)
PropertyValueDevice NameDavidME-FlowRolePrimary human interface, Mobile command centerHardwareMicrosoft Surface Pro 9Form FactorTouch-enabled tablet/laptop hybridOSWindows 11 Home 25H2CPUIntel Core i7-1255U (12th Gen, 2.60 GHz)RAM16GB (15.8GB usable)GPUIntel IntegratedTouch10-point multi-touch + Pen supportTailscale IP100.x.x.1 (after setup)Status✅ Active - Primary control plane
Hosts:

VS Code + Claude Code
Parsec client (connect to AdmiralEnergy)
SSH sessions to all nodes
LIDS development (local testing)
Planning & orchestration

Architectural Role:

THE CONTROLLER - you operate everything from here
Lightweight - no heavy compute
Portable - couch, kitchen, office, anywhere
Nothing runs here that needs to stay running


Remote Access Configuration
Tailscale Mesh Network (Recommended)
Secure private network across all devices - works from anywhere, even outside home WiFi.
DeviceTailscale IPRoleDavidME-Flow100.x.x.1ControllerAdmiralEnergy100.x.x.2GPU Workstationadmiral-server100.x.x.3Canonical RuntimeDO Droplet100.x.x.4Cloud Edge
Setup Commands:
bash# Windows (Surface + Desktop): Download from https://tailscale.com/download

# Ubuntu (admiral-server + Droplet):
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

### Access Methods Matrix

| From | To | Method | Use Case |
|------|-----|--------|----------|
| Surface Pro | AdmiralEnergy | **Parsec** | GPU work, ComfyUI, visual tasks |
| Surface Pro | AdmiralEnergy | RDP | General Windows access |
| Surface Pro | admiral-server | **SSH** | Agent management, PM2 |
| Surface Pro | admiral-server | **VS Code Remote SSH** | Code editing |
| Surface Pro | DO Droplet | SSH | Cloud management |
| Surface Pro | Any node | **Claude.ai** | Natural language operations |

### Parsec Setup (GPU Remote Desktop)

**AdmiralEnergy (Host):**
1. Download from https://parsec.app/downloads
2. Sign in / create account
3. Enable hosting in settings

**Surface Pro (Client):**
1. Download same app
2. Sign in with same account
3. Connect to "AdmiralEnergy"

**Benefits:**
- Game-streaming quality (60fps, low latency)
- GPU-accelerated encoding
- Works over internet (not just LAN)
- Sessions persist when disconnected
- Free for personal use

---

## Port Allocation Map

### Admiral-Server Services (192.168.1.23)

#### Infrastructure (4000-4099)
| Port | Service | Category | Status |
|------|---------|----------|--------|
| 4000 | MCP Kernel | infrastructure | ✅ Active |
| 4050 | Oracle | infrastructure | ✅ Active |
| 4065 | Content / SARAI | apex / python | ✅ Active |
| 4070 | Sync | infrastructure | ✅ Active |
| 4080 | Librarian | infrastructure | ✅ Active |
| 4090 | Admiral | apex | ✅ Active |
| 4091 | Admiral Brain | apex | ✅ Active |
| 4095 | Twenty CRM MCP | support | ✅ Active |
| 4096 | RedHawk | apex | ✅ Active |
| 4097 | Transcription Service | python | 🔲 Planned |
| 4098 | Compass Agents | support | ✅ Active |

#### Agent-Claude & MCP (4100-4130)
| Port | Service | Category | Status |
|------|---------|----------|--------|
| 4100 | Gideon | apex | ✅ Active |
| 4110 | Agent-Claude (HTTP) | apex | ✅ Active |
| 4111 | Agent-Claude (WS) | apex | ✅ Active |
| 4115 | Twilio Service | support | ✅ Active |
| 4120 | Forge | infrastructure | ✅ Active |
| 4121 | LinkedIn MCP | support | ✅ Active |
| 4122 | Reddit MCP | support | ✅ Reassigned |
| 4130 | Voice Service | python | ✅ Active |

#### Sales AI (5000-5100)
| Port | Service | Category | Status |
|------|---------|----------|--------|
| 5000 | LiveWire | apex | ✅ Active |
| 5001 | FO-001 Scout | fieldops | ✅ Active |
| 5002 | FO-002 Analyst | fieldops | ✅ Active |
| 5003 | FO-003 Caller | fieldops | ✅ Active |
| 5004 | FO-004 Scribe | fieldops | ✅ Active |
| 5005 | FO-005 Watchman | fieldops | ✅ Active |
| 5006 | FO-006 Courier | fieldops | ✅ Active |
| 5007 | FO-007 Crafter | fieldops | ✅ Active |
| 5008 | FO-008 Trainer | fieldops | ✅ Active |
| 5009 | FO-009 Recon | fieldops | ✅ Active |
| 5010 | FO-010 Apex-FO | fieldops | ✅ Active |
| 5100 | Cassius | python | 💤 Dormant |

#### External Services (3000-3999)
| Port | Service | Status |
|------|---------|--------|
| 3000 | Twenty CRM UI | ✅ Active |
| 3001 | Twenty CRM API | ✅ Active |
| 1337 | Leon AI (RedHawk) | ✅ Active |
| 5678 | n8n | ✅ Active |

### Local Development (Windows - AdmiralEnergy or Surface)
| Port | Service | Purpose |
|------|---------|---------|
| 3100 | ADS Dashboard | CRM/Dialer UI dev |
| 3101 | Compass | Mobile PWA dev |
| 3102 | RedHawk Academy | Training Platform dev |
| 5678 | n8n (local) | Workflow testing |
| 8188 | ComfyUI | Image/Video generation |

### DO Droplet (165.227.111.24) - Planned
| Port | Service | Status |
|------|---------|--------|
| 22 | SSH | ✅ Active |
| 80/443 | Webhook Receiver | 🔲 Planned |
| 3000 | LIDS Production | 🔲 Optional |

---

## Repository Architecture

### Code Flow (Single Source of Truth)
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           CODE FLOW ARCHITECTURE                                  │
│                                                                                   │
│                                                                                   │
│    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐  │
│    │  Windows Dev    │         │     GitHub      │         │ admiral-server  │  │
│    │  (Surface/      │         │    (Backup &    │         │  (CANONICAL)    │  │
│    │   Desktop)      │         │   Versioning)   │         │                 │  │
│    └────────┬────────┘         └────────┬────────┘         └────────┬────────┘  │
│             │                           │                           │            │
│             │                           │                           │            │
│    ┌────────┴────────────────────────────────────────────────────────┘           │
│    │                                                                              │
│    │   DEVELOPMENT FLOW:                                                         │
│    │                                                                              │
│    │   1. Clone/pull from GitHub to Windows (for local dev/testing)             │
│    │   2. Edit code on Windows                                                   │
│    │   3. Test locally                                                           │
│    │   4. git push to GitHub                                                     │
│    │   5. Deploy script: SSH to admiral-server → git pull → pm2 reload          │
│    │   6. Changes live in production                                             │
│    │                                                                              │
│    │   ROLLBACK FLOW:                                                            │
│    │                                                                              │
│    │   1. Something breaks                                                       │
│    │   2. SSH to admiral-server                                                  │
│    │   3. git checkout <previous-commit>                                         │
│    │   4. pm2 reload all                                                         │
│    │   5. Back in business                                                       │
│    │                                                                              │
│    └─────────────────────────────────────────────────────────────────────────────┘
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### LifeOS-Core Structure (admiral-server: ~/LifeOS-Core)
```
lifeos-core/
├── agents/
│   ├── apex/           # GIDEON, LIVEWIRE, ADMIRAL, REDHAWK, CONTENT, AGENT-CLAUDE
│   ├── fieldops/       # SCOUT, ANALYST, CALLER, SCRIBE, WATCHMAN, COURIER, CRAFTER, TRAINER, RECON, APEX-FO
│   ├── infrastructure/ # MCP-KERNEL, ORACLE, LIBRARIAN, SYNC, FORGE
│   ├── support/        # COMPASS-AGENTS, TWILIO-SERVICE, SORA, REDDIT-MCP, LINKEDIN-MCP
│   └── python/         # SARAI, VOICE-SERVICE, TRANSCRIPTION-SERVICE, CASSIUS
├── packages/           # Shared TypeScript libraries
├── config/             # Configuration files
├── scripts/            # Automation scripts
├── docs/               # Documentation
├── n8n/                # Workflow definitions
├── supabase/           # Supabase config
├── CLAUDE.md           # AI instructions
├── AGENTS.md           # Agent registry
└── ARCHITECTURE.md     # System architecture
```

### LIDS (Separate Repo: github.com/AdmiralEnergy/LIDS)
```
lids/
├── apps/
│   ├── dashboard/      # Main LIDS (ADS)
│   ├── compass/        # Mobile PWA
│   └── redhawk-academy/# Training platform
└── packages/           # Shared UI components
```

**Connection:** LIDS → LifeOS-Core via HTTP/WebSocket API calls (not code imports)

---

## Daily Workflow Examples

### Morning (Couch, Coffee)
```
Surface Pro → SSH to admiral-server
$ pm2 list                    # Check agents running
$ pm2 logs --lines 50         # Review overnight logs
$ tail -f logs/oracle.log     # Check memory service
```

### Midday (Kitchen Table)
```
Surface Pro → Claude.ai (this chat)
"Deploy the updated gideon agent"
→ Claude provides deploy command
→ Copy/paste to terminal or run deploy script
```

### Afternoon (Need GPU)
```
Surface Pro → Parsec → AdmiralEnergy
Open ComfyUI (localhost:8188)
Queue video generation
Disconnect Parsec → rendering continues
Check back later for results
```

### Evening (Living Room)
```
Surface Pro → VS Code Remote SSH → admiral-server
Edit agent code directly on canonical source
Test changes
$ pm2 reload gideon
Verify in logs
```

### Late Night (In Bed)
```
Surface Pro → Check on phone/tablet
Tailscale app → SSH to admiral-server
$ pm2 list                    # All green? Good night.

Persistence Guarantees
MachineWhat Happens When You DisconnectAdmiralEnergyParsec/RDP disconnect = desktop keeps running, ComfyUI renders continueadmiral-serverSSH disconnect = PM2 keeps all 16 agents alive, tunnels stay upDO DropletAlways on, no connection neededSurface ProCan sleep/shutdown - nothing depends on it running
Key Principle: You're viewing and controlling, not hosting. Work continues whether you're connected or not.

Current State Summary
ComponentStatusLocationNotesLifeOS-Core✅ Restructuredadmiral-server31 agents in 5 categoriesAgent paths✅ FixedAll configsecosystem.config.js updatedLegacy cleanup✅ Completeadmiral-server~5GB removedLIDS-monorepo⚠️ Needs separationInside LifeOS-CoreMove to own repoDO Droplet⚠️ UnderutilizedDigitalOcean$7.68/month, assign roleWindows desktop✅ Development readyLocalDeploy scripts neededRemote access🔲 Needs setupAll nodesTailscale + ParsecCross-platform⚠️ Needs configGit settingsLine endings, paths

Pending Actions
PriorityActionEffort1Separate LIDS-monorepo → Own GitHub repo30 min2Install Tailscale on all 4 nodes15 min3Install Parsec on AdmiralEnergy + Surface10 min4Create deploy.ps1 script for Windows15 min5Configure DO Droplet role (webhooks)1 hr6Fix Claude settings.local.json5 min7Git cross-platform config5 min8Root directory consolidation30 min

Registry Summary
DeviceRoleOSCPURAMGPUIPadmiral-serverCanonical RuntimeUbuntu 24.04i9-11900H32GBIntegrated192.168.1.23DO DropletCloud EdgeUbuntu 22.041 vCPU2GBNone165.227.111.24AdmiralEnergyGPU WorkstationWindows 11Ryzen 7 570016GBRTX 4060 TiLANDavidME-FlowCommand NodeWindows 11i7-1255U16GBIntegratedLAN

Architecture Principles

admiral-server = Truth - Canonical code lives here, GitHub is backup
Windows = Development - Edit, test, then deploy to server
Surface Pro = Controller - Operate everything from anywhere
Desktop = Compute - GPU tasks, controlled remotely
Nothing depends on you being connected - All services persist
Graceful deploys - pm2 reload = zero-downtime updates
Easy rollback - git checkout + pm2 reload = instant recovery


Document Version: 2.1
Last Updated: December 24, 2025
Owner: David Edwards | Admiral Energy LLC + Studio Admiral
