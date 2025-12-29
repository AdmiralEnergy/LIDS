# Unified Progression System

**Version:** 3.0 | **Updated:** December 29, 2025

---

## Purpose: Why This System Exists

**The Problem:** 70% of solar sales reps quit within the first month. Why? No leads, no structure, and no way to see their progression. A rep might not make their first sale until day 45 - and without visible progress, it feels like getting yelled at day over day with no income.

**The Solution:** The Progression System is one of THREE CORE PILLARS of ADS:

| Pillar | Purpose |
|--------|---------|
| **LEADS** | PropStream imports with TCPA compliance - reps have something to call on Day 1 |
| **STRUCTURE** | Dialer, agents, training - just show up and press dial |
| **PROGRESSION** | XP system showing improvement BEFORE first sale - THE GLUE |

**This is not gamification.** This is diagnostic data that tells both the rep AND leadership where to focus training.

### Example: Why Progression is Diagnostic

| Scenario | Naive Analysis | With Progression Metrics |
|----------|---------------|--------------------------|
| 100 calls, 20 conversations | "Needs closer training" | If Sub-30s Drop Rate is 65%, needs OPENER training |
| High dials, low connects | "Bad leads" | If voicemails = 0, not leaving messages |
| Good conversations, no appts | "Needs closing help" | Correct - target closer training |

The efficiency badges tell both rep AND leadership where strengths and weaknesses are.

---

## Authoritative Documentation

This file provides the integration architecture. For detailed requirements, reference:

| Document | Location | Contains |
|----------|----------|----------|
| **SalesOperativeProgression.md** | LifeOS-Core/docs/_SYSTEMS/LIDS/RedHawk_Training_Academy/Admiral Energy Sales Academy/ | Complete rank requirements, XP sources, badge tiers, level thresholds |
| **redhawk.md** | LifeOS-Core/agents/apex/redhawk/ | RedHawk API endpoints, module structure, exam system |
| **REDHAWK_ACADEMY.md** | LIDS/docs/ | RedHawk Academy app integration |

**DO NOT INVENT REQUIREMENTS.** All specs are documented in SalesOperativeProgression.md.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SINGLE SOURCE OF TRUTH: Twenty CRM (repProgressions custom object)         │
│  Location: Droplet (localhost:3001) via https://twenty.ripemerchant.host    │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  LIDS (ADS)   │    │   RedHawk     │    │   COMPASS     │
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
| `workspaceMemberId` | UUID | Links to Twenty user (**PERMANENT ID**) |
| `totalXp` | number | Cumulative XP |
| `currentLevel` | number | Calculated from XP thresholds |
| `currentRank` | string | E-1 through E-7 |
| `closedDeals` | number | Verified deal counter |
| `badges` | JSON | Array of earned badge IDs |
| `streakDays` | number | Consecutive activity days |
| `completedModules` | JSON | Array of passed module IDs |
| `certifications` | JSON | Array of certification IDs |
| `defeatedBosses` | JSON | Array of boss IDs |
| `passedExams` | JSON | Array of exam IDs with scores |

**Critical:** Always use `workspaceMemberId`, never email. workspaceMemberId is permanent; email can change.

---

## Rank System (Summary)

See **SalesOperativeProgression.md** for complete requirements.

| Rank | Code | XP | Key Gates |
|------|------|-----|-----------|
| SDR I | E-1 | 0 | Starting rank |
| SDR II | E-2 | 500+ | Modules 0-1, 100+ dials |
| SDR III | E-3 | 1,500+ | Modules 0-3, 2 badges, 3+ appointments |
| Sales Operative | E-4 | 3,000+ | Sub-30s Drop <50%, Modules 0-5, 5 deals, exam 80% |
| Senior Operative | E-5 | 8,000+ | Call-to-Appt >5%, Full Cert, 10 deals, exam 85% |
| Team Lead | E-6 | 15,000+ | Cadence Completion >70%, 25 deals, mentored 2+ reps |
| Manager | E-7 | 30,000+ | Team metrics, leadership cert |

### Skill Gates

Rank promotions require ALL of:
1. **XP Threshold** - Minimum cumulative XP
2. **Module Completions** - Training milestones (RedHawk)
3. **Verified Metrics** - Real deals/appointments from Twenty CRM
4. **Efficiency Gates** - Calculated from call data
5. **Exams** (E-4+) - Certification pass scores

---

## Efficiency Metrics (Diagnostic Data)

