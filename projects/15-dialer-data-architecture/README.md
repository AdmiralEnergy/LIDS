# Project 15: Dialer Data Architecture

## Status: PHASE 3 COMPLETE - Progression Sync Fixed

**Started:** December 29, 2025
**Login Deployed:** December 29, 2025
**Call History Added:** December 29, 2025
**Progression Sync Fixed:** December 29, 2025

---

## Summary

Fix call logging, XP tracking, and implement proper call history. Establish user identity architecture where Twenty CRM User ID is the source of truth (not email).

---

## Completed Work

### Phase 1: Login System ✅ COMPLETE

**Root Cause Found:** Multiple workspace members (6 users), no way to identify current user.

**Solution Deployed:**
- COMPASS-style email login screen added
- User enters email → validated against Twenty `/rest/workspaceMembers`
- `workspaceMemberId` stored in localStorage
- On each visit, validates stored ID still exists in Twenty
- If user removed from Twenty → auto-logout on next visit

**Files Changed:**
| File | Changes |
|------|---------|
| `client/src/contexts/user-context.tsx` | User state management, Twenty validation |
| `client/src/components/LoginScreen.tsx` | Email login UI |
| `client/src/App.tsx` | Wrap app in UserProvider, show login when needed |
| `client/src/lib/twentySync.ts` | Debug logging, fixed naming conflict |
| `client/src/pages/dialer.tsx` | Debug logging at recordCall sites |

**Key Architecture Decisions:**
1. `workspaceMemberId` is the **permanent** user identifier
2. `email` is only used for **login lookup** (can change without data loss)
3. All progression/stats link to `workspaceMemberId`, never email
4. Session persists via `localStorage.twentyWorkspaceMemberId`

### Phase 1B: Debug Logging ✅ COMPLETE

Added comprehensive console logging to trace sync chain:
- `[Twenty Sync]` - Initialization and user identification
- `[recordCall]` - Call logging with full request/response
- `[syncFromTwenty]` / `[syncToTwenty]` - Progression sync
- `[Dialer]` / `[Auto-Disposition]` - Dialer call sites

**Fixed:** Import naming conflict where local `getCurrentWorkspaceMember()` shadowed the API import.

### Phase 2: Call History Page ✅ COMPLETE

Built a native phone app-style call history page at `/call-history`.

**Features:**
- Shows all calls from Twenty CRM (Notes with "Call -" prefix)
- Filter by timeframe: Today, This Week, This Month, All Time
- Filter by disposition: Contacted, No Answer, Voicemail, Callback, etc.
- Search by name or phone number
- Stats row: Total Calls, Total Time, Contacted, Connect Rate
- Click-to-call and view lead buttons
- Sorted by most recent first

**Files Added/Changed:**
| File | Changes |
|------|---------|
| `client/src/pages/call-history.tsx` | New page component |
| `client/src/App.tsx` | Added route `/call-history` and sidebar menu item |

**Data Source:** Queries Twenty CRM Notes via GraphQL, parses call notes with format:
```
Call - DISPOSITION | M:SS | Lead Name
```

### Phase 3: Progression Sync Fixed ✅ COMPLETE

**Root Cause Found:** The `syncToTwenty()` function was trying to sync fields that don't exist in Twenty CRM's `repProgressions` schema:
- `defeatedBosses` ❌ Not in schema
- `passedExams` ❌ Not in schema
- `completedModules` ❌ Not in schema
- `lastActivityDate` ❌ Not in schema
- `efficiencyMetrics` ❌ Not in schema

This caused all sync operations to fail with 400 Bad Request errors.

**Twenty CRM repProgressions Schema (actual):**
| Field | Type | Synced |
|-------|------|--------|
| id | UUID | ✓ |
| name | String | ✓ |
| workspaceMemberId | String | ✓ |
| totalXp | Float | ✓ |
| currentLevel | Float | ✓ |
| currentRank | String | ✓ |
| closedDeals | Float | ✓ |
| badges | String (JSON) | ✓ |
| streakDays | Float | ✓ |

**Solution:**
1. Fixed `syncToTwenty()` to only sync valid fields
2. Fixed `syncFromTwenty()` to not expect non-existent fields
3. Fixed `syncEfficiencyMetrics()` to not try syncing to Twenty
4. Fixed `twentyStatsApi.ts` to use dynamic headers (API key was empty at module load)

**Files Changed:**
| File | Changes |
|------|---------|
| `client/src/lib/twentySync.ts` | Removed invalid fields from sync payloads |
| `client/src/lib/twentyStatsApi.ts` | Changed `headers` to `getHeaders()` function |
| `client/src/pages/chat.tsx` | Placeholder for coming soon chat feature |

**Verified Working:**
- Created test progression record in Twenty CRM ✓
- Updated progression record via REST API ✓
- Build passes ✓

**Local-Only Fields:** The following are stored in IndexedDB only (for offline use):
- defeatedBosses, passedExams, completedModules
- efficiencyMetrics, lastActivityDate
- bossAttempts, titles, activeTitle
- menteeCount, graduationDate, specialization

---

## Remaining Work

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Login system + debug logging | ✅ COMPLETE |
| Phase 2 | Call History page | ✅ COMPLETE |
| Phase 3 | Progression sync fixes | ✅ COMPLETE |
| Phase 4 | Documentation updates | ✅ COMPLETE |

**All phases complete!** Deploy to droplet to enable live testing.

---

## User Identity Architecture (IMPLEMENTED)

```
Twenty CRM Workspace Member
    │
    ├── workspaceMemberId: "uuid-xxx" ← PERMANENT (never changes)
    ├── email: "user@example.com"     ← MUTABLE (login lookup only)
    ├── name: "John Doe"              ← MUTABLE
    │
    └── repProgressions (custom object)
        ├── workspaceMemberId: "uuid-xxx" ← Links to member ID
        ├── totalXp: 1500
        ├── rank: "closer-1"
        └── ... stats
```

### Rules Enforced
1. **User ID is permanent** - workspaceMemberId never changes
2. **Email is mutable** - Users can update email without data loss
3. **All records link to User ID** - Never to email
4. **Session tracks User ID** - localStorage stores workspaceMemberId

---

## Call History Requirements (Phase 2)

Like native phone apps (iPhone, Android, Mojo Dialer):
- Show all calls (inbound + outbound)
- Filter by timeframe (today, this week, all time)
- Filter by user (for managers)
- Each call shows: contact name, number, duration, disposition, timestamp
- Persist permanently in Twenty CRM
- Segregate by session AND user

---

## Deployment Notes

### Environment Variables
```bash
# In apps/ads-dashboard/client/.env (NOT root)
VITE_TWENTY_API_KEY=your_key_here

# IMPORTANT: Vite reads from client/ folder, not root
# After .env changes, must rebuild for client to pick up
```

### Build & Deploy
```bash
cd apps/ads-dashboard
node node_modules/vite/bin/vite.js build
# Then deploy dist/ to droplet
```

---

*Last Updated: December 29, 2025 (All Phases Complete)*
