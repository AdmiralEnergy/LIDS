# Project 10: Studio Consolidation Audit

## Executive Summary

Leigh (CMO) cannot access the Studio Dashboard because the COMPASS app uses a deprecated HELM_USERS registry that doesn't include her. The Studio app uses Twenty CRM for auth and has role detection, but there's no cross-app routing to redirect CMO users from COMPASS to Studio. The solution is to update COMPASS to detect role from Twenty and redirect CMO users to `studio.ripemerchant.host`.

---

## Current State Analysis

### Authentication Flow (COMPASS)

```
User visits compass.ripemerchant.host
         │
         ▼
┌─────────────────────────────────────────┐
│  user-context.tsx                       │
│                                         │
│  1. Check localStorage for stored user  │
│  2. If found, lookup in HELM_USERS[]    │◄── PROBLEM: Leigh not in list
│  3. If not found, try Twenty /rest/me   │
│  4. If email matches, create user obj   │◄── Role detection exists
│  5. Show login screen if no match       │
└─────────────────────────────────────────┘
         │
         ▼
LoginScreen.tsx → Email dropdown (HELM_USERS only)
         │
         ▼
User stuck - Can't select Leigh's email
```

### Authentication Flow (Studio)

```
User visits studio.ripemerchant.host
         │
         ▼
┌─────────────────────────────────────────┐
│  user-context.tsx                       │
│                                         │
│  1. Check localStorage                  │
│  2. Call /api/twenty/auth with email    │◄── Uses Twenty CRM
│  3. inferRole(email) → 'cmo' for Leigh  │◄── Role detection works
│  4. Create user with CMO role           │
│  5. Show MarketingDashboard             │
└─────────────────────────────────────────┘
         │
         ▼
MarketingLoginScreen.tsx → Email input (any email)
         │
         ▼
Leigh CAN log in if she goes directly to Studio
```

---

## Critical Issues

### C1: HELM_USERS Registry Deprecated
- **Severity:** HIGH
- **Location:** `apps/compass/client/src/lib/user-context.tsx:14-21`
- **Impact:** CMO (Leigh) not in list, cannot log in to COMPASS
- **Evidence:**
```typescript
export const HELM_USERS: User[] = [
  { id: '1', name: 'David Edwards', email: 'davide@admiralenergy.ai', ... },
  { id: '2', name: 'Nate Jenkins', email: 'nathanielj@admiralenergy.ai', ... },
  { id: '3', name: 'Edwin Stewart', email: 'thesolardistrict@gmail.com', ... },
  // NO LEIGH - leighe@ripemerchant.host missing
];
```

### C2: No Cross-App Role Routing
- **Severity:** HIGH
- **Location:** `apps/compass/client/src/App.tsx`
- **Impact:** CMO users should be redirected to Studio, but no logic exists
- **Root Cause:** Apps operate independently with no role-based redirects

### C3: Login Screen Uses Static Dropdown
- **Severity:** MEDIUM
- **Location:** `apps/compass/client/src/components/LoginScreen.tsx`
- **Impact:** Users can only select from HELM_USERS dropdown, no email input
- **Evidence:** Dropdown populated from HELM_USERS array only

### C4: Code Not Synced to Local
- **Severity:** MEDIUM
- **Location:** Local `apps/` vs Droplet `/var/www/lids/apps/`
- **Impact:** Local repo missing `apps/studio/` entirely
- **Evidence:**
```
Local:  apps/ads-dashboard, apps/compass, apps/redhawk-academy
Droplet: apps/ads-dashboard, apps/compass, apps/redhawk-academy, apps/studio
```

---

## Target State

### Role-Based Routing Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          USER LOGIN FLOW (TARGET)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   User enters email at compass.ripemerchant.host                             │
│                          │                                                    │
│                          ▼                                                    │
│   ┌──────────────────────────────────────────────────────────────┐           │
│   │  Twenty CRM Auth (/api/twenty/auth)                          │           │
│   │  Returns: { success: true, user: { email, name, id } }       │           │
│   └──────────────────────────────────────────────────────────────┘           │
│                          │                                                    │
│                          ▼                                                    │
│   ┌──────────────────────────────────────────────────────────────┐           │
│   │  Role Detection (inferRole)                                   │           │
│   │  • davide@admiralenergy.ai → 'owner'                         │           │
│   │  • nathanielj@admiralenergy.ai → 'coo'                       │           │
│   │  • leighe@ripemerchant.host → 'cmo'                          │           │
│   │  • * → 'rep'                                                  │           │
│   └──────────────────────────────────────────────────────────────┘           │
│                          │                                                    │
│          ┌───────────────┴───────────────┐                                   │
│          │                               │                                    │
│          ▼                               ▼                                    │
│   ┌─────────────┐               ┌─────────────────┐                          │
│   │ role: cmo   │               │ role: rep/coo/  │                          │
│   │             │               │ owner           │                          │
│   └──────┬──────┘               └────────┬────────┘                          │
│          │                               │                                    │
│          ▼                               ▼                                    │
│   REDIRECT to                    STAY on COMPASS                              │
│   studio.ripemerchant.host       (sales agents UI)                           │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Location | Changes |
|------|----------|---------|
| `user-context.tsx` | `apps/compass/client/src/lib/` | Use Twenty CRM auth instead of HELM_USERS |
| `LoginScreen.tsx` | `apps/compass/client/src/components/` | Add email input field, remove dropdown |
| `App.tsx` | `apps/compass/client/src/` | Add redirect logic for CMO role |
| `inferRole()` | Create or add to user-context | Role detection by email |

---

## Success Criteria

- [ ] Leigh can enter email at compass.ripemerchant.host
- [ ] Email validated against Twenty CRM (not HELM_USERS)
- [ ] CMO role detected → redirect to studio.ripemerchant.host
- [ ] Sales reps (Edwin, Jonathan, Kareem) stay on COMPASS
- [ ] Owner (David) can access both apps
- [ ] Local repo has `apps/studio/` synced from droplet

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing logins | Medium | HIGH | Test with all HELM_USERS emails first |
| Twenty API failure | Low | HIGH | Add fallback to localStorage |
| Redirect loop | Low | MEDIUM | Add `?noredirect` escape hatch |
| PM2 restart disruption | Low | LOW | Deploy during off-hours |

---

## Dependencies

- Twenty CRM running on droplet (port 3001)
- `/api/twenty/auth` endpoint working
- Nginx routing for studio.ripemerchant.host configured (verified)

---

*Audit completed: December 28, 2025*
