# Project 11: COMPASS Auth Unification

## Status: IN PROGRESS

**Started:** December 28, 2025
**Completed:** -

---

## Summary

Update COMPASS app to use Twenty CRM as the central auth layer, replacing the deprecated HELM_USERS array. Users will authenticate via Twenty login redirect, and the app will use `inferRole()` for role-based features.

## Problem

1. **HELM_USERS is hardcoded** - Only 6 users in the array, Leigh (CMO) not included
2. **No Twenty auth** - COMPASS doesn't use `/api/twenty/auth` endpoint like Studio does
3. **Login screen uses dropdown** - Can only select from HELM_USERS, no email input
4. **No unauthenticated redirect** - Users see login screen instead of redirecting to Twenty

## Solution

1. Add `/api/twenty/auth` endpoint to COMPASS server (copy from Studio)
2. Replace HELM_USERS with `fetchTwentyUser()` + `inferRole()`
3. Add redirect to twenty.ripemerchant.host for unauthenticated users
4. Update LoginScreen to use email input

---

## Phases

| Phase | Feature | Priority | Status |
|-------|---------|----------|--------|
| 1 | Add /api/twenty/auth server endpoint | HIGH | Pending |
| 2 | Update user-context.tsx with Twenty auth | HIGH | Pending |
| 3 | Update LoginScreen.tsx | MEDIUM | Pending |
| 4 | Test and verify | HIGH | Pending |

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/compass/server/routes.ts` | Add /api/twenty/auth endpoint |
| `apps/compass/client/src/lib/user-context.tsx` | Replace HELM_USERS with fetchTwentyUser + inferRole |
| `apps/compass/client/src/components/LoginScreen.tsx` | Change to email input, add Twenty redirect |

---

## Reference Implementation

Studio app already has the correct pattern:
- `/var/www/lids/apps/studio/server/index.ts` - Has `/api/twenty/auth`
- `/var/www/lids/apps/studio/client/src/lib/user-context.tsx` - Has `inferRole()` + `fetchTwentyUser()`

---

## Verification

1. Visit compass.ripemerchant.host (not logged in)
2. Should redirect to twenty.ripemerchant.host
3. After login, redirect back to COMPASS
4. User sees their assigned agent based on role

---

*Created: December 28, 2025*
