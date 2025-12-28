# LiveWire Integration Plan - COMPASS PWA

**Date:** December 25, 2025
**Status:** COMPLETED - MIGRATED TO COMPASS
**Author:** Guardian MCP
**Project:** 6 - LiveWire Integration

---

## Executive Summary

**PLAN CHANGED:** Instead of fixing LiveWire in ADS Dashboard, we are migrating LiveWire to **Compass PWA** for cleaner isolation and better testing.

**Actions:**
1. Move LiveWire functionality to Compass (`compass.ripemerchant.host/livewire`)
2. Remove ALL LiveWire traces from ADS Dashboard
3. Revert any changes made to ADS Dashboard
4. Leave no dead pages or orphaned code

---

## Part 1: Why Compass Instead of ADS Dashboard

### Problems with ADS Dashboard Integration

| Issue | Impact |
|-------|--------|
| Refine `useList` dependency | Page blocks waiting for Twenty CRM |
| Mixed data sources | CRM leads mixed with Reddit leads |
| Cascading errors | Removing one thing breaks others |
| Complex debugging | Many data providers, hooks, contexts |

### Benefits of Compass Integration

| Benefit | Description |
|---------|-------------|
| **Isolation** | No Twenty CRM, no Refine, no conflicts |
| **PWA-native** | Installable on mobile, offline capable |
| **Clean slate** | Fresh implementation without legacy |
| **Simpler stack** | Express + React, no complex providers |
| **Testbed** | Prove it works before any ADS integration |

---

## Part 2: Architecture

### Before (ADS Dashboard - REMOVING)

```
ADS Dashboard (:5000)
├── /livewire route ◄── REMOVE
├── Dashboard LiveWire banner ◄── REMOVE
└── /api/livewire/* proxy ◄── REMOVE
```

### After (Compass PWA - ADDING)

```
Compass PWA (:3101)
├── /livewire route ◄── NEW
├── /api/livewire/* proxy ◄── NEW
└── LiveWire page (Reddit leads table) ◄── NEW
```

### Data Flow

```
Compass (:3101)
  │
  ├─► GET /api/livewire/leads
  │     └─► Proxy to admiral-server:5000/leads
  │
  └─► LiveWire Page
        ├── Reddit Leads Table
        ├── Intent Scoring (HOT/WARM/COLD)
        ├── Stats Overview
        └── Refresh Button
```

---

## Part 3: Implementation Plan

### Phase 1: Remove LiveWire from ADS Dashboard

**Goal:** Clean removal, no dead code, no orphaned routes

#### 1.1 Remove from App.tsx
```typescript
// DELETE route:
<Route path="/livewire" component={LiveWirePage} />

// DELETE import:
import { LiveWirePage } from "./pages/livewire";

// DELETE from sidebar menu:
{ key: "livewire", icon: <ThunderboltOutlined />, label: "LiveWire" }
```

#### 1.2 Remove from dashboard.tsx
```typescript
// DELETE LiveWireBanner component (entire function)
// DELETE LiveWire imports (ThunderboltOutlined, RedditOutlined for banner)
// DELETE LiveWire state variables:
//   - showLiveWire
//   - liveWireStats
//   - liveWireLoading
// DELETE LiveWire useEffect
// DELETE LiveWireBanner usage in JSX
```

#### 1.3 Remove from server/routes.ts
```typescript
// DELETE these routes (lines 258-312):
app.get("/api/livewire/leads", ...)
app.get("/api/livewire/health", ...)

// DELETE LIVEWIRE_API_URL constant
```

#### 1.4 Delete files
```bash
rm /var/www/lids/apps/ads-dashboard/client/src/pages/livewire.tsx
rm /var/www/lids/apps/ads-dashboard/client/src/pages/livewire-fixed.tsx
```

### Phase 2: Add LiveWire to Compass

#### 2.1 Add proxy routes to Compass server
**File:** `apps/compass/server/routes.ts`

