# Project 5: REAL Sales Tool - Dialer Utility Overhaul

**Status:** In Progress
**Started:** December 25, 2025
**Priority:** CRITICAL

---

## Problem Statement

Phase 8 delivered a pretty phone-style UI that isn't actually useful for sales reps. The current dialer:

- Shows 500 leads where 300+ have no phone number
- Can't see full lead profile (12 phone fields hidden)
- Can't edit leads, add notes, or track history
- Keypad doesn't work (dead UI)
- SMS/Email don't persist (lost on refresh)
- No lead prioritization (random order)
- No caller ID display in mobile view
- Less functional than using your actual phone

**Core Question:** Why would a rep use this SaaS platform when they can have more control with their phone?

---

## Vision

Transform the dialer into a tool a sales rep would **CHOOSE** to use over their phone.

**Value Proposition:**
1. **Filtered queue** = No wasted time on uncallable leads
2. **ICP sorting** = Call the best leads first
3. **All phones visible** = Try cell2 if cell1 didn't answer
4. **Notes/history** = "Oh right, I talked to them yesterday about X"
5. **Persistence** = Pick up where you left off
6. **Auto-disposition** = Zero manual logging
7. **XP tracking** = Gamified motivation

---

## What a Rep Actually Needs

```
┌─────────────────────────────────────────────────────┐
│  JOHN SMITH                              ICP: 87   │
│  Highland Park, Denver CO                           │
├─────────────────────────────────────────────────────┤
│  PHONES                                             │
│  ┌─────────────────────────────────────────────┐    │
│  │ Cell 1: (555) 123-4567  [DIAL] [SMS]       │    │
│  │ Cell 2: (555) 123-4568  [DIAL] [SMS]       │    │
│  │ Landline: (555) 123-4569  [DIAL]           │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  EMAIL: john.smith@email.com  [COMPOSE]             │
├─────────────────────────────────────────────────────┤
│  NOTES (2)                                 [+ ADD]  │
│  "Left voicemail about solar savings" - 2h ago      │
│  "Initial contact via door knock" - Yesterday       │
├─────────────────────────────────────────────────────┤
│  CALL HISTORY                                       │
│  No Answer (12s) - Today 2:34pm                     │
│  Voicemail Left (45s) - Dec 23                      │
├─────────────────────────────────────────────────────┤
│  [EDIT LEAD]  [SCHEDULE]  [SKIP]                    │
└─────────────────────────────────────────────────────┘
```

---

## Core Problems to Fix

| Problem | Current State | Target State |
|---------|---------------|--------------|
| **Useless leads in queue** | 500 leads, 300+ no phone | Only show leads WITH phone numbers |
| **Hidden phone numbers** | Shows 1 phone | Show all 12 fields (cell1-4, landline1-4, etc.) |
| **Can't edit leads** | Read-only display | Full CRUD via Twenty GraphQL |
| **No notes** | None visible | Show/add notes per lead |
| **No call history** | None visible | Show past calls for this lead |
| **SMS doesn't persist** | Lost on refresh | Store in Dexie, show thread |
| **Email hidden** | Hook exists, no UI | Full email compose/send |
| **Random lead order** | Index 0 to 500 | Sort by ICP score (hot leads first) |
| **No caller ID** | Hidden | Show "Calling from: (704) XXX-XXXX" |
| **Dead keypad** | Doesn't work | Remove or make functional |

---

## Data Available (from Twenty CRM)

### Phone Fields (12 total)
```
cell1, cell2, cell3, cell4          // Cell phones
landline1, landline2, landline3, landline4  // Landlines
phone1, phone2                      // Generic
phones.primaryPhoneNumber           // Twenty native field
```

### DNC Status per Phone
```
cell1_dnc, cell2_dnc, ...           // Do Not Call flags
tcpaStatus: SAFE | MODERATE | DANGEROUS | DNC
```

### Other Lead Data
```
name, email1-3, company, jobTitle
street, city, state, zipCode
icpScore (0-100), leadSource
createdAt, lastContactDate
```

