# Project 10: Studio Consolidation & HELM Registry Fix

## Status: IN PROGRESS

**Started:** December 28, 2025
**Completed:** -

---

## Summary

Consolidate Studio Dashboard as the marketing-focused app, fix the authentication/routing so CMO users (Leigh) land on Studio instead of COMPASS, and sync production code to local repository.

## Problem

1. **HELM_USERS is outdated** - Hardcoded user list no longer used; Twenty CRM is the auth source
2. **CMO routing broken** - Leigh cannot access Studio Dashboard; gets redirected to standard login
3. **Code drift** - Production droplet has full Studio app (`apps/studio/`) not in local repo
4. **Dead code in ADS** - `studio.tsx` existed in ADS but was never routed (removed Dec 28)

## Solution

1. Fix auth flow: Twenty CRM → role detection → route CMO to Studio
2. Sync production Studio code to local repository
3. Clean up deprecated HELM_USERS references
4. Document proper domain routing

---

## Phases

| Phase | Feature | Priority | Status |
|-------|---------|----------|--------|
| 1 | Audit current auth flow | HIGH | ⏳ IN PROGRESS |
| 2 | Fix HELM registry / Twenty auth | HIGH | Pending |
| 3 | Add CMO → Studio routing logic | HIGH | Pending |
| 4 | Sync droplet Studio to local | MEDIUM | Pending |
| 5 | Test Leigh's access | HIGH | Pending |
| 6 | Clean up deprecated code | LOW | Pending |

---

## Files to Modify

### Droplet (`/var/www/lids/`)
| File | Changes |
|------|---------|
| `apps/compass/client/src/lib/user-context.tsx` | Remove HELM_USERS, add role-based routing |
| `apps/studio/client/src/lib/user-context.tsx` | Verify Twenty auth works |
| `apps/compass/client/src/App.tsx` | Add redirect logic for CMO role |

### Local (sync from droplet)
| File | Changes |
|------|---------|
| `apps/studio/` | Entire app needs syncing from production |

---

## Current Architecture (Droplet)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PM2 Processes on Droplet (165.227.111.24)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  lids (ADS Dashboard)   :5000   helm.ripemerchant.host                      │
│  compass                :3101   compass.ripemerchant.host                   │
│  studio                 :3103   studio.ripemerchant.host                    │
│  academy                :3102   academy.ripemerchant.host                   │
└─────────────────────────────────────────────────────────────────────────────┘

User Login Flow:
  1. User visits compass.ripemerchant.host
  2. COMPASS checks HELM_USERS (DEPRECATED) or Twenty CRM
  3. If CMO role detected → SHOULD redirect to studio.ripemerchant.host
  4. Currently: CMO users stuck or can't log in
```

---

## Success Criteria

- [ ] Leigh can log in via Twenty CRM email
- [ ] Leigh is automatically routed to Studio Dashboard
- [ ] Studio Dashboard shows marketing.tsx (Sarai + Muse chat)
- [ ] COMPASS remains accessible for sales reps
- [ ] Local repo matches production code

---

## Verification

```bash
# Test Leigh's login
1. Visit compass.ripemerchant.host
2. Enter leighe@ripemerchant.host
3. Should redirect to studio.ripemerchant.host

# Verify PM2 processes
ssh root@165.227.111.24 "pm2 list"

# Check Studio is accessible
curl -s https://studio.ripemerchant.host/api/health
```

---

## Rollback

If routing breaks:
```bash
# Revert user-context.tsx
ssh root@165.227.111.24 "cd /var/www/lids && git checkout HEAD~1 -- apps/compass/client/src/lib/user-context.tsx"
ssh root@165.227.111.24 "cd /var/www/lids/apps/compass && npm run build && pm2 restart compass"
```

---

*Created: December 28, 2025*
