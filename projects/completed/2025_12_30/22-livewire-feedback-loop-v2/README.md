# Project 22: LiveWire Feedback Loop v2.0

**Status:** IN PROGRESS - AWAITING VERIFICATION
**Started:** December 30, 2025
**Owner:** Terminal Claude + David Edwards
**Priority:** HIGH

---

## Overview

Transform LiveWire from a keyword-matching scanner into a **self-optimizing lead intelligence system** that learns from human feedback to refine keyword weights, intent detection, and subreddit quality over time.

**Core Principle:** The human (Nate) determines what makes a good lead. LiveWire learns from those decisions.

---

## Implementation Status

### Phase 1: Frontend Components (COMPLETED)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| KeywordManager | `apps/compass/client/src/components/livewire/KeywordManager.tsx` | COMPLETED | Shows keyword scores, trends, performance indicators |
| SubredditManager | `apps/compass/client/src/components/livewire/SubredditManager.tsx` | COMPLETED | Active/Test/Retired tiers with promote/demote |
| LearningDashboard | `apps/compass/client/src/components/livewire/LearningDashboard.tsx` | COMPLETED | Metrics, recommendations, sequential thinking |

### Phase 2: Main Page Integration (COMPLETED)

| Feature | Location | Status | Notes |
|---------|----------|--------|-------|
| Tab Navigation | `livewire.tsx` | COMPLETED | Leads \| Keywords \| Subreddits \| Learning |
| Feedback Toast | `livewire.tsx` | COMPLETED | Shows what was learned after feedback |
| Rejection Flow | `livewire.tsx` | COMPLETED | Bad feedback sets status=rejected, removes from view |

### Phase 3: Backend Learning Engine (COMPLETED)

| Endpoint | Location | Status | Notes |
|----------|----------|--------|-------|
| `/v2/learning/metrics` | LiveWire backend | COMPLETED | Feedback counts, accuracy rate |
| `/v2/learning/recommendations` | LiveWire backend | COMPLETED | AI recommendations |
| `/v2/learning/thinking-logs` | LiveWire backend | COMPLETED | Sequential thinking |
| `/v2/learning/apply-recommendation` | LiveWire backend | COMPLETED | Apply changes |

### Phase 4: Verification (PENDING)

| Test | Status | Verified By |
|------|--------|-------------|
| Feedback toast appears with details | PENDING | |
| KeywordManager shows real data | PENDING | |
| SubredditManager tiers work | PENDING | |
| LearningDashboard shows metrics | PENDING | |
| Sequential thinking logs appear | PENDING | |
| Tab navigation works | PENDING | |

---

## Files Modified

### Frontend (COMPASS PWA)
- `apps/compass/client/src/pages/livewire.tsx` - Main page with tabs, feedback toast
- `apps/compass/client/src/components/livewire/KeywordManager.tsx` - NEW
- `apps/compass/client/src/components/livewire/SubredditManager.tsx` - NEW
- `apps/compass/client/src/components/livewire/LearningDashboard.tsx` - NEW

### Backend Proxy (COMPASS Server)
- `apps/compass/server/routes.ts` - Added v2.0 learning engine routes

### Backend (LiveWire Service - admiral-server)
- `src/index.ts` - Added learning engine endpoints

---

## Success Criteria

- [ ] User gives feedback (thumbs up/down) and sees a toast confirming what was learned
- [ ] KeywordManager shows all keywords with weights, trends, and performance indicators
- [ ] Underperforming keywords are flagged with Keep/Remove actions
- [ ] SubredditManager shows tiers with promote/demote controls
- [ ] LearningDashboard shows accuracy metrics (not mock data)
- [ ] Sequential thinking logs appear for analyzed leads
- [ ] Recommendations appear based on feedback patterns
- [ ] All four tabs (Leads, Keywords, Subreddits, Learning) are accessible

---

## Verification Commands

```bash
# 1. Start COMPASS locally
cd apps/compass && npm run dev

# 2. Navigate to LiveWire
# http://localhost:3101/livewire

# 3. Check backend health
curl http://192.168.1.23:5000/health

# 4. Check learning metrics endpoint
curl http://192.168.1.23:5000/v2/learning/metrics

# 5. Check keywords endpoint
curl http://192.168.1.23:5000/v2/keywords

# 6. Check subreddits endpoint
curl http://192.168.1.23:5000/v2/subreddits
```

---

## Rollback Plan

If issues found:
1. Revert livewire.tsx to remove tabs, keep leads-only view
2. Components are isolated - can be removed without affecting core leads functionality
3. Backend endpoints are additive - existing leads/feedback endpoints unchanged

---

## Next Steps After Verification

1. **Intent Chain Display** - Show step-by-step scoring breakdown per lead
2. **Feedback Persistence** - Ensure feedback adjustments persist across restarts
3. **Pattern Learning** - Auto-detect "already bought" phrases from negative feedback
4. **Recommendation Engine** - Generate smarter recommendations from aggregate patterns

---

*Last Updated: December 30, 2025*
