# Codex Implementation Plan - Project 22: LiveWire Feedback Loop v2.0

## System Prompt

```
You are verifying the LiveWire Feedback Loop v2.0 implementation.

Context:
- App: apps/compass (React + TypeScript + Vite PWA)
- LiveWire is a Reddit lead scanner that needs visible learning mechanics
- Implementation adds KeywordManager, SubredditManager, LearningDashboard
- Backend: LiveWire service on admiral-server (192.168.1.23:5000)
- Frontend: COMPASS PWA (localhost:3101 dev, compass.ripemerchant.host prod)

Key files:
- apps/compass/client/src/pages/livewire.tsx - Main page with tabs
- apps/compass/client/src/components/livewire/KeywordManager.tsx - Keyword panel
- apps/compass/client/src/components/livewire/SubredditManager.tsx - Subreddit panel
- apps/compass/client/src/components/livewire/LearningDashboard.tsx - Learning panel
- apps/compass/server/routes.ts - Proxy routes to backend

Brand tokens:
- Navy: #0c2f4a
- Gold: #c9a648
- White: #f7f5f2
```

---

## Phase 1: Backend Endpoint Verification

### Test 1.1: Learning Metrics Endpoint
```bash
# Check if learning metrics endpoint returns real data
curl -s http://192.168.1.23:5000/v2/learning/metrics | jq

# Expected response structure:
# {
#   "success": true,
#   "metrics": {
#     "totalFeedback": <number>,
#     "positiveFeedback": <number>,
#     "negativeFeedback": <number>,
#     "accuracyRate": <number 0-100>,
#     "accuracyTrend": "improving" | "declining" | "stable",
#     "lastTrainingDate": <ISO date>,
#     "modelVersion": "2.0.0"
#   }
# }
```
**Status:** [ ] PASS / [ ] FAIL / [ ] ENDPOINT MISSING

### Test 1.2: Keywords Endpoint
```bash
# Check if keywords endpoint returns all keywords with scores
curl -s http://192.168.1.23:5000/v2/keywords | jq

# Expected:
# {
#   "success": true,
#   "keywords": [
#     {
#       "keyword": "solar",
#       "baseWeight": 5,
#       "currentWeight": 6,
#       "positiveCount": 10,
#       "negativeCount": 3,
#       "status": "active"
#     },
#     ...
#   ],
#   "analytics": {
#     "total": <number>,
#     "active": <number>,
#     "flagged": <number>,
#     "removed": <number>
#   }
# }
```
**Status:** [ ] PASS / [ ] FAIL / [ ] ENDPOINT MISSING

### Test 1.3: Subreddits Endpoint
```bash
# Check if subreddits endpoint returns tier data
curl -s http://192.168.1.23:5000/v2/subreddits | jq

# Expected:
# {
#   "success": true,
#   "subreddits": [
#     {
#       "name": "solar",
#       "tier": "active",
#       "qualityScore": 75,
#       "leadsGenerated": 100,
#       "goodLeads": 75,
#       "badLeads": 25
#     },
#     ...
#   ],
#   "analytics": {
#     "totalSubreddits": <number>,
#     "activeCount": <number>,
#     "testCount": <number>,
#     "retiredCount": <number>
#   }
# }
```
**Status:** [ ] PASS / [ ] FAIL / [ ] ENDPOINT MISSING

### Test 1.4: Recommendations Endpoint
```bash
curl -s http://192.168.1.23:5000/v2/learning/recommendations | jq
```
**Status:** [ ] PASS / [ ] FAIL / [ ] ENDPOINT MISSING

### Test 1.5: Thinking Logs Endpoint
```bash
curl -s "http://192.168.1.23:5000/v2/learning/thinking-logs?limit=5" | jq
```
**Status:** [ ] PASS / [ ] FAIL / [ ] ENDPOINT MISSING

---

## Phase 2: Frontend Component Verification

### Test 2.1: Tab Navigation
```
1. Navigate to http://localhost:3101/livewire (or production URL)
2. Verify four tabs visible: Leads | Keywords | Subreddits | Learning
3. Click each tab and verify content changes
4. Verify tab counts update (Leads should show lead count)
```
**Status:** [ ] PASS / [ ] FAIL
**Notes:**

### Test 2.2: KeywordManager Display
```
1. Click "Keywords" tab
2. Verify analytics summary cards appear (Total, Active, Flagged, Removed)
3. Verify keyword table shows:
   - Keyword name
   - Base weight
   - Current weight
   - Thumbs up/down counts
   - Trend indicator (up/down/neutral icon)
   - Status label
4. Verify flagged keywords section appears if any keywords have negative performance
5. Verify Reset button works on a keyword
```
**Status:** [ ] PASS / [ ] FAIL
**Notes:**

### Test 2.3: SubredditManager Display
```
1. Click "Subreddits" tab
2. Verify analytics summary (Total, Active, Testing, Retired, Avg Quality)
3. Verify tier tabs work (Active | Testing | Retired)
4. Verify each subreddit shows:
   - Name (with link to Reddit)
   - Quality badge
   - Lead counts
   - Success rate
   - Weight
5. Test Promote button on a Test tier subreddit
6. Test Demote button on an Active tier subreddit
```
**Status:** [ ] PASS / [ ] FAIL
**Notes:**

