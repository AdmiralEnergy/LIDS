# RedHawk Sales Academy

**Sales training platform for Admiral Energy** - Gamified learning with AI boss battles.

**Updated:** December 24, 2025

---

## Overview

RedHawk Academy is a Progressive Web App for training solar sales representatives. It features module-based learning, certification exams, and AI-powered "boss battle" practice sessions against simulated prospects.

```
Production:  https://academy.ripemerchant.host
Local Dev:   http://localhost:3102
Location:    apps/redhawk-academy/
PM2 Service: redhawk-academy
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   REDHAWK ACADEMY (:3102)                        │
│                   Express + React (Vite)                         │
├─────────────────────────────────────────────────────────────────┤
│  CLIENT (React)                                                  │
│  ├── pages/                                                      │
│  │   ├── Dashboard.tsx       Progress overview                  │
│  │   ├── Modules.tsx         Training modules list              │
│  │   ├── ModuleQuiz.tsx      Quiz interface                     │
│  │   ├── BossBattle.tsx      AI prospect simulation             │
│  │   ├── Certification.tsx   Cert status and exams              │
│  │   ├── Profile.tsx         Rep profile and stats              │
│  │   └── Login.tsx           Authentication                     │
│  ├── components/                                                 │
│  │   ├── BattleChat.tsx      Battle conversation UI             │
│  │   ├── ScorePanel.tsx      Real-time scoring display          │
│  │   ├── RankBadge.tsx       Rank visualization                 │
│  │   └── ModuleCard.tsx      Module preview cards               │
│  └── api/                                                        │
│      ├── redhawk.ts          Agent API client                   │
│      └── mockApi.ts          Offline demo mode                  │
├─────────────────────────────────────────────────────────────────┤
│  SERVER (Express)                                                │
│  └── Proxy to REDHAWK Agent (:4096)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        REDHAWK Agent   Leon-RedHawk    Twenty CRM
        (:4096)         (:1337)         (XP Sync)
        AI Engine       Voice Mode      Progression
```

---

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `Dashboard.tsx` | Rep home screen with progress overview |
| `/modules` | `Modules.tsx` | Browse training modules |
| `/modules/:id/quiz` | `ModuleQuiz.tsx` | Take module certification quiz |
| `/battle` | `BossBattle.tsx` | AI boss battle practice |
| `/certification` | `Certification.tsx` | View certifications, retake exams |
| `/profile` | `Profile.tsx` | Rep profile and battle stats |
| `/login` | `Login.tsx` | Authentication (redirects if not logged in) |

---

## Features

### Training Modules

| Module | Content |
|--------|---------|
| Solar Fundamentals | How solar works, panel types, system components |
| Sales Process | Door approach, qualifying, presenting, closing |
| Objection Handling | Common objections and responses |
| Product Knowledge | Admiral Energy offerings, financing options |
| Compliance (TCPA) | Legal requirements, DNC rules, consent |

### Boss Battle System

Practice sales skills against AI prospects of increasing difficulty:

| Level | Name | Description |
|-------|------|-------------|
| 1 | Friendly Prospect | Open to conversation, few objections |
| 2 | Cautious Buyer | Some skepticism, basic objections |
| 3 | Tough Customer | Price-focused, multiple objections |
| 4 | Expert Negotiator | Savvy, complex objections |
| 5 | The Gatekeeper | Maximum resistance, expert-level challenge |

**Scoring Categories:**
- Opener
- Rapport building
- Discovery questions
- Pitch delivery
- Objection handling
- Closing technique
- Overall performance

**XP Rewards:**
- Win: `level * 100` XP
- Lose: `level * 30` XP
- Abandon: 10 XP

### Certification Levels

| Level | Unlocks |
|-------|---------|
| Trainee | Practice mode only |
| Associate | COMPASS access |
| Specialist | ADS Dashboard access |
| Expert | Advanced features, team mentoring |

### Progression Integration

XP earned in battles syncs to Twenty CRM via `awardBattleXP()`:
- Tracks total XP, rank, battle history
- Visible on LIDS Dashboard leaderboard
- Persists across devices

---

## Backend Services

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| REDHAWK Agent | 4096 | AI conversation engine | Active |
| Leon-RedHawk | 1337 | Voice-native training mode | Active |
| Twenty CRM | 3001 | XP sync, progression | Active |

### API Endpoints (via REDHAWK Agent)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/redhawk/progress/:repId` | GET | Get rep progression |
| `/api/redhawk/modules` | GET | List training modules |
| `/api/redhawk/cert/start` | POST | Start certification exam |
| `/api/redhawk/cert/submit` | POST | Submit exam answers |
| `/api/redhawk/cert/:repId` | GET | Get certifications |
| `/api/redhawk/battle/start` | POST | Start boss battle |
| `/api/redhawk/battle/turn` | POST | Submit conversation turn |
| `/api/redhawk/battle/end` | POST | End battle, get XP |
| `/api/redhawk/battle/stats/:repId` | GET | Get battle statistics |
| `/api/redhawk/health` | GET | Health check |

### Mock Mode

When `VITE_USE_MOCK_API=true` or no API URL configured:
- Uses `mockApi.ts` for demo functionality
- Random AI responses in battles
- Simulated scoring
- No persistence

---

## Data Layer

### Browser (Context/State)

| Context | Purpose |
|---------|---------|
| `AuthContext` | User authentication state |
| Local component state | Battle progress, scores, turns |

### Integration Points

| System | Purpose |
|--------|---------|
| REDHAWK Agent (4096) | AI conversation, scoring |
| Leon-RedHawk (1337) | Voice-based training (optional) |
| Twenty CRM | XP sync via `twentyProgressionApi.ts` |
| user_registry | User identity, permissions |

---

## Configuration

### Environment Variables

```bash
PORT=3102
VITE_API_BASE_URL=http://192.168.1.23:4096
VITE_USE_MOCK_API=false
```

### Authentication

Uses `AuthContext` with:
- Rep identity from login
- HelmUser integration for XP sync
- Protected routes redirect to `/login`

---

## Development

```bash
# Start dev server
cd apps/redhawk-academy
npm run dev
# → http://localhost:3102

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
scp -r dist/* edwardsdavid913@192.168.1.23:~/apps/redhawk-academy/
ssh edwardsdavid913@192.168.1.23 "pm2 restart redhawk-academy"
```

**Production URL:** https://academy.ripemerchant.host

---

## Cloudflare Tunnel

Configured in `~/.cloudflared/config.yml`:

```yaml
- hostname: academy.ripemerchant.host
  service: http://localhost:3102
```

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| REDHAWK Agent response latency | Medium | AI responses can take 2-5s |
| No offline battle mode | Medium | Requires agent connection |
| Voice mode not integrated | Low | Leon-RedHawk available but not connected |
| Module content incomplete | Low | Needs full curriculum |

---

## Roadmap

1. **Voice Training Mode** - Integrate Leon-RedHawk for spoken practice
2. **Curriculum Expansion** - Full module content for all 5 areas
3. **Team Battles** - Compete against other reps
4. **AI Coaching** - Post-battle feedback and suggestions
5. **Certification Verification** - Digital badges, LinkedIn integration

---

## Related Documentation

- [ADS_DASHBOARD.md](./ADS_DASHBOARD.md) - Main CRM/dialer dashboard
- [COMPASS.md](./COMPASS.md) - Field assistant PWA
- [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - Full system architecture

---

*Last Updated: December 24, 2025*
