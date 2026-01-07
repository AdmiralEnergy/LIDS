# Studio Postiz Auth - Audit Findings

## Current Authentication Comparison

### ADS Dashboard (Twenty CRM Auth)
```
File: apps/ads-dashboard/client/src/lib/user-context.tsx

Flow:
1. User enters email
2. Server queries Twenty GraphQL: workspaceMembers
3. Find member by email match
4. Store workspaceMemberId (permanent UUID)
5. On reload: validate ID still exists in workspace

Key identifiers:
- workspaceMemberId: "20202020-xxxx-xxxx-xxxx-xxxxxxxxxxxx" (permanent)
- email: mutable, can be changed

Storage keys:
- ads_current_user: { id, email }
- twentyWorkspaceMemberId: "uuid"
```

### Studio Dashboard (Current - Also Twenty)
```
File: apps/studio/client/src/lib/user-context.tsx

Flow:
1. User enters email
2. Server queries Twenty: /rest/workspaceMembers
3. Match by email
4. Return user object with hardcoded role based on email

Problems:
- Uses email as primary key (not workspaceMemberId)
- Roles hardcoded by email pattern
- If Leigh changes email, she loses access
```

---

## Postiz Database Schema (from earlier session)

```sql
-- User table
CREATE TABLE "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    activated BOOLEAN DEFAULT false,
    "isSuperAdmin" BOOLEAN DEFAULT false,
    "activationToken" TEXT,
    "forgotPasswordToken" TEXT,
    "providerId" TEXT,
    "providerName" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Organization table
CREATE TABLE "Organization" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "apiKey" TEXT UNIQUE,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- UserOrganization junction table
CREATE TABLE "UserOrganization" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "User"(id),
    "organizationId" UUID REFERENCES "Organization"(id),
    role TEXT DEFAULT 'USER', -- SUPERADMIN, ADMIN, USER
    disabled BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW()
);
```

---

## Current Postiz Users (from earlier session)

| Email | Role | Status |
|-------|------|--------|
| davide@admiralenergy.ai | SUPERADMIN | Activated |
| leighe@ripemerchant.host | (not yet invited) | Pending |

---

## Authentication Architecture Options

### Option A: Direct PostgreSQL Connection

```
Studio Backend ──(pg connection)──> Postiz PostgreSQL (Oracle ARM)
```

**Implementation:**
```typescript
// routes.ts
import { Pool } from 'pg';

const postizDb = new Pool({
  connectionString: process.env.POSTIZ_DB_URL
  // postgresql://postiz:password@100.125.221.62:5432/postiz
});

app.post('/api/postiz/auth', async (req, res) => {
  const { email } = req.body;

  const result = await postizDb.query(`
    SELECT u.id, u.email, u.activated, uo.role, o.id as "orgId"
    FROM "User" u
    JOIN "UserOrganization" uo ON u.id = uo."userId"
    JOIN "Organization" o ON uo."organizationId" = o.id
    WHERE LOWER(u.email) = LOWER($1)
    AND u.activated = true
    AND uo.disabled = false
  `, [email]);

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'User not found or not activated' });
  }

  res.json(result.rows[0]);
});
```

**Pros:**
- Full control, reliable
- Can add custom queries
- No Postiz API limitations

**Cons:**
- Need to expose PostgreSQL port (5432) to Tailscale
- Need database password in Studio .env
- Bypasses Postiz app layer

---

### Option B: Postiz Internal API (Frontend API)

Postiz frontend uses undocumented API endpoints. We could use those.

**Research needed:** Intercept Postiz frontend network calls to find user endpoints.

**Likely endpoints:**
- `POST /api/auth/login` - Login with email/password
- `GET /api/user/me` - Get current user (requires session)

**Pros:**
- Uses Postiz's own auth
- No database credentials needed

**Cons:**
- Undocumented, may change
- Requires session management
- More complex

---

