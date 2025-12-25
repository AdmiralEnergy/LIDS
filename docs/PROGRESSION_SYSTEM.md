# Unified Progression System

**Version:** 2.0 | **Updated:** December 25, 2025

---

## Overview

The Progression System is the gamification layer for Admiral Energy sales operations. It tracks:
- **XP (Experience Points)** - Earned from sales activities
- **Levels** (1-25) - Based on cumulative XP
- **Ranks** (E-1 through E-7) - Career progression gates
- **Badges** - Achievement recognition
- **Certifications** - Skill verification via RedHawk exams

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SINGLE SOURCE OF TRUTH: Twenty CRM (repProgressions custom object)         │
│  Location: admiral-server (192.168.1.23:3001) via Tailscale (100.66.42.81) │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  ADS (HELM)   │    │   RedHawk     │    │   COMPASS     │
│  Dashboard    │    │   Academy     │    │   PWA         │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ IndexedDB     │    │ Twenty API    │    │ Twenty API    │
│ (offline      │    │ (direct)      │    │ (direct)      │
│  cache)       │    │               │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
       │                     │                     │
       └─────────────────────┴─────────────────────┘
                             │
                             ▼
                ┌───────────────────────┐
                │  SYNC MECHANISM       │
                │  - On login           │
                │  - On activity        │
                │  - Periodic (5min)    │
                └───────────────────────┘
```

---

## Twenty CRM Schema

### repProgressions Custom Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | string | Rep display name |
| `workspaceMemberId` | UUID | Links to Twenty user |
| `totalXp` | number | Cumulative XP |
| `currentLevel` | number | Calculated from XP |
| `currentRank` | string | E-1 through E-7 |
| `closedDeals` | number | Deal counter |
| `badges` | JSON | Array of badge IDs |
| `streakDays` | number | Consecutive activity days |
| `completedModules` | JSON | Array of module IDs |
| `certifications` | JSON | Array of certification IDs |
| `defeatedBosses` | JSON | Array of boss IDs |
| `passedExams` | JSON | Array of exam IDs |

---

## Rank System

### Progression Ladder

| Rank | Code | XP Threshold | Requirements |
|------|------|--------------|--------------|
| SDR I | E-1 | 0 | Starting rank |
| SDR II | E-2 | 500 | Level 3, 2 deals |
| SDR III | E-3 | 1,500 | Level 6, 10 deals |
| **Sales Operative** | E-4 | 3,000 | Level 10, 25 deals, **operative_certification exam** |
| Senior Operative | E-5 | 5,000 | Level 15, 100 deals, **senior_certification exam** |
| Team Lead | E-6 | 8,000 | Level 18, 25 deals, mentoring 2 reps |
| Manager | E-7 | 12,000 | Level 25, 50 deals, leadership cert |

### Skill Gates (RedHawk Integration)

Promotions to E-4+ require passing RedHawk certification exams:

| Promotion | Required Exam | Pass Score | Questions |
|-----------|--------------|------------|-----------|
| SDR III → Sales Operative | `operative_certification` | 80% | 25 |
| Sales Operative → Senior | `senior_operative_cert` | 85% | 25 |
| Senior → Team Lead | `compliance_master_cert` | 90% | 25 |

---

## XP Sources

### Dialer Activities (ADS Dashboard)

| Activity | Base XP | Notes |
|----------|---------|-------|
| Dial Made | 2 | Every outbound call attempt |
| Call Connected | 5 | Prospect answered |
| 2+ Minute Call | 15 | Quality conversation |
| Callback Scheduled | 25 | Future appointment |
| Appointment Set | 100 | Primary goal |
| Appointment Held | 50 | Show rate bonus |
| Deal Closed | 300 | Ultimate goal |
| Voicemail Left | 8 | Cadence step |
| Email Sent | 10 | Outreach |
| SMS Sent | 8 | Outreach |
| First Dial of Day | 25 | Daily bonus |

### Training Activities (RedHawk Academy)

| Activity | XP | Notes |
|----------|-----|-------|
| Module 0: Product Foundations | 50 | |
| Module 1: Opener Mastery | 50 | |
| Module 2: Timing Optimization | 50 | |
| Module 3: Cadence Excellence | 50 | |
| Module 4: Objection Exploration | 75 | |
| Module 5: TCPA Compliance | 100 | |
| Module 6: Framework Certification | 300 | Capstone |
| Boss Battle Win | 100 × Level | Max 500 XP |
| Elite Exam Score (95%+) | +100 | Bonus |

---

## Level Thresholds

| Level | Total XP | Level | Total XP |
|-------|----------|-------|----------|
| 1 | 0 | 14 | 15,500 |
| 2 | 100 | 15 | 20,000 |
| 3 | 250 | 16 | 25,000 |
| 4 | 500 | 17 | 30,000 |
| 5 | 850 | 18 | 36,000 |
| 6 | 1,300 | 19 | 43,000 |
| 7 | 1,900 | 20 | 51,000 |
| 8 | 2,700 | 21 | 60,000 |
| 9 | 3,800 | 22 | 70,000 |
| 10 | 5,200 | 23 | 82,000 |
| 11 | 7,000 | 24 | 96,000 |
| 12 | 9,200 | 25 | 112,000 |
| 13 | 12,000 | | |

---

## Badge System

### Compliance Badges (via RedHawk exams)

| Badge | Exam | Pass Score | XP Award |
|-------|------|------------|----------|
| `tcpa_certified` | TCPA Compliance | 80% | 200 |
| `can_spam_certified` | CAN-SPAM | 80% | 150 |
| `sms_certified` | CTIA SMS | 80% | 100 |
| `dnc_certified` | DNC Registry | 80% | 100 |
| `compliance_master` | All 4 above | - | 500 |

### Performance Badges (auto-awarded)

| Badge | Tiers | Criteria |
|-------|-------|----------|
| `opener_elite` | Bronze/Silver/Gold | Conversation starts |
| `conversion_champion` | Bronze/Silver/Gold/Platinum | Appointment rate |
| `appointment_setter` | Bronze/Silver/Gold | Appointments set |
| `closer` | Bronze/Silver/Gold | Deals closed |
| `show_rate_champion` | Bronze/Silver | Show rate % |

---

## Boss Battles (RedHawk)

Boss battles are simulated sales objection scenarios.

### RedHawk Boss

| Property | Value |
|----------|-------|
| Name | REDHAWK |
| Unlock Level | 12 |
| Required For | Senior Operative (E-5) |
| Win XP | 1,000 |
| Badge | `redhawk_slayer` |
| Title | "RedHawk Conqueror" |

### Battle XP Formula

```
Win:    100 × Level (+ 50% if all objections cleared)
Loss:   30 × Level
Abandon: 10 flat
```

---

## Implementation Files

### ADS Dashboard (LIDS)

```
apps/ads-dashboard/client/src/
├── features/progression/
│   ├── config/
│   │   ├── ranks.ts        # Rank definitions (E-1 to E-7)
│   │   ├── xp.ts           # XP sources and thresholds
│   │   ├── badges.ts       # Badge definitions
│   │   ├── specializations.ts
│   │   └── modules.ts      # Training modules
│   ├── hooks/
│   │   ├── useProgression.ts    # Main state hook
│   │   └── useEfficiencyMetrics.ts
│   └── components/
│       ├── DialerHUD.tsx        # Stats overlay
│       ├── PlayerCard.tsx       # Profile display
│       ├── LevelProgress.tsx    # XP bar
│       ├── BadgeDisplay.tsx     # Badge grid
│       ├── PromotionGateModal.tsx
│       └── BossGate.tsx
└── lib/
    └── progressionDb.ts    # IndexedDB (offline cache)
