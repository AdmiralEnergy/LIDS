# Project 23: LiveWire v3.0 - Audit Findings

## Executive Summary

LiveWire v2 uses keyword-based scoring that fundamentally cannot distinguish intent. A post saying "Just installed my Powerwall" scores the same as "Want to buy a Powerwall" because both contain "Powerwall". This project replaces the entire system with a multi-agent architecture that learns intent from human labeling.

---

## Current State (v2 - Node.js)

### Architecture
```
Reddit → Keyword Match → Score Calculation → HOT/WARM/COLD → User Feedback → Keyword Weights
                                                                      ↓
                                                        (penalizes keywords, not context)
```

### Location
- **Backend:** `/agents/apex/livewire/` on admiral-server:5000
- **Frontend:** `apps/compass/client/src/pages/livewire.tsx`

### Critical Flaws

#### C1: Keywords Don't Capture Intent
- **Severity:** CRITICAL
- **Example:** "Just installed my Powerwall" → scores "powerwall" keyword
- **Reality:** User already bought - not a lead
- **Problem:** Keyword weight decreases, but "powerwall" is still a good keyword when used by buyers

#### C2: Context Attribution is Wrong
- **Severity:** CRITICAL
- **Current:** Bad lead → all matched keywords penalized
- **Should be:** Bad lead → context phrase identified ("just installed" = already bought)
- **Impact:** Good keywords like "solar", "powerwall", "battery" get wrongly penalized

#### C3: No Real Learning
- **Severity:** HIGH
- **Current:** Weights adjust +/- based on feedback
- **Missing:** Pattern extraction, intent classification, reasoning capture
- **Result:** System cannot generalize - treats each keyword independently

#### C4: Single Intent Model
- **Severity:** MEDIUM
- **Current:** Score 0-100 → HOT/WARM/COLD
- **Missing:** Intent categories (buying, researching, already_bought, upselling)
- **Impact:** Can't distinguish "needs solar" from "needs battery for existing solar"

---

## Target State (v3 - Python AutoGen)

### Architecture
```
Reddit → Post Scout Agent → Intent Analyst Agent → Human Labels
              ↓                     ↓                    ↓
         No scoring          AI suggests with      Confirms/corrects
                             confidence score       with reasoning
                                    ↓
                            Pattern Learning
                                    ↓
                         Progressive Autonomy (0→4)
```

### Key Changes

| Aspect | v2 (Current) | v3 (Target) |
|--------|--------------|-------------|
| Scoring | Keyword weights | No auto-scoring (initially) |
| Learning | Weight adjustment | Human-labeled intent patterns |
| Classification | Score thresholds | Intent categories |
| Autonomy | Full auto-score | Progressive (L0-L4) |
| Stack | Node.js/TypeScript | Python/AutoGen |
| LLM | Gemini 2.0 Flash | Claude 3.5 Sonnet |

---

## Agent Definitions

### 1. Post Scout Agent
**Responsibility:** Find Reddit posts about solar/energy topics

**Does:**
- Scan configured subreddits
- Extract post metadata (author, content, timestamps)
- Queue posts for analysis

**Does NOT:**
- Score posts
- Filter posts
- Make intent judgments

### 2. Intent Analyst Agent
**Responsibility:** Analyze post content, suggest intent classification

**Intent Categories:**
- `buying` - Actively shopping for solar
- `researching` - Gathering info, not ready to buy
- `already_bought` - Showing off their system
- `upselling_opportunity` - Has solar, wants more (battery, EV charger)
- `negative_experience` - Complaining about their system
- `not_relevant` - False positive

**Output:**
- Suggested intent category
- Confidence score (0-100%)
- Reasoning (key phrases detected)
- Requires human confirmation at L0-L1

### 3. Subreddit Researcher Agent
**Responsibility:** Discover hidden goldmine subreddits

**Capabilities:**
- Analyze cross-posting patterns
- Track member demographics
- Monitor engagement on solar topics
- Report mod policies on commercial content
- Weekly performance reports

### 4. DM Crafter Agent
**Responsibility:** Generate personalized outreach messages

