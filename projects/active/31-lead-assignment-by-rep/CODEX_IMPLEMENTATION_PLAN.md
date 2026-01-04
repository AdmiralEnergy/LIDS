# Codex Implementation Plan - Project 31: Lead Assignment by Rep

## System Prompt

```
You are implementing per-rep lead assignment for the ADS Dashboard.

Context:
- App: apps/ads-dashboard (React + TypeScript + Vite + Refine)
- CRM: Twenty CRM (GraphQL API)
- Problem: All leads visible to all reps - no assignment capability
- Solution: Add assignedToWorkspaceMemberId field, filter leads by rep

Key Architecture:
- workspaceMemberId = permanent user identifier (never changes)
- Email is for login lookup only (can change)
- All stats/progression already use workspaceMemberId

Brand tokens:
- Navy: #0c2f4a
- Gold: #c9a648
- White: #f7f5f2
```

---

## Phase 1: Add Custom Field to Twenty CRM (MANUAL)

This must be done via Twenty CRM UI or admin script:

1. Go to https://twenty.ripemerchant.host
2. Settings → Data Model → People
3. Add field:
   - Name: `assignedToWorkspaceMemberId`
   - Label: "Assigned Rep ID"
   - Type: TEXT
   - Description: "WorkspaceMember ID of assigned rep"

**OR** run script:
```bash
cd C:\LifeOS\LIDS\scripts
python add_lead_assignment_field.py
```

---

## Phase 2: Update TypeScript Types

### Task 2.1: Update TwentyPerson Interface

**File:** `client/src/providers/twentyDataProvider.ts`

Find the `interface TwentyPerson` block and add the new field:

```typescript
interface TwentyPerson {
  id: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
  // ... existing fields ...
  tcpaStatus?: string;
  leadSource?: string;
  assignedToWorkspaceMemberId?: string;  // ADD THIS LINE
}
```

### Task 2.2: Update Lead Type in Shared Schema

**File:** `shared/schema.ts` (if exists) or update the Lead type wherever defined

Add to Lead interface:
```typescript
assignedToWorkspaceMemberId?: string;
```

### Task 2.3: Update mapPersonToLead Function

**File:** `client/src/providers/twentyDataProvider.ts`

In the `mapPersonToLead` function, add the field mapping:

```typescript
function mapPersonToLead(person: TwentyPerson): Lead {
  // ... existing code ...

  return {
    id: person.id,
    name: fullName,
    email,
    phone,
    company,
    stage,
    status: person.tcpaStatus?.toLowerCase() || "new",
    icpScore: 50,
    source: person.leadSource || (person.linkedinLink?.primaryLinkUrl ? "LinkedIn" : "PropStream"),
    createdAt: person.createdAt ? new Date(person.createdAt) : new Date(),
    assignedToWorkspaceMemberId: person.assignedToWorkspaceMemberId,  // ADD THIS LINE
  };
}
```

---

## Phase 3: Update GraphQL Queries

### Task 3.1: Update getList Query

**File:** `client/src/providers/twentyDataProvider.ts`

In the `getList` function for "people" resource, add the field to the GraphQL query:

Find the people query and add `assignedToWorkspaceMemberId`:

```graphql
query GetPeople($first: Int, $after: String) {
  people(first: $first, after: $after) {
    edges {
      node {
        id
        name { firstName lastName }
        emails { primaryEmail }
        phones { primaryPhoneNumber }
        # ... existing fields ...
        tcpaStatus
        leadSource
        assignedToWorkspaceMemberId  # ADD THIS
      }
    }
    pageInfo { hasNextPage endCursor }
    totalCount
  }
}
```

### Task 3.2: Update getOne Query

In the `getOne` function for "people" resource, add the field:

```graphql
query GetPerson($id: ID!) {
  person(filter: { id: { eq: $id } }) {
    id
    name { firstName lastName }
    # ... existing fields ...
    assignedToWorkspaceMemberId  # ADD THIS
  }
}
```

### Task 3.3: Update create Mutation

In the `create` function for "people", add to mutation input:

```typescript
// In the inputData construction:
if (lead.assignedToWorkspaceMemberId) {
  inputData.assignedToWorkspaceMemberId = lead.assignedToWorkspaceMemberId;
}
```

### Task 3.4: Update update Mutation

In the `update` function for "people", add to updateData:

```typescript
// In the updateData construction:
if (lead.assignedToWorkspaceMemberId !== undefined) {
  updateData.assignedToWorkspaceMemberId = lead.assignedToWorkspaceMemberId;
}
```

---

## Phase 4: Create Lead Assignment Hook

### Task 4.1: Create useLeadAssignment Hook

**File:** `client/src/hooks/useLeadAssignment.ts`

```typescript
import { useUpdate, useNotification } from "@refinedev/core";
import { getWorkspaceMembers } from "../lib/twentyStatsApi";

interface WorkspaceMember {
  id: string;
  name: { firstName: string; lastName: string };
  userEmail: string;
}

export function useLeadAssignment() {
  const { mutate: updateLead } = useUpdate();
  const { open: notify } = useNotification();

  const assignLeadToRep = async (leadId: string, workspaceMemberId: string | null) => {
    try {
      await updateLead({
        resource: "people",
        id: leadId,
        values: {
          assignedToWorkspaceMemberId: workspaceMemberId,
        },
      });

      notify?.({
        type: "success",
        message: workspaceMemberId ? "Lead assigned" : "Lead unassigned",
      });
    } catch (error) {
      console.error("[LeadAssignment] Error:", error);
      notify?.({
        type: "error",
        message: "Failed to assign lead",
      });
    }
  };

  const bulkAssignLeads = async (leadIds: string[], workspaceMemberId: string) => {
    for (const leadId of leadIds) {
      await assignLeadToRep(leadId, workspaceMemberId);
    }
  };

  return {
    assignLeadToRep,
    bulkAssignLeads,
    getWorkspaceMembers,
  };
}
```

