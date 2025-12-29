# Project 15: Dialer Data Architecture

## Status: IN PROGRESS

**Started:** December 29, 2025

---

## Summary

Fix call logging, XP tracking, and implement proper call history. Establish user identity architecture where Twenty CRM User ID is the source of truth (not email).

---

## Critical Issues

| Issue | Symptom | Root Cause | Status |
|-------|---------|------------|--------|
| XP not recording | Toast shows "+2 XP" but bar stays 0/100 | No login → workspaceMemberId is null | **FIXING** |
| Calls not logging | Dashboard shows 0 calls | Note uses `body` but Twenty uses `bodyV2` | **FIXING** |
| No call history | Can't see past calls | Feature doesn't exist | PENDING |
| User identity | Multiple workspace members, can't identify user | No login screen | **FIXING** |

---

## Root Cause Analysis (Dec 29)

### Debug Logging Revealed:
```
[Twenty Sync] Found 6 workspace members
[Twenty Sync] ✗ Multiple workspace members found. User identification required.
[Twenty Sync] Final workspace member ID: null
```

### Issues Found:
1. **No login screen** - App can't identify which of 6 workspace members is the current user
2. **Wrong GraphQL field** - Using `body` but Twenty CRM Notes use `bodyV2`
3. **All sync fails** - Without workspaceMemberId, progression sync is skipped

### Solution:
1. Add COMPASS-style login screen (email lookup against Twenty)
2. Fix Note field: `body` → `bodyV2`
3. Store workspaceMemberId in localStorage, validate on each load

---

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Debug why XP/calls aren't persisting to Twenty | PENDING |
| Phase 2 | Implement Call History page | PENDING |
| Phase 3 | Refactor user identity (ID as truth, not email) | PENDING |
| Phase 4 | Documentation updates | PENDING |

---

## User Identity Architecture (CRITICAL)

### Current Problem
- Email is used as the user identifier
- If someone changes their email, they lose all stats
- No consistent User ID across sessions/devices

### Target Architecture
```
Twenty CRM Workspace Member
    │
    ├── id: "uuid-xxx" ← THIS IS TRUTH (never changes)
    ├── email: "user@example.com" ← Can be changed
    ├── name: "John Doe"
    │
    └── repProgressions (custom object)
        ├── workspaceMemberId: "uuid-xxx" ← Links to member ID
        ├── totalXp: 1500
        ├── rank: "closer-1"
        └── ... stats
```

### Rules
1. **User ID is permanent** - Once assigned, never changes
2. **Email is mutable** - Users can update their email
3. **All records link to User ID** - Never to email
4. **Session tracks User ID** - localStorage stores ID, not just email

---

## Call History Requirements

Like native phone apps (iPhone, Android, Mojo Dialer):
- Show all calls (inbound + outbound)
- Filter by timeframe (today, this week, all time)
- Filter by user (for managers)
- Each call shows: contact name, number, duration, disposition, timestamp
- Persist permanently in Twenty CRM
- Segregate by session AND user

---

*Last Updated: December 29, 2025*