**Features:**
- Template styles (professional, casual, value-add)
- A/B testing framework
- Reply rate tracking
- Personalization based on post content
- Always requires human approval at L0-L3

---

## Progressive Autonomy System

### Level 0: Fully Manual (Starting State)
- Agents find posts, extract metadata
- Human labels EVERY post with:
  - Intent category
  - Reasoning (why this classification)
  - Quality rating (good_lead, bad_lead, maybe)
- No AI suggestions shown
- **Unlock L1:** 100 labeled samples

### Level 1: AI Suggests, Human Confirms
- AI shows intent suggestion with confidence %
- Human confirms or corrects
- Disagreements logged for pattern analysis
- **Unlock L2:** 85% accuracy over 200 samples

### Level 2: Auto-Label Low Confidence
- High confidence (>90%): Auto-label, human reviews queue
- Low confidence (<90%): Human reviews before labeling
- DMs still require human approval
- **Unlock L3:** 90% accuracy over 500 samples

### Level 3: DM With Approval
- Auto-classify all posts
- Auto-generate DM drafts for high-intent leads
- Human approves/rejects DMs before sending
- Track reply rates by template
- **Unlock L4:** 95% accuracy, >15% reply rate, 1000+ samples

### Level 4: Full Autonomy
- Auto-classify, auto-DM for high-intent leads
- Human spot-checks random 10%
- Real-time alerts for anomalies
- Can be demoted if accuracy drops

---

## Data Model

### Core Tables

```sql
-- Training data from human labels
labeled_posts (
  id, reddit_id, subreddit, author, title, content, url,
  -- AI analysis
  ai_intent, ai_confidence, ai_reasoning, ai_analyzed_at,
  -- Human labels (training gold)
  human_intent, human_reasoning, human_quality, human_labeled_at,
  -- Outcome tracking
  status, dm_sent_at, reply_received_at, converted_at,
  -- ML features
  embedding
)

-- Patterns learned from aggregate labels
intent_patterns (
  id, intent_category, pattern_text, pattern_type,
  confidence_weight, hit_count, success_rate
)

-- Subreddit intelligence
subreddit_intel (
  id, subreddit, tier, quality_score,
  best_posting_hours, demographics
)

-- DM tracking with A/B testing
dm_drafts (
  id, lead_id, subject, body, template_style, a_b_variant,
  status, approved_at, sent_at, reply_received
)

-- Autonomy level management
autonomy_config (
  current_level, total_samples, current_accuracy, last_level_change
)
```

---

## Migration Strategy

### Phase 1: Deploy v3 Alongside v2 (Week 1)
- v2 continues running on :5000
- v3 deployed on :5100
- No data sharing yet

### Phase 2: Start Training (Week 2-4)
- Nate uses new training UI in COMPASS
- Labels 100+ posts to reach L1
- v2 still handling "production"

### Phase 3: Parallel Evaluation (Week 5-6)
- Compare v3 intent classifications against v2 scoring
- Measure accuracy against human labels
- Track conversion rates

### Phase 4: Switchover (Week 7-8)
- Route COMPASS to v3 endpoints
- Keep v2 as fallback
- Monitor for issues

### Phase 5: Deprecate v2 (Week 9+)
- Once v3 reaches L2+, disable v2
- Archive v2 codebase

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low initial accuracy | Medium | High | Start at L0 (fully manual) |
| Reddit account ban | High | Medium | Throttle DMs, build karma |
| Training data bias | Medium | Medium | Diverse labels, track disagreements |
| LLM costs | Medium | Low | Batch analysis, cache embeddings |
| Migration data loss | High | Low | Parallel operation, backups |

---

## Success Criteria

| Metric | v2 Baseline | v3 Target |
|--------|-------------|-----------|
| Intent accuracy | ~50% (estimated) | >85% |
| False positive rate | High (context issues) | <15% |
| DM reply rate | Unknown | >15% |
| Human review time | All leads | <25% (at L2+) |
| Nate satisfaction | Frustrated | Confident |

---

*Audit completed: December 30, 2025*
