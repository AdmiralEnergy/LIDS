# Project 31: Lead Assignment by Rep

## Status: COMPLETE
**Created:** 2026-01-04
**Completed:** 2026-01-04
**Priority:** HIGH - Core feature for multi-rep usage

---

## Problem Statement

Currently, ALL leads in Twenty CRM are visible to ALL reps. There's no way to:
1. Assign leads to specific reps
2. Filter leads by assigned rep
3. Have per-rep lead lists

This creates chaos when multiple reps are using the system - everyone sees everyone's leads.

---

## Final Implementation

### Solution: SELECT Field (not RELATION)

RELATION fields to system objects (workspaceMember) cannot be created via API.
We implemented a SELECT field with all workspace members as dropdown options.

### Field Configuration

| Property | Value |
|----------|-------|
| **Field Name** | `assignedRep` |
| **Field Type** | SELECT |
| **Field ID** | `d207c01e-714c-4cf2-a6b1-b2b01c6ddaf4` |
| **Object** | Person |

### SELECT Options (Workspace Members)

| Label | Value | Color |
|-------|-------|-------|
| Nathaniel Jenkins | NATHANIEL_JENKINS | #4B5563 |
| Jonathan Lindqvist | JONATHAN_LINDQVIST | #1D4ED8 |
| David Edwards | DAVID_EDWARDS | #059669 |
| Edwin Royal Stewart | EDWIN_ROYAL_STEWART | #D97706 |
| Lou Hallug | LOU_HALLUG | #DC2626 |
| Leigh Edwards | LEIGH_EDWARDS | #7C3AED |

### Sync Script

When new reps are added, run:
```bash
python scripts/sync_rep_options.py
```

This fetches all workspace members via GraphQL and updates the SELECT field options.

---

## How It Works

### In Twenty CRM (Source of Truth)

1. Go to People view
2. Click any person record
3. Find "Assigned Rep" dropdown
4. Select the rep from the list
5. Changes save automatically

### In ADS Dashboard (Integration)

The dashboard reads the `assignedRep` field and filters leads:

```typescript
// Convert user name to SELECT value format
const currentUserSelectValue = userName.toUpperCase().replace(/\s+/g, '_');

// Filter: show unassigned OR assigned to current user
const myLeads = rawLeads.filter(lead =>
  !lead.assignedRep || lead.assignedRep === currentUserSelectValue
);
```

Admin users (davide@admiralenergy.ai) can toggle "Show All Leads" to see everything.

---

## Files Modified

| File | Changes |
|------|---------|
| `client/src/providers/twentyDataProvider.ts` | Added `assignedRep` to interface + queries |
| `client/src/pages/leads.tsx` | Added filtering by current user + admin toggle |
| `client/src/hooks/useLeadAssignment.ts` | Assignment hook with SCREAMING_SNAKE_CASE conversion |
| `client/src/components/AssignRepDropdown.tsx` | Rep selection UI component |
| `shared/schema.ts` | Added `assignedRep` to Lead type |

## Scripts Created

| Script | Purpose |
|--------|---------|
| `scripts/sync_rep_options.py` | Syncs workspace members to SELECT options |
| `scripts/find_field_id.py` | Utility to locate fields by name |
| `scripts/inspect_metadata_graphql.py` | GraphQL introspection for debugging |

---

## Success Criteria

- [x] SELECT field exists on Person in Twenty CRM
- [x] In Twenty UI: Dropdown shows all workspace members
- [x] In Twenty UI: Can assign leads to reps via dropdown
- [x] ADS Dashboard: Reps only see their assigned leads (or unassigned)
- [x] ADS Dashboard: Admin can toggle to see all leads
- [x] Assignment persists after page reload
- [x] Sync script works to update options when reps change

---

## Architecture Compliance

This implementation follows the Three Rules:

1. **Backend ≠ Complete**: The SELECT field is manageable entirely via Twenty CRM UI
2. **Twenty CRM = Config Layer**: All assignment happens in Twenty, dashboard reflects it
3. **Integration Pattern**: Designed in Twenty first, dashboard integrates via GraphQL

---

## Notes

- RELATION fields to workspaceMember CANNOT be created via API (Twenty limitation)
- SELECT field provides same UX (dropdown) with less API complexity
- Values use SCREAMING_SNAKE_CASE format to match Twenty's SELECT field conventions
- Old TEXT field `assignedToWorkspaceMemberId` was removed, replaced with SELECT `assignedRep`
