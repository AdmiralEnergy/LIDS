# Project 9: Studio Dashboard Launch

## Status: COMPLETE

**Started:** December 28, 2025
**Completed:** December 28, 2025

---

## Summary

Launched Studio Marketing Dashboard as a standalone app at `studio.ripemerchant.host` with Twenty CRM authentication.

---

## What Was Done

### 1. Cloudflare DNS Setup
- Added A record: `studio` → `165.227.111.24` (proxied)

### 2. Droplet Configuration
- Nginx config already existed at `/etc/nginx/sites-enabled/studio`
- Created `.env` file with Twenty API credentials
- Fixed PM2 process to use correct working directory (`--cwd`)

### 3. Removed Studio from ADS
- Removed `/studio` path from nginx lids config
- Rebuilt ADS dashboard
- Studio no longer embedded in ADS

### 4. Authentication Fixed
- **Issue:** "Twenty CRM not configured" error
- **Root Cause:** PM2 cwd was `/root`, dotenv couldn't find `.env`
- **Fix:** Recreated PM2 process with `--cwd /var/www/lids/apps/studio`

---

## Final Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Production Domains                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  helm.ripemerchant.host     → ADS Dashboard (sales)         :5000           │
│  studio.ripemerchant.host   → Studio Dashboard (marketing)  :3103           │
│  compass.ripemerchant.host  → COMPASS PWA (AI agents)       :3101           │
│  academy.ripemerchant.host  → RedHawk Academy (training)    :3102           │
│  twenty.ripemerchant.host   → Twenty CRM                    :3001           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Verification

```bash
# Test auth endpoint
curl -X POST https://studio.ripemerchant.host/api/twenty/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"leighe@ripemerchant.host"}'

# Response:
# {"success":true,"user":{"id":"d260b737...","name":"Leigh Edwards","email":"leighe@ripemerchant.host"}}
```

---

## Key Files

| Location | Purpose |
|----------|---------|
| `/etc/nginx/sites-enabled/studio` | Nginx reverse proxy config |
| `/var/www/lids/apps/studio/.env` | Environment variables |
| `/var/www/lids/apps/studio/dist/index.cjs` | Built server |
| `apps/studio/README.md` | Full documentation |

---

## PM2 Configuration

```bash
# Correct way to start Studio (cwd is critical)
pm2 delete studio
cd /var/www/lids/apps/studio
pm2 start dist/index.cjs --name studio --cwd /var/www/lids/apps/studio
pm2 save
```

---

## User Access

| User | Email | Can Access |
|------|-------|------------|
| Leigh Edwards | leighe@ripemerchant.host | YES (CMO) |
| David Edwards | davide@admiralenergy.ai | YES (Owner) |
| Sales Reps | *@admiralenergy.ai | YES (if in Twenty) |
| Unknown emails | | NO (rejected) |

---

## Lessons Learned

1. **PM2 cwd matters** - When app uses `dotenv/config`, PM2 must have correct working directory
2. **Test auth locally first** - `curl localhost:3103/api/twenty/auth` before blaming DNS
3. **Check env vars** - "Not configured" usually means missing env, not code bug

---

*Created: December 28, 2025*
*Completed: December 28, 2025*
