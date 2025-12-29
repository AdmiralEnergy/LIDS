# Admiral Chat

Native team chat system for LIDS with channels, DMs, and SMS inbox unification.

## Status: PHASE 4 COMPLETE - READY FOR TESTING

**Created:** December 29, 2025

---

## Overview

Admiral Chat enables real-time team communication across all LIDS apps. It provides:

- **Channels** - #general, #sales, #marketing, #sms-inbox
- **Direct Messages** - Private 1:1 conversations between team members
- **SMS Unification** - Inbound SMS appears in owner's chat inbox
- **Cadence Notifications** - n8n triggers appear as action items

---

## Architecture

Admiral Chat is implemented as a **shared package + centralized backend**:

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

## Code Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| **Shared Package** | `packages/admiral-chat/` | React components, hooks, types |
| **Backend API** | `apps/ads-dashboard/server/chat-routes.ts` | REST endpoints + in-memory storage |
| **ADS Integration** | `apps/ads-dashboard/client/src/pages/chat.tsx` | Chat page in sales dashboard |
| **Studio Integration** | `apps/studio/client/src/pages/team-chat.tsx` | Chat page in marketing dashboard |
| **Studio Proxy** | `apps/studio/server/routes.ts` | Forwards /api/chat/* to ADS |

---

## Package: @lids/admiral-chat

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

---

## API Endpoints

All endpoints are served from ADS Dashboard at `https://helm.ripemerchant.host/api/chat/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/channels` | GET | List channels for user |
| `/channels` | POST | Create channel/DM |
| `/channels/:id/messages` | GET | Get messages (paginated) |
| `/channels/:id/messages` | POST | Send message |
| `/channels/:id/read` | POST | Mark as read |
| `/poll` | GET | Poll for updates |
| `/members` | GET | Proxy to Twenty CRM |
| `/sms/inbound` | POST | Route SMS to chat |
| `/sequence/notification` | POST | n8n cadence notifications |
| `/debug/stats` | GET | Debug storage stats |

---

## Current Deployment Status

| App | Route | Status | Notes |
|-----|-------|--------|-------|
| **ADS Dashboard** | `/chat` | LIVE | Main chat + cadence viewer |
| **Studio** | `/team` | LIVE | Proxies to ADS backend |
| **Academy** | - | v2 | Training cohort channels |
| **COMPASS** | - | v2 | AI + team chat hybrid |

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Real-time | HTTP Polling (5s) | COMPASS pattern works, saves RAM |
| Storage | In-memory (MVP) | Get it live fast, migrate to DB later |
| Auth | Twenty CRM | Single login across all LIDS |
| Package | @lids/admiral-chat | Shared across all apps |
| Cross-app | Proxy to ADS | Single source of truth for messages |

---

## Usage in Apps

### Adding to a new LIDS app

1. Add dependency:
```json
{
  "dependencies": {
    "@lids/admiral-chat": "*"
  }
}
```

2. Add proxy to server (if not ADS):
```typescript
// server/routes.ts
const ADS_URL = process.env.ADS_DASHBOARD_URL || "http://localhost:3100";

app.use("/api/chat", async (req, res) => {
  const targetUrl = `${ADS_URL}/api/chat${req.url}`;
  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "x-workspace-member-id": req.headers["x-workspace-member-id"],
      "x-workspace-member-name": req.headers["x-workspace-member-name"],
    },
    body: ["POST", "PATCH", "PUT"].includes(req.method)
      ? JSON.stringify(req.body)
      : undefined,
  });
  const data = await response.json();
  res.status(response.status).json(data);
});
```

3. Add chat page:
```tsx
import { ChatWindow } from "@lids/admiral-chat/components";
import { useUser } from "@/lib/user-context";

export default function TeamChat() {
  const { currentUser } = useUser();

  if (!currentUser) {
    return <div>Please log in to access team chat.</div>;
  }

  return (
    <ChatWindow
      currentUserId={currentUser.id}
      showChannelList={true}
      defaultChannelSlug="general"
      className="h-full"
    />
  );
}
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

## Roadmap

### v1 (Current)
- [x] #general, #sales, #marketing channels
- [x] DMs between team members
- [x] Messages persist while server runs
- [x] Twenty CRM auth (no separate login)
- [x] Available in ADS Dashboard
- [x] Available in Studio (proxy)

### v2 (Planned)
- [ ] Academy cohort channels
- [ ] COMPASS AI + chat hybrid
- [ ] PostgreSQL persistent storage
- [ ] File attachments
- [ ] Browser notifications
- [ ] Unread counts

### v3 (Future)
- [ ] Voice calls (browser-to-browser via WebRTC/Twilio)
- [ ] Video calls (1:1)
- [ ] Group video (training sessions)
- [ ] Screen share
- [ ] Lead video meetings (no install required)

---

## Deployment Checklist

### Pre-Deployment

- [ ] Ensure ADS Dashboard server is running (has chat backend)
- [ ] Verify Twenty CRM is accessible at `http://localhost:3001`
- [ ] Check `ADS_DASHBOARD_URL` env var is set for apps that proxy

### Deploy to Droplet

```bash
# SSH to droplet
ssh root@165.227.111.24

# Pull latest code
cd /var/www/lids && git pull

# Rebuild ADS Dashboard (has chat backend)
cd apps/ads-dashboard && npm run build && pm2 restart lids

# Rebuild Studio (chat proxy)
cd ../studio && npm run build && pm2 restart studio

# Verify services are running
pm2 status
```

### Post-Deployment Verification

```bash
# Check chat API is responding
curl https://helm.ripemerchant.host/api/chat/debug/stats

# Check channels are seeded
curl https://helm.ripemerchant.host/api/chat/channels

# Check Studio proxy works
curl https://studio.ripemerchant.host/api/chat/channels
```

### Testing

1. **ADS Dashboard**: Visit `https://helm.ripemerchant.host/chat`
   - [ ] Login works
   - [ ] Channels display (#general, #sales, #marketing)
   - [ ] Can send messages
   - [ ] Messages persist (while server running)

2. **Studio**: Visit `https://studio.ripemerchant.host/team`
   - [ ] Login works
   - [ ] Channels display (proxied from ADS)
   - [ ] Can send messages
   - [ ] Messages appear in both ADS and Studio

3. **Cross-App Messaging**:
   - [ ] Send message from ADS → appears in Studio
   - [ ] Send message from Studio → appears in ADS

### Rollback

```bash
# If something goes wrong, rollback to previous commit
ssh root@165.227.111.24
cd /var/www/lids
git log --oneline -5  # Find previous working commit
git checkout <commit-hash>
cd apps/ads-dashboard && npm run build && pm2 restart lids
cd ../studio && npm run build && pm2 restart studio
```

---

## What Still Needs Testing

| Feature | Status | Notes |
|---------|--------|-------|
| Basic channels | NEEDS TESTING | #general, #sales, #marketing |
| Direct messages | NEEDS TESTING | DM creation and messaging |
| Cross-app messaging | NEEDS TESTING | ADS ↔ Studio |
| SMS inbox | NOT IMPLEMENTED | Phase 3 |
| Cadence notifications | NOT IMPLEMENTED | Phase 5, requires n8n |
| Unread counts | NOT IMPLEMENTED | Phase 2 |
| Offline support | PARTIAL | Dexie caching present, needs testing |

---

## Related Documentation

- [Project 16: Admiral Chat](../../projects/16-admiral-chat/README.md) - Full project details
- [ADMIRAL_CADENCE_PLAN.md](../../docs/Sales%20Framework/ADMIRAL_CADENCE_PLAN.md) - Cadence integration
- [ARCHITECTURE.md](../../docs/architecture/ARCHITECTURE.md) - System architecture

---

*Last Updated: December 29, 2025*
