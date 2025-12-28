# Studio - Marketing Command Center

**Admiral Energy Marketing Suite**

Live at: https://studio.ripemerchant.host

---

## Overview

Studio is the marketing dashboard for Admiral Energy, providing access to AI content creation agents (Sarai & Muse) and quick publishing tools for social media platforms.

## Target Users

| User | Email | Role |
|------|-------|------|
| Leigh Edwards | leighe@ripemerchant.host | CMO - Primary user |
| David Edwards | davide@admiralenergy.ai | Owner - Full access |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  studio.ripemerchant.host                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Cloudflare (DNS + Proxy)                                                  │
│         │                                                                    │
│         ▼                                                                    │
│   Nginx (port 443) ──────► localhost:3103 (Studio App)                      │
│                                   │                                          │
│                                   ├── /api/twenty/auth → Twenty CRM :3001   │
│                                   ├── /api/sarai/chat → admiral-server:4065 │
│                                   └── /api/muse/chat → admiral-server:4066  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Port Reference

| Service | Port | Location |
|---------|------|----------|
| Studio App | 3103 | Droplet (PM2) |
| Twenty CRM | 3001 | Droplet (Docker) |
| Sarai Agent | 4065 | admiral-server |
| Muse Agent | 4066 | admiral-server |

---

## Authentication

### Flow

```
User visits studio.ripemerchant.host
         │
         ▼
┌─────────────────────────────┐
│  Login Screen               │
│  - Enter work email         │
│  - Click "Enter STUDIO"     │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  POST /api/twenty/auth      │
│  - Validates email against  │
│    Twenty workspaceMembers  │
└─────────────────────────────┘
         │
    ┌────┴────┐
    │         │
  Found    Not Found
    │         │
    ▼         ▼
┌────────┐  ┌─────────────────┐
│ Login  │  │ "Email not      │
│ Success│  │  found" error   │
└────────┘  └─────────────────┘
```

### Implementation

**Server:** `server/routes.ts`
```typescript
app.post("/api/twenty/auth", async (req, res) => {
  const TWENTY_URL = process.env.TWENTY_CRM_URL || "http://localhost:3001";
  const TWENTY_KEY = process.env.TWENTY_API_KEY;

  // Fetch workspaceMembers from Twenty CRM
  const response = await fetch(`${TWENTY_URL}/rest/workspaceMembers`, {
    headers: { "Authorization": `Bearer ${TWENTY_KEY}` },
  });

  // Find member by email (Twenty uses 'userEmail' field)
  const member = members.find(m => m.userEmail?.toLowerCase() === email.toLowerCase());

  if (member) {
    return res.json({ success: true, user: { id, name, email } });
  }
  return res.status(404).json({ error: "User not found" });
});
```

**Client:** `client/src/lib/user-context.tsx`
```typescript
function inferRole(email: string): "owner" | "coo" | "cmo" | "rep" {
  if (email === "davide@admiralenergy.ai") return "owner";
  if (email === "nathanielj@admiralenergy.ai") return "coo";
  if (email === "leighe@ripemerchant.host") return "cmo";
  return "rep";
}
```

---

## Features

### 1. Marketing Dashboard (`/marketing`)

- **Sarai** - Content Creator agent
  - Generates LinkedIn posts, TikTok captions, Google Business updates
  - Real-time chat interface
  - Copy-to-clipboard for generated content

- **Muse** - Strategy Planner agent
  - Campaign planning and strategy
  - Content calendar suggestions
  - Marketing insights

### 2. Quick Post

Direct links to Admiral Energy social accounts:
- LinkedIn Company Page
- TikTok Account
- Google Business Profile

### 3. Content Ideas

Pre-built prompts for solar marketing:
- Holiday Solar Savings
- Year-End Tax Credits
- 2025 Energy Goals
- Customer Success Story
- And more...

---

## Deployment

### Droplet Configuration

**Nginx:** `/etc/nginx/sites-enabled/studio`
```nginx
server {
    listen 443 ssl;
    server_name studio.ripemerchant.host;

    ssl_certificate /etc/ssl/cloudflare/origin.crt;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;

    location / {
        proxy_pass http://localhost:3103;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

**PM2 Process:**
```bash
# Must use --cwd flag so dotenv can find .env file
pm2 start dist/index.cjs --name studio --cwd /var/www/lids/apps/studio
pm2 save
```

**Environment:** `.env`
```env
PORT=3103
BACKEND_HOST=100.66.42.81
TWENTY_CRM_URL=http://localhost:3001
TWENTY_API_KEY=<jwt_token>
```

### Cloudflare DNS

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | studio | 165.227.111.24 | ON |

---

## Development

```bash
# Local development
cd apps/studio
npm run dev
# → http://localhost:3103

# Build for production
npm run build
# → dist/index.cjs + dist/public/

# Deploy to droplet
ssh root@165.227.111.24 "cd /var/www/lids/apps/studio && git pull && npm run build && pm2 restart studio"
```

---

## File Structure

```
apps/studio/
├── client/
│   └── src/
│       ├── components/
│       │   └── ui/           # shadcn/ui components
│       ├── lib/
│       │   └── user-context.tsx  # Auth context + inferRole()
│       └── pages/
│           ├── home.tsx          # Login screen
│           ├── marketing.tsx     # Main dashboard with Sarai/Muse
│           ├── livewire.tsx      # LiveWire leads (owner only)
│           └── CommandsPage.tsx  # Agent commands
├── server/
│   ├── index.ts              # Express server entry
│   ├── routes.ts             # API routes including /api/twenty/auth
│   └── agent-responses.ts    # Mock agent responses
├── .env                      # Environment variables (on droplet)
└── package.json
```

---

## Troubleshooting

### "Twenty CRM not configured"

**Cause:** Missing `.env` file or PM2 cwd is wrong.

**Fix:**
```bash
# Check PM2 cwd
pm2 show studio | grep cwd

# Should be: /var/www/lids/apps/studio
# If it's /root, fix with:
pm2 delete studio
cd /var/www/lids/apps/studio
pm2 start dist/index.cjs --name studio --cwd /var/www/lids/apps/studio
pm2 save
```

### "Email not found"

**Cause:** User not in Twenty workspace.

**Fix:**
1. Go to https://twenty.ripemerchant.host
2. Settings → Members → Invite
3. Add user's email
4. User accepts invite
5. Can now log into Studio

### Agents not responding

**Cause:** admiral-server not reachable.

**Check:**
```bash
# From droplet
curl http://100.66.42.81:4065/health
curl http://100.66.42.81:4066/health
```

---

*Last Updated: December 28, 2025*
