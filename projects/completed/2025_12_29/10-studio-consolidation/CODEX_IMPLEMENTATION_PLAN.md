# Codex Implementation Plan - Project 10

**Studio Consolidation & HELM Registry Fix**
*For execution on droplet via SSH*

---

## Status: READY FOR EXECUTION

---

## System Prompt

```
You are fixing the authentication and routing for the LIDS marketing dashboard.

Context:
- Apps: COMPASS (sales), Studio (marketing) - both on droplet 165.227.111.24
- Problem: CMO user (Leigh) cannot access Studio; HELM_USERS registry deprecated
- Solution: Use Twenty CRM for auth, add role-based redirect

Key insight:
- Studio app already works with Twenty auth (verified)
- COMPASS uses deprecated HELM_USERS hardcoded list
- Need to update COMPASS to use Twenty + redirect CMO to Studio

Files on droplet:
- /var/www/lids/apps/compass/client/src/lib/user-context.tsx
- /var/www/lids/apps/compass/client/src/components/LoginScreen.tsx
- /var/www/lids/apps/compass/client/src/App.tsx
```

---

## Phase 1: Update COMPASS Auth (CRITICAL)

### Task 1.1: Add Twenty Auth Function to COMPASS

**File:** `/var/www/lids/apps/compass/client/src/lib/user-context.tsx`

Add after the existing imports:

```typescript
// Role detection by email
function inferRole(email: string): User['role'] {
  const e = email.toLowerCase();
  if (e === 'davide@admiralenergy.ai') return 'owner';
  if (e === 'nathanielj@admiralenergy.ai') return 'coo';
  if (e === 'leighe@ripemerchant.host') return 'cmo';
  return 'rep';
}

// Auth via Twenty CRM
async function fetchTwentyUser(email: string): Promise<User | null> {
  try {
    const response = await fetch('/api/twenty/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.success || !data.user) return null;

    const role = inferRole(email);
    return {
      id: data.user.id,
      name: data.user.name || email.split('@')[0],
      email: email.toLowerCase(),
      role,
      fieldops_agent_id: getAgentForRole(role),
      hasLiveWireAccess: ['owner', 'coo'].includes(role),
    };
  } catch {
    return null;
  }
}

function getAgentForRole(role: string): string {
  const map: Record<string, string> = {
    owner: 'guardian',
    coo: 'fo-009',
    cmo: 'fo-007',
    rep: 'fo-001',
  };
  return map[role] || 'fo-001';
}
```

### Task 1.2: Update loginByEmail Function

**File:** `/var/www/lids/apps/compass/client/src/lib/user-context.tsx`

Replace the existing `loginByEmail` implementation in UserProvider:

```typescript
const loginByEmail = async (email: string): Promise<User | null> => {
  // Try Twenty CRM first
  const user = await fetchTwentyUser(email);
  if (user) {
    // Check if CMO should redirect to Studio
    if (user.role === 'cmo') {
      window.location.href = 'https://studio.ripemerchant.host';
      return null;
    }
    setCurrentUser(user);
    return user;
  }

  // Fallback to HELM_USERS for offline/testing
  const helmUser = HELM_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (helmUser) {
    setCurrentUser(helmUser);
    return helmUser;
  }

  return null;
};
```

---

## Phase 2: Update Login Screen (HIGH)

### Task 2.1: Add Email Input to LoginScreen

**File:** `/var/www/lids/apps/compass/client/src/components/LoginScreen.tsx`

The login screen needs an email input field in addition to or instead of the dropdown. Find the email selection component and add:

```typescript
const [emailInput, setEmailInput] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState('');

const handleEmailLogin = async () => {
  if (!emailInput.trim()) return;
  setIsSubmitting(true);
  setError('');

  const result = await loginByEmail(emailInput.trim());
  if (!result) {
    setError('Email not found in Twenty CRM');
  }
  setIsSubmitting(false);
};
```

