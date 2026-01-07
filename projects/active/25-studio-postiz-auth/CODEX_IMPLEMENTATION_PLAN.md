# Codex Implementation Plan - Studio Postiz Authentication

## System Prompt

```
You are implementing Postiz-based authentication for Studio Dashboard.

Context:
- App: apps/studio (React + TypeScript + Vite + Express)
- Current: Uses Twenty CRM for auth (being replaced)
- Target: Use Postiz PostgreSQL for auth
- Postiz DB: postgresql://postiz:PASSWORD@100.125.221.62:5432/postiz

Key concepts:
- postizUserId: Permanent UUID from Postiz User.id (never changes)
- email: Mutable, used for login lookup only
- role: SUPERADMIN (David), ADMIN (Leigh), USER (others)

Critical files:
- server/routes.ts - Backend auth endpoints
- client/src/lib/postiz-user-context.tsx - Frontend auth context (NEW)
- client/src/App.tsx - Auth gating
- .env - Database connection string
```

---

## Phase 1: Infrastructure Setup (CRITICAL)

### Task 1.1: Expose PostgreSQL Port on Oracle ARM

**Location:** Oracle ARM (lifeos-arm) via SSH

```bash
# SSH to Oracle ARM
ssh ubuntu@100.125.221.62

# Edit docker-compose.yml
cd ~/postiz
nano docker-compose.yml

# Add ports to postiz-postgres service:
# services:
#   postiz-postgres:
#     ...
#     ports:
#       - "5432:5432"

# Restart stack
sudo docker-compose down
sudo docker-compose up -d
```

### Task 1.2: Get Database Password

```bash
# On Oracle ARM
cat ~/postiz/.env | grep DATABASE_URL
# Extract password from: postgresql://postiz:PASSWORD@postiz-postgres:5432/postiz
```

### Task 1.3: Test Connection from Droplet

```bash
# On Droplet (where Studio runs)
ssh root@100.94.207.1

# Install psql if needed
apt-get install postgresql-client

# Test connection via Tailscale IP
psql postgresql://postiz:PASSWORD@100.125.221.62:5432/postiz -c "SELECT COUNT(*) FROM \"User\""
```

---

## Phase 2: Backend Auth Endpoints

### Task 2.1: Add PostgreSQL Client

**File:** `apps/studio/server/routes.ts`

Add at top of file:
```typescript
import pg from 'pg';
const { Pool } = pg;

// Postiz PostgreSQL connection
const postizPool = process.env.POSTIZ_DB_URL ? new Pool({
  connectionString: process.env.POSTIZ_DB_URL,
  ssl: false, // Internal Tailscale connection
}) : null;
```

### Task 2.2: Create Auth Endpoint

**File:** `apps/studio/server/routes.ts`

Add endpoint:
```typescript
// Postiz Authentication - Find user by email
app.post('/api/postiz/auth', async (req, res) => {
  if (!postizPool) {
    return res.status(503).json({
      error: 'Postiz database not configured',
      connected: false
    });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const result = await postizPool.query(`
      SELECT
        u.id,
        u.email,
        u.activated,
        u."isSuperAdmin",
        uo.role,
        o.id as "orgId",
        o.name as "orgName"
      FROM "User" u
      LEFT JOIN "UserOrganization" uo ON u.id = uo."userId"
      LEFT JOIN "Organization" o ON uo."organizationId" = o.id
      WHERE LOWER(u.email) = LOWER($1)
    `, [email.trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found. Please register at Postiz first.',
        connected: true
      });
    }

    const user = result.rows[0];

    if (!user.activated) {
      return res.status(401).json({
        error: 'Account not activated. Please check your email.',
        connected: true
      });
    }

    // Determine effective role
    let role = user.role || 'USER';
    if (user.isSuperAdmin) {
      role = 'SUPERADMIN';
    }

    res.json({
      id: user.id,
      email: user.email,
      role: role,
      orgId: user.orgId,
      orgName: user.orgName,
      connected: true
    });

  } catch (error) {
    console.error('[Postiz Auth] Database error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      connected: false
    });
  }
});
```

