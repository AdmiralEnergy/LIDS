# Project 9: Studio Dashboard Launch

## Status: PLANNING

**Started:** December 28, 2025

---

## Summary

Complete the Studio Dashboard for marketing users (Leigh) and set up proper routing so marketing users land on Studio instead of ADS.

## Problem

1. **No Studio Dashboard exists** - Only a shell was created in Project 8
2. **Leigh uses ADS** - Marketing users see sales tools (dialer, pipeline) they don't need
3. **Sarai/Muse not accessible** - Feature flags defined but no UI to access marketing agents
4. **helm.ripemerchant.host/studio** - Expected route doesn't exist

## Solution

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Production Domains                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  helm.ripemerchant.host  → ADS Dashboard (sales reps)        :5000          │
│  studio.ripemerchant.host → Studio Dashboard (marketing)     :5003          │
│  compass.ripemerchant.host → COMPASS PWA (all - personal AI) :3101          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### User Routing

| User | Role | Lands On | Reason |
|------|------|----------|--------|
| Leigh Edwards | CMO | Studio Dashboard | Marketing tools, Sarai/Muse agents |
| Edwin, Jonathan, Kareem | Rep | ADS Dashboard | Sales tools, dialer, pipeline |
| David Edwards | Owner | ADS Dashboard | Full access to all (can visit any) |

---

## Phases

| Phase | Description | Priority | Status |
|-------|-------------|----------|--------|
| 1 | Enhance Studio Dashboard UI | HIGH | Pending |
| 2 | Integrate Sarai agent into Studio | HIGH | Pending |
| 3 | Add ComfyUI/Muse integration | MEDIUM | Pending |
| 4 | Setup studio.ripemerchant.host | HIGH | Pending |
| 5 | Remove marketing feature flags from ADS | LOW | Pending |

---

## Phase Details

### Phase 1: Enhance Studio Dashboard UI

The current shell in `apps/studio-dashboard` needs:
- Proper navigation (Content, Campaigns, Analytics)
- Marketing-specific widgets (content calendar, campaign status)
- Embedded COMPASS with Sarai agent

**Key Files:**
- `apps/studio-dashboard/client/src/pages/dashboard.tsx`
- `apps/studio-dashboard/client/src/components/`

### Phase 2: Integrate Sarai Agent

Sarai is the content generation AI. Wire up the compass-studio package:
- Sarai endpoint: `http://100.66.42.81:4065/chat`
- Commands: `/generate`, `/campaign`

**Key Files:**
- `packages/compass-studio/src/agents/index.ts`
- `apps/studio-dashboard/client/src/pages/dashboard.tsx`

### Phase 3: ComfyUI/Muse Integration

Add visual content generation:
- Muse agent for image prompts
- ComfyUI workflow triggers
- Gallery view for generated assets

### Phase 4: Production Deployment

Setup new domain:
```bash
# On droplet
cd /var/www/lids
npm run build:studio  # or build:all

# Nginx config for studio.ripemerchant.host
# PM2 process for studio-dashboard on :5003
```

### Phase 5: Clean Up ADS

Remove unused marketing references:
- Remove `sarai` and `marketing` feature flags from `twentyStatsApi.ts` (they were never implemented)
- Keep ADS focused on sales only

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/studio-dashboard/client/src/pages/dashboard.tsx` | Full marketing dashboard UI |
| `apps/studio-dashboard/client/src/pages/content.tsx` | NEW - Content management |
| `apps/studio-dashboard/client/src/pages/campaigns.tsx` | NEW - Campaign management |
| `packages/compass-studio/src/agents/index.ts` | Wire real Sarai endpoint |
| `apps/ads-dashboard/client/src/lib/twentyStatsApi.ts` | Remove unused marketing flags |

---

## Success Criteria

- [ ] Studio Dashboard running on `studio.ripemerchant.host`
- [ ] Leigh can chat with Sarai from Studio
- [ ] `/generate` command creates content via Sarai
- [ ] No marketing features remain in ADS
- [ ] ADS continues working for sales reps

---

*Created: December 28, 2025*