```typescript
// LiveWire proxy to admiral-server
const LIVEWIRE_API_URL = process.env.LIVEWIRE_URL || "http://100.66.42.81:5000";

app.get("/api/livewire/leads", async (req, res) => {
  try {
    const response = await fetch(`${LIVEWIRE_API_URL}/leads`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: "LiveWire unavailable", leads: [] });
  }
});

app.get("/api/livewire/health", async (req, res) => {
  try {
    const response = await fetch(`${LIVEWIRE_API_URL}/health`);
    const data = await response.json();
    res.json({ status: "ok", ...data });
  } catch (error) {
    res.json({ status: "error", error: error.message });
  }
});
```

#### 2.2 Create LiveWire page
**File:** `apps/compass/client/src/pages/livewire.tsx`

Features to include:
- Reddit leads table (from ADS livewire.tsx)
- Intent tier badges (HOT/WARM/COLD)
- Stats overview tiles
- Refresh button
- Subreddit breakdown
- State distribution

#### 2.3 Add route to Compass App.tsx
```typescript
import { LiveWirePage } from "./pages/livewire";

// Add route:
<Route path="/livewire" component={LiveWirePage} />

// Add to navigation (if applicable)
```

### Phase 3: Deploy

#### 3.1 Build and deploy ADS Dashboard (with LiveWire removed)
```bash
ssh root@165.227.111.24 "cd /var/www/lids/apps/ads-dashboard && npm run build && pm2 restart lids"
```

#### 3.2 Build and deploy Compass (with LiveWire added)
```bash
ssh root@165.227.111.24 "cd /var/www/lids/apps/compass && npm run build && pm2 restart compass"
```

---

## Part 4: Files to Modify

### ADS Dashboard (REMOVE)

| File | Action |
|------|--------|
| `client/src/App.tsx` | Remove LiveWire route and menu item |
| `client/src/pages/dashboard.tsx` | Remove LiveWireBanner |
| `client/src/pages/livewire.tsx` | DELETE |
| `client/src/pages/livewire-fixed.tsx` | DELETE |
| `server/routes.ts` | Remove /api/livewire/* routes |

### Compass (ADD)

| File | Action |
|------|--------|
| `client/src/pages/livewire.tsx` | CREATE (full LiveWire page) |
| `client/src/App.tsx` | Add /livewire route |
| `server/routes.ts` | Add /api/livewire/* proxy routes |

---

## Part 5: Verification Checklist

### ADS Dashboard (After Removal)
- [ ] No `/livewire` route exists
- [ ] Dashboard has no LiveWire banner
- [ ] No console errors about LiveWire
- [ ] All other pages work normally
- [ ] No dead imports or unused code

### Compass (After Addition)
- [ ] `/livewire` route works
- [ ] Reddit leads table displays
- [ ] Stats show correctly (HOT/WARM/COLD counts)
- [ ] Refresh button works
- [ ] Page loads within 2 seconds

---

## Part 6: Access URLs

| App | URL | LiveWire |
|-----|-----|----------|
| ADS Dashboard | helm.ripemerchant.host | ✗ Removed |
| Compass | compass.ripemerchant.host/livewire | ✓ New Home |

---

## Appendix: Original LiveWire Features to Migrate

From `livewire.tsx`:
1. **SystemStateBar** - Status indicators (simplified for Compass)
2. **LeadFlowSnapshot** - 4 tiles (HOT, WARM, Actionable, Total)
3. **RedditLeadsTable** - Main data table with columns:
   - Author
   - Post Title
   - Subreddit
   - Intent Score
   - Intent Tier (badge)
   - Keywords Matched
   - Actions (View Post link)
4. **Analytics Grid** - Top subreddits, state distribution
5. **Refresh functionality** - Manual refresh button
6. **Auto-refresh** - 30 second interval (optional)

---

*Plan Updated: December 25, 2025 - Changed to Compass integration*
