# LIDS Monorepo - Service Architecture

**Version:** 2.0 | **Updated:** December 25, 2025

---

## Overview

LIDS runs on the DO Droplet. Core functionality works standalone; admiral-server provides optional AI/voice enhancements.



---

## Key Architecture Decisions

### Twenty CRM Location

**Twenty CRM runs ONLY on the DO Droplet.** No admiral-server instance.

| Property | Value |
|----------|-------|
| Host | localhost:3001 (on droplet) |
| External URL | https://twenty.ripemerchant.host |
| Docker containers | twenty-server, twenty-db, twenty-redis |

### Standalone Operation

LIDS Dashboard works with ONLY the droplet:

| Feature | Standalone? | Notes |
|---------|------------|-------|
| Lead management | Yes | Twenty CRM on droplet |
| Native phone calls | Yes | Uses tel: links with timer tracking |
| Call disposition | Yes | Auto-disposition logs to Twenty CRM |
| XP/Progression | Yes | IndexedDB local |
| Lead filtering/sorting | Yes | Client-side ICP sorting |
| Multi-phone display | Yes | Shows all 12 PropStream fields |
| SMS (toll-free) | Yes* | Via twilio-service, messages persist locally |
| Browser calling | No | Requires Twilio Service |
| Live transcription | No | Requires Voice Service |

*SMS requires admiral-server for send, but messages persist in IndexedDB

---

## Service Inventory

### DO Droplet (165.227.111.24)

| Service | Port | Type | Role |
|---------|------|------|------|
| lids | 5000 | Node.js | Sales dashboard |
| studio | 3100 | Node.js | Marketing dashboard |
| compass | 3101 | Node.js | AI chat PWA |
| redhawk | 3102 | Node.js | Training academy |
| twenty-server | 3001 | Docker | Auth + CRM (SSOT) |
| postiz | 3200 | Docker | Social scheduling (Phase 4) |
| twenty-db | - | Docker PostgreSQL | - |
| twenty-redis | - | Docker Redis | - |

**Headless Backend Pattern:**
- Twenty is to ADS what Postiz is to Studio
- User-facing dashboards proxy to headless services
- Leigh never sees Postiz UI directly

### admiral-server (192.168.1.23) - OPTIONAL

| Service | Port | Purpose |
|---------|------|---------|
| twilio-service | 4115 | Browser Twilio calling |
| voice-service | 4130 | STT + TTS |
| transcription-service | 4097 | Live transcription |
| agent-claude | 4110 | Primary MCP server |

---

## Environment Configuration

### LIDS (.env) - Minimal Required

```bash
NODE_ENV=production
PORT=5000
TWENTY_CRM_URL=http://localhost:3001
TWENTY_API_KEY=your_api_key_here
```

### With Optional Backend Services

```bash
VOICE_SERVICE_URL=http://100.66.42.81:4130
TWILIO_SERVICE_URL=http://100.66.42.81:4115
```

---

## Authentication Architecture

**Twenty CRM is the single source of truth for authentication across all LIDS apps.**

See [AUTH.md](./AUTH.md) for full documentation.

### Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. User visits https://helm.ripemerchant.host (or any LIDS app)│
│  2. App checks localStorage for workspaceMemberId               │
│  3. If not found → show login screen                            │
│  4. User enters email                                           │
│  5. App queries: GET /rest/workspaceMembers                     │
│  6. Find member by email → extract workspaceMemberId            │
│  7. Store workspaceMemberId in localStorage                     │
│  8. User is logged in                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Session Persistence

| Key | Purpose |
|-----|---------|
| `twentyWorkspaceMemberId` | Permanent user identifier |
| `twentyUserEmail` | Display only |
| `twentyUserName` | Display only |

### Access Control

| Action | How |
|--------|-----|
| Grant access | Invite to Twenty workspace |
| Revoke access | Remove from Twenty workspace |
| User sees login | workspaceMemberId not found in Twenty |

### Key Code Locations

| File | Purpose |
|------|---------|
| `client/src/contexts/user-context.tsx` | User state management |
| `client/src/components/LoginScreen.tsx` | Login UI |
| `client/src/lib/twentySync.ts` | Progression sync with user ID |

---

## Failure Modes

### admiral-server Down (Graceful Degradation)

When admiral-server is unreachable:
1. Dialer switches to tel: links (native phone)
2. No live transcription (manual notes)
3. CRM and XP system continue working

---

## Dialer Component Architecture

The mobile-first dialer uses a component hierarchy optimized for sales rep workflow:

