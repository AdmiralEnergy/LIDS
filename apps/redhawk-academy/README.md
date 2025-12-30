# RedHawk Academy - Sales Training Platform

Sales training platform with skill gates, certifications, and progression system.

**URL:** https://academy.ripemerchant.host
**Port:** 3102 (dev and prod)
**PM2 Name:** redhawk

---

## Purpose

RedHawk Academy provides structured sales training for Admiral Energy reps. It includes:
- Framework modules (Products, Openers, Timing, Cadence, Objections, TCPA)
- Skill-gated progression (must pass exams to advance rank)
- Boss battles (AI-powered role-play practice)
- Certifications (prove mastery of complete framework)

---

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Training Modules | LIVE | 6 framework modules with content |
| Module Quizzes | LIVE | Pass quizzes to earn XP |
| Boss Battles | LIVE | AI-powered role-play scenarios |
| Certifications | LIVE | Full framework certification exam |
| Progression Sync | LIVE | Syncs with Twenty CRM repProgressions |

---

## Training Framework

### Modules

| # | Module | XP | Required For |
|---|--------|-----|--------------|
| 0 | Product Foundations | 50 | E-2 |
| 1 | Opener Mastery | 50 | E-2 |
| 2 | Timing Optimization | 50 | E-3 |
| 3 | Cadence Excellence | 50 | E-3 |
| 4 | Objection Exploration | 75 | E-4 |
| 5 | TCPA Compliance | 100 | E-4 |
| 6 | Full Framework Certification | 300 | E-5 |

### Rank Gates

RedHawk Academy enforces skill gates for rank promotion:

| Rank | Code | Requirements |
|------|------|--------------|
| SDR I | E-1 | Starting rank |
| SDR II | E-2 | Modules 0-1, 100+ dials |
| SDR III | E-3 | Modules 0-3, 2 badges |
| Operative | E-4 | Modules 0-5, exam 80% |
| Senior | E-5 | Full Certification, exam 85% |
| Team Lead | E-6 | Leadership cert |
| Manager | E-7 | Team metrics |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  RedHawk Academy (Droplet :3102)                            │
├─────────────────────────────────────────────────────────────┤
│  Frontend: React + Vite                                      │
│  Backend: Express.js                                         │
│                                                              │
│  Key Files:                                                  │
│  ├── lib/twentyProgressionApi.ts - Twenty CRM sync          │
│  ├── pages/BossBattle.tsx        - AI role-play             │
│  ├── pages/ModuleQuiz.tsx        - Quiz interface           │
│  └── pages/Certification.tsx     - Cert exam                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Tailscale (for boss battles)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Admiral-Server (192.168.1.23)                              │
├─────────────────────────────────────────────────────────────┤
│  RedHawk Agent :4096 - Boss battle AI                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration with ADS Dashboard

RedHawk Academy and ADS Dashboard share the same progression data:

- **Single Source of Truth:** Twenty CRM `repProgressions` custom object
- **Shared Fields:** totalXp, currentLevel, currentRank, badges
- **XP Sources:** Both apps award XP to the same record

```
ADS Dashboard                    RedHawk Academy
     │                                │
     │  Call XP                       │  Module XP
     │  (dials, connects)             │  (quizzes, battles)
     │                                │
     └────────────┬───────────────────┘
                  │
                  ▼
          Twenty CRM
        repProgressions
```

---

## Development

```bash
cd apps/redhawk-academy
npm install
npm run dev  # http://localhost:3102
```

---

## Environment Variables

```bash
# Required
TWENTY_CRM_URL=http://localhost:3001
TWENTY_API_KEY=your_key

# Optional (for boss battles)
VITE_BACKEND_HOST=100.66.42.81
VITE_REDHAWK_AGENT_PORT=4096
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/cert/:repId` | GET | Get certifications |
| `/progress/:repId` | GET | Get module completion |
| `/battle/stats/:repId` | GET | Get boss battle history |
| `/cert/start` | POST | Start certification exam |
| `/cert/submit` | POST | Submit exam answers |
| `/battle/start` | POST | Start boss battle |

---

## Future: Academy Cohort Channels (Project 16 Phase 6)

Planned integration with Admiral Chat:
- `#cohort-jan-2026` - Training class channels
- `#training-questions` - General Q&A
- `#certifications` - Exam discussion

---

## Related Documentation

- [PROGRESSION_SYSTEM.md](../../docs/PROGRESSION_SYSTEM.md) - Complete progression system
- [REDHAWK_ACADEMY.md](../../docs/REDHAWK_ACADEMY.md) - Academy integration details

---

*Last Updated: December 29, 2025*
