# Postiz Integration for Studio

Social media scheduling backend for Studio Dashboard.

**URL:** https://postiz.ripemerchant.host
**Port:** 3200 (droplet)
**Status:** Installed Dec 30, 2025

---

## Accounts

| Email | Role | Status |
|-------|------|--------|
| davide@admiralenergy.ai | Admin | Registered |
| leighe@admiralenergy.ai | User | Invited (email not received) |

**Note:** Invitation emails require RESEND_API_KEY to be configured. Currently not set.

---

## API Access

### MCP Endpoint
```
https://postiz.ripemerchant.host/api/mcp/715db26d53696f1eb750df016ade9481c800efdfa1a30e546e0b95ea3651b806
```

### Public API (v1)
Base URL: `https://postiz.ripemerchant.host/api/public/v1`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/posts` | GET | List scheduled posts |
| `/posts` | POST | Create/schedule a post |
| `/posts/:id` | DELETE | Delete a post |
| `/integrations` | GET | List connected social accounts |
| `/is-connected` | GET | Check if account is connected |
| `/upload` | POST | Upload media file |
| `/upload-from-url` | POST | Upload media from URL |
| `/find-slot/:id` | GET | Find available time slot |

### Authentication
All API requests require Bearer token:
```
Authorization: Bearer <API_KEY>
```

---

## Docker Stack (Droplet)

| Container | Port | Image |
|-----------|------|-------|
| postiz | 3200 | ghcr.io/gitroomhq/postiz-app:latest |
| postiz-postgres | 5432 | postgres:17-alpine |
| postiz-redis | 6379 | redis:7.2-alpine |

**Location:** `/var/www/postiz/docker-compose.yml`

---

## Environment Variables

```env
# Core
DATABASE_URL=postgresql://postiz:***@postiz-postgres:5432/postiz
REDIS_URL=redis://postiz-redis:6379
JWT_SECRET=***

# URLs
MAIN_URL=https://postiz.ripemerchant.host
FRONTEND_URL=https://postiz.ripemerchant.host
NEXT_PUBLIC_BACKEND_URL=https://postiz.ripemerchant.host/api
BACKEND_INTERNAL_URL=http://localhost:3000

# Storage
STORAGE_PROVIDER=local
UPLOAD_DIRECTORY=/uploads

# Email (CONFIGURED)
RESEND_API_KEY=re_3LY48VG4_***  # Truncated
EMAIL_FROM_ADDRESS=noreply@admiralenergy.ai
EMAIL_FROM_NAME=Admiral Energy

# Social OAuth (TO BE CONFIGURED)
# TIKTOK_CLIENT_ID=
# TIKTOK_CLIENT_SECRET=
# LINKEDIN_CLIENT_ID=
# LINKEDIN_CLIENT_SECRET=
```

---

## Email Configuration

**Status:** CONFIGURED (Dec 30, 2025)

| Setting | Value |
|---------|-------|
| Provider | Resend |
| From Address | noreply@admiralenergy.ai |
| From Name | Admiral Energy |

Invite emails now work. Send invites from Postiz admin panel.

---

## Studio Integration Plan

### Phase 1: Direct Access (Current)
- Leigh uses Postiz UI directly at https://postiz.ripemerchant.host
- Connects TikTok/LinkedIn via OAuth in Postiz

### Phase 2: API Proxy
- Studio proxies `/api/postiz/*` to Postiz backend
- Studio calendar shows scheduled posts from Postiz API

### Phase 3: Native UI
- Studio builds custom scheduling UI
- Calls Postiz API for all operations
- Leigh never leaves Studio

---

## Social Platform Setup

### TikTok
1. Postiz has pre-approved TikTok app (they did the audit)
2. Connect via OAuth in Postiz settings
3. No Admiral Energy developer account needed

### LinkedIn
1. Connect personal + company page via OAuth
2. Postiz handles token refresh

---

## Useful Commands

```bash
# Check Postiz logs
ssh root@165.227.111.24 "docker logs postiz -f"

# Restart Postiz
ssh root@165.227.111.24 "cd /var/www/postiz && docker compose restart postiz"

# Check RAM usage
ssh root@165.227.111.24 "docker stats postiz postiz-postgres postiz-redis --no-stream"
```

---

## Related Files

- Project 14: `projects/active/14-studio-dashboard-redesign/README.md`
- Studio App: `apps/studio/`
- Droplet config: `/var/www/postiz/docker-compose.yml`

---

*Created: December 30, 2025*