### Option C: Postiz Cookie/Session Sharing

If user is logged into Postiz, Studio could validate that session.

**Implementation:**
- Redirect to Postiz login
- Postiz sets cookie
- Studio reads cookie, validates with Postiz

**Pros:**
- True SSO
- User only logs in once

**Cons:**
- Complex cookie sharing
- Same-domain requirements
- Postiz may not support this

---

## Recommended: Option A (Direct DB)

Direct PostgreSQL is most reliable for self-hosted instance.

### Steps to Enable

1. **Expose PostgreSQL port on Oracle ARM:**
   ```bash
   # On lifeos-arm, edit docker-compose.yml
   services:
     postiz-postgres:
       ports:
         - "5432:5432"  # Add this line
   ```

2. **Get database password:**
   ```bash
   ssh ubuntu@100.125.221.62 "cat ~/postiz/.env | grep DATABASE_URL"
   ```

3. **Add to Studio .env:**
   ```env
   POSTIZ_DB_URL=postgresql://postiz:PASSWORD@100.125.221.62:5432/postiz
   ```

4. **Security: Tailscale-only access**
   - PostgreSQL only accessible via Tailscale IPs (100.x.x.x)
   - Not exposed to public internet

---

## User Identity Model for Studio

```typescript
interface PostizUser {
  id: string;           // Postiz User.id (UUID) - PERMANENT
  email: string;        // Current email (mutable)
  role: 'SUPERADMIN' | 'ADMIN' | 'USER';
  orgId: string;        // Organization ID
  activated: boolean;
}

// Storage keys (similar to ADS)
const STORAGE_KEY = 'studio_current_user';
const POSTIZ_USER_ID_KEY = 'postizUserId';
```

---

## Role Mapping

| Postiz Role | Studio Access |
|-------------|---------------|
| SUPERADMIN | Full access (David) - all features, settings |
| ADMIN | Full access - content, calendar, chat |
| USER | Standard access - view, limited edit |

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `lib/postiz-auth.ts` | Database queries for auth |
| `lib/postiz-user-context.tsx` | React context (replaces user-context.tsx) |

### Modified Files
| File | Changes |
|------|---------|
| `server/routes.ts` | Add `/api/postiz/auth`, `/api/postiz/validate` |
| `App.tsx` | Use PostizUserProvider instead |
| `MarketingLoginScreen.tsx` | Update UI (optional) |
| `.env` | Add `POSTIZ_DB_URL` |

### Removed/Deprecated
| File | Action |
|------|--------|
| `lib/user-context.tsx` | Keep for reference, replace with postiz version |
| Twenty env vars | Remove `TWENTY_CRM_URL`, `TWENTY_API_KEY` |

---

## Migration Path

1. **Keep both auth systems temporarily**
   - Postiz auth: new provider
   - Twenty auth: existing (fallback)

2. **Feature flag approach:**
   ```typescript
   const usePostizAuth = process.env.VITE_AUTH_PROVIDER === 'postiz';
   ```

3. **Once Postiz works, remove Twenty**

---

## Testing Checklist

- [ ] David can login with davide@admiralenergy.ai
- [ ] David gets SUPERADMIN role
- [ ] Leigh can login with leighe@ripemerchant.host (after invite)
- [ ] Leigh gets appropriate role
- [ ] Invalid email shows error
- [ ] Inactive user cannot login
- [ ] Session persists across page reloads
- [ ] Stored userId validated on each load
- [ ] Logout clears session

---

## Open Questions for User

1. **Database access method:**
   - Direct PostgreSQL connection (recommended)
   - Or another approach?

2. **Leigh's Postiz account:**
   - Need to invite her first from Postiz UI
   - What role should she have? (ADMIN recommended)

3. **Should PostgreSQL be exposed to Tailscale?**
   - Required for Option A
   - Security: Only Tailscale IPs can access

---

*Audit completed: January 7, 2026*
