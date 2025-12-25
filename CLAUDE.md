# LIDS - Live Interactive Dashboard

**Frontend-first sales software for solar reps in the field.**

**Terminology:**
- **LIDS** = Live Interactive Dashboard (the app you're working on)
- **ADS** = Admiral Dialer System (collection of backend tools: Twilio, Twenty CRM, n8n, etc.)

---

## 30-Second Overview

| What | Who | Where |
|------|-----|-------|
| CRM + Dialer + Gamified Progression | Solar sales reps at Admiral Energy | `apps/ads-dashboard/client/src/` |

**LIDS is a frontend experience that happens to have a backend.**

The backend is stable, documented, and rarely touched. Your work happens in the React frontend where reps live between doors.

---

## Production Architecture (Two-Node)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DROPLET (165.227.111.24) - User-Facing Apps                                │
│  All team-accessible services (no home network dependency)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  LIDS Dashboard           https://lids.ripemerchant.host     :5000         │
│  Twenty CRM               https://twenty.ripemerchant.host   :3001         │
│  COMPASS                  https://compass.ripemerchant.host  :3101         │
│  RedHawk Academy          https://academy.ripemerchant.host  :3102         │
└─────────────────────────────────────────────────────────────────────────────┘
                              │ Tailscale (100.66.42.81)
┌─────────────────────────────▼───────────────────────────────────────────────┐
│  ADMIRAL-SERVER (192.168.1.23) - AI & Voice Services                        │
│  Services requiring GPU/local hardware                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Voice Service            http://100.66.42.81:4130                         │
│  Twilio Service           http://100.66.42.81:4115                         │
│  Agent Claude             http://100.66.42.81:4110                         │
│  RedHawk Agent            http://100.66.42.81:4096                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Design:** If home power goes out, reps can still access LIDS, Twenty CRM, COMPASS via droplet. Only AI/voice features need admiral-server.

```
┌────────────────────────────────────────────────────────────────┐
│                     WHERE WORK HAPPENS                          │
│                                                                 │
│   client/src/                                                   │
│   ├── pages/        ← User screens (dialer, dashboard, crm)   │
│   ├── components/   ← Reusable UI                              │
│   ├── features/     ← Progression system (XP, ranks, bosses)  │
│   └── hooks/        ← useDialer, useTranscription              │
│                                                                 │
├─────────────────── line of prominence ──────────────────────────┤
│                                                                 │
│   server/           ← Stable, documented (ARCHITECTURE.md)     │
│   shared/           ← Drizzle schema                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Priority Hierarchy

```
UI/UX Excellence          ← Where value is created
├── User feel
├── Visual polish
├── Interaction flow
├── Perceived performance
└── Progression dopamine

Frontend Code Quality     ← Where iteration happens
└── client/src/

─────────────────────────────────────────────────

Backend Services          ← Stable, documented
└── See docs/architecture/ARCHITECTURE.md

Infrastructure            ← Rarely touched
└── See docs/architecture/DEPLOYMENT_CHECKLIST.md
```

---

## Design System

### Brand Tokens

```css
--admiral-navy:   #0c2f4a;  /* Primary - headers, nav, buttons */
--admiral-gold:   #c9a648;  /* Accent - XP, wins, progression */
--admiral-white:  #f7f5f2;  /* Backgrounds, cards */
```

### UX Principles for Sales Software

| Principle | Why | Implementation |
|-----------|-----|----------------|
| **Instant** | Reps are between doors | Optimistic UI, local-first with Dexie |
| **Glanceable** | Check during calls | XP bar visible, rank in header |
| **Dopamine-driven** | Adoption is voluntary | Confetti on level-up, boss victory screens |
| **Forgiving** | Fat fingers on mobile | Large tap targets, undo on dispositions |
| **Offline-resilient** | Bad cell signal | IndexedDB sync queue |

### Component Patterns

```tsx
// Primary action - Navy background
<Button className="bg-[#0c2f4a] hover:bg-[#0c2f4a]/90">

// Success/Win state - Gold accent
<Badge className="bg-[#c9a648] text-white">

// Cards - White with subtle shadow
<Card className="bg-[#f7f5f2] shadow-sm">
```

---

## Where to Work

### Primary Work Area: `client/src/`

```
client/src/
├── pages/
│   ├── dashboard.tsx     ← Rep home screen
│   ├── dialer.tsx        ← Click-to-call interface
│   ├── crm.tsx           ← Lead management
│   └── activity.tsx      ← Call history
│
├── components/
│   ├── ui/               ← shadcn/ui primitives
│   ├── dialer/           ← Keypad, call controls
│   └── progression/      ← XP bar, rank display
│
├── features/
│   └── progression/
│       ├── config/       ← XP values, rank thresholds
│       ├── hooks/        ← useProgression, useXP
│       └── components/   ← LevelUpModal, BossCard
│
├── hooks/
│   ├── useDialer.ts      ← Twilio Voice SDK wrapper
│   └── useTranscription.ts
│
├── lib/
│   ├── db.ts             ← Dexie (IndexedDB) schema
│   ├── progressionDb.ts  ← XP/rank persistence
│   ├── settings.ts       ← App configuration
│   ├── twentySync.ts     ← CRM bidirectional sync
│   └── twentyStatsApi.ts ← Twenty GraphQL calls
│
└── providers/
    └── twentyDataProvider.ts  ← Refine.dev data layer
```

### File Importance Heat Map

```
🔴 HIGH TOUCH (iterate here)
   pages/*.tsx
   features/progression/*
   components/dialer/*

🟡 MEDIUM TOUCH (enhance carefully)
   lib/db.ts, lib/progressionDb.ts
   hooks/useDialer.ts

🟢 LOW TOUCH (stable, documented)
   lib/settings.ts
   lib/twentySync.ts
   providers/*

⚪ DO NOT TOUCH (infrastructure)
   server/*
   shared/*
```

---

## Where NOT to Work

### Backend Stability Zone

The following are **stable and documented**. Modify only with explicit requirements and full understanding of downstream effects.

| Path | Why Protected | Documentation |
|------|---------------|---------------|
| `server/index.ts` | Proxy configuration for 3 services | ARCHITECTURE.md §Proxy Architecture |
| `server/routes.ts` | API contracts, Twenty integration | ARCHITECTURE.md §Backend Service Details |
| `shared/schema.ts` | Drizzle schema, migration required | ARCHITECTURE.md §Data Flow |
| `lib/settings.ts` | Contains hardcoded API key (security) | See Known Issues below |

### Infrastructure (admiral-server)

Do not modify without DevOps review:
- PM2 ecosystem configs
- Docker Compose files
- Cloudflare tunnel config
- Service .env files

Reference: `docs/architecture/DEPLOYMENT_CHECKLIST.md`

---

## Known Issues

### Security (Do Not Expose Further)

| Issue | Location | Severity | Status |
|-------|----------|----------|--------|
| API key in client bundle | `lib/settings.ts:47` | Medium | Key is workspace-scoped, forced via code |
| No authentication | Entire app | **HIGH** | Planned for user_registry integration |
| Credentials in .env | Droplet + admiral-server | Medium | Standard practice, access controlled |

**Note:** The Twenty API key is embedded in client code but is now forced (ignores localStorage). The key is workspace-scoped and read-only for CRM data. Still, avoid adding more secrets to client-side code.

**Rule:** Do not add more secrets to client-side code. Any new credentials must be server-side.

### Single Points of Failure

| Component | Impact if Down | Mitigation |
|-----------|----------------|------------|
| DO Droplet | LIDS, Twenty, COMPASS offline | None (but independent of home network) |
| admiral-server | Voice, AI, Twilio offline | Core CRM still works on droplet |
| Tailscale | Droplet can't reach admiral-server | Voice/AI features unavailable |
| Twenty CRM | No lead data | Dexie cache provides read-only |

**Resilience:** Droplet handles critical CRM ops. Admiral-server handles AI/voice. Either can fail without taking down the other.

Reference: `docs/architecture/TROUBLESHOOTING.md`

---

## Documentation Map

```
LIDS-monorepo/
├── CLAUDE.md                           ← You are here
├── README.md                           ← User-facing overview
├── PORT_REFERENCE.md                   ← Quick port lookup
│
└── docs/
    └── architecture/
        ├── ARCHITECTURE.md             ← Complete system truth (15KB)
        │   ├── Service inventory
        │   ├── Data flow diagrams
        │   ├── Proxy architecture
        │   └── Backend service details
        │
        ├── DEPLOYMENT_CHECKLIST.md     ← Operational procedures (8KB)
        │   ├── Prerequisites
        │   ├── Phase-by-phase setup
        │   └── Rollback procedures
        │
        └── TROUBLESHOOTING.md          ← Issue resolution (10KB)
            ├── Quick diagnostics
            ├── Common issues + solutions
            └── Debug commands
```

---

## Quick Commands

### Development

```bash
# Start local dev server (connects to admiral-server)
cd apps/ads-dashboard
npm run dev
# → http://localhost:3100
```

### Build

```bash
# Production build
npm run build
# → dist/index.cjs (server)
# → dist/public/ (client assets)
```

### Deploy (to Droplet)

```bash
# Push to GitHub, then on droplet:
ssh root@165.227.111.24 "cd /var/www/lids && git pull && cd apps/ads-dashboard && npm run build && pm2 restart lids --update-env"

# Or for all apps:
ssh root@165.227.111.24 "cd /var/www/lids && git pull && npm run build:all && pm2 restart all --update-env"
```

### Health Check

```bash
# Droplet services status
ssh root@165.227.111.24 "pm2 status"

# Twenty CRM connection
curl https://lids.ripemerchant.host/api/twenty/status

# Direct on droplet
ssh root@165.227.111.24 'curl -s http://localhost:5000/api/twenty/status'
```

---

## For Guardian MCP

### Repo Health Priorities

1. **Frontend UX** - If the UI doesn't feel fast and polished, nothing else matters
2. **Progression System** - XP/ranks drive adoption; protect the dopamine loop
3. **Dialer Reliability** - Core revenue generator; zero tolerance for call drops
4. **Data Sync** - Dexie ↔ Twenty must stay consistent
5. **Documentation** - Keep architecture docs current

### Orchestration Notes

```
Terminal Claude (Guardian MCP)
    │
    ├── Frontend work → Direct file edits in client/src/
    │
    ├── Production (Droplet) → SSH root@165.227.111.24
    │   pm2 restart lids
    │   pm2 logs lids
    │
    ├── AI Services (admiral-server) → SSH edwardsdavid913@192.168.1.23
    │   pm2 restart voice-service
    │   pm2 logs twilio-service
    │
    └── Service URLs:
        Droplet: https://*.ripemerchant.host (lids, twenty, compass, academy)
        Admiral: http://100.66.42.81:PORT (voice, twilio, agents)
```

### When to Escalate

- Any change to `server/index.ts` proxy config
- Any change to authentication flow (currently none)
- Any new environment variable or secret
- Any Docker or PM2 configuration change
- Any Cloudflare tunnel modification

### Testing Mental Model

```
Before: "Does the backend work?"
After:  "Does the REP see what they need to see?"

Frontend is the product.
Backend is infrastructure.
Test from the UI down.
```

---

## Target User Profile

**Name:** Field Sales Rep (Edwin, Jonathan, Kareem)
**Device:** Mobile phone, sometimes laptop
**Context:** Standing on a porch, 30 seconds between knocks
**Needs:**
- See the lead's name and phone
- One tap to dial
- Quick disposition after call
- Glance at XP to feel progress

**Never thinks about:**
- GraphQL queries
- Proxy middleware
- Sync logic
- Container orchestration

**Build for their reality, not ours.**

---

*Last Updated: December 25, 2025*