---

## Phase 5: Create AssignRepDropdown Component

### Task 5.1: Create Component

**File:** `client/src/components/leads/AssignRepDropdown.tsx`

```typescript
import { useState, useEffect } from "react";
import { Select, Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { getWorkspaceMembers } from "../../lib/twentyStatsApi";

interface Props {
  value?: string;
  onChange: (workspaceMemberId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface WorkspaceMember {
  id: string;
  name: { firstName: string; lastName: string };
  userEmail: string;
}

export function AssignRepDropdown({ value, onChange, disabled, placeholder = "Assign to..." }: Props) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        const data = await getWorkspaceMembers();
        setMembers(data);
      } catch (error) {
        console.error("[AssignRepDropdown] Error loading members:", error);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  if (loading) {
    return <Spin size="small" />;
  }

  return (
    <Select
      value={value || undefined}
      onChange={(val) => onChange(val || null)}
      disabled={disabled}
      placeholder={placeholder}
      allowClear
      style={{ width: "100%" }}
      options={members.map((m) => ({
        value: m.id,
        label: (
          <span>
            <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
            {m.name.firstName} {m.name.lastName}
          </span>
        ),
      }))}
    />
  );
}
```

---

## Phase 6: Add Lead Filtering

### Task 6.1: Update Dialer Page

**File:** `client/src/pages/dialer.tsx`

Add filtering logic after fetching leads:

```typescript
// Get current user's workspaceMemberId
const currentWorkspaceMemberId = localStorage.getItem('workspaceMemberId');
const isAdmin = localStorage.getItem('userEmail') === 'davide@admiralenergy.ai'; // or use isExecutive()

// Filter leads based on assignment
const filteredLeads = useMemo(() => {
  if (isAdmin || showAllLeads) {
    return rawLeads; // Admins see all
  }

  return rawLeads.filter(lead =>
    !lead.assignedToWorkspaceMemberId || // Unassigned = available
    lead.assignedToWorkspaceMemberId === currentWorkspaceMemberId // Assigned to me
  );
}, [rawLeads, currentWorkspaceMemberId, isAdmin, showAllLeads]);
```

Add toggle in UI:
```typescript
const [showAllLeads, setShowAllLeads] = useState(false);

// In render:
{isAdmin && (
  <Switch
    checked={showAllLeads}
    onChange={setShowAllLeads}
    checkedChildren="All Leads"
    unCheckedChildren="My Leads"
  />
)}
```

### Task 6.2: Update Leads Page

**File:** `client/src/pages/leads.tsx`

Add "Assigned To" column to table:

```typescript
// In columns definition:
{
  title: "Assigned To",
  dataIndex: "assignedToWorkspaceMemberId",
  key: "assignedTo",
  render: (workspaceMemberId: string, record: Lead) => (
    <AssignRepDropdown
      value={workspaceMemberId}
      onChange={(newId) => handleAssignLead(record.id, newId)}
    />
  ),
},
```

Add filter toggle:
```typescript
const [filterByMe, setFilterByMe] = useState(true);

const displayedLeads = filterByMe && !isAdmin
  ? leads.filter(l => !l.assignedToWorkspaceMemberId || l.assignedToWorkspaceMemberId === currentWorkspaceMemberId)
  : leads;
```

---

## Phase 7: Add Bulk Assignment

### Task 7.1: Add Bulk Actions to Leads Table

**File:** `client/src/pages/leads.tsx`

```typescript
const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
const { bulkAssignLeads, getWorkspaceMembers } = useLeadAssignment();

const rowSelection = {
  selectedRowKeys,
  onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
};

// Bulk assign button
<Dropdown
  menu={{
    items: workspaceMembers.map(m => ({
      key: m.id,
      label: `${m.name.firstName} ${m.name.lastName}`,
      onClick: () => bulkAssignLeads(selectedRowKeys, m.id),
    })),
  }}
>
  <Button disabled={selectedRowKeys.length === 0}>
    Assign Selected ({selectedRowKeys.length})
  </Button>
</Dropdown>
```

---

## Verification Commands

```bash
# Test the app builds
cd apps/ads-dashboard && npm run build

# Start dev server
npm run dev

# Test Twenty API (check field exists)
curl -X POST https://twenty.ripemerchant.host/graphql \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ people(first: 1) { edges { node { id assignedToWorkspaceMemberId } } } }"}'
```

---

## Rollback

If issues arise:
1. The field is optional - queries work without it
2. Remove filtering logic in dialer.tsx/leads.tsx
3. Remove AssignRepDropdown component usage
4. Field can stay in Twenty (harmless if unused)

---

## Success Verification

1. [ ] Navigate to Leads page → See "Assigned To" column
2. [ ] Click dropdown → See list of workspace members
3. [ ] Assign lead → Refresh → Assignment persists
4. [ ] Login as non-admin → Only see assigned/unassigned leads
5. [ ] Login as admin → See all leads with toggle
6. [ ] Select multiple leads → Bulk assign → All assigned
