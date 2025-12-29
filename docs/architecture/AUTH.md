# LIDS Authentication Architecture

**Version:** 1.0 | **Updated:** December 29, 2025

---

## Overview

All LIDS applications (ADS Dashboard, Studio, COMPASS, Academy) use **Twenty CRM as the single source of truth** for user authentication. There is no separate auth system, no Supabase, no HELM Registry.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    TWENTY CRM = CENTRAL IDENTITY PROVIDER                     │
│                                                                              │
│  • User invited to Twenty workspace → Can access ALL LIDS apps               │
│  • User removed from Twenty → Loses access to ALL LIDS apps                  │
│  • Single point of user management                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## User Identity Model

### Key Concept: workspaceMemberId

Every user in Twenty CRM has a **workspace member ID** - a UUID that never changes, even if the user changes their email or name.

```
Twenty CRM Workspace Member
    │
    ├── workspaceMemberId: "uuid-xxx"  ← PERMANENT (never changes)
    ├── email: "user@example.com"      ← MUTABLE (can be changed)
    └── name: "John Doe"               ← MUTABLE (can be changed)
```

### Why workspaceMemberId, Not Email?

| Identifier | Permanence | Use Case |
|------------|------------|----------|
| `workspaceMemberId` | **Permanent** | Foreign keys, data relationships |
| `email` | Mutable | Login lookup only |

**Example:** If a user changes their email from `john@old.com` to `john@new.com`:
1. Their `workspaceMemberId` stays the same
2. All their progression, call logs, stats remain intact
3. They login with new email, get same data

---

## Login Flow

### First Login

```
┌────────────────────────────────────────────────────────────────────────────┐
│  USER ENTERS EMAIL ON LOGIN SCREEN                                         │
│                                                                            │
│  1. App receives email: "user@example.com"                                 │
│  2. App queries Twenty: GET /rest/workspaceMembers                         │
│  3. Find member where userEmail matches                                    │
│  4. If found:                                                              │
│     - Extract workspaceMemberId                                            │
│     - Store in localStorage                                                │
│     - User is logged in                                                    │
│  5. If not found:                                                          │
│     - Show error: "Email not found in workspace"                           │
│     - User cannot proceed                                                  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Subsequent Visits

```
┌────────────────────────────────────────────────────────────────────────────┐
│  APP LOADS                                                                 │
│                                                                            │
│  1. Check localStorage for twentyWorkspaceMemberId                         │
│  2. If found:                                                              │
│     - Query Twenty: GET /rest/workspaceMembers                             │
│     - Check if workspaceMemberId still exists in workspace                 │
│     - If exists → User is authenticated, show app                          │
│     - If not exists → Clear localStorage, show login (revoked)             │
│  3. If not found:                                                          │
│     - Show login screen                                                    │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Session Persistence

### localStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `twentyWorkspaceMemberId` | UUID | **Primary identifier** - used for all data relationships |
| `twentyUserEmail` | String | Display only (shown in UI) |
| `twentyUserName` | String | Display only (shown in UI) |

### Session Validation

On every app load, the stored `workspaceMemberId` is validated against Twenty CRM:

```typescript
// From user-context.tsx
const validateSession = async () => {
  const storedId = localStorage.getItem('twentyWorkspaceMemberId');
  if (!storedId) return false;

  const members = await fetchWorkspaceMembers();
  const isValid = members.some(m => m.id === storedId);

  if (!isValid) {
    // User was removed from Twenty - clear session
    localStorage.removeItem('twentyWorkspaceMemberId');
    localStorage.removeItem('twentyUserEmail');
    localStorage.removeItem('twentyUserName');
    return false;
  }

  return true;
};
```

---

## User Management

### Add a New User

1. Go to `https://twenty.ripemerchant.host`
2. Login as admin
3. **Settings → Members → Invite Member**
4. Enter user's email
5. User receives invite, accepts
6. User can now login to any LIDS app

### Remove a User

1. Go to `https://twenty.ripemerchant.host`
2. Login as admin
3. **Settings → Members → Remove** (click user, then remove)
4. User's `workspaceMemberId` is removed from workspace
5. Next time user loads any LIDS app:
   - App validates their stored ID
   - Twenty says "not found"
   - App clears localStorage, shows login
   - User cannot login (email not in workspace)