```
MobileDialer.tsx              ← Main container, state management
├── CompactHUD.tsx            ← XP bar, rank, streak, caller ID, phone mode toggle
├── PhoneHomeScreen.tsx       ← Home screen with calendar, contacts, apps
├── LeadCardStack.tsx         ← Swipeable card stack with framer-motion
│   └── LeadCard.tsx          ← Individual lead with multi-phone support
├── CallControls.tsx          ← Dial/mute/hangup buttons
├── MobileDispositionPanel.tsx ← Post-call disposition
├── ActionPanel.tsx           ← SMS drawer with message history
├── LeadProfile.tsx           ← Full lead view (notes, call history, all phones)
├── EmailComposer.tsx         ← Email composition with templates
└── SkippedLeadsPanel         ← Inline panel for restoring skipped leads
```

### Key Features

| Feature | Implementation |
|---------|---------------|
| Lead filtering | Only leads WITH phone numbers shown |
| ICP sorting | Highest score first (descending) |
| Multi-phone | All 12 fields: cell1-4, landline1-4, phone1-2 |
| Phone type detection | Cell phones show SMS button, landlines don't |
| ICP badges | Color-coded: green (80+), gold (60+), orange (40+) |
| TCPA warnings | DNC/DANGEROUS status shown as red badge |
| Caller ID | CompactHUD shows outbound number or "Using Device" |
| Phone mode toggle | Switch between Twilio (browser) and Device (native) |
| Skipped leads | Track swiped leads, restore from panel |
| Lead profile | Tabbed view with Info, Notes, Call History |
| SMS persistence | Messages stored in Dexie, survive refresh |
| Email composer | Template-based email with send capability |
| Phone home screen | Calendar, contacts grid, app shortcuts |

### Data Flow

```
Twenty CRM (GraphQL)
    ↓
dialer.tsx (fetch leads)
    ↓
Filter: hasPhone() check on 12 fields
    ↓
Sort: by icpScore descending
    ↓
MobileDialer (cardLeads prop)
    ↓
LeadCardStack → LeadCard (expanded view with all phones)
```

---

## SMS Architecture

### Configuration

| Setting | Value |
|---------|-------|
| Default Number | +1 (833) 385-6399 (toll-free) |
| Send Endpoint | `/twilio-api/sms/send` → twilio-service:4115 |
| Inbound Webhook | `POST /api/ads/dialer/sms/inbound` |
| Status Webhook | `POST /api/ads/dialer/sms/status` |
| Persistence | Dexie smsMessages table (IndexedDB) |

### Send Flow

```
Client (useSms.ts)
    ↓ POST /twilio-api/sms/send
LIDS Server (Express proxy)
    ↓
twilio-service:4115 (admiral-server)
    ↓
Twilio API
    ↓
Recipient Phone
```

### Receive Flow

```
Customer replies to toll-free
    ↓
Twilio Webhook
    ↓ POST /api/ads/dialer/sms/inbound
LIDS Server (routes.ts) → In-memory store
    ↓
Client polls every 10 seconds
    ↓
Sync new messages to Dexie
    ↓
ActionPanel displays with chat UI
```

### Twilio Console Configuration

To receive inbound SMS, configure toll-free number webhook:
- **A message comes in:** `POST https://lids.ripemerchant.host/api/ads/dialer/sms/inbound`

See [Twilio Configuration](./Twilio/twilio.md) for full details.

---

## Studio Dashboard Architecture

Studio is the marketing dashboard for Leigh (CMO). Uses Twenty CRM as single source of truth.

### Twenty CRM Custom Objects

| Object | ID | Purpose |
|--------|-----|---------|
| `studioContentItem` | `59076336-a524-410f-ac85-9c7ba5858c84` | Content pieces to create/post |
| `studioWeeklyPlan` | `a95fc0e3-6685-45cf-ba4d-2ccf4a72dfd4` | MUSE weekly suggestions |
| `marketingProgression` | `c55ddb2b-d734-4a1e-bcdd-bce928314c41` | Marketing XP, ranks, badges |

### Studio API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/content` | GET/POST | List/create content items |
| `/api/content/:id` | GET/PATCH/DELETE | Single content operations |
| `/api/weekly-plans` | GET/POST | Weekly plan management |
| `/api/progression` | GET | Get user's marketing progression |
| `/api/progression/:id` | PATCH | Update progression |
| `/api/progression/add-xp` | POST | Add XP with auto-level calculation |
| `/api/muse/chat` | POST | Proxy to MUSE agent (4066) |
| `/api/sarai/chat` | POST | Proxy to Sarai agent (4065) |

### Studio Data Flow

```
Twenty CRM (SSOT - Persistent)
    │
    ├── studioContentItems
    ├── studioWeeklyPlans
    └── marketingProgressions
    │
    ▼
Studio Server (Express proxy)
    │
    ▼
Dexie (IndexedDB - Local cache for offline)
```

---

## Related Documentation

- DEPLOYMENT_CHECKLIST.md - Deployment guide
- TROUBLESHOOTING.md - Common issues
- ../../CLAUDE.md - Development guidelines
- ../../projects/5/PROJECT.md - Phase 5 implementation details
- ../../projects/14-studio-dashboard-redesign/README.md - Studio redesign project

---

*Last Updated: December 29, 2025*
