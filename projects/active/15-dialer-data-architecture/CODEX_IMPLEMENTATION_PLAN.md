# Codex Implementation Plan - Project 15: Dialer Data Architecture

## System Prompt

```
You are implementing critical data architecture fixes for ADS Dashboard (LIDS).

CONTEXT:
- App: apps/ads-dashboard (React + TypeScript + Vite)
- Production: https://helm.ripemerchant.host
- CRM: Twenty CRM (localhost:3001 on droplet)
- Auth: Twenty CRM is the ONLY identity provider

CURRENT PROBLEMS (verified via live testing):
1. XP shows "+2 XP" toast but bar stays at 0/100 - Twenty sync failing
2. Dashboard shows 0 calls despite making calls - Note creation failing
3. No call history view exists - users can't see past calls
4. User identity uses email as key - changing email loses all stats

KEY FILES:
- lib/twentySync.ts - Progression sync to Twenty CRM (recently modified, still broken)
- lib/progressionDb.ts - Dexie (IndexedDB) local cache
- pages/dialer.tsx - Main dialer page
- pages/dashboard.tsx - Dashboard with stats
- providers/twentyDataProvider.ts - Twenty GraphQL queries

TWENTY CRM ARCHITECTURE:
- Workspace Members: Built-in object (id, email, name)
- repProgressions: Custom object for XP/ranks
- Notes: Used to log calls (format: "Call - DISPOSITION")

BRAND TOKENS:
- Navy: #0c2f4a
- Gold: #c9a648
- White: #f7f5f2
```

---

## Phase 1: Debug XP and Call Logging (CRITICAL)

### Task 1.1: Add Debug Logging to recordCall()

**File:** `apps/ads-dashboard/client/src/lib/twentySync.ts`

The `recordCall()` function was recently rewritten to create Notes in Twenty CRM, but it's failing silently. Add comprehensive logging to identify the failure point.

```typescript
// Find the recordCall function and add console.log statements:
// 1. Log at function entry with all parameters
// 2. Log the GraphQL mutation being sent
// 3. Log the response or error
// 4. Log when XP is being added

// Also check: Is getCurrentWorkspaceMember() returning a valid ID?
// If it returns undefined, the whole sync chain breaks.
```

### Task 1.2: Verify Twenty GraphQL Note Creation

**Test manually in browser console:**
```javascript
// In browser dev tools on helm.ripemerchant.host:
// Check if the mutation format is correct
// The Note mutation might need different fields

// Twenty's Note object requires:
// - body: string (the note content)
// - personId or companyId: string (link to a record)
// We might be using wrong field names
```

### Task 1.3: Fix getCurrentWorkspaceMember()

**File:** `apps/ads-dashboard/client/src/lib/twentySync.ts`

The `getCurrentWorkspaceMember()` function should reliably return the current user's workspace member ID. If it fails, nothing syncs.

```typescript
// Current implementation uses API to get current user
// But if the API call fails or returns wrong format, sync breaks
// Add fallback: check localStorage, then check Dexie, then make API call
```

### Task 1.4: Verify XP Addition Flow

**File:** `apps/ads-dashboard/client/src/lib/progressionDb.ts`

The `addXP()` function should:
1. Add XP to local Dexie
2. Trigger sync to Twenty CRM
3. Update the UI

Check if all three steps are happening.

---

## Phase 2: Implement Call History Page

### Task 2.1: Create Call History Page

**File:** `apps/ads-dashboard/client/src/pages/call-history.tsx` (NEW)

Create a new page that shows all calls like a native phone app.

```tsx
// Requirements:
// - List all calls (from Twenty Notes with "Call -" prefix)
// - Show: contact name, phone number, duration, disposition, timestamp
// - Filter by: Today, This Week, This Month, All Time
// - Sort by: Most Recent first
// - Click to view lead details or redial
// - Responsive design (works on mobile)

// UI Layout:
// ┌─────────────────────────────────────────┐
// │ Call History                    [Filter]│
// ├─────────────────────────────────────────┤
// │ ┌─────────────────────────────────────┐ │
// │ │ 📞 John Smith                       │ │
// │ │ (704) 555-1234 • 2:34 • CONTACT    │ │
// │ │ Today at 10:30 AM                   │ │
// │ └─────────────────────────────────────┘ │
// │ ┌─────────────────────────────────────┐ │
// │ │ 📵 Jane Doe                         │ │
// │ │ (980) 555-5678 • 0:12 • NO ANSWER  │ │
// │ │ Today at 10:15 AM                   │ │
// │ └─────────────────────────────────────┘ │
// └─────────────────────────────────────────┘
```

### Task 2.2: Add Route for Call History

**File:** `apps/ads-dashboard/client/src/App.tsx`

Add the route for the new call history page.

### Task 2.3: Add Navigation Link

**File:** `apps/ads-dashboard/client/src/components/Sidebar.tsx` (or equivalent)

Add "Call History" to the sidebar navigation, between "Activity" and "Dialer".