### Test 2.4: LearningDashboard Display
```
1. Click "Learning" tab
2. Verify metrics cards show:
   - Total Feedback count
   - Accuracy Rate with trend indicator
   - Last Updated date
   - Status (Learning/Active feedback loop)
3. Verify recommendations section shows (or "No recommendations" message)
4. Verify sequential thinking logs section shows (or "No thinking logs yet")
5. Verify learning loop explanation at bottom
```
**Status:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Phase 3: Feedback Loop Verification

### Test 3.1: Feedback Toast on Lead Action
```
1. Navigate to Leads tab
2. Find a lead and click thumbs down (reject)
3. If dropdown appears, select a reason (e.g., "Already Bought")
4. Verify toast notification appears showing:
   - "Lead Rejected" title
   - Keywords that were adjusted
   - Action was recorded
5. Verify lead disappears from the list
6. Verify stats update (lead count decreases)
```
**Status:** [ ] PASS / [ ] FAIL
**Notes:**

### Test 3.2: Keyword Weight Adjustment After Feedback
```
1. Note current weight of a keyword in KeywordManager
2. Go to Leads tab
3. Reject a lead that matches that keyword
4. Return to Keywords tab
5. Verify keyword weight has decreased
6. Verify negative count has increased
```
**Status:** [ ] PASS / [ ] FAIL
**Notes:**

### Test 3.3: Subreddit Stats Update After Feedback
```
1. Note current stats for a subreddit in SubredditManager
2. Go to Leads tab
3. Find a lead from that subreddit
4. Give it negative feedback (reject)
5. Return to Subreddits tab
6. Verify bad leads count increased
7. Verify quality score recalculated
```
**Status:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Phase 4: Edge Cases

### Test 4.1: Empty States
```
- New installation with no feedback history: metrics should show 0s, not errors
- Subreddit tier with no subreddits: should show "No subreddits in this tier"
- No recommendations: should show "No recommendations at this time"
```
**Status:** [ ] PASS / [ ] FAIL

### Test 4.2: Error Handling
```
- Backend offline: components should show error state with retry button
- Slow network: loading spinners should appear
- API returns error: graceful error message, not crash
```
**Status:** [ ] PASS / [ ] FAIL

### Test 4.3: Keep/Remove Actions on Flagged Keywords
```
1. Find a flagged keyword (or lower a keyword's score until flagged)
2. Click "Keep" button
3. Verify action completes (keyword status changes or stays)
4. Click "Remove" button on another flagged keyword
5. Verify keyword removed from active list
```
**Status:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Phase 5: Production Deployment Verification

### Test 5.1: Deploy to Production
```bash
# Build COMPASS
cd apps/compass && npm run build

# Deploy to droplet
ssh root@165.227.111.24 "cd /var/www/lids && git pull && cd apps/compass && npm run build && pm2 restart compass"
```

### Test 5.2: Production URL Check
```
1. Navigate to https://compass.ripemerchant.host/livewire
2. Repeat Test 2.1-2.4 on production
3. Verify backend connectivity (metrics load, not mock data)
```
**Status:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Verification Checklist Summary

| Test | Description | Status |
|------|-------------|--------|
| 1.1 | Learning metrics endpoint | |
| 1.2 | Keywords endpoint | |
| 1.3 | Subreddits endpoint | |
| 1.4 | Recommendations endpoint | |
| 1.5 | Thinking logs endpoint | |
| 2.1 | Tab navigation | |
| 2.2 | KeywordManager display | |
| 2.3 | SubredditManager display | |
| 2.4 | LearningDashboard display | |
| 3.1 | Feedback toast | |
| 3.2 | Keyword weight adjustment | |
| 3.3 | Subreddit stats update | |
| 4.1 | Empty states | |
| 4.2 | Error handling | |
| 4.3 | Keep/Remove actions | |
| 5.1 | Production deploy | |
| 5.2 | Production verification | |

---

## Known Issues to Address

If tests fail, check:

1. **Backend not returning data:**
   - Verify LiveWire service is running: `pm2 status` on admiral-server
   - Check if v2 endpoints exist in src/index.ts
   - Check Tailscale connection from droplet to admiral-server

2. **Mock data showing instead of real:**
   - LearningDashboard falls back to mock if backend returns error
   - Add console.log to identify if fetch is failing

3. **Keep/Remove buttons not working:**
   - These may need backend endpoints created
   - Check if POST /v2/keywords/:keyword/keep and /remove exist

4. **Toast not appearing:**
   - Check if toast import is correct in livewire.tsx
   - Check if feedback response includes adjustedKeywords

---

## Post-Verification Tasks

After all tests pass:

1. Move project folder: `projects/active/22-...` → `projects/completed/2025_12_30/22-...`
2. Update README.md status to COMPLETE
3. Document any issues found and their resolutions
4. Create follow-up project for remaining features (Intent Chain Display, etc.)

---

*Codex created: December 30, 2025*