Add UI element:
```tsx
<div className="space-y-2">
  <Input
    type="email"
    value={emailInput}
    onChange={(e) => setEmailInput(e.target.value)}
    placeholder="Enter your work email"
    onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
  />
  <Button
    onClick={handleEmailLogin}
    disabled={isSubmitting || !emailInput.trim()}
    className="w-full"
  >
    {isSubmitting ? 'Checking...' : 'Continue'}
  </Button>
  {error && <p className="text-red-500 text-sm">{error}</p>}
</div>
```

---

## Phase 3: Verify /api/twenty/auth Endpoint

### Task 3.1: Check Endpoint Exists on COMPASS Server

**File:** `/var/www/lids/apps/compass/server/index.ts`

Verify or add the `/api/twenty/auth` route:

```typescript
app.post('/api/twenty/auth', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    // Query Twenty CRM for user by email
    const response = await fetch(`http://localhost:3001/rest/workspaceMembers?filter=email[eq]=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TWENTY_API_KEY}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ success: false, error: 'Twenty lookup failed' });
    }

    const data = await response.json();
    const member = data.data?.workspaceMembers?.[0];

    if (member) {
      return res.json({
        success: true,
        user: {
          id: member.id,
          name: member.name?.firstName ? `${member.name.firstName} ${member.name.lastName}` : email.split('@')[0],
          email: member.email,
        }
      });
    }

    return res.status(404).json({ success: false, error: 'User not found' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});
```

---

## Phase 4: Test & Deploy

### Task 4.1: Build and Restart

```bash
ssh root@165.227.111.24 "cd /var/www/lids/apps/compass && npm run build && pm2 restart compass"
```

### Task 4.2: Test Login Flow

1. Visit `compass.ripemerchant.host`
2. Enter `leighe@ripemerchant.host`
3. **Expected:** Redirect to `studio.ripemerchant.host`

4. Enter `thesolardistrict@gmail.com` (Edwin)
5. **Expected:** Stay on COMPASS, show sales agents

### Task 4.3: Verify Studio Access

1. Visit `studio.ripemerchant.host`
2. Enter `leighe@ripemerchant.host`
3. **Expected:** Marketing dashboard with Sarai/Muse chat

---

## Phase 5: Sync to Local (MEDIUM)

### Task 5.1: Pull Studio App from Droplet

```bash
# From local machine
scp -r root@165.227.111.24:/var/www/lids/apps/studio C:/LifeOS/LIDS/apps/
```

### Task 5.2: Commit and Push

```bash
cd C:/LifeOS/LIDS
git add apps/studio
git commit -m "feat: sync Studio app from production droplet"
git push
```

---

## Verification Commands

```bash
# Check COMPASS is running
ssh root@165.227.111.24 "pm2 list | grep compass"

# Check Studio is running
ssh root@165.227.111.24 "pm2 list | grep studio"

# Test Twenty auth endpoint
ssh root@165.227.111.24 "curl -X POST http://localhost:3101/api/twenty/auth -H 'Content-Type: application/json' -d '{\"email\":\"leighe@ripemerchant.host\"}'"

# Check nginx routing
ssh root@165.227.111.24 "nginx -t && cat /etc/nginx/sites-enabled/studio"
```

---

## Rollback

If login breaks:
```bash
# Revert COMPASS changes
ssh root@165.227.111.24 "cd /var/www/lids && git checkout HEAD~1 -- apps/compass/"
ssh root@165.227.111.24 "cd /var/www/lids/apps/compass && npm run build && pm2 restart compass"
```

---

## Port Reference

| App | Dev Port | Prod Port | Domain |
|-----|----------|-----------|--------|
| ADS (LIDS) | 3100 | 5000 | helm.ripemerchant.host |
| COMPASS | 3101 | 3101 | compass.ripemerchant.host |
| Studio | 3103 | 3103 | studio.ripemerchant.host |
| Twenty CRM | - | 3001 | twenty.ripemerchant.host |

---

*Implementation plan ready for execution*
*Created: December 28, 2025*
