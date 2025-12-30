# COMPASS - AI Rep Assistant

Mobile PWA providing AI-powered assistance for field sales reps.

**URL:** https://compass.ripemerchant.host
**Port:** 3101 (dev and prod)
**PM2 Name:** compass

---

## Purpose

COMPASS is a mobile-first Progressive Web App (PWA) that gives field sales reps AI assistance during live sales calls. It provides objection handling, lead enrichment, and suggested actions.

---

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Lead Selector | LIVE | Select leads from Twenty CRM |
| Enrichment | LIVE | Property data via Scout MLS Scanner |
| Coach Agent | LIVE | Objection handling with strategies |
| Suggested Actions | LIVE | Context-aware call suggestions |
| Intel Agent | Phase 2 | Lead enrichment via Scout |
| Guard Agent | Phase 3 | TCPA compliance checking |
| Scribe Agent | Phase 4 | CRM logging automation |

---

## Micro-Agents (Project 17)

### Coach Agent (Phase 1 - COMPLETE)

Handles objection rebuttals with fuzzy matching.

**Supported Objections:**
1. too_expensive - Reframe technique
2. not_interested - Clarify technique
3. already_have_solar - Expand technique
4. need_to_talk_to_spouse - Schedule technique
5. bad_credit - Reassure technique
6. dont_own_home - Redirect technique
7. roof_concern - Risk Reduce technique
8. utility_rate - Future Pace technique
9. need_to_think - Isolate technique

**API:**
```
POST /api/objection
{
  "objection": "too expensive",
  "context": { "previousAttempts": 0 }
}

Response:
{
  "response": "I get that. Most homeowners felt...",
  "technique": "Reframe",
  "confidence": 0.86,
  "followUp": "If the numbers showed a savings..."
}
```

### Intel Agent (Phase 2 - NEXT)

Property lookup via Scout MLS Scanner on admiral-server.

### Guard Agent (Phase 3 - PENDING)

TCPA compliance checking before calls.

### Scribe Agent (Phase 4 - PENDING)

Automatic CRM logging of call outcomes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  COMPASS PWA (Droplet :3101)                                │
├─────────────────────────────────────────────────────────────┤
│  Frontend: React + Vite + PWA                               │
│  Backend: Express.js                                         │
│                                                              │
│  Components:                                                 │
│  ├── LeadSelector    - Pick lead from Twenty CRM            │
│  ├── EnrichButton    - Trigger property enrichment          │
│  ├── SuggestedActions - Command options                     │
│  ├── EnrichmentSummary - Show results                       │
│  └── AgentSidebar    - Multi-agent chat                     │
│                                                              │
│  Server Modules:                                             │
│  ├── coach.ts        - Objection handling                   │
│  ├── enrichment.ts   - Lead enrichment                      │
│  ├── routes.ts       - API endpoints                        │
│  └── storage.ts      - Data persistence                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Tailscale (optional)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Admiral-Server (192.168.1.23) - OPTIONAL                   │
├─────────────────────────────────────────────────────────────┤
│  Agent-Claude :4110  - Primary AI assistance                │
│  Scout        :????  - MLS property lookup                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Development

```bash
cd apps/compass
npm install
npm run dev  # http://localhost:3101
```

---

## Environment Variables

```bash
# Required
TWENTY_CRM_URL=http://localhost:3001
TWENTY_API_KEY=your_key

# Optional (for AI features)
VITE_BACKEND_HOST=100.66.42.81
VITE_COMPASS_AGENT_PORT=4098
```

---

## PWA Features

COMPASS is a Progressive Web App with:
- Offline support via service worker
- Installable on mobile devices
- IndexedDB caching for lead data
- Background sync for actions

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/objection` | POST | Handle customer objections |
| `/api/suggest-action` | POST | Get suggested next action |
| `/api/enrichment/enrich` | POST | Enrich lead with property data |

---

## Related Projects

- **Project 17:** COMPASS Micro-Agents (current work)
- **Project 16:** Admiral Chat (Phase 6 - COMPASS integration)

---

*Last Updated: December 29, 2025*
