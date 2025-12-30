# Project 16: Admiral Chat

## Status: PHASE 4 COMPLETE - READY FOR TESTING

**Started:** December 29, 2025
**Phase 1 Completed:** December 29, 2025

---

## Summary

Build a native team chat system for LIDS that enables channels (#general, #sales) and direct messages, with SMS inbox unification for owners. Admiral Chat is the **communication layer** and **cadence viewer** while **n8n handles sequencing automation**.

---

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | MVP - Channels + DMs | COMPLETE |
| Phase 2 | Polish - Unread, offline, notifications | PENDING |
| Phase 3 | SMS Unification - Owner inbox | PENDING |
| Phase 4 | Cross-App Deployment (ADS, Studio) | COMPLETE |
| Phase 5 | Cadence Integration (n8n) | PENDING |

### v2 Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 6 | Academy Integration - Training chat | PLANNED |
| Phase 7 | COMPASS Integration - AI + team hybrid | PLANNED |
| Phase 8 | Persistent Storage - PostgreSQL migration | PLANNED |

### v3 Roadmap (Future)

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 9 | Voice Calls - Browser-to-browser via WebRTC | PLANNED |
| Phase 10 | Video Calls - 1:1 and group video | PLANNED |
| Phase 11 | Screen Share - For training and demos | PLANNED |
| Phase 12 | Lead Video Calls - Customer-facing video meetings | PLANNED |

---

## Current Deployment Status

| App | Chat Route | Status | Notes |
|-----|------------|--------|-------|
| **ADS Dashboard** | `/chat` | LIVE | Main chat + cadence viewer |
| **Studio** | `/team` | LIVE | Proxies to ADS backend |
| **Academy** | - | v2 | Training cohort channels |
| **COMPASS** | - | v2 | AI + team chat hybrid |

---

## What Was Built

### Package: @lids/admiral-chat

```
packages/admiral-chat/
├── package.json           # @lids/admiral-chat
├── src/
│   ├── index.ts           # Main barrel export
│   ├── db.ts              # Dexie client schema
│   ├── types/index.ts     # TypeScript interfaces
│   ├── components/
│   │   ├── index.ts       # Component exports
│   │   ├── ChatProvider.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── ChannelList.tsx
│   │   ├── ChannelHeader.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageBubble.tsx
│   │   └── NewDMModal.tsx
│   ├── hooks/
│   │   ├── index.ts       # Hook exports
│   │   ├── useChat.ts     # Main combined hook
│   │   ├── useChannels.ts
│   │   ├── useMessages.ts
│   │   └── usePoll.ts
│   └── services/
│       └── chatApi.ts     # API client
```

### Server: In-Memory Storage (MVP)

- `apps/ads-dashboard/server/chat-routes.ts` - Full API implementation
- Auto-seeds default channels: #general, #sales, #marketing, #sms-inbox
- Endpoints for SMS inbound and n8n sequence notifications

### ADS Integration

- `apps/ads-dashboard/client/src/pages/chat.tsx` - Chat page
- Menu item: "Team Chat"
- Route: `/chat`

### Studio Integration

- `apps/studio/client/src/pages/team-chat.tsx` - Chat page
- `apps/studio/server/routes.ts` - Chat API proxy to ADS
- Nav item: "Team"
- Route: `/team`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LIDS PLATFORM                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    ADS      │  │   STUDIO    │  │   ACADEMY   │  │   COMPASS   │        │
│  │   /chat     │  │   /team     │  │   (v2)      │  │   (v2)      │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         │         ┌──────┴──────┐        │                │                │
│         │         │   PROXY     │        │                │                │
│         │         └──────┬──────┘        │                │                │
│         └────────────────┴───────────────┴────────────────┘                │
│                                    │                                         │
│                    ┌───────────────┴───────────────┐                        │
│                    │      @lids/admiral-chat       │                        │
│                    │      (Shared Package)         │                        │
│                    └───────────────┬───────────────┘                        │
│                                    │                                         │
│                    ┌───────────────┴───────────────┐                        │
│                    │   ADS Dashboard Backend       │                        │
│                    │   (Central Chat Storage)      │                        │
│                    └───────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Real-time | HTTP Polling (5s) | COMPASS pattern works, saves RAM |
| Storage | In-memory (MVP) | Get it live fast, migrate to DB later |
| Auth | Twenty CRM | Single login across all LIDS |
| Package | @lids/admiral-chat | Shared across all apps |
| Cross-app | Proxy to ADS | Single source of truth for messages |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat/channels` | GET | List channels for user |
| `/api/chat/channels` | POST | Create channel/DM |
| `/api/chat/channels/:id/messages` | GET | Get messages (paginated) |
| `/api/chat/channels/:id/messages` | POST | Send message |
| `/api/chat/channels/:id/read` | POST | Mark as read |
| `/api/chat/poll` | GET | Poll for updates |
| `/api/chat/members` | GET | Proxy to Twenty CRM |
| `/api/chat/sms/inbound` | POST | Route SMS to chat |
| `/api/chat/sequence/notification` | POST | n8n cadence notifications |
| `/api/chat/debug/stats` | GET | Debug storage stats |

---

## Cadence Viewer Feature

Admiral Chat serves as the **cadence viewer** - showing n8n-triggered sequence notifications.

Reference: `docs/Sales Framework/ADMIRAL_CADENCE_PLAN.md`

```
n8n Workflow (Sequencing Engine)
    ├── Day 0: Email 1 → Email service
    ├── Day 2: Call reminder → Admiral Chat notification
    ├── Day 8: SMS → Admiral Chat (via Twilio)
    └── Day 9: Break-up call reminder → Admiral Chat
```

### n8n Integration Endpoint

```bash
# Post cadence notification to chat
curl -X POST http://localhost:3100/api/chat/sequence/notification \
  -H "Content-Type: application/json" \
  -d '{
    "type": "call_due",
    "leadId": "abc123",
    "leadName": "John Smith",
    "sequenceDay": 6,
    "dueAction": "Power Hour Call"
  }'
