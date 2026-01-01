# LIDS Agent Reference

**External agents that LIDS dashboards interact with**

Agents are stored in LifeOS-Core (separate repo), not LIDS. LIDS calls agents via HTTP proxy to admiral-server.

---

## Agent Registry

| Agent | Port | Location (LifeOS-Core) | Purpose |
|-------|------|------------------------|---------|
| **ADMIRAL** | 4088 | `agents/python/admiral` | Sales CEO AI - Conversational strategy, FieldOps orchestration |
| **AdmiralQuartermaster** | 4090 | `agents/apex/admiralquartermaster` | n8n workflows, cadence scheduling, task routing |
| **MUSE** | 4066 | `agents/python/muse` | Marketing strategy, content planning, RAG for marketing plan |
| **Sarai** | 4065 | `agents/python/sarai` | Content creation, copywriting, scripts |
| **Guardian (Agent-Claude)** | 4110 | `agents/apex/guardian` | Primary AI with persistent memory |
| **RedHawk** | 4096 | `agents/apex/redhawk` | Sales training, exams, boss battles |
| **LiveWire** | 5000 | `agents/python/livewire` | Reddit intelligence, lead sourcing |
| **FieldOps** | 4091-4095 | `agents/apex/fieldops-*` | Specialized sales agents (Scout, Analyst, Caller, Scribe, Watchman) |

---

## Connection Details

**Admiral-Server:** `100.66.42.81` (Tailscale VPN)

All LIDS apps proxy to agents via their Express servers:

```typescript
// Example: apps/studio/server/routes.ts
const MUSE_URL = `http://100.66.42.81:4066`;
const SARAI_URL = `http://100.66.42.81:4065`;

