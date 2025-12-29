# LIDS Agent Reference

**External agents that LIDS dashboards interact with**

Agents are stored in LifeOS-Core (separate repo), not LIDS. LIDS calls agents via HTTP proxy to admiral-server.

---

## Agent Registry

| Agent | Port | Location (LifeOS-Core) | Purpose |
|-------|------|------------------------|---------|
| **MUSE** | 4066 | `agents/python/muse` | Marketing strategy, content planning, RAG for marketing plan |
| **Sarai** | 4065 | `agents/python/sarai` | Content creation, copywriting, scripts |
| **Guardian (Agent-Claude)** | 4110 | `agents/apex/guardian` | Primary AI with persistent memory |
| **RedHawk** | 4096 | `agents/apex/redhawk` | Sales training, exams, boss battles |
| **LiveWire** | 5000 | `agents/python/livewire` | Reddit intelligence, lead sourcing |
| **FieldOps (1-10)** | 5001-5010 | `agents/python/fieldops` | Sales agents (Scout, Analyst, Caller, etc.) |

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

**Ports:** 5001-5010
**Role:** Specialized sales agents

| Port | Agent | Role |
|------|-------|------|
| 5001 | Scout | Lead research |
| 5002 | Analyst | Data analysis |
| 5003 | Caller | Call assistance |
| 5004 | Closer | Closing strategies |
| 5005-5010 | Reserved | Future agents |

---

## n8n Workflows

**Location:** admiral-server:5678

n8n orchestrates agent workflows for automation:
- Daily content reminders
- Engagement tracking
- Buffer sync

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

*Last Updated: December 28, 2025*
