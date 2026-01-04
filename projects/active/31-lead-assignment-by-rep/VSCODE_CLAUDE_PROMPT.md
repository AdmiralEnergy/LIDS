# Project 31: Lead Assignment by Rep - VS Code Claude Execution Prompt

## OBJECTIVE

Implement per-rep lead assignment for ADS Dashboard. Currently ALL leads are visible to ALL reps. After this implementation:
- Leads can be assigned to specific reps via `assignedToWorkspaceMemberId` field
- Reps only see leads assigned to them (or unassigned leads)
- Admins (owner email: `davide@admiralenergy.ai`) see all leads with a toggle
- Assignment persists in Twenty CRM

---

## CRITICAL CONTEXT

### Repository
- **Path:** `C:\LifeOS\LIDS`
- **App:** `apps/ads-dashboard` (React + TypeScript + Vite + Refine.dev)
- **CRM:** Twenty CRM at `https://twenty.ripemerchant.host`

### Identity Architecture (MUST UNDERSTAND)
```
workspaceMemberId = PERMANENT user identifier (UUID, never changes)
email = MUTABLE lookup key (can be changed by user)

ALL data relationships use workspaceMemberId, NOT email.
```

### Key Files to Modify
| File | Purpose |
|------|---------|
| `client/src/providers/twentyDataProvider.ts` | GraphQL queries, TwentyPerson interface, mapPersonToLead |
| `client/src/pages/dialer.tsx` | Filter leads by assignment |
| `client/src/lib/twentyStatsApi.ts` | Has `getWorkspaceMembers()` function already |

### Key Files to Create
| File | Purpose |
|------|---------|
| `client/src/hooks/useLeadAssignment.ts` | Assignment logic hook |
| `client/src/components/leads/AssignRepDropdown.tsx` | Rep selection dropdown |

---

## PHASE 1: Add Field to Twenty CRM (MANUAL - Skip in code)

The field `assignedToWorkspaceMemberId` must be added to Twenty CRM manually:
1. Go to https://twenty.ripemerchant.host
2. Settings → Data Model → People
3. Add field: Name=`assignedToWorkspaceMemberId`, Type=TEXT

**Assume this field already exists when writing code.**

---

## PHASE 2: Update TypeScript Types

### Task 2.1: Update TwentyPerson Interface

**File:** `client/src/providers/twentyDataProvider.ts`

Find the `interface TwentyPerson` block (around line 13) and add:
```typescript
assignedToWorkspaceMemberId?: string;
```

### Task 2.2: Update mapPersonToLead Function

In the same file, find `function mapPersonToLead` and add to the return object:
```typescript
assignedToWorkspaceMemberId: person.assignedToWorkspaceMemberId,
```

### Task 2.3: Update Lead Interface

Find where the `Lead` type/interface is defined and add:
```typescript
assignedToWorkspaceMemberId?: string;
```

---

## PHASE 3: Update GraphQL Queries

### Task 3.1: Update getList Query for "people"

In `twentyDataProvider.ts`, find the GraphQL query for fetching people (search for `people(first:`). Add `assignedToWorkspaceMemberId` to the query fields:

```graphql
query {
  people(first: $first, after: $after) {
    edges {
      node {
        id
        name { firstName lastName }
        # ... existing fields ...
        assignedToWorkspaceMemberId  # ADD THIS
      }
    }
  }
}
```

### Task 3.2: Update create/update Mutations

In the `create` function for "people", ensure `assignedToWorkspaceMemberId` is included in the mutation input if provided.

In the `update` function for "people", ensure `assignedToWorkspaceMemberId` can be updated.

---

## PHASE 4: Create useLeadAssignment Hook

**Create file:** `client/src/hooks/useLeadAssignment.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { getWorkspaceMembers } from "../lib/twentyStatsApi";
import { getTwentyCrmUrl, getSettings } from "../lib/settings";

interface WorkspaceMember {
  id: string;
  name: { firstName: string; lastName: string };
  userEmail: string;
}

export function useLeadAssignment() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkspaceMembers();
        setMembers(data);
      } catch (e) {
        console.error("[useLeadAssignment] Failed to load members:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const assignLead = useCallback(async (leadId: string, workspaceMemberId: string | null) => {
    const settings = getSettings();
    const apiUrl = getTwentyCrmUrl();

    const mutation = `
      mutation UpdatePerson($id: ID!, $data: PersonUpdateInput!) {
        updatePerson(id: $id, data: $data) {
          id
          assignedToWorkspaceMemberId
        }
      }
    `;

    try {
      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.twentyApiKey}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            id: leadId,
            data: { assignedToWorkspaceMemberId: workspaceMemberId },
          },
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }
      return result.data?.updatePerson;
    } catch (error) {
      console.error("[useLeadAssignment] Failed to assign lead:", error);
      throw error;
    }
  }, []);

  const bulkAssign = useCallback(async (leadIds: string[], workspaceMemberId: string) => {
    const results = [];
    for (const id of leadIds) {
      try {
        const result = await assignLead(id, workspaceMemberId);
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error });
      }
    }
    return results;
  }, [assignLead]);

  const getMemberName = useCallback((workspaceMemberId: string | null | undefined) => {
    if (!workspaceMemberId) return "Unassigned";
    const member = members.find(m => m.id === workspaceMemberId);
    return member ? `${member.name.firstName} ${member.name.lastName}` : "Unknown";
  }, [members]);

  return {
    members,
    loading,
    assignLead,
    bulkAssign,
    getMemberName,
  };
}
```

---

## PHASE 5: Create AssignRepDropdown Component

**Create file:** `client/src/components/leads/AssignRepDropdown.tsx`

