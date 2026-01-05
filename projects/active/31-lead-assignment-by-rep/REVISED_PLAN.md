# Project 31: Lead Assignment - REVISED PLAN

## Current Status

- TEXT field `assignedToWorkspaceMemberId` exists on Person ✅
- **Relation fields can ONLY be created via Twenty CRM UI** (API limitation)
- Need to create RELATION field in Twenty UI for proper dropdown experience

---

## What Went Wrong

The initial implementation violated core architecture principles:

| Mistake | Correct Approach |
|---------|------------------|
| Built assignment UI in ADS Dashboard | Design in Twenty CRM first, integrate to dashboard |
| Field exists but not usable in Twenty UI | Field must be configurable in Twenty's native interface |
| Created loose backend connection | Dashboard should REFLECT Twenty, not be the source |
| Requires CLI/code to manage | Must be manageable entirely via UI |

---

## Three Rules (from user)

1. **Backend ≠ Complete** - If it needs CLI to use, it's not done
2. **Twenty CRM = Auth Layer + Config Layer** - All management happens in Twenty UI
3. **Integration Pattern** - Design in Twenty FIRST, then map to dashboard

---

## Correct Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  TWENTY CRM (Source of Truth)                                   │
│  twenty.ripemerchant.host                                       │
│                                                                 │
│  ├── People (Leads)                                             │
│  │   ├── assignedToWorkspaceMemberId field (TEXT → RELATION?)   │
│  │   └── Editable in Twenty's native UI                         │
│  │                                                              │
│  ├── Views                                                      │
│  │   ├── "All Leads" (admin view)                               │
│  │   ├── "My Leads" (filtered by current user) ← IF POSSIBLE    │
│  │   └── Per-rep views if dynamic filter not available          │
│  │                                                              │
│  └── Workspace Members                                          │
│      └── Each rep has a workspaceMemberId                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ GraphQL API (read/reflect)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ADS DASHBOARD (Integration Layer)                              │
│  helm.ripemerchant.host                                         │
│                                                                 │
│  ├── Leads Page                                                 │
│  │   └── Shows leads from Twenty (filtered by assignment)       │
│  │                                                              │
│  ├── Dialer                                                     │
│  │   └── Calls leads assigned to current rep                    │
│  │                                                              │
│  └── Assignment UI (OPTIONAL - mirrors Twenty capability)       │
│      └── If Twenty can't do it natively, provide UI here        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Create Relation in Twenty CRM UI

**IMPORTANT:** Relation fields cannot be created via API. Must use Twenty CRM UI.

### Step-by-Step: Create Assigned Rep Relation

1. **Go to Twenty CRM**: https://twenty.ripemerchant.host
2. **Navigate to Settings** → Click gear icon (bottom left)
3. **Go to Data Model** → Under "Workspace", click "Data model"
4. **Select "People"** → Click on the People object
5. **Add Relation Field**:
   - Click "+ Add Field"
   - **Type**: Select "Relation"
   - **Related to**: Select "Workspace Member"
   - **Field name**: `assignedRep`
   - **Label**: `Assigned Rep`
   - **Relation type**: Many-to-One (many people can be assigned to one rep)
   - **Icon**: IconUserCheck
   - Save

This creates a proper dropdown in Twenty's People view showing all workspace members.

### Workspace Members Reference

| Name | Email | ID |
|------|-------|-----|
| Nathaniel Jenkins | nathanielj@admiralenergy.ai | 0ba4db24-3fe6-4a21-9a11-782d04ae25dc |
| Jonathan Lindqvist | lindqvist@logicside.co | 63996c58-0656-4865-a4c8-b5fc7405d41b |
| David Edwards | davide@admiralenergy.ai | 77f49688-f742-41e9-89d5-96177eb3d07d |
| Edwin Royal Stewart | thesolardistrict@gmail.com | 910c53fc-4cb2-4ec0-9ab2-833dc488a543 |
| Lou Hallug | info@thekardangroupltd.com | 9a5fa69d-b09e-4b1e-85a0-fede8b2cbe6a |
| Leigh Edwards | leighe@ripemerchant.host | d260b737-5c79-4ccb-aea5-db1b95255780 |

### Task 1.2: Create Views in Twenty

Twenty CRM supports saved views with filters. Create:

1. **"All Leads"** - No filter, admin use
2. **"Unassigned Leads"** - Where assignedToWorkspaceMemberId is empty
3. **"[Rep Name] Leads"** - Per-rep view filtered by their ID

**Question:** Does Twenty support a "current user" dynamic filter? If yes, one "My Leads" view works for everyone. If no, need per-rep views.

### Task 1.4: Test Assignment Workflow in Twenty

Admin workflow (in Twenty CRM UI):
1. Go to People
2. Select lead(s)
3. Edit → Set "Assigned Rep ID" field
4. Save

This must work without any code/CLI.

---

## Phase 2: ADS Dashboard Integration

### Task 2.1: Dashboard Reflects Twenty Assignment

The current implementation already:
- Fetches `assignedToWorkspaceMemberId` from Twenty
- Filters leads by current user's workspaceMemberId
- Shows admin toggle for viewing all leads

This is correct as an INTEGRATION - it reads from Twenty.

### Task 2.2: Remove or Simplify Dashboard Assignment UI

Options:
- **Option A:** Remove AssignRepDropdown from dashboard - assignment only in Twenty
- **Option B:** Keep it as a convenience mirror - updates go to Twenty via GraphQL

Recommend Option B - keeps dashboard self-contained while Twenty remains source of truth.

### Task 2.3: Link to Twenty from Dashboard

Add quick link: "Manage in Twenty CRM" that opens twenty.ripemerchant.host/objects/people

---

## Phase 3: Rep Workflow Documentation

### For Reps:
1. Log into Twenty CRM (twenty.ripemerchant.host)
2. Go to People → "My Leads" view (or their named view)
3. Upload new leads via CSV import
4. New leads appear in their view (if auto-assign works, otherwise admin assigns)

### For Admin:
1. Log into Twenty CRM
2. Go to People → "All Leads" or "Unassigned Leads"
3. Select leads → Bulk edit → Set Assigned Rep ID
4. Leads now appear in that rep's view

### For Calling (ADS Dashboard):
1. Log into ADS Dashboard (helm.ripemerchant.host)
2. Dialer automatically shows leads assigned to logged-in rep
3. No configuration needed - reads from Twenty

---

## Investigation Needed

Before implementation, need to answer:

1. **Can Twenty's TEXT field show as dropdown?**
   - Or does it need to be RELATION type?

2. **Does Twenty support "current user" filter in views?**
   - If yes: One "My Leads" view works for all
   - If no: Need per-rep views or different approach

3. **Does Twenty have bulk edit for assignment?**
   - Admin needs to assign multiple leads at once

4. **Can Twenty auto-assign on import?**
   - When rep imports CSV, auto-set their ID as assignee

---

## Success Criteria (Revised)

- [ ] Admin can assign leads to reps **entirely in Twenty CRM UI**
- [ ] Reps can see only their leads in Twenty CRM (via view)
- [ ] Reps can upload leads in Twenty CRM
- [ ] ADS Dashboard reflects assignments from Twenty
- [ ] No CLI/code required for any lead management task
- [ ] Assignment persists and syncs correctly

---

## Next Steps

1. **Investigate Twenty CRM capabilities** (views, relations, bulk edit)
2. **Configure Twenty CRM** based on findings
3. **Test admin assignment workflow** in Twenty UI
4. **Test rep "My Leads" workflow** in Twenty UI
5. **Verify ADS Dashboard integration** still works
6. **Document workflows** for reps and admin
