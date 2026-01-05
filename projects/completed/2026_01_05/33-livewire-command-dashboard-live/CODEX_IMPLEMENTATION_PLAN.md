# CODEX: LiveWire Command Dashboard - Go Live

## Objective

Activate LiveWire lead discovery on Command Dashboard with full configuration UI and live Reddit scanning, replacing mock data with real intelligence.

## Prerequisites

- [x] Command Dashboard deployed on Oracle ARM (command.ripemerchant.host)
- [x] Authentication working via Twenty CRM
- [x] LiveWire v1 backend running on admiral-server:5000
- [x] COMPASS LiveWire UI components available for porting
- [ ] LiveWire AutoGen Intelligence deployed to admiral-server:5100

---

## Phase 1: Add API Proxy Routes to Command Dashboard

**Goal:** Connect Command Dashboard server to LiveWire backend on admiral-server

### Step 1.1: Add LiveWire v1 proxy routes

**File:** `apps/command-dashboard/server/routes.ts`
**Action:** Add proxy routes for LiveWire v1 backend

```typescript
// Add after existing imports
const LIVEWIRE_API_URL = process.env.LIVEWIRE_API_URL || "http://100.66.42.81:5000";

// LiveWire Leads
app.get("/api/livewire/leads", async (req, res) => {
  try {
    const response = await fetchWithTimeout(`${LIVEWIRE_API_URL}/leads`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable", leads: [] });
  }
});

// LiveWire Settings
app.get("/api/livewire/settings", async (req, res) => {
  try {
    const response = await fetchWithTimeout(`${LIVEWIRE_API_URL}/settings`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable" });
  }
});

app.post("/api/livewire/settings", async (req, res) => {
  try {
    const response = await fetchWithTimeout(`${LIVEWIRE_API_URL}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable" });
  }
});

// v2.0 Keywords
app.get("/api/livewire/v2/keywords", async (req, res) => {
  try {
    const response = await fetchWithTimeout(`${LIVEWIRE_API_URL}/v2/keywords`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable", keywords: [] });
  }
});

app.post("/api/livewire/v2/keywords/:keyword/reset", async (req, res) => {
  try {
    const { keyword } = req.params;
    const response = await fetchWithTimeout(
      `${LIVEWIRE_API_URL}/v2/keywords/${encodeURIComponent(keyword)}/reset`,
      { method: "POST" }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable" });
  }
});

// v2.0 Subreddits
app.get("/api/livewire/v2/subreddits", async (req, res) => {
  try {
    const response = await fetchWithTimeout(`${LIVEWIRE_API_URL}/v2/subreddits`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable", subreddits: [] });
  }
});

app.post("/api/livewire/v2/subreddits/:name/promote", async (req, res) => {
  try {
    const { name } = req.params;
    const response = await fetchWithTimeout(
      `${LIVEWIRE_API_URL}/v2/subreddits/${encodeURIComponent(name)}/promote`,
      { method: "POST" }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable" });
  }
});

app.post("/api/livewire/v2/subreddits/:name/demote", async (req, res) => {
  try {
    const { name } = req.params;
    const response = await fetchWithTimeout(
      `${LIVEWIRE_API_URL}/v2/subreddits/${encodeURIComponent(name)}/demote`,
      { method: "POST" }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable" });
  }
});

app.post("/api/livewire/v2/subreddits/:name/retire", async (req, res) => {
  try {
    const { name } = req.params;
    const response = await fetchWithTimeout(
      `${LIVEWIRE_API_URL}/v2/subreddits/${encodeURIComponent(name)}/retire`,
      { method: "POST" }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable" });
  }
});

// Lead status and feedback
app.patch("/api/livewire/leads/:leadId/status", async (req, res) => {
  try {
    const { leadId } = req.params;
    const response = await fetchWithTimeout(
      `${LIVEWIRE_API_URL}/leads/${leadId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable" });
  }
});

app.post("/api/livewire/leads/:leadId/feedback", async (req, res) => {
  try {
    const { leadId } = req.params;
    const response = await fetchWithTimeout(
      `${LIVEWIRE_API_URL}/leads/${leadId}/feedback`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable" });
  }
});
```

---

## Phase 2: Port Settings Component

**Goal:** Add LiveWire Settings tab to Command Dashboard

### Step 2.1: Create LiveWireSettings component

**File:** `apps/command-dashboard/client/src/components/livewire/LiveWireSettings.tsx`
**Action:** Create (copy and adapt from COMPASS)

Key adaptations:
- Use Command Dashboard styling (not COMPASS's shadcn components)
- Use existing UI patterns from Command Dashboard
- Connect to `/api/livewire/settings` endpoints

### Step 2.2: Update LiveWireControl to include Settings

**File:** `apps/command-dashboard/client/src/components/livewire/LiveWireControl.tsx`
**Action:** Add Settings tab to the existing component

---

## Phase 3: Port Keyword and Subreddit Managers

**Goal:** Add configuration management UI

### Step 3.1: Create KeywordManager component

**File:** `apps/command-dashboard/client/src/components/livewire/KeywordManager.tsx`
**Action:** Create (port from COMPASS)

### Step 3.2: Create SubredditManager component

**File:** `apps/command-dashboard/client/src/components/livewire/SubredditManager.tsx`
**Action:** Create (port from COMPASS)

### Step 3.3: Add tabs to LiveWireControl

**File:** `apps/command-dashboard/client/src/components/livewire/LiveWireControl.tsx`
**Action:** Add tab navigation for Leads | Settings | Keywords | Subreddits

---

## Phase 4: Connect to Live Data

**Goal:** Replace mock data with live Reddit leads

### Step 4.1: Update LiveWireControl to fetch real leads

**File:** `apps/command-dashboard/client/src/components/livewire/LiveWireControl.tsx`
**Action:** Replace mockPosts with API fetch

```typescript
// Replace mockPosts with real API call
const [posts, setPosts] = useState<RedditPost[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchLeads() {
    try {
      const response = await fetch('/api/livewire/leads');
      const data = await response.json();
      // Transform leads to match RedditPost interface
      setPosts(data.leads.map(transformLeadToPost));
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }

  fetchLeads();
  const interval = setInterval(fetchLeads, 60000); // Refresh every 60s
  return () => clearInterval(interval);
}, []);
```

### Step 4.2: Remove MOCK toggle from header

**File:** `apps/command-dashboard/client/src/pages/dashboard.tsx`
**Action:** Remove `useMockData` state and toggle button

---

## Phase 5: Deploy and Test

### Step 5.1: Build and deploy Command Dashboard

```bash
ssh ubuntu@100.125.221.62
cd /home/ubuntu/lids/apps/command-dashboard
git pull origin main
npm run build
pm2 restart command-dashboard
```

### Step 5.2: Verify live data

1. Go to command.ripemerchant.host
2. Login with davide@admiralenergy.ai
3. Click LIVEWIRE INTEL tab
4. Verify leads appear (should match COMPASS)
5. Test Settings, Keywords, Subreddits tabs

---

## Verification Checklist

- [ ] Command Dashboard shows live Reddit leads
- [ ] Lead count matches COMPASS LiveWire
- [ ] Settings page allows configuration changes
- [ ] Keywords page shows all keywords with scores
- [ ] Subreddits page shows tier management
- [ ] Approve/Reject feedback records properly
- [ ] Auto-refresh brings new leads
- [ ] No mock data visible

---

## Completion Criteria

1. All phases complete
2. All verification items checked
3. David and Nate can use command.ripemerchant.host for LiveWire
4. COMPASS continues to work (parallel operation)
