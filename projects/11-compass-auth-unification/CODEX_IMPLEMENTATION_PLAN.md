# Codex Implementation Plan - Project 11

**COMPASS Auth Unification**
*Replace HELM_USERS with Twenty CRM auth*

---

## Status: READY FOR EXECUTION

---

## System Prompt

```
You are updating COMPASS authentication to use Twenty CRM.

Context:
- App: apps/compass (React + TypeScript + Vite)
- Problem: HELM_USERS array is hardcoded, Leigh (CMO) cannot access
- Solution: Use Twenty CRM for auth like Studio does

Key files:
- apps/compass/server/routes.ts - Add /api/twenty/auth endpoint
- apps/compass/client/src/lib/user-context.tsx - Replace HELM_USERS with Twenty auth
- apps/compass/client/src/components/LoginScreen.tsx - Email input instead of dropdown

Reference (working implementation):
- apps/studio/server/index.ts - Has /api/twenty/auth
- apps/studio/client/src/lib/user-context.tsx - Has inferRole() + fetchTwentyUser()
```

---

## Phase 1: Add Server Endpoint (CRITICAL)

### Task 1.1: Add /api/twenty/auth to routes.ts

**File:** `apps/compass/server/routes.ts`

Add this endpoint (copy from Studio, adapt for COMPASS routes pattern):

```typescript
// Add near the top with other imports
const TWENTY_CRM_URL = process.env.TWENTY_CRM_URL || "http://localhost:3001";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY || "";

// Add this route in registerRoutes function
app.post("/api/twenty/auth", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  if (!TWENTY_API_KEY) {
    return res.status(503).json({ error: "Twenty CRM not configured" });
  }

  try {
    const response = await fetch(`${TWENTY_CRM_URL}/rest/workspaceMembers`, {
      headers: {
        "Authorization": `Bearer ${TWENTY_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return res.status(503).json({ error: "Twenty CRM unavailable" });
    }

    const data = await response.json();
    const members = data.data?.workspaceMembers || data.workspaceMembers || [];

    // Find member by email
    const lowerEmail = email.toLowerCase();
    const member = members.find((m: any) =>
      m.email?.toLowerCase() === lowerEmail
    );

    if (member) {
      return res.json({
        success: true,
        user: {
          id: member.id,
          name: member.name?.firstName
            ? `${member.name.firstName} ${member.name.lastName}`
            : email.split("@")[0],
          email: member.email,
        },
      });
    }

    return res.status(404).json({
      success: false,
      error: "Not a workspace member. Contact admin for access.",
    });
  } catch (err) {
    console.error("[twenty/auth] Error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});
```

---

## Phase 2: Update Client Auth (CRITICAL)

### Task 2.1: Update user-context.tsx

**File:** `apps/compass/client/src/lib/user-context.tsx`

Replace the entire file with Twenty-based auth:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "coo" | "cmo" | "manager" | "rep";
  fieldops_agent_id: string;
  hasLiveWireAccess?: boolean;
  hasGuardianAccess?: boolean;
}

const ROLE_TO_AGENT: Record<string, string> = {
  owner: "guardian",
  coo: "fo-009",
  cmo: "fo-007",
  manager: "fo-010",
  rep: "fo-001",
};

function inferRole(email: string): User["role"] {
  const e = email.toLowerCase();
  if (e === "davide@admiralenergy.ai") return "owner";
  if (e === "nathanielj@admiralenergy.ai") return "coo";
  if (e === "leighe@ripemerchant.host") return "cmo";
  return "rep";
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  assignedAgentId: string;
  hasLiveWireAccess: boolean;
  hasGuardianAccess: boolean;
  isLoading: boolean;
  loginByEmail: (email: string) => Promise<User | null>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const STORAGE_KEY = "compass_current_user";

// Auth via backend proxy to Twenty CRM
async function fetchTwentyUser(email: string): Promise<User | null> {
  try {
    const response = await fetch("/api/twenty/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.warn("[Auth] Twenty lookup failed:", err.error);
      return null;
    }

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
      hasGuardianAccess: role === "owner",
    };
  } catch (err) {
    console.error("[Auth] Error:", err);
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.email) {
            const user = await fetchTwentyUser(parsed.email);
            if (user) {
              setCurrentUserState(user);
              setIsLoading(false);
              return;
            }
          }
        } catch {}
      }
      setCurrentUserState(null);
      setIsLoading(false);
    }
    init();
  }, []);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
  };

  const logout = () => {
    setCurrentUserState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const loginByEmail = async (email: string): Promise<User | null> => {
    const user = await fetchTwentyUser(email);
    if (user) {
      setCurrentUser(user);
      return user;
    }
    return null;
  };

  const assignedAgentId = currentUser?.fieldops_agent_id || "fo-001";
  const hasLiveWireAccess = currentUser?.hasLiveWireAccess || currentUser?.role === "owner" || false;
  const hasGuardianAccess = currentUser?.role === "owner";

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        assignedAgentId,
        hasLiveWireAccess,
        hasGuardianAccess,
        isLoading,
        loginByEmail,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
```

---

## Phase 3: Update Login Screen (HIGH)

### Task 3.1: Update LoginScreen.tsx

**File:** `apps/compass/client/src/components/LoginScreen.tsx`

Replace with email input form:

```typescript
import { useState } from "react";
import { useUser } from "../lib/user-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function LoginScreen() {
  const { loginByEmail } = useUser();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError("");

    const user = await loginByEmail(email.trim());

    if (!user) {
      setError("Email not found. You must be a Twenty CRM workspace member to access COMPASS.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">C</span>
            </div>
          </div>
          <CardTitle className="text-2xl">COMPASS</CardTitle>
          <CardDescription>
            Your AI-powered sales companion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? "Verifying..." : "Continue"}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Access is managed through Twenty CRM.
              <br />
              Contact your admin if you need access.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 4: Test & Deploy

### Task 4.1: Build and Restart

```bash
# Local build test
cd apps/compass && npm run build

# Deploy to droplet
ssh root@165.227.111.24 "cd /var/www/lids/apps/compass && git pull && npm run build && pm2 restart compass"
```

### Task 4.2: Test Login Flow

1. Visit `compass.ripemerchant.host`
2. Enter `leighe@ripemerchant.host`
3. **Expected:** Login succeeds, CMO role detected

4. Enter `thesolardistrict@gmail.com` (Edwin)
5. **Expected:** Login succeeds, rep role detected

6. Enter `notauser@example.com`
7. **Expected:** Error "Email not found"

---

## Verification Commands

```bash
# Check COMPASS is running
ssh root@165.227.111.24 "pm2 list | grep compass"

# Test Twenty auth endpoint
ssh root@165.227.111.24 "curl -X POST http://localhost:3101/api/twenty/auth -H 'Content-Type: application/json' -d '{\"email\":\"leighe@ripemerchant.host\"}'"

# Check logs for errors
ssh root@165.227.111.24 "pm2 logs compass --lines 20"
```

---

## Rollback

If login breaks:

```bash
# Revert changes
ssh root@165.227.111.24 "cd /var/www/lids && git checkout HEAD~1 -- apps/compass/"
ssh root@165.227.111.24 "cd /var/www/lids/apps/compass && npm run build && pm2 restart compass"
```

---

*Implementation plan ready for execution*
*Created: December 28, 2025*