```

---

## v2: Academy Integration Plan

### Use Case
RedHawk Academy training cohorts need dedicated chat channels:
- `#cohort-jan-2026` - Specific training class
- `#training-questions` - General Q&A
- `#certifications` - Exam discussion

### Features
- **Cohort Channels** - Auto-created per training class
- **Instructor DMs** - Direct message trainers
- **Progress Sharing** - Share certification achievements
- **Study Groups** - Private channels for study partners

### Technical Approach
```
Academy App
    │
    ├── /api/chat/* → Proxy to ADS (like Studio)
    │
    └── New channel types:
        ├── 'cohort' - Training class channel
        └── 'study-group' - Student-created private
```

---

## v3: Voice & Video Calls Plan

### Vision
Bring real-time voice and video into Admiral Chat - for both internal team calls AND customer-facing lead meetings.

### Comparison: Build vs. Integrate

| Option | Pros | Cons |
|--------|------|------|
| **WebRTC (Build)** | Full control, no dependencies | Complex, TURN servers needed |
| **Twilio Video** | Already have Twilio, proven | $0.004/min per participant |
| **Daily.co** | Simple API, good free tier | Another vendor |
| **Jitsi** | Self-hosted, free | Requires server resources |

### Recommended: Twilio Video + WebRTC

We already use Twilio for calling. Twilio Video extends this:
- 1:1 video calls built-in
- Group rooms up to 50 participants
- Screen sharing
- Recording (for training)

### Feature Roadmap

#### Phase 9: Browser-to-Browser Voice
```
Rep A (ADS)  ←──WebRTC──→  Rep B (ADS)
              via Twilio
```
- Click user → "Start Call"
- Uses existing Twilio account
- In-chat call controls

#### Phase 10: 1:1 Video Calls
```
Leigh (Studio)  ←──Video──→  David (ADS)
                   ↓
            Screen Share
```
- Video toggle on voice calls
- Picture-in-picture support
- Works on mobile (Surface Pro for Leigh)