app.post('/api/muse/chat', async (req, res) => {
  const response = await fetch(`${MUSE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  res.json(await response.json());
});
```

---

## Marketing Agents (Studio)

### MUSE - Strategy Planner

**Port:** 4066
**Endpoint:** `/chat`
**Role:** Marketing strategy, content planning

**Capabilities:**
- Query marketing plan via RAG
- Suggest weekly content based on strategy
- Explain WHY each piece fits the plan
- Provide step-by-step guidance for Leigh

**LIDS Routes:**
- `POST /api/muse/chat` - General chat
- `GET /api/muse/health` - Health check
- `POST /api/muse/suggest-content` - Get content suggestions (planned)

### Sarai - Content Creator

**Port:** 4065
**Endpoint:** `/chat`
**Role:** Content creation, copywriting

**Capabilities:**
- Write LinkedIn posts
- Create TikTok captions
- Generate scripts
- Draft email copy

**LIDS Routes:**
- `POST /api/sarai/chat` - General chat
- `GET /api/sarai/health` - Health check

---

## Sales Agents (ADS/COMPASS)

### ADMIRAL - Sales CEO AI

**Port:** 4088
**Type:** Python / FastAPI / Anthropic Claude 3.5
**Location:** `agents/python/admiral`
**PM2:** `admiral`

**Role:** Conversational AI CEO for Admiral Energy's sales operations

**Capabilities:**
- Executive-level sales strategy guidance
- TCPA compliance oversight
- Daily passdowns and EOD summaries
- Territory research via Scout
- Performance metrics via Analyst
- FieldOps agent orchestration

**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/status` | GET | Detailed status |
| `/chat` | POST | Main conversation endpoint |
| `/passdown` | POST | Generate daily passdown |
| `/eod-summary` | POST | Generate EOD summary |
| `/territory` | POST | Research territory by zip |
| `/compliance` | POST | Check TCPA compliance |
| `/metrics` | POST | Get performance metrics |

**Telegram Commands:** `/start`, `/help`, `/briefing`, `/territory [zip]`, `/metrics`, `/compliance [phone]`

**Documentation:** `agents/python/admiral/ADMIRAL.md`

---

### AdmiralQuartermaster - Operations Orchestrator

**Port:** 4090
**Type:** Node.js / TypeScript / Fastify
**Location:** `agents/apex/admiralquartermaster`
**PM2:** `admiral-quartermaster`

**Role:** n8n workflow orchestration, cadence scheduling, task routing

**Capabilities:**
- n8n workflow management (create, execute, list)
- Cadence scheduling and processing (5-min cron)
- Lead enrollment management
- Task assignment to agents
- System health monitoring
- Policy enforcement

**Key Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/n8n/workflows` | GET/POST | List/Create workflows |
| `/n8n/workflows/:id/execute` | POST | Execute workflow |
| `/cadences` | GET/POST | Cadence CRUD |
| `/cadences/process` | POST | Process due steps |
| `/enrollments` | GET/POST | Enrollment CRUD |

**n8n Integration:** All n8n workflows referencing ADMIRAL should use `admiral-quartermaster` agent ID.

**Documentation:** `agents/apex/admiral/ADMIRALQUARTERMASTER.md`

---

### Guardian (Agent-Claude)

**Port:** 4110
**Role:** Primary AI with persistent memory (Oracle)

**Used By:** COMPASS PWA

### RedHawk

**Port:** 4096
**Role:** Sales training, exams, boss battles

**Used By:** RedHawk Academy

**Endpoints:**
- `POST /api/exams/:id/start`
- `POST /api/exams/:id/submit`
- `POST /api/battles/start`
- `POST /api/battles/:id/turn`

### FieldOps Agents

**Ports:** 4091-4095
**Role:** Specialized sales agents orchestrated by ADMIRAL v2.0

| Port | Agent | Role |
|------|-------|------|
| 4091 | Scout | Territory research, MLS data, market analysis |
| 4092 | Analyst | Lead scoring, performance metrics, KPI tracking |
| 4093 | Caller | Dialer operations, call scripts, talk tracks |
| 4094 | Scribe | CRM logging, activity tracking, notes |
| 4095 | Watchman | Compliance checking, DNC verification, TCPA |

**Note:** ADMIRAL automatically calls these agents based on conversation context (territory keywords → Scout, metrics keywords → Analyst, compliance keywords → Watchman).

---

## n8n Workflows

**Location:** admiral-server:5678

n8n orchestrates agent workflows for automation:
- Daily content reminders
- Engagement tracking
- Postiz sync

---

## Postiz (Social Scheduling)

**Status:** Phase 4 - PENDING
**Repository:** github.com/gitroomhq/postiz-app
**Location:** Droplet (:3200) - NOT admiral-server
**URL:** `postiz.ripemerchant.host` (planned)

Postiz replaces Buffer for social media scheduling. Open-source, self-hosted.

**Architecture:** Postiz is to Studio what Twenty is to ADS - a headless backend.

### How OAuth Works

Postiz went through TikTok's developer audit once. All self-hosters benefit:
1. Postiz has approved TikTok App ID
2. Users OAuth-connect their accounts to Postiz
3. Postiz posts using their app + user's token
4. No need for Admiral Energy to apply for API access

### Supported Platforms
- TikTok (Business Account required)
- LinkedIn (personal + business)
- Instagram
- Twitter/X
- YouTube
- Google My Business

### Key Features
- Native n8n integration (`n8n-nodes-postiz`)
- Content Library (media persists, reusable)
- NodeJS SDK (`@postiz/node`)
- Self-hosted (no subscription fees)
- API for programmatic scheduling

### TikTok API Limits
| Limit | Value |
|-------|-------|
| Requests/minute | 6 per token |
| Posts/day | ~15 per account |
| Scheduling window | Unlimited (vs TikTok's 10 days) |

### Integration Plan (Phase 4)
1. Clone Postiz repo on droplet
2. Configure Docker Compose (port 3200)
3. Add Cloudflare tunnel: `postiz.ripemerchant.host`
4. Connect TikTok + LinkedIn via OAuth
5. Add `/api/postiz/*` proxy routes in Studio
6. Build upload UI in Studio calendar
7. Sync posted content back to Twenty CRM

---

## Health Checks

```bash
# From LIDS apps (via proxy)
curl https://studio.ripemerchant.host/api/muse/health
curl https://studio.ripemerchant.host/api/sarai/health

# Direct (from droplet via Tailscale)
curl http://100.66.42.81:4065/health
curl http://100.66.42.81:4066/health
curl http://100.66.42.81:4110/health
```

---

## Adding New Agents

1. Create agent in LifeOS-Core under `agents/`
2. Deploy to admiral-server with PM2
3. Add proxy route in relevant LIDS app's `server/routes.ts`
4. Update this document

---

---

## LiveWire v3 - Multi-Agent Intent Training System

**Status:** PLANNING
**Port:** 5100 (Python/FastAPI)
**Location:** admiral-server `/var/lib/livewire/`

### Architecture: LiveWire STAYS, Agents EXTEND

```
LiveWire (scan) → Intent Analyst (qualify) → DM Crafter (reach out) → Outcomes → ALL agents learn
```

**Critical Insight:** Do NOT replace LiveWire scanner. The 4 agents extend LiveWire's capabilities.

### The 4 Agents + Their Learning Loops

| Agent | Stack | Job | Learns From |
|-------|-------|-----|-------------|
| **LiveWire** | TypeScript (existing :5000) | Find Reddit posts matching keywords | Which keywords + subreddits produce leads that CONVERT |
| **Intent Analyst** | Python/AutoGen | Research post context, guess intent | Nate's corrections when AI guesses wrong |
| **DM Crafter** | Python/AutoGen | Generate personalized outreach messages | Reply rates and conversion rates per template/style |
| **Subreddit Researcher** | Python/AutoGen | Discover goldmine subreddits, track performance | Conversion rates by subreddit (not just post volume) |

### Aggregate Data Store

All agents share a single source of truth:

```sql
lead_journey (
  -- LiveWire found it
  reddit_id, subreddit, matched_keywords, found_at,
  -- Intent Analyst analyzed it
  ai_intent, ai_confidence, ai_reasoning,
  -- Nate reviewed it
  nate_decision,  -- 'approved' | 'denied'
  nate_intent_correction,  -- if AI was wrong
  problem_phrase,  -- if denied, what PHRASE (not keyword)
  -- DM Crafter (only if approved)
  dm_template_used, dm_personalization_style, dm_sent_at,
  -- Outcomes (feeds ALL agents)
  reply_received, converted, deal_value
)
```

### Progressive Autonomy Levels

| Level | Description | Unlock Requirement |
|-------|-------------|-------------------|
| **L0** | Human labels ALL posts | Starting state |
| **L1** | AI suggests, human confirms | 100 labeled samples |
| **L2** | Auto-label high confidence | 85% accuracy / 200 samples |
| **L3** | Auto-DM with approval | 90% accuracy / 500 samples |
| **L4** | Full autonomy | 95% accuracy, 15% reply rate |

### Key Learning: Phrases, Not Keywords

The system learns CONTEXT, not just keyword weights:
- "Just installed my Powerwall" → `already_bought` intent (Nate selects "just installed" as problem phrase)
- "Want to buy a Powerwall" → `buying` intent
- Same keyword "Powerwall", opposite intents - only context distinguishes them

### Project Reference

See: `projects/active/23-livewire-v3-multi-agent/`
- `README.md` - Status dashboard
- `SESSION_NOTES.md` - Architecture refinement notes
- `AUDIT_FINDINGS.md` - Current v2 analysis, target v3 state

---

*Last Updated: December 30, 2025*
