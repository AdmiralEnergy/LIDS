# Project 24: LiveWire Autogen Intent Training System

**Status:** PLANNING
**Started:** December 30, 2025
**Owner:** David Edwards
**Priority:** HIGH

---

## Overview

Replace keyword-based LiveWire scoring with a **human-trained intent detection system** using Python Autogen multi-agent architecture.

**Core Problem:** Keywords don't capture intent. "Just installed my Powerwall" and "Want to buy a Powerwall" both match "Powerwall" but have opposite intents. The current system penalizes the keyword when it should detect the context.

**Solution:** Human labels posts with intent + reasoning → System learns patterns → Progressive autonomy

---

## Architecture (Hybrid TypeScript + Python)

```
TypeScript (existing LiveWire)        Python Autogen (new, port 5010)
─────────────────────────────         ────────────────────────────────
• Reddit API/scanning                 • Intent Analysis Agent (TeachableAgent)
• Lead storage (SQLite)               • Subreddit Research Agent
• COMPASS proxy routes                • Outreach Agent
• Basic CRUD                          • Pattern learning & confidence scoring
         │                                     │
         └─────────────┬───────────────────────┘
                       │
                       ▼
                 SQLite (shared)
                 • lead_candidates
                 • intent_training_samples
                 • learned_intent_patterns
```

---

## Multi-Agent Team

| Agent | Role | Key Tools |
|-------|------|-----------|
| **Post Research** | Surface posts (NO scoring) | browse_subreddit, get_unreviewed |
| **Intent Analysis** | Learn patterns, suggest intent | suggest_intent, learn_from_label |
| **Subreddit Research** | Discover goldmines | discover_related, get_metrics |
| **Outreach** | Craft DMs/comments | generate_dm, track_replies |

---

## Progressive Autonomy

| Phase | Samples | Agent Behavior |
|-------|---------|----------------|
| **Training** | 0-50 | Human labels ALL, agent observes |
| **Assisted** | 50-160 | Agent suggests, human confirms/corrects |
| **Active** | 160+ | Agent auto-classifies >75% confidence |

---

## Implementation Status

### Phase 0: Project Setup
- [x] Project folder created
- [x] README.md
- [x] CODEX_IMPLEMENTATION_PLAN.md
- [x] AUDIT_FINDINGS.md

### Phase 1: Foundation (Week 1)
- [ ] Python package: `agents/python/livewire/`
- [ ] FastAPI server on port 5010
- [ ] Intent labeling UI in COMPASS
- [ ] SQLite schema migrations

### Phase 2: TeachableAgent (Week 2)
- [ ] Pattern extraction from labels
- [ ] Confidence scoring
- [ ] Accuracy tracking

### Phase 3: Subreddit Intelligence (Week 3)
- [ ] Related subreddit discovery
- [ ] Quality metrics from intent labels
- [ ] Tier recommendations

### Phase 4: Outreach (Week 4)
- [ ] DM template generation
- [ ] Comment drafts
- [ ] Reply rate tracking

---

## Key Decisions

| Question | Decision |
|----------|----------|
| **Labeling UI** | COMPASS (rich interface) |
| **Outreach** | Build in parallel |
| **Architecture** | Hybrid (TS scanning + Python learning) |

---

## Success Criteria

- [ ] 100+ labeled posts in first week
- [ ] 85%+ intent accuracy by week 4
- [ ] 15%+ DM reply rate
- [ ] Higher conversion than v2 keyword system

---

## Files

| File | Purpose |
|------|---------|
| `README.md` | This file - status dashboard |
| `CODEX_IMPLEMENTATION_PLAN.md` | Detailed implementation plan |
| `AUDIT_FINDINGS.md` | Current system issues |

---

*Last Updated: December 30, 2025*
