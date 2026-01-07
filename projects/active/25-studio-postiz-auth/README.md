# Project 25: Studio Postiz Authentication

## Status: COMPLETE

**Created:** January 7, 2026
**Completed:** January 7, 2026
**Owner:** David Edwards

---

## Executive Summary

Replaced Studio's Twenty CRM authentication with Postiz-based authentication. David (owner) has SUPERADMIN access, and team members can access Studio via Postiz registration, with permanent user IDs (UUIDs) that survive email changes.

---

## Implementation Summary

### Approach: Direct PostgreSQL Connection (Option A)

Connected Studio backend directly to Postiz PostgreSQL database on Oracle ARM via Tailscale.

**Connection String:**
```
postgresql://postiz:***@100.125.221.62:5432/postiz
```

---

## Completed Tasks

### Phase 1: Infrastructure Setup
- [x] Exposed PostgreSQL port 5432 on Oracle ARM docker-compose
- [x] Set David's `isSuperAdmin` flag in Postiz database
- [x] Added `pg` dependency to Studio package.json

### Phase 2: Backend Auth Endpoints
- [x] Created `/api/postiz/auth` endpoint (find user by email)
- [x] Created `/api/postiz/validate` endpoint (validate stored user ID)
- [x] Created `/api/postiz/auth-status` endpoint (connection check)
- [x] Removed Twenty auth proxy (no longer needed)

### Phase 3: Frontend Auth
- [x] Created `postiz-user-context.tsx` (new provider)
- [x] Updated `App.tsx` to use `PostizUserProvider`
- [x] Updated `MarketingLoginScreen.tsx` for Postiz

### Phase 4: Environment Setup
- [x] Created `.env` with POSTIZ_DB_URL
- [x] Created `.env.example` for documentation

### Phase 5: Testing
- [x] Tested auth endpoint with David's email → SUPERADMIN ✓
- [x] Tested validate endpoint with UUID → valid ✓
- [x] Tested auth-status endpoint → connected ✓
- [x] Tested invalid email → proper error message ✓

---

## Files Modified/Created

| File | Action | Purpose |
|------|--------|---------|
| `apps/studio/server/routes.ts` | Modified | Added Postiz auth endpoints, removed Twenty auth |
| `apps/studio/client/src/lib/postiz-user-context.tsx` | Created | New auth provider for Postiz |
| `apps/studio/client/src/App.tsx` | Modified | Switched to PostizUserProvider |
| `apps/studio/client/src/components/MarketingLoginScreen.tsx` | Modified | Updated import and error message |
| `apps/studio/.env` | Created | Postiz DB credentials |
| `apps/studio/.env.example` | Created | Documentation template |

---

## User Access Matrix

| User | Email | Postiz Role | Studio Access | Status |
|------|-------|-------------|---------------|--------|
| David | davide@admiralenergy.ai | SUPERADMIN | Full | Active |
| Leigh | leighe@ripemerchant.host | ADMIN | Standard | Pending (needs to accept Postiz invite) |

---

## Key Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  STUDIO Frontend (React)                                    │
│  └── PostizUserProvider                                     │
│      ├── loginByEmail(email) → POST /api/postiz/auth        │
│      ├── validate on load → POST /api/postiz/validate       │
│      └── Stores postizUserId in localStorage (permanent)    │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    (HTTP requests)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STUDIO Backend (Express.js:3103)                           │
│  └── /api/postiz/* endpoints                                │
│      └── Direct PostgreSQL queries to Postiz DB             │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    (pg connection via Tailscale)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  POSTIZ PostgreSQL (Oracle ARM:5432)                        │
│  └── User, Organization, UserOrganization tables            │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Notes

### Local Development
```bash
cd apps/studio
npm run dev
# Uses .env with POSTIZ_DB_URL
```

### Production (Droplet)
Need to add to `/var/www/lids/apps/studio/.env`:
```env
POSTIZ_DB_URL=postgresql://postiz:postiz_secure_2025@100.125.221.62:5432/postiz
```

Then restart:
```bash
ssh root@100.94.207.1 "cd /var/www/lids && git pull && pm2 restart studio"
```

---

## Security Notes

1. **Database credentials** - Stored in .env (gitignored)
2. **Tailscale-only** - PostgreSQL only reachable via Tailscale IPs
3. **User validation** - Checks `activated = true` before login
4. **Session validation** - Stored UUID validated on each app load
5. **Access revocation** - Remove user from Postiz = immediate Studio lockout

---

## Rollback Plan

If needed, revert to Twenty auth:
1. In `App.tsx`: Change `PostizUserProvider` to `UserProvider`, import from `user-context`
2. In `MarketingLoginScreen.tsx`: Import from `user-context`
3. The old `user-context.tsx` is still present (not deleted)

---

*Completed: January 7, 2026*
