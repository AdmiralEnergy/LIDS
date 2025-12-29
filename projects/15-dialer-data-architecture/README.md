# Project 15: Dialer Data Architecture

## Status: IN PROGRESS

**Started:** December 29, 2025

---

## Summary

Fix call logging, XP tracking, and implement proper call history. Establish user identity architecture where Twenty CRM User ID is the source of truth (not email).

---

## Critical Issues

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| XP not recording | Toast shows "+2 XP" but bar stays 0/100 | Twenty sync failing silently |
| Calls not logging | Dashboard shows 0 calls | Note creation failing or wrong format |
| No call history | Can't see past calls | Feature doesn't exist |
| User identity fragile | Email change = lost stats | Email used as identifier instead of ID |

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