### Task 2.3: Create Validate Endpoint

**File:** `apps/studio/server/routes.ts`

Add endpoint:
```typescript
// Postiz Authentication - Validate stored user ID
app.post('/api/postiz/validate', async (req, res) => {
  if (!postizPool) {
    return res.status(503).json({
      error: 'Postiz database not configured',
      valid: false
    });
  }

  const { userId } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID required', valid: false });
  }

  try {
    const result = await postizPool.query(`
      SELECT
        u.id,
        u.email,
        u.activated,
        u."isSuperAdmin",
        uo.role,
        o.id as "orgId"
      FROM "User" u
      LEFT JOIN "UserOrganization" uo ON u.id = uo."userId"
      LEFT JOIN "Organization" o ON uo."organizationId" = o.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({ valid: false, error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.activated) {
      return res.json({ valid: false, error: 'Account deactivated' });
    }

    let role = user.role || 'USER';
    if (user.isSuperAdmin) {
      role = 'SUPERADMIN';
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: role,
        orgId: user.orgId
      }
    });

  } catch (error) {
    console.error('[Postiz Validate] Database error:', error);
    res.status(500).json({ valid: false, error: 'Database error' });
  }
});
```

### Task 2.4: Add Status Endpoint

**File:** `apps/studio/server/routes.ts`

```typescript
// Postiz connection status
app.get('/api/postiz/status', async (req, res) => {
  if (!postizPool) {
    return res.json({ connected: false, error: 'Not configured' });
  }

  try {
    await postizPool.query('SELECT 1');
    res.json({ connected: true });
  } catch (error) {
    res.json({ connected: false, error: 'Connection failed' });
  }
});
```

---

## Phase 3: Frontend Auth Context

### Task 3.1: Create Postiz User Context

**File:** `apps/studio/client/src/lib/postiz-user-context.tsx` (NEW)

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// User interface matching Postiz structure
export interface PostizUser {
  id: string;           // Permanent UUID from Postiz
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'USER';
  orgId?: string;
  orgName?: string;
}

interface UserContextType {
  currentUser: PostizUser | null;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  loginByEmail: (email: string) => Promise<PostizUser | null>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEY = 'studio_postiz_user';
const USER_ID_KEY = 'postizUserId';

export function PostizUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<PostizUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate stored user ID on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const storedUserId = localStorage.getItem(USER_ID_KEY);

      if (storedUserId) {
        setIsValidating(true);
        try {
          const response = await fetch('/api/postiz/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: storedUserId }),
          });

          const data = await response.json();

          if (data.valid && data.user) {
            setCurrentUser(data.user);
            // Update stored email in case it changed
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          } else {
            // Session invalid - clear storage
            console.warn('[PostizAuth] Stored session invalid:', data.error);
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(USER_ID_KEY);
          }
        } catch (err) {
          console.error('[PostizAuth] Validation error:', err);
          // Keep user logged in if validation fails (network issue)
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              setCurrentUser(JSON.parse(stored));
            } catch {}
          }
        }
        setIsValidating(false);
      }

      setIsLoading(false);
    }

    init();
  }, []);

  // Login by email
  const loginByEmail = useCallback(async (email: string): Promise<PostizUser | null> => {
    setError(null);

    try {
      const response = await fetch('/api/postiz/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.id) {
        setError(data.error || 'Login failed');
        return null;
      }

      const user: PostizUser = {
        id: data.id,
        email: data.email,
        role: data.role,
        orgId: data.orgId,
        orgName: data.orgName,
      };

      // Store in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(USER_ID_KEY, user.id);

      setCurrentUser(user);
      return user;

    } catch (err) {
      console.error('[PostizAuth] Login error:', err);
      setError('Connection failed. Please try again.');
      return null;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    setCurrentUser(null);
  }, []);

  return (
    <UserContext.Provider value={{
      currentUser,
      isLoading,
      isValidating,
      error,
      loginByEmail,
      logout,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function usePostizUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('usePostizUser must be used within PostizUserProvider');
  }
  return context;
}

// Helper to get stored user ID
export function getStoredPostizUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}
```