### Check Current Users

```bash
# Via API
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://twenty.ripemerchant.host/rest/workspaceMembers

# Or via UI
# twenty.ripemerchant.host → Settings → Members
```

---

## Code Locations

### ADS Dashboard

| File | Purpose |
|------|---------|
| `apps/ads-dashboard/client/src/contexts/user-context.tsx` | User state, validation, login/logout |
| `apps/ads-dashboard/client/src/components/LoginScreen.tsx` | Login UI component |
| `apps/ads-dashboard/client/src/App.tsx` | UserProvider wrapper |
| `apps/ads-dashboard/client/src/lib/twentySync.ts` | Uses workspaceMemberId for sync |

### user-context.tsx (Key Functions)

```typescript
// Login: lookup email → store workspaceMemberId
async function login(email: string) {
  const members = await fetchWorkspaceMembers();
  const member = members.find(m => m.userEmail === email);
  if (member) {
    localStorage.setItem('twentyWorkspaceMemberId', member.id);
    // ... store email, name
  }
}

// Logout: clear everything
function logout() {
  localStorage.removeItem('twentyWorkspaceMemberId');
  localStorage.removeItem('twentyUserEmail');
  localStorage.removeItem('twentyUserName');
}

// Validate: check if workspaceMemberId still in Twenty
async function validateSession() {
  const storedId = localStorage.getItem('twentyWorkspaceMemberId');
  const members = await fetchWorkspaceMembers();
  return members.some(m => m.id === storedId);
}
```

---

## Troubleshooting

### User Can't Login

**Symptom:** User enters email, gets "Email not found in workspace"

**Causes:**
1. User hasn't been invited to Twenty workspace
2. User entered wrong email (typo)
3. User's invitation hasn't been accepted yet

**Fix:**
- Check Twenty → Settings → Members
- Verify user's email matches exactly
- Re-send invitation if needed

### User Suddenly Logged Out

**Symptom:** User was working, now sees login screen

**Causes:**
1. User was removed from Twenty workspace
2. User cleared browser storage
3. Twenty API is down (can't validate)

**Fix:**
- If removed: Re-invite to Twenty if appropriate
- If cleared storage: User just logs in again
- If API down: Wait for Twenty to recover

### workspaceMemberId is null

**Symptom:** Console shows `workspaceMemberId: null` or sync skipped

**Causes:**
1. User didn't complete login
2. localStorage was cleared
3. Login screen was bypassed somehow

**Fix:**
- Ensure UserProvider wraps the app
- Check localStorage in browser DevTools
- Force logout and login again

### Progression Not Syncing

**Symptom:** XP shows locally but doesn't persist to Twenty

**Causes:**
1. No workspaceMemberId (user not logged in)
2. Twenty API key missing or invalid
3. Network error

**Check:**
```javascript
// In browser console
console.log(localStorage.getItem('twentyWorkspaceMemberId'));
// Should return a UUID, not null
```

---

## Security Notes

### What's Protected

- **Dashboard access:** Requires valid workspaceMemberId in Twenty
- **Data segregation:** Progression data linked to workspaceMemberId

### What's NOT Protected

- **Twenty API key:** Embedded in client bundle (by design - it's a workspace-scoped key)
- **Data between users:** All users in workspace can see all leads (this is intentional for sales team)

### Why This Works

- All users are employees of Admiral Energy
- Twenty CRM manages who's in the workspace
- Removing from Twenty = no access
- This is simpler and more reliable than a separate auth system

---

## Environment Variables

### Required for Login to Work

```bash
# In apps/ads-dashboard/client/.env (NOT root folder)
VITE_TWENTY_API_KEY=your_api_key_here

# IMPORTANT: Vite embeds this at BUILD TIME
# After changing .env, must rebuild:
# node node_modules/vite/bin/vite.js build
```

### Twenty API Key Scope

The API key should have:
- Read access to `workspaceMembers` (for login validation)
- Read/write access to `people` (leads)
- Read/write access to `notes` (call logging)
- Read/write access to `repProgressions` (XP/ranks)

---

*Last Updated: December 29, 2025*