```typescript
import { useState } from "react";
import { useLeadAssignment } from "../../hooks/useLeadAssignment";
import { ChevronDown, User, Loader2 } from "lucide-react";

interface Props {
  value?: string | null;
  onChange: (workspaceMemberId: string | null) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

export function AssignRepDropdown({ value, onChange, disabled, compact }: Props) {
  const { members, loading, getMemberName } = useLeadAssignment();
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleSelect = async (memberId: string | null) => {
    setUpdating(true);
    try {
      await onChange(memberId);
    } finally {
      setUpdating(false);
      setIsOpen(false);
    }
  };

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  }

  const displayName = getMemberName(value);

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || updating}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border border-border
                   hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                   ${compact ? 'text-xs' : 'text-sm'}`}
      >
        {updating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <User className="w-3 h-3 text-muted-foreground" />
        )}
        <span className={value ? '' : 'text-muted-foreground'}>
          {displayName}
        </span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
            <button
              onClick={() => handleSelect(null)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
            >
              <span className="text-muted-foreground">Unassigned</span>
            </button>
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member.id)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2
                           ${value === member.id ? 'bg-muted' : ''}`}
              >
                <User className="w-3 h-3 text-muted-foreground" />
                <span>{member.name.firstName} {member.name.lastName}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default AssignRepDropdown;
```

---

## PHASE 6: Update Dialer Page with Lead Filtering

**File:** `client/src/pages/dialer.tsx`

### Task 6.1: Add imports
```typescript
import { useLeadAssignment } from "../hooks/useLeadAssignment";
```

### Task 6.2: Add state for filtering
```typescript
const [showAllLeads, setShowAllLeads] = useState(false);
const { getMemberName } = useLeadAssignment();
```

### Task 6.3: Get current user and check admin status
```typescript
const currentWorkspaceMemberId = localStorage.getItem('workspaceMemberId') || localStorage.getItem('twentyWorkspaceMemberId');
const userEmail = localStorage.getItem('userEmail');
const isAdmin = userEmail === 'davide@admiralenergy.ai';
```

### Task 6.4: Filter leads (add after leads are fetched)
```typescript
const filteredLeads = useMemo(() => {
  if (!rawLeads) return [];

  // Admins can toggle to see all
  if (isAdmin && showAllLeads) {
    return rawLeads;
  }

  // Filter to show: unassigned leads OR leads assigned to current user
  return rawLeads.filter(lead =>
    !lead.assignedToWorkspaceMemberId ||
    lead.assignedToWorkspaceMemberId === currentWorkspaceMemberId
  );
}, [rawLeads, currentWorkspaceMemberId, isAdmin, showAllLeads]);
```

### Task 6.5: Add admin toggle in UI (somewhere in the header/controls area)
```typescript
{isAdmin && (
  <div className="flex items-center gap-2">
    <label className="text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={showAllLeads}
        onChange={(e) => setShowAllLeads(e.target.checked)}
        className="mr-2"
      />
      Show all leads
    </label>
  </div>
)}
```

### Task 6.6: Use filteredLeads instead of rawLeads
Replace usage of `rawLeads` with `filteredLeads` throughout the component where leads are displayed.

---

## PHASE 7: Add Assignment to Lead Cards/Details

If there's a `LeadCard.tsx` or lead detail view, add the AssignRepDropdown:

```typescript
import { AssignRepDropdown } from "./AssignRepDropdown";
import { useLeadAssignment } from "../../hooks/useLeadAssignment";

// Inside component:
const { assignLead } = useLeadAssignment();

// In render:
<AssignRepDropdown
  value={lead.assignedToWorkspaceMemberId}
  onChange={async (newId) => {
    await assignLead(lead.id, newId);
    // Trigger refetch of leads
  }}
  compact
/>
```

---

## VERIFICATION CHECKLIST

After implementation, verify:

1. [ ] Build succeeds: `cd apps/ads-dashboard && npm run build`
2. [ ] TwentyPerson interface has `assignedToWorkspaceMemberId`
3. [ ] Lead type has `assignedToWorkspaceMemberId`
4. [ ] GraphQL query includes `assignedToWorkspaceMemberId`
5. [ ] mapPersonToLead passes through the field
6. [ ] useLeadAssignment hook works
7. [ ] AssignRepDropdown component renders
8. [ ] Dialer filters leads correctly
9. [ ] Admin toggle works for davide@admiralenergy.ai

---

## DEPLOYMENT

After verification:
```bash
cd C:\LifeOS\LIDS
git add -A
git commit -m "feat(ads): implement per-rep lead assignment (Project 31)

- Add assignedToWorkspaceMemberId to Person schema
- Create useLeadAssignment hook for assignment logic
- Create AssignRepDropdown component
- Filter dialer leads by current user assignment
- Admin toggle to view all leads

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

Then deploy:
```bash
ssh root@100.94.207.1 "cd /var/www/lids && git pull && cd apps/ads-dashboard && npm run build && pm2 restart lids"
```

---

## IMPORTANT NOTES

1. **DO NOT** use email for assignment - use `workspaceMemberId` only
2. **DO NOT** break existing lead queries - the field is optional
3. **DO NOT** add mock data - this is production
4. The field may not exist in Twenty CRM yet - code should handle undefined gracefully
5. Use existing `getWorkspaceMembers()` from `twentyStatsApi.ts`
6. Follow existing code patterns in the codebase

---

## REFERENCE FILES

Read these files first to understand patterns:
- `client/src/providers/twentyDataProvider.ts` - GraphQL patterns
- `client/src/lib/twentyStatsApi.ts` - How workspaceMemberId is used
- `client/src/lib/twentySync.ts` - Current user identification
- `apps/ads-dashboard/twenty-crm/TWENTY_CRM_INTEGRATION.md` - Full context