#### Phase 11: Group Video / Screen Share
```
┌─────────────────────────────────┐
│  Training Session               │
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ 👤  │ │ 👤  │ │ 👤  │ ...   │
│  └─────┘ └─────┘ └─────┘       │
│  ┌─────────────────────┐       │
│  │   SCREEN SHARE      │       │
│  │   (Trainer's CRM)   │       │
│  └─────────────────────┘       │
└─────────────────────────────────┘
```
- Up to 10 participants (training use case)
- Screen share for demos
- Chat sidebar during call

#### Phase 12: Lead Video Calls
```
Rep (ADS)  ←──Video──→  Lead (Browser Link)
              ↓
        No app required
        Just click link
```
- Generate meeting link from lead card
- Lead joins via browser (no install)
- Record for QA/training
- Integrates with Twenty CRM activity

### Technical Architecture (v3)

```
┌─────────────────────────────────────────────────────────────────┐
│  Admiral Chat v3                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Text Chat   │    │  Voice Call  │    │  Video Call  │      │
│  │  (Current)   │    │  (Phase 9)   │    │  (Phase 10+) │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └───────────────────┴───────────────────┘               │
│                             │                                    │
│              ┌──────────────┴──────────────┐                    │
│              │   Twilio Programmable Video  │                    │
│              │   + WebRTC                   │                    │
│              └──────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### New Components (Future)

```
packages/admiral-chat/src/components/
├── ... (existing)
├── CallButton.tsx         # Initiate voice call
├── VideoCallModal.tsx     # Video call interface
├── CallControls.tsx       # Mute, video, share, end
├── ParticipantGrid.tsx    # Multi-participant view
├── ScreenShareView.tsx    # Screen share display
└── MeetingLinkGenerator.tsx # For lead video calls
```

### New Hooks (Future)

```
packages/admiral-chat/src/hooks/
├── ... (existing)
├── useVoiceCall.ts        # Twilio Voice SDK
├── useVideoCall.ts        # Twilio Video SDK
├── useScreenShare.ts      # Screen capture API
└── useMeetingRoom.ts      # Room management
```

---

## Testing

```bash
# Start ADS Dashboard (has chat backend)
cd apps/ads-dashboard
npm run dev

# Start Studio (proxies to ADS)
cd apps/studio
npm run dev

# Check chat stats
curl http://localhost:3100/api/chat/debug/stats

# List channels
curl http://localhost:3100/api/chat/channels

# Send test message
curl -X POST http://localhost:3100/api/chat/channels/ch-general/messages \
  -H "Content-Type: application/json" \
  -H "x-workspace-member-id: test-user" \
  -H "x-workspace-member-name: Test User" \
  -d '{"content": "Hello team!"}'
```

---

## Environment Variables

### ADS Dashboard
```env
TWENTY_CRM_URL=http://localhost:3001
TWENTY_API_KEY=your-key
```

### Studio (for proxy)
```env
ADS_DASHBOARD_URL=http://localhost:3100
```

### Production (Droplet)
```env
ADS_DASHBOARD_URL=https://helm.ripemerchant.host
```

---

## Success Criteria

### v1 (Current)
- [x] #general, #sales, #marketing channels work
- [x] DMs between team members work
- [x] Messages persist while server runs
- [x] Twenty CRM auth (no separate login)
- [x] Available in ADS
- [x] Available in Studio (proxy)

### v2 (Planned)
- [ ] Academy cohort channels
- [ ] COMPASS AI + chat hybrid
- [ ] PostgreSQL persistent storage
- [ ] File attachments
- [ ] Browser notifications

### v3 (Future)
- [ ] Voice calls (browser-to-browser)
- [ ] Video calls (1:1)
- [ ] Group video (training)
- [ ] Screen share
- [ ] Lead video meetings

---

*Last Updated: December 29, 2025 - Phase 4 COMPLETE, Ready for Testing*