Calculated from call data in Twenty CRM (Notes with "Call -" prefix):

| Metric | Formula | Badge | Rank Gate |
|--------|---------|-------|-----------|
| Sub-30s Drop Rate | calls < 30s / total calls | Opener Elite | E-4 (<50%) |
| Call-to-Appt Rate | appointments / total calls | Conversion Champion | E-5 (>5%) |
| 2+ Min Conversation Rate | calls > 2min / total calls | Engagement Master | — |
| Cadence Completion Rate | leads with full cadence / total leads | — | E-6 (>70%) |
| Show Rate | held appointments / set appointments | Show Rate Champion | — |

**These metrics diagnose skill gaps.** A rep struggling with Sub-30s Drop Rate needs opener training, not closer training.

---

## Level Thresholds

| Level | XP | Level | XP |
|-------|-----|-------|-----|
| 1 | 0 | 9 | 5,500 |
| 2 | 100 | 10 | 7,500 |
| 3 | 250 | 11 | 10,000 |
| 4 | 500 | 12 | 13,000 |
| 5 | 1,000 | 13 | 16,500 |
| 6 | 1,750 | 14 | 20,500 |
| 7 | 2,750 | 15 | 25,000 |
| 8 | 4,000 | 16+ | +5,000/level |

---

## XP Sources (Summary)

See **SalesOperativeProgression.md** for complete XP values and multipliers.

### Activity XP
| Activity | XP |
|----------|-----|
| Dial Attempt | 2 |
| Dial Connect | 5 |
| 2+ Minute Conversation | 15 |
| Appointment Set | 100 |
| Deal Closed | 300 |

### Training XP (RedHawk)
| Activity | XP |
|----------|-----|
| Framework Module (0-3) | 50 each |
| Module 4 (Objections) | 75 |
| Module 5 (TCPA) | 100 |
| Full Framework Cert | 300 |
| Boss Battle Win | 100 × Level |

---

## Integration: ADS + RedHawk

| System | Writes | Reads |
|--------|--------|-------|
| **ADS Dashboard** | Call XP, activity stats | RedHawk progress, Twenty progression |
| **RedHawk Academy** | Module completions, exam scores, battle results | Twenty progression |
| **COMPASS** | Field activity | Twenty progression |

All systems read/write to the same `repProgressions` object in Twenty CRM.

### RedHawk API Endpoints

```
GET  /cert/:repId           # Certifications and exam results
GET  /progress/:repId       # Module completion status
GET  /battle/stats/:repId   # Boss battle history
POST /cert/start            # Start certification exam
POST /cert/submit           # Submit exam answers
POST /battle/start          # Start boss battle
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

## Implementation Files

### ADS Dashboard (LIDS)

```
apps/ads-dashboard/client/src/
├── features/progression/
│   ├── config/
│   │   ├── ranks.ts        # Rank definitions (E-1 to E-7)
│   │   ├── xp.ts           # XP sources and thresholds
│   │   ├── badges.ts       # Badge definitions
│   │   └── modules.ts      # Training modules
│   ├── hooks/
│   │   └── useProgression.ts    # Main state hook
│   └── components/
│       ├── DialerHUD.tsx        # Stats overlay
│       ├── PlayerCard.tsx       # Profile display
│       └── LevelProgress.tsx    # XP bar
└── lib/
    ├── progressionDb.ts    # IndexedDB (offline cache)
    └── twentySync.ts       # Twenty CRM sync
```

### RedHawk Academy (LIDS)

```
apps/redhawk-academy/client/src/
├── lib/
│   └── twentyProgressionApi.ts  # Twenty CRM sync
└── pages/
    ├── BossBattle.tsx
    ├── ModuleQuiz.tsx
    └── Certification.tsx
```

---

## Current Status

### Known Issues (To Fix)

| Issue | Severity | Status |
|-------|----------|--------|
| Sync not implemented in ADS | CRITICAL | IndexedDB only, no Twenty sync |
| repProgressions object may not exist | HIGH | Need to verify/create in Twenty |
| Badge/Exam sync gap | MEDIUM | RedHawk badges not appearing in ADS |

### Project 18: Progression System Fix

See `projects/18-progression-system-fix/` for implementation plan.

---

## Related Documents

- `apps/ads-dashboard/README.md` - ADS Dashboard vision (three pillars)
- `docs/REDHAWK_ACADEMY.md` - RedHawk Academy integration
- `CLAUDE.md` - Development instructions

---

**Owner:** David Edwards | Admiral Energy
