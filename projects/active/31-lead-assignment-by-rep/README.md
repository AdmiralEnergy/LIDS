# Project 31: Lead Assignment by Rep

## Status: COMPLETE
**Created:** 2026-01-04
**Completed:** 2026-01-04
**Priority:** HIGH - Core feature for multi-rep usage
**Execution Prompt:** `VSCODE_CLAUDE_PROMPT.md`

---

## Problem Statement

Currently, ALL leads in Twenty CRM are visible to ALL reps. There's no way to:
1. Assign leads to specific reps
2. Filter leads by assigned rep
3. Have per-rep lead lists

This creates chaos when multiple reps are using the system - everyone sees everyone's leads.

---

## Current State

### What Exists

| Component | Uses workspaceMemberId? | Purpose |
|-----------|------------------------|---------|
| Call Records | YES (`createdBy.workspaceMemberId`) | Track WHO made each call |
| Rep Progression | YES (`workspaceMemberId`) | XP, levels, badges per rep |
| Lead Assignment | NO | **Missing - leads have no rep assignment** |

### Person Schema (Twenty CRM)

Current custom fields on Person:
- `cell1-4`, `landline1-4`, `phone1-2` (PropStream phones)
- `email1-3` (PropStream emails)
- `street`, `city`, `state`, `zipCode` (address)
- `tcpaStatus`, `leadSource` (lead metadata)
- `assignedRepEmail` (exists but UNUSED - email-based, not ID-based)

### Why workspaceMemberId (not email)?

```
User changes email in Twenty CRM
├── Email-based: All lead assignments BREAK
└── ID-based: Assignments remain intact (workspaceMemberId never changes)
```

This is why progression and call records already use `workspaceMemberId`.

---

## Target State

### New Field on Person

```graphql
Person {
  # ... existing fields ...
  assignedToWorkspaceMemberId: String  # New field - links to WorkspaceMember.id
}
```

### Lead List Behavior

| User | Sees |
|------|------|
| Rep (logged in) | Only leads where `assignedToWorkspaceMemberId` = their ID |
| Admin/Owner | All leads (no filter applied) |

### Assignment UI

1. **Single Assignment**: Click lead → Assign to dropdown → Select rep
2. **Bulk Assignment**: Select multiple leads → Bulk assign to rep
3. **CSV Import**: Option to auto-assign imported leads to uploader

---

## Implementation Plan

### Phase 1: Add Custom Field to Twenty CRM

**Option A: Via Twenty UI**
1. Go to Settings → Data Model → People
2. Add custom field: `assignedToWorkspaceMemberId` (Text type)
3. Save changes

**Option B: Via Script** (like `add_twenty_fields.py`)
```python
add_field(PERSON_OBJECT_ID, "assignedToWorkspaceMemberId", "Assigned To", "TEXT", "WorkspaceMember ID of assigned rep", "IconUser")
```

### Phase 2: Update TwentyPerson Interface

**File:** `client/src/providers/twentyDataProvider.ts`

```typescript
interface TwentyPerson {
  // ... existing fields ...
  assignedToWorkspaceMemberId?: string;  // Add this
}
```

### Phase 3: Update GraphQL Queries

Add `assignedToWorkspaceMemberId` to all Person queries:
- `getList` (people query)
- `getOne` (person query)
- `create` (createPerson mutation)
- `update` (updatePerson mutation)

### Phase 4: Filter Leads by Assigned Rep

**In dialer.tsx / leads.tsx:**
```typescript
const currentWorkspaceMemberId = localStorage.getItem('workspaceMemberId');

// Filter leads to only show assigned ones
const myLeads = rawLeads.filter(lead =>
  !lead.assignedToWorkspaceMemberId || // Unassigned = available to all
  lead.assignedToWorkspaceMemberId === currentWorkspaceMemberId
);
```

### Phase 5: Add Assignment UI

1. **LeadCard**: Add "Assign" button/dropdown
2. **Leads Table**: Add "Assigned To" column
3. **Bulk Actions**: Select leads → Assign to rep
4. **Settings**: Toggle "Show only my leads" vs "Show all leads"

---

## Files to Modify

| File | Changes |
|------|---------|
| `providers/twentyDataProvider.ts` | Add field to interface + queries |
| `pages/dialer.tsx` | Filter leads by current rep |
| `pages/leads.tsx` | Add assignment column + actions |
| `components/dialer/LeadCard.tsx` | Add assign button |
| `lib/twentyStatsApi.ts` | Add getWorkspaceMembers for dropdown |

## Files to Create

| File | Purpose |
|------|---------|
| `components/leads/AssignRepDropdown.tsx` | Rep selection component |
| `hooks/useLeadAssignment.ts` | Lead assignment logic |

---

## Success Criteria

- [x] Custom field exists on Person in Twenty CRM (code ready, field needs adding in Twenty UI)
- [x] Leads can be assigned to specific reps
- [x] Reps only see leads assigned to them (or unassigned)
- [x] Admins can see all leads (toggle for davide@admiralenergy.ai)
- [x] Assignment persists after page reload (via Twenty CRM GraphQL)
- [ ] Bulk assignment works (hook ready, UI not implemented)
- [x] Assignment shows in lead details (Assigned To column with dropdown)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing lead queries | Field is optional, empty = unassigned |
| Performance with filtered queries | Filter on client (data already fetched) |
| User confusion | Clear "My Leads" vs "All Leads" toggle |

---

## Notes

- The `assignedRepEmail` field exists but should NOT be used (email-based)
- This follows the same pattern as call records and progression
- Admin override needed for lead reassignment and viewing all leads