```

### RedHawk Academy (LIDS)

```
apps/redhawk-academy/client/src/
├── lib/
│   └── twentyProgressionApi.ts  # Twenty CRM sync
├── config/
│   └── ranks.ts                 # Rank thresholds
└── pages/
    ├── BossBattle.tsx
    ├── ModuleQuiz.tsx
    └── Certification.tsx
```

### LifeOS-Core (Backend)

```
agents/apex/redhawk/
├── data/redhawk/
│   ├── exams/              # Exam question banks
│   │   ├── skill-gates/
│   │   ├── compliance/
│   │   └── custom/
│   ├── results/            # Exam attempts
│   └── battles/            # Battle sessions
└── src/
    └── boss-battle/        # Battle logic
```

---

## API Endpoints

### ADS Dashboard (Express)

```
GET  /api/progression           # Get current user progression
POST /api/progression/xp        # Award XP
POST /api/progression/sync      # Sync to Twenty CRM
```

### RedHawk Agent (Port 4096)

```
POST /api/exams/:exam_id/start    # Start exam session
POST /api/exams/:exam_id/submit   # Submit answers
GET  /api/certifications/:rep_id  # Get certifications
POST /api/battles/start           # Start boss battle
POST /api/battles/:id/turn        # Battle turn
```

### Twenty CRM REST

```
GET    /rest/repProgressions
POST   /rest/repProgressions
PATCH  /rest/repProgressions/:id
```

---

## Sync Strategy

### ADS Dashboard → Twenty CRM

1. **On Activity**: When XP is earned, update IndexedDB immediately, queue sync to Twenty
2. **On Login**: Pull latest from Twenty, merge with local (Twenty wins on conflict)
3. **Periodic**: Every 5 minutes, push local changes to Twenty
4. **On Logout**: Force sync all pending changes

### RedHawk → Twenty CRM

1. **Direct Write**: All exam/battle results write directly to Twenty CRM
2. **No Local Cache**: RedHawk always reads/writes Twenty (requires connectivity)

### Conflict Resolution

- **Twenty CRM is SSOT** - If conflict, Twenty data wins
- **XP is additive** - Never subtract XP, only add
- **Badges are append-only** - Once earned, never removed

---

## Known Issues / TODO

1. **Sync not implemented in ADS** - Currently ADS uses IndexedDB only, no Twenty sync
2. **No repProgressions object in Twenty** - May need to create custom object
3. **Badge/Exam sync gap** - RedHawk badges not appearing in ADS

---

## Related Documents

- `docs/_SYSTEMS/PROGRESSION_UNIFIED_DESIGN.md` (LifeOS-Core)
- `docs/_SYSTEMS/LIDS/RedHawk_Training_Academy/` (Training curriculum)
- `docs/REDHAWK_ACADEMY.md` (LIDS)

---

**Owner:** David Edwards | Admiral Energy
