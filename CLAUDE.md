# HELM - Admiral Dialer System

**Frontend-first sales software for solar reps in the field.**

---

## 30-Second Overview

| What | Who | Where |
|------|-----|-------|
| CRM + Dialer + Gamified Progression | Solar sales reps at Admiral Energy | `apps/ads-dashboard/client/src/` |

**HELM is a frontend experience that happens to have a backend.**

The backend is stable, documented, and rarely touched. Your work happens in the React frontend where reps live between doors.

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
| API key in client bundle | `lib/settings.ts:46` | **HIGH** | Known, needs server-side migration |
| No authentication | Entire app | **HIGH** | Planned for helm_registry integration |
| Credentials in .env | admiral-server | Medium | Standard practice, access controlled |

**Rule:** Do not add more secrets to client-side code. Any new credentials must be server-side.

### Single Points of Failure

| Component | Impact if Down | Mitigation |
|-----------|----------------|------------|
| admiral-server | All services offline | None (single server) |
| Cloudflare tunnel | External access lost | LAN access still works |
| Twenty CRM | No lead data | Dexie cache provides read-only |

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

### Deploy

```bash
# Copy to admiral-server
scp -r dist/* edwardsdavid913@192.168.1.23:~/apps/helm-dashboard/

# Restart on server
ssh edwardsdavid913@192.168.1.23 "pm2 restart helm-dashboard"
```

### Health Check

```bash
# All services status
ssh edwardsdavid913@192.168.1.23 "pm2 status"

# Specific service
curl http://192.168.1.23:3100/api/twenty/status
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
    ├── Backend investigation → SSH to admiral-server
    │   ssh edwardsdavid913@192.168.1.23
    │
    └── Service management → PM2 commands via SSH
        pm2 restart helm-dashboard
        pm2 logs twilio-service
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

*Last Updated: December 24, 2025*