### Task 3.2: Update App.tsx

**File:** `apps/studio/client/src/App.tsx`

Replace UserProvider with PostizUserProvider:

```typescript
// Change imports
import { PostizUserProvider, usePostizUser } from './lib/postiz-user-context';

// In AppContent component, change:
// const { currentUser, isLoading } = useUser();
// to:
const { currentUser, isLoading } = usePostizUser();

// In root App component, change:
// <UserProvider>
// to:
<PostizUserProvider>
  {/* ... */}
</PostizUserProvider>
```

---

## Phase 4: Login Screen Update (Optional)

### Task 4.1: Update Error Message

**File:** `apps/studio/client/src/components/MarketingLoginScreen.tsx`

Update error message to reference Postiz:

```typescript
// Change error message from Twenty to Postiz
// "Access denied. You must be an Admiral Energy team member."
// to:
"Access denied. Please register at postiz.ripemerchant.host first."
```

---

## Phase 5: Environment & Deployment

### Task 5.1: Add Environment Variable

**File:** `apps/studio/.env` (local dev)

```env
# Postiz Database (PostgreSQL on Oracle ARM via Tailscale)
POSTIZ_DB_URL=postgresql://postiz:PASSWORD@100.125.221.62:5432/postiz
```

### Task 5.2: Update Droplet Environment

```bash
ssh root@100.94.207.1

# Edit Studio environment
nano /var/www/lids/apps/studio/.env

# Add:
POSTIZ_DB_URL=postgresql://postiz:PASSWORD@100.125.221.62:5432/postiz

# Restart Studio
pm2 restart studio
```

### Task 5.3: Add pg Dependency

```bash
cd apps/studio
npm install pg @types/pg
```

---

## Phase 6: Invite Leigh to Postiz

### Task 6.1: Create Leigh's Account

In Postiz UI (https://postiz.ripemerchant.host):
1. Login as David (davide@admiralenergy.ai)
2. Go to Settings → Teams
3. Invite: leighe@ripemerchant.host
4. Role: Select ADMIN (or add as ADMIN after join)

### Task 6.2: Verify in Database

```sql
-- Check Leigh's account
SELECT u.id, u.email, u.activated, uo.role
FROM "User" u
LEFT JOIN "UserOrganization" uo ON u.id = uo."userId"
WHERE u.email = 'leighe@ripemerchant.host';
```

---

## Verification Commands

### Test Auth Endpoint
```bash
curl -X POST https://studio.ripemerchant.host/api/postiz/auth \
  -H "Content-Type: application/json" \
  -d '{"email": "davide@admiralenergy.ai"}'
```

Expected response:
```json
{
  "id": "uuid-xxx",
  "email": "davide@admiralenergy.ai",
  "role": "SUPERADMIN",
  "orgId": "uuid-yyy",
  "connected": true
}
```

### Test Validate Endpoint
```bash
curl -X POST https://studio.ripemerchant.host/api/postiz/validate \
  -H "Content-Type: application/json" \
  -d '{"userId": "uuid-xxx"}'
```

### Test Status Endpoint
```bash
curl https://studio.ripemerchant.host/api/postiz/status
```

---

## Rollback Plan

If Postiz auth fails:

1. **Revert App.tsx:**
   ```typescript
   // Change back to:
   import { UserProvider, useUser } from './lib/user-context';
   ```

2. **Restore Twenty env vars on Droplet**

3. **Restart Studio:**
   ```bash
   pm2 restart studio
   ```

---

## Success Criteria

- [ ] David can login with davide@admiralenergy.ai
- [ ] David shows as SUPERADMIN
- [ ] Leigh can login with leighe@ripemerchant.host (after invite)
- [ ] Leigh shows as ADMIN
- [ ] Invalid email shows proper error
- [ ] Unactivated user cannot login
- [ ] Session persists across refreshes
- [ ] Stored userId validated on each app load
- [ ] Removing user from Postiz revokes Studio access

---

*Implementation Plan v1.0 - January 7, 2026*