### Notes/Activities
- Notes table: title, body, personId
- CallRecords: duration, disposition, timestamp
- Tasks: title, status, dueDate

---

## Implementation Plan

### Step 1: Filter Leads to Callable Only [COMPLETE]

**File:** `pages/dialer.tsx`

```typescript
// BEFORE: Shows all 500 leads
const leads = (tableProps.dataSource || []) as Lead[];

// AFTER: Only leads with at least one phone number
const callableLeads = useMemo(() => {
  return leads.filter(lead => {
    const hasPhone = lead.phone || lead.cell1 || lead.cell2 ||
                     lead.landline1 || lead.landline2 ||
                     lead.phone1 || lead.phone2;
    return hasPhone;
  });
}, [leads]);
```

### Step 2: Sort by ICP Score [COMPLETE]

```typescript
const sortedLeads = useMemo(() => {
  return [...callableLeads].sort((a, b) => {
    return (b.icpScore || 0) - (a.icpScore || 0); // Highest first
  });
}, [callableLeads]);
```

### Step 3: Enhanced Lead Card with All Phones [IN PROGRESS]

**File:** `components/dialer/LeadCard.tsx`

```typescript
interface Lead {
  id: string;
  name?: string;
  phone?: string;      // Primary
  cell1?: string;
  cell2?: string;
  cell3?: string;
  cell4?: string;
  landline1?: string;
  landline2?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  icpScore?: number;
  tcpaStatus?: string;
}

// Helper to get all available phones
function getAvailablePhones(lead: Lead): Array<{number: string, type: string, isDnc: boolean}> {
  const phones = [];
  if (lead.cell1) phones.push({ number: lead.cell1, type: 'Cell 1', isDnc: false });
  if (lead.cell2) phones.push({ number: lead.cell2, type: 'Cell 2', isDnc: false });
  // ... etc for all 12 fields
  return phones;
}
```

### Step 4: Full Lead Profile View [PENDING]

**New Component:** `components/dialer/LeadProfile.tsx`

Full-screen slide-up panel showing:
- All phone numbers with individual dial/SMS buttons
- Email with compose button
- Notes list with add button
- Call history from Dexie
- Edit button → opens Twenty-style form
- ICP score badge
- Address/location
- TCPA status warning if dangerous/DNC

### Step 5: Add Notes Functionality [PENDING]

**Use existing Twenty GraphQL:**
```typescript
// Create note
createNote({
  resource: "notes",
  values: {
    title: "Call follow-up",
    body: noteText,
    personId: lead.id,
  }
});

// Fetch notes for lead
const { data: notes } = useList({
  resource: "notes",
  filters: [{ field: "personId", operator: "eq", value: lead.id }],
});
```

### Step 6: Show Call History [PENDING]

**From Dexie `activities` table:**
```typescript
const callHistory = useLiveQuery(async () => {
  return db.activities
    .where("leadId")
    .equals(lead.id)
    .and(a => a.type === "call")
    .reverse()
    .limit(10)
    .toArray();
}, [lead.id]);
```

### Step 7: SMS Persistence [PENDING]

**Add to Dexie schema in `lib/db.ts`:**
```typescript
smsMessages: '++id, leadId, phoneNumber, direction, text, timestamp, status'
```

**Modify `useSms.ts`:**
```typescript
// On send: save to Dexie
await db.smsMessages.add({
  leadId: currentLead.id,
  phoneNumber: toNumber,
  direction: 'sent',
  text: message,
  timestamp: new Date(),
  status: 'sent',
});

// On load: fetch from Dexie
const history = useLiveQuery(() =>
  db.smsMessages.where('leadId').equals(leadId).toArray()
);
```

### Step 8: Email Compose UI [PENDING]

**New Component:** `components/dialer/EmailComposer.tsx`

Slide-up panel with:
- To: (pre-filled from lead.email)
- Subject input
- Body textarea
- Quick templates dropdown
- Send button (uses existing useEmail hook)

### Step 9: Caller ID Display [PENDING]

**In LeadCard or CallControls:**
```tsx
<div className="caller-id">
  Calling from: {settings.smsPhoneNumber || 'Your Device'}
</div>
```

