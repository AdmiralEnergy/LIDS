# Project 11: COMPASS Auth Unification - Audit

## Executive Summary

COMPASS uses a deprecated HELM_USERS array for authentication instead of Twenty CRM. This prevents new users (like Leigh/CMO) from accessing the app and creates maintenance burden. The solution is to replicate Studio's Twenty CRM auth pattern.

---

## Current State Analysis

### Authentication Flow (BROKEN)

```
User visits compass.ripemerchant.host
         │
         ▼
┌─────────────────────────────────────────────────┐
│  user-context.tsx                                │
│                                                  │
│  1. Check localStorage for stored user           │
│  2. Lookup in HELM_USERS[] array                 │◄── PROBLEM: 6 hardcoded users only
│  3. If not found, show LoginScreen               │
└─────────────────────────────────────────────────┘
         │
         ▼
LoginScreen.tsx
         │
         ▼
Email dropdown → Only HELM_USERS emails shown
         │
         ▼
Leigh can't log in - her email not in list
```

---

## Critical Issues

### C1: HELM_USERS Array Deprecated

- **Severity:** HIGH
- **Location:** `apps/compass/client/src/lib/user-context.tsx:8-15`
- **Impact:** Only 6 hardcoded users can access COMPASS
- **Evidence:**

```typescript
export const HELM_USERS: User[] = [
  { id: '1', name: 'David Edwards', email: 'davide@admiralenergy.ai', role: 'owner', ... },
  { id: '2', name: 'Nate Jenkins', email: 'nathanielj@admiralenergy.ai', role: 'coo', ... },
  { id: '3', name: 'Edwin Stewart', email: 'thesolardistrict@gmail.com', role: 'rep', ... },
  { id: '4', name: 'Loie Hallug', email: 'info@thekardangroupltd.com', role: 'rep', ... },
  { id: '5', name: 'Kareem Hallug', email: 'khallug@kardansolar.com', role: 'rep', ... },
  { id: '6', name: 'Jonathan Lindqvist', email: 'lindqvist@logicside.co', role: 'rep', ... },
];
// LEIGH (leighe@ripemerchant.host) NOT IN LIST
```

### C2: No /api/twenty/auth Endpoint

- **Severity:** HIGH
- **Location:** `apps/compass/server/routes.ts`
- **Impact:** Cannot validate users against Twenty CRM
- **Evidence:** Searched routes.ts - no twenty auth endpoint exists

### C3: LoginScreen Uses Dropdown

- **Severity:** MEDIUM
- **Location:** `apps/compass/client/src/components/LoginScreen.tsx`
- **Impact:** Users can only select from HELM_USERS dropdown
- **Root Cause:** UI designed for static user list, not dynamic auth

---

## Target State

### Authentication Flow (TARGET)

```
User visits compass.ripemerchant.host
         │
         ▼
┌─────────────────────────────────────────────────┐
│  App checks for valid Twenty session             │
│  (cookie/token from previous login)              │
└─────────────────────────────────────────────────┘
         │
         ├── No session? ──────────────────────────┐
         │                                          │
         ▼                                          ▼
Redirect to twenty.ripemerchant.host     Call /api/twenty/auth
         │                                          │
         ▼                                          ▼
User logs in at Twenty              inferRole(email) → owner/cmo/rep
         │                                          │
         ▼                                          ▼
Redirect back to COMPASS              Show role-appropriate content
```

---

## Files to Modify

| File | Current State | Target State |
|------|---------------|--------------|
| `apps/compass/server/routes.ts` | No /api/twenty/auth | Add endpoint (copy from Studio) |
| `apps/compass/client/src/lib/user-context.tsx` | HELM_USERS array | fetchTwentyUser() + inferRole() |
| `apps/compass/client/src/components/LoginScreen.tsx` | Dropdown from HELM_USERS | Email input + Twenty redirect |

---

## Reference: Studio Implementation

### Server Endpoint (`apps/studio/server/index.ts`)

```typescript
app.post("/api/twenty/auth", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const TWENTY_URL = process.env.TWENTY_CRM_URL || "http://localhost:3001";
  const TWENTY_KEY = process.env.TWENTY_API_KEY || "";

  try {
    const response = await fetch(`${TWENTY_URL}/rest/workspaceMembers`, {
      headers: {
        "Authorization": `Bearer ${TWENTY_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    const members = data.data?.workspaceMembers || [];
    const lowerEmail = email.toLowerCase();
    const member = members.find(m => m.email?.toLowerCase() === lowerEmail);

    if (member) {
      return res.json({
        success: true,
        user: {
          id: member.id,
          name: member.name?.firstName ?
            `${member.name.firstName} ${member.name.lastName}` :
            email.split('@')[0],
          email: member.email,
        }
      });
    }

    return res.status(404).json({ success: false, error: "Not a workspace member" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Server error" });
  }
});
```

### Client Auth (`apps/studio/client/src/lib/user-context.tsx`)

```typescript
function inferRole(email: string): User["role"] {
  const e = email.toLowerCase();
  if (e === "davide@admiralenergy.ai") return "owner";
  if (e === "nathanielj@admiralenergy.ai") return "coo";
  if (e === "leighe@ripemerchant.host") return "cmo";
  return "rep";
}

async function fetchTwentyUser(email: string): Promise<User | null> {
  try {
    const response = await fetch("/api/twenty/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.success || !data.user) return null;

    const role = inferRole(email);
    return {
      id: data.user.id,
      name: data.user.name || email.split("@")[0],
      email: email.toLowerCase(),
      role,
      fieldops_agent_id: ROLE_TO_AGENT[role] || "fo-001",
      hasLiveWireAccess: ["owner", "coo", "cmo"].includes(role),
    };
  } catch {
    return null;
  }
}
```

---

## Success Criteria

- [ ] /api/twenty/auth endpoint added to COMPASS server
- [ ] HELM_USERS array removed from user-context.tsx
- [ ] inferRole() function added
- [ ] fetchTwentyUser() function added
- [ ] LoginScreen uses email input instead of dropdown
- [ ] Unauthenticated users redirect to Twenty login
- [ ] Leigh (CMO) can access COMPASS

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing user logins | Medium | HIGH | Test with all current users before deploy |
| Twenty API failure | Low | HIGH | Add error handling, show helpful message |
| Role detection mismatch | Low | MEDIUM | Test all roles explicitly |

---

*Audit completed: December 28, 2025*
