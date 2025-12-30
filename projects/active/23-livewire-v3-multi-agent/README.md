# Project 23: LiveWire v3.0 - Multi-Agent Intent Training System

**Status:** PLANNING
**Started:** December 30, 2025
**Owner:** David Edwards
**Priority:** HIGH

---

## Overview

Replace the current keyword-based LiveWire (v2) with a Python AutoGen multi-agent system that learns intent from human labeling, not pattern matching.

**Core Problem:** Keywords don't capture intent. "Just installed my Powerwall" and "Want to buy a Powerwall" both match "Powerwall" but have opposite intents.

**Solution:** Human labels posts → System learns patterns → Progressive autonomy

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LIVEWIRE v3.0 MULTI-AGENT SYSTEM                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ POST SCOUT  │  │ INTENT      │  │ SUBREDDIT   │  │ DM CRAFTER  │   │
│  │ AGENT       │  │ ANALYST     │  │ RESEARCHER  │  │ AGENT       │   │
│  │             │  │             │  │             │  │             │   │
│  │ Find posts  │  │ Analyze     │  │ Discover    │  │ Generate    │   │
│  │ NO scoring  │  │ Suggest     │  │ goldmines   │  │ personalized│   │
│  │ Just surface│  │ Human trains│  │ Demographics│  │ DMs/comments│   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                           │                                            │
│                  ┌────────▼────────┐                                   │
│                  │  ORCHESTRATOR   │                                   │
│                  │  (AutoGen)      │                                   │
│                  │  Progressive    │                                   │
│                  │  Autonomy 0-4   │                                   │
│                  └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology | Location |
|-----------|------------|----------|
| Backend | Python 3.11 + FastAPI + AutoGen 0.4 | admiral-server:5100 |
| Database | SQLite | /var/lib/livewire/livewire_v3.db |
| LLM | Claude 3.5 Sonnet | API |
| Reddit | PRAW | OAuth app |
| Frontend | React (COMPASS PWA) | Droplet:3101 |

---

## Progressive Autonomy Levels

| Level | Description | Unlock Requirement |
|-------|-------------|-------------------|
| **L0** | Human labels ALL posts | Starting state |
| **L1** | AI suggests, human confirms | 100 labeled samples |
| **L2** | Auto-label high confidence | 85% accuracy / 200 samples |
| **L3** | Auto-DM with approval | 90% accuracy / 500 samples |
| **L4** | Full autonomy | 95% accuracy, 15% reply rate |

---

## Implementation Status

### Phase 1: Infrastructure
- [ ] Python environment on admiral-server
- [ ] AutoGen + FastAPI + PRAW installed
- [ ] SQLite schema created
- [ ] FastAPI server deployed on :5100

### Phase 2: Core Agents
- [ ] Post Scout Agent
- [ ] Intent Analyst Agent
- [ ] GroupChat orchestrator

### Phase 3: Training System
- [ ] Training API endpoints
- [ ] Human labeling storage
- [ ] Autonomy level progression

### Phase 4: Frontend
- [ ] Training interface (livewire-training.tsx)
- [ ] Confidence dashboard (livewire-autonomy.tsx)
- [ ] DM approval queue (livewire-dm-queue.tsx)

### Phase 5: Advanced Agents
- [ ] DM Crafter Agent
- [ ] Subreddit Researcher Agent

---

## Success Criteria

- [ ] 100+ labeled posts in first week
- [ ] 85%+ intent accuracy by week 4
- [ ] 15%+ DM reply rate
- [ ] Higher conversion than v2 keyword system

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `admiral-server/livewire-v3/` | NEW - Python service directory |
| `apps/compass/server/routes.ts` | ADD - v3 proxy routes |
| `apps/compass/client/src/pages/livewire-training.tsx` | NEW |
| `apps/compass/client/src/pages/livewire-autonomy.tsx` | NEW |
| `docs/agents.md` | UPDATE - Add LiveWire v3 |

---

*Last Updated: December 30, 2025*