### Task 2.4: Create GraphQL Query for Call Notes

**File:** `apps/ads-dashboard/client/src/lib/twentyStatsApi.ts`

Add a function to fetch all call notes with proper filtering:

```typescript
export async function getCallHistory(options: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<CallRecord[]> {
  // Query Twenty Notes where body starts with "Call -"
  // Parse the body to extract: disposition, duration, timestamp
  // Join with Person data to get contact name/phone
  // Return sorted by createdAt desc
}
```

---

## Phase 3: Refactor User Identity Architecture

### Task 3.1: Update User Identity Model

**CRITICAL ARCHITECTURE CHANGE**

The current system uses email as the user identifier. This is fragile - if a user changes their email, they lose all their stats.

**New Model:**
```
Twenty Workspace Member ID = Source of Truth
├── Permanent, never changes
├── Assigned when user joins workspace
└── All records link to this ID

Email = Mutable attribute
├── Can be changed by user/admin
├── Used for login only
└── NOT used as foreign key
```

### Task 3.2: Update Dexie Schema

**File:** `apps/ads-dashboard/client/src/lib/progressionDb.ts`

```typescript
// Current: progression table uses 'email' as primary identifier
// Change to: use 'workspaceMemberId' as primary identifier

// Add migration to handle existing data:
// 1. For each record with email, look up workspaceMemberId
// 2. Update record to use workspaceMemberId
// 3. Keep email as secondary field for display only
```

### Task 3.3: Update twentySync.ts

**File:** `apps/ads-dashboard/client/src/lib/twentySync.ts`

```typescript
// Update all functions to use workspaceMemberId instead of email:
// - getRepProgression(workspaceMemberId) instead of getRepProgression(email)
// - syncRepProgression(workspaceMemberId, data) instead of syncRepProgression(email, data)
// - recordCall() should link to workspaceMemberId

// Store workspaceMemberId in localStorage on login:
// localStorage.setItem('twentyWorkspaceMemberId', id)
// localStorage.setItem('twentyUserEmail', email) // for display only
```

### Task 3.4: Update useProgression Hook

**File:** `apps/ads-dashboard/client/src/features/progression/hooks/useProgression.ts`

```typescript
// Update to use workspaceMemberId:
// - On init, get workspaceMemberId from localStorage or API
// - All queries/mutations use workspaceMemberId
// - Email is only used for display
```

---

## Phase 4: Documentation Updates

### Task 4.1: Update CLAUDE.md

**File:** `CLAUDE.md`

Add section on User Identity Architecture:

```markdown
## User Identity Architecture

### Source of Truth: Twenty Workspace Member ID

| Field | Purpose | Mutable? |
|-------|---------|----------|
| workspaceMemberId | Unique identifier, links all records | NO |
| email | Login credential, display | YES |
| name | Display name | YES |

### Why ID over Email?
- Users may change email (marriage, company policy, etc.)
- Email change should NOT lose progression stats
- ID is permanent, assigned at workspace invite
- All foreign keys reference ID, never email
```

### Task 4.2: Create Data Architecture Doc

**File:** `docs/architecture/DATA_ARCHITECTURE.md` (NEW)

Document the complete data flow:
- Twenty CRM objects (built-in and custom)
- Dexie local cache schema
- Sync strategy (Twenty-first, Dexie as cache)
- Call logging format
- Progression tracking

### Task 4.3: Update Project README

**File:** `projects/15-dialer-data-architecture/README.md`

Update status as phases complete.

---

## Verification Commands

```bash
# After Phase 1: Check if calls are being logged
ssh root@165.227.111.24 "curl -s 'http://localhost:3001/rest/notes?filter[body][startsWith]=Call' -H 'Authorization: Bearer YOUR_TOKEN' | jq '.data | length'"

# After Phase 2: Check call history page
curl -s https://helm.ripemerchant.host/call-history

# Browser console tests:
# Check current user ID
console.log(localStorage.getItem('twentyWorkspaceMemberId'))

# Check if progression is syncing
// Make a call, then check Twenty for the Note
```

---

## Rollback Plan

### Phase 1 (Debug)
- No schema changes, just logging - safe to revert

### Phase 2 (Call History)
- New page only, no existing functionality affected
- Remove route and page file to rollback

### Phase 3 (User Identity)
- **HIGH RISK** - Changes how data is keyed
- Backup Dexie before migration
- Keep email field for fallback
- Migration should be reversible

---

## Success Criteria

- [ ] XP bar updates after call disposition (not just toast)
- [ ] Dashboard "Calls Today" increments after calls
- [ ] Call History page shows all calls with details
- [ ] User can change email without losing stats
- [ ] workspaceMemberId stored in localStorage
- [ ] All records link to workspaceMemberId, not email

---

## Priority Order

1. **Phase 1** - MUST fix first, nothing works without it
2. **Phase 2** - High value, gives reps visibility into their work
3. **Phase 3** - Important for long-term, but can be done after 1 & 2
4. **Phase 4** - Documentation, do alongside other phases
