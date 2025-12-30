# Project 22: LiveWire Feedback Loop v2.0 - Audit Findings

## Executive Summary

LiveWire was a keyword-matching Reddit scanner that scored leads but provided no visibility into WHY leads scored as they did, and no way to improve the system based on user feedback. This project transforms it into a self-optimizing system with visible learning mechanics.

**Before:** User rejects lead → lead disappears → nothing learned
**After:** User rejects lead → toast shows what keywords were adjusted → KeywordManager shows updated weights → LearningDashboard shows accuracy improving

---

## Current State Analysis (Pre-Implementation)

### Architecture Before

```
┌─────────────────────────────────────────────────────────────────────┐
│  LIVEWIRE BEFORE                                                    │
│                                                                     │
│  Reddit → Keywords Match → Score Calculated → Leads Displayed       │
│                                     ↓                               │
│                         User gives feedback (invisible)             │
│                                     ↓                               │
│                            Backend adjusts (invisible)              │
│                                     ↓                               │
│                              Lead disappears                        │
│                                                                     │
│  PROBLEM: User can't see if feedback matters                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Critical Issues Identified

#### C1: Invisible Learning
- **Severity:** CRITICAL
- **Location:** `livewire.tsx` feedback handlers
- **Impact:** Users don't trust system, stop giving feedback
- **Evidence:** Feedback POST returns success but UI shows nothing

#### C2: No Keyword Visibility
- **Severity:** HIGH
- **Location:** No KeywordManager component existed
- **Impact:** Can't see which keywords perform well vs poorly
- **Evidence:** Keywords hardcoded in backend config

#### C3: No Subreddit Tiers
- **Severity:** HIGH
- **Location:** No tier system existed
- **Impact:** Bad subreddits pollute good leads, can't experiment safely
- **Evidence:** All subreddits treated equally

#### C4: Opaque Intent Scoring
- **Severity:** HIGH
- **Location:** Score displayed but not explained
- **Impact:** Can't correct when system misclassifies intent
- **Evidence:** Shows "Score: 45 WARM" without breakdown

---

## Target State (Post-Implementation)

### Architecture After

```
┌─────────────────────────────────────────────────────────────────────┐
│  LIVEWIRE FEEDBACK LOOP v2.0                                        │
│                                                                     │
│  Reddit → Keywords Match → Context Analysis → Score Calculated      │
│              ↑                                      ↓               │
│      Weights adjusted                        Leads Displayed        │
│              ↑                                      ↓               │
│      Learning Engine                         User gives feedback    │
│              ↑                                      ↓               │
│              └───────────────────────────────────────┘               │
│                                                                     │
│  USER VISIBILITY AT EVERY STEP:                                     │
│  • Feedback Toast → shows what was learned                          │
│  • KeywordManager → shows all keyword weights/trends                │
│  • SubredditManager → shows tier performance                        │
│  • LearningDashboard → shows accuracy, recommendations              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### New Components

#### 1. KeywordManager.tsx
```typescript
// Shows keyword performance with visual indicators
interface KeywordScore {
  keyword: string;
  baseWeight: number;
  currentWeight: number;
  feedbackCount: number;
  positiveCount: number;
  negativeCount: number;
  positiveContexts: string[];
  negativeContexts: string[];
  lastUpdated: string;
  status: 'active' | 'flagged' | 'removed';
}

// Features:
// - Analytics summary (total, active, flagged, removed)
// - Performance indicators (strong, average, needs attention, underperforming)
// - Trend icons (up/down/neutral)
// - Actions: Reset, Keep, Remove
```

#### 2. SubredditManager.tsx
```typescript
// Shows subreddit tiers with quality metrics
interface SubredditScore {
  name: string;
  tier: 'active' | 'test' | 'retired';
  qualityScore: number;       // 0-100
  leadsGenerated: number;
  goodLeads: number;
  badLeads: number;
  avgIntentScore: number;
  weight: number;
  recommendation?: string;
}

// Features:
// - Tab navigation: Active | Testing | Retired
// - Quality scores with color coding
// - Promote/Demote/Retire controls
// - Tier system explanation
```

#### 3. LearningDashboard.tsx
```typescript
// Shows learning metrics and AI recommendations
interface LearningMetrics {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  accuracyRate: number;
  accuracyTrend: 'improving' | 'declining' | 'stable';
  lastTrainingDate: string;
  modelVersion: string;
}

interface Recommendation {
  id: string;
  type: 'keyword' | 'subreddit' | 'pattern' | 'config';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
}

// Features:
// - Metrics cards (total feedback, accuracy rate, status)
// - Recommendations with Apply buttons
// - Sequential thinking logs
// - Learning loop visualization
```

### Main Page Changes (livewire.tsx)

#### Tab Navigation
```tsx
// Four tabs for all LiveWire features
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="leads">Leads ({filteredLeads.length})</TabsTrigger>
    <TabsTrigger value="keywords">Keywords</TabsTrigger>
    <TabsTrigger value="subreddits">Subreddits</TabsTrigger>
    <TabsTrigger value="learning">Learning</TabsTrigger>
  </TabsList>
  ...
</Tabs>
```

#### Feedback Confirmation Toast
```tsx
// Shows what was learned when feedback is submitted
const handleFeedback = async (leadId: string, quality: 'good' | 'bad', reason?: string) => {
  const response = await fetch(`${LIVEWIRE_API}/leads/${leadId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ quality, reason, intentCorrection })
  });

  const result = await response.json();

  // Show confirmation toast
  toast({
    title: quality === 'good' ? 'Lead Approved' : 'Lead Rejected',
    description: `Feedback recorded. Keywords adjusted: ${result.adjustedKeywords?.join(', ')}`,
  });
};
```

### Backend Endpoints Added

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v2/learning/metrics` | GET | Feedback counts, accuracy rate, trend |
| `/v2/learning/recommendations` | GET | AI recommendations based on patterns |
| `/v2/learning/thinking-logs` | GET | Sequential thinking for each lead |
| `/v2/learning/apply-recommendation` | POST | Apply suggested changes |

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/compass/client/src/pages/livewire.tsx` | Added tabs, feedback toast, component integration |
| `apps/compass/client/src/components/livewire/KeywordManager.tsx` | NEW - Keyword performance panel |
| `apps/compass/client/src/components/livewire/SubredditManager.tsx` | NEW - Subreddit tier manager |
| `apps/compass/client/src/components/livewire/LearningDashboard.tsx` | NEW - Learning metrics and recommendations |
| `apps/compass/server/routes.ts` | Added v2.0 learning proxy routes |
| LiveWire backend `src/index.ts` | Added learning engine endpoints |

---

## Success Criteria

| Criterion | Metric | Status |
|-----------|--------|--------|
| Feedback visibility | Toast shows on every feedback action | PENDING |
| Keyword transparency | All keywords visible with weights | PENDING |
| Subreddit tiers | Active/Test/Retired working | PENDING |
| Learning metrics | Real data (not mock) displayed | PENDING |
| Sequential thinking | Logs appear for analyzed leads | PENDING |
| Tab navigation | All 4 tabs accessible | PENDING |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backend endpoints missing | Medium | High | Components fall back to mock data with warning |
| Learning metrics always 0 | Medium | Medium | Need feedback history to populate |
| Sequential thinking empty | High | Low | Feature flag until backend implements |
| Keyword Keep/Remove broken | Medium | Medium | Reset action works as fallback |

---

## Verification Required

See CODEX_IMPLEMENTATION_PLAN.md for detailed testing checklist.

---

*Audit completed: December 30, 2025*