### Step 10: Remove/Fix Dead Keypad [PENDING]

Either:
- **Option A:** Remove keypad button entirely (cleanest)
- **Option B:** Wire up ApexKeypad to actually work with useDialer.appendDigit()

---

## File Changes Summary

| File | Action | Changes | Status |
|------|--------|---------|--------|
| `pages/dialer.tsx` | Modify | Filter leads, sort by ICP, pass full lead data | COMPLETE |
| `components/dialer/LeadCard.tsx` | Modify | Show all phones, ICP badge, expand for full profile | IN PROGRESS |
| `components/dialer/LeadProfile.tsx` | **CREATE** | Full lead view with notes, history, edit | PENDING |
| `components/dialer/PhoneList.tsx` | **CREATE** | List of all phone numbers with dial/SMS buttons | PENDING |
| `components/dialer/NotesList.tsx` | **CREATE** | Show/add notes for lead | PENDING |
| `components/dialer/CallHistory.tsx` | **CREATE** | Past calls from Dexie | PENDING |
| `components/dialer/EmailComposer.tsx` | **CREATE** | Email compose UI | PENDING |
| `components/dialer/MobileDialer.tsx` | Modify | Integrate new components | PENDING |
| `lib/db.ts` | Modify | Add smsMessages table | PENDING |
| `hooks/useSms.ts` | Modify | Persist to Dexie | PENDING |

---

## UI Flow

```
Lead Queue (filtered, sorted by ICP)
    ↓
Lead Card (compact view)
  - Name, primary phone, ICP badge
  - Tap → Expand to full profile
    ↓
Full Profile View
  - All phones (each with Dial/SMS button)
  - Email (with Compose button)
  - Notes (with Add button)
  - Call history
  - Edit Lead button
    ↓
Tap Dial on specific phone
    ↓
Call screen (shows which number being called)
    ↓
Call ends → Auto-disposition
    ↓
Next lead (auto-advance)
```

---

## Success Criteria

- [x] Only leads WITH phone numbers appear in queue
- [x] Leads sorted by ICP score (hottest first)
- [x] Can see all 12 phone numbers for a lead
- [x] Can dial ANY phone number, not just primary
- [x] Can SMS any cell number
- [ ] Can add notes to leads
- [ ] Can see call history per lead
- [ ] SMS messages persist (survive refresh)
- [ ] Can compose/send email
- [ ] Can edit lead details
- [x] Shows caller ID ("Calling from: XXX")
- [x] No dead/broken UI elements (keypad removed)
- [x] Documentation updated (LIDS_DASHBOARD.md, ARCHITECTURE.md)

---

## Implementation Priority

| Task | Effort | Status |
|------|--------|--------|
| Filter + Sort leads | 30 min | COMPLETE |
| Full phone list | 1 hour | COMPLETE |
| Caller ID display | 15 min | COMPLETE |
| Remove dead keypad | 10 min | COMPLETE |
| Lead profile view | 2 hours | PENDING |
| Notes integration | 1 hour | PENDING |
| Call history | 1 hour | PENDING |
| SMS persistence | 1 hour | PENDING |
| Email composer | 1 hour | PENDING |
| Edit lead | 2 hours | PENDING |

**Completed:** ~2 hours
**Total Remaining:** ~8 hours

---

## Technical Notes

### ExtendedLead Interface
Added to `dialer.tsx` to support PropStream fields:
```typescript
interface ExtendedLead extends Lead {
  cell1?: string | null;
  cell2?: string | null;
  cell3?: string | null;
  cell4?: string | null;
  landline1?: string | null;
  landline2?: string | null;
  landline3?: string | null;
  landline4?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  tcpaStatus?: string | null;
  cell1_dnc?: boolean | null;
  // ... more fields
}
```

### Twenty CRM Integration
- GraphQL endpoint for notes CRUD
- Refine.dev useCreate/useList hooks
- Activity logging via existing hooks

### Dexie Schema Extension
Need to add SMS persistence table.

---

*Last Updated: December 25, 2025*
