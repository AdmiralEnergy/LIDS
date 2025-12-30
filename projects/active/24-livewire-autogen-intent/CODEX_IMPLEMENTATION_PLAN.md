# Project 24: LiveWire Autogen Intent Training System

**Date:** December 30, 2025
**Goal:** Replace keyword-scoring with human-trained intent detection using multi-agent Autogen architecture
**Project Folder:** `C:\LifeOS\LIDS\projects\active\24-livewire-autogen-intent\`

---

## Problem Statement

The current LiveWire system is fundamentally broken:

1. **Keywords are scored atomically** - "powerwall" gets penalized when the problem is "just installed"
2. **Context is ignored** - Same phrase, opposite intent: "just installed powerwall" vs "want to buy powerwall"
3. **No real learning** - System adjusts keyword weights, but can't learn intent patterns
4. **Too many holes** - Takes forever to verify it's actually working

**David's Insight:** "The INTENT DETECTION is what's broken, not the keyword/subreddit."

---

## Design Philosophy

1. **Stop auto-scoring** - Surface posts for human review, no scores
2. **Human labels intent** - Nate provides classification + reasoning (WHY)
3. **Learn from aggregate data** - 160+ labeled posts → intent patterns emerge
4. **Progressive autonomy** - Start human-only, gradually let AI suggest with confidence
5. **Multi-agent coordination** - Specialized agents for research, analysis, discovery, outreach

---

## Architecture Overview

```
                              Human (Nate via COMPASS)
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    LIVEWIRE INTENT TEAM (Python Autogen)                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐   │
│  │  POST RESEARCH  │    │ INTENT ANALYSIS │    │ SUBREDDIT RESEARCH  │   │
│  │     AGENT       │    │     AGENT       │    │       AGENT         │   │
│  │                 │    │                 │    │                     │   │
│  │ • Fetch Reddit  │    │ • TeachableAgent│    │ • Discover subs     │   │
│  │ • Surface posts │    │ • Learn patterns│    │ • Evaluate quality  │   │
│  │ • No scoring    │    │ • Suggest intent│    │ • Find goldmines    │   │
│  └────────┬────────┘    └────────┬────────┘    └──────────┬──────────┘   │
│           │                      │                        │              │
│           └──────────────────────┼────────────────────────┘              │
│                                  │                                       │
│                                  ▼                                       │
│                    ┌─────────────────────────┐                           │
│                    │    OUTREACH AGENT       │                           │
│                    │                         │                           │
│                    │ • Craft DM templates    │                           │
│                    │ • Generate comments     │                           │
│                    │ • Track reply rates     │                           │
│                    └─────────────────────────┘                           │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   SQLite Intent Store   │
                    │   (Training Data SSOT)  │
                    └─────────────────────────┘
```

---

## Agent Definitions

### 1. Post Research Agent

**Role:** Discovery and surfacing of Reddit posts (NO auto-scoring)

**Tools:**
- `browse_subreddit(sub, sort, limit)` - Fetch posts
- `get_unreviewed_posts(limit)` - Queue for labeling
- `check_dedupe(url)` - Avoid duplicates

**Output:** Raw posts with metadata, no scores attached

### 2. Intent Analysis Agent (TeachableAgent)

**Role:** Learn from human labels, eventually suggest intent with confidence

**Tools:**
- `suggest_intent(post_id, text)` - Returns intent + confidence + reasoning
- `learn_from_label(post_id, label, reasoning)` - Store human teaching
- `get_learned_patterns()` - Show what's been learned

**Learning Loop:**
```
Phase 1 (0-50 labels): Human labels ALL, agent observes
Phase 2 (50-160 labels): Agent suggests, human confirms/corrects
Phase 3 (160+ labels): Agent auto-classifies high-confidence, human reviews uncertain
```

### 3. Subreddit Research Agent

**Role:** Discover high-value communities, evaluate performance

**Tools:**
- `discover_related_subreddits(seed)` - Find new sources
- `get_subreddit_metrics(sub)` - Quality metrics from labels
- `recommend_tier_change(sub)` - Promote/demote recommendations

### 4. Outreach Agent

**Role:** Craft contextual messages that get replies

**Tools:**
- `generate_dm_template(post_id, intent, context)` - Personalized DM
- `generate_comment_draft(post_id)` - Helpful comment (not spam)
- `record_outreach_result(post_id, got_reply)` - Track performance

---

## Intent Categories

| Intent | Description | Example |
|--------|-------------|---------|
| `buying` | Actively seeking to purchase | "looking for solar installer recommendations" |
| `bought` | Already purchased/installed | "just installed my powerwall last week" |
| `researching` | Early research phase | "is solar worth it in NC?" |
| `complaining` | Negative experience/warning | "solar company scammed me" |
| `upsell_opportunity` | Existing customer, upsell potential | "have solar, want battery backup" |
| `not_relevant` | Off-topic, professional, spam | "I work for a solar company" |

---

## Human Labeling UI (COMPASS)

```
┌─────────────────────────────────────────────────────────────────────┐
│ INTENT LABELING QUEUE (23 posts awaiting review)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Post: "Finally got my powerwall installed last week!"               │
│ Subreddit: r/solar | Age: 3 days | Engagement: 45 upvotes          │
│                                                                     │
│ AI Suggestion: BOUGHT (72% confidence)                              │
│ Patterns matched: "finally got" → bought (0.85)                     │
│                                                                     │
│ Your Classification:                                                │
│ ○ Buying    ○ Bought ✓   ○ Researching                             │
│ ○ Complaining   ○ Upsell Opportunity   ○ Not Relevant              │
│                                                                     │
│ WHY? (required): _____________________________________________      │
│ Example: "User says 'finally got' and 'last week' - past tense"    │
│                                                                     │
│ Key phrases that indicated this: [finally got] [last week] [+]      │
│                                                                     │
│ Quality: ○ Good Lead   ○ Bad Lead   ○ Maybe                        │
│                                                                     │
│ [SUBMIT LABEL]  [SKIP]  [FLAG FOR DISCUSSION]                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (New Tables)

```sql
-- Human intent labels (training data SSOT)
CREATE TABLE intent_training_samples (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,

  -- Content
  title TEXT NOT NULL,
  body_snippet TEXT,
  subreddit TEXT,

  -- Human labels
  intent_label TEXT NOT NULL,     -- 'buying', 'bought', etc.
  reasoning TEXT NOT NULL,         -- WHY (critical for learning)
  indicator_phrases TEXT,          -- JSON: ["finally got", "last week"]
  quality_label TEXT NOT NULL,     -- 'good_lead', 'bad_lead', 'maybe'

  -- Metadata
  labeled_by TEXT NOT NULL,
  labeled_at TEXT NOT NULL,

  FOREIGN KEY (candidate_id) REFERENCES lead_candidates(id)
);

-- Learned patterns (from TeachableAgent)
CREATE TABLE learned_intent_patterns (
  id TEXT PRIMARY KEY,
  pattern_text TEXT NOT NULL,      -- "finally got", "looking to buy"
  indicates_intent TEXT NOT NULL,  -- 'buying', 'bought'
  confidence REAL NOT NULL,        -- 0.0-1.0
  sample_count INTEGER NOT NULL,   -- How many labels support this
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL
);

-- Agent suggestions (for accuracy tracking)
CREATE TABLE intent_suggestions (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  suggested_intent TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  was_correct INTEGER,             -- 1 if matched human, 0 if not
  suggested_at TEXT NOT NULL
);

-- Message templates with performance
CREATE TABLE message_templates (
  id TEXT PRIMARY KEY,
  template_type TEXT NOT NULL,     -- 'dm', 'comment'
  intent_category TEXT NOT NULL,
  template_text TEXT NOT NULL,
  times_sent INTEGER DEFAULT 0,
  times_replied INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
```

---

## Pattern Learning Algorithm

```python
# From human labels, extract patterns
def extract_patterns_from_label(label: IntentLabel) -> List[Pattern]:
    patterns = []

    # 1. Human-identified indicator phrases (highest quality)
    for phrase in label.indicator_phrases:
        patterns.append(Pattern(
            text=phrase,
            indicates=label.intent,
            confidence=0.9,  # Human-identified = high confidence
            source='human'
        ))

    # 2. Extract verb tense patterns
    if contains_past_tense(label.reasoning):
        # "installed", "got", "bought" → BOUGHT intent
        pass

    # 3. Extract context windows around keywords
    # "want to [keyword]" vs "just [keyword]"

    return patterns

# Classify new post using learned patterns
def classify_intent(text: str) -> IntentClassification:
    patterns = get_active_patterns()
    matches = find_matching_patterns(text, patterns)

    # Aggregate scores by intent
    intent_scores = aggregate_by_intent(matches)

    # Calculate confidence
    winner = max(intent_scores, key=intent_scores.get)
    confidence = calculate_confidence(intent_scores, matches)

    return IntentClassification(
        intent=winner,
        confidence=confidence,
        requires_human_review=(confidence < 0.75),
        reasoning=explain_classification(matches)
    )
```

---

## Implementation Phases

### Phase 0: Project Setup (First)

**Goal:** Create project folder and documentation

**Location:** `C:\LifeOS\LIDS\projects\active\24-livewire-autogen-intent\`

**Files to Create:**
```
24-livewire-autogen-intent/
├── README.md                    # Project status dashboard
├── CODEX_IMPLEMENTATION_PLAN.md # This plan (copy from Claude plan file)
└── AUDIT_FINDINGS.md            # Current system issues
```

### Phase 1: Foundation (Week 1)

**Goal:** Human labeling UI + basic Autogen team structure

**Deliverables:**
- [ ] `agents/python/livewire/` - New Python package
- [ ] `team.py` - SelectorGroupChat with 4 agents
- [ ] `server.py` - FastAPI wrapper (port 5010)
- [ ] Intent labeling UI in COMPASS
- [ ] SQLite schema migrations

**Files to Create:**
```
agents/python/livewire/
├── livewire/
│   ├── __init__.py
│   ├── team.py           # Autogen team definition
│   ├── server.py         # FastAPI endpoints
│   ├── tools/
│   │   ├── post_research.py
│   │   ├── intent_analysis.py
│   │   ├── subreddit_research.py
│   │   └── outreach.py
│   └── data/
│       └── intent_memory/  # TeachableAgent storage
├── pyproject.toml
└── README.md
```

### Phase 2: TeachableAgent Learning (Week 2)

**Goal:** Intent Analysis Agent learns from human labels

**Deliverables:**
- [ ] TeachableAgent integration
- [ ] Pattern extraction from labels
- [ ] Confidence scoring system
- [ ] UI shows agent suggestions
- [ ] Accuracy tracking (agent vs human)

### Phase 3: Subreddit Intelligence (Week 3)

**Goal:** Discover and evaluate high-value communities

**Deliverables:**
- [ ] Subreddit discovery from related subs
- [ ] Quality metrics from intent labels (not just good/bad leads)
- [ ] Auto-recommendations for tier changes
- [ ] "Hidden goldmine" discovery

### Phase 4: Outreach System (Week 4)

**Goal:** Craft messages that get replies

**Deliverables:**
- [ ] DM template generation based on intent
- [ ] Comment drafts (helpful, not spammy)
- [ ] Reply rate tracking
- [ ] A/B testing framework

---

## Critical Files to Modify

### Existing (TypeScript - admiral-server)

| File | Change |
|------|--------|
| `agents/apex/livewire/src/index.ts` | Add proxy to Python Autogen service |
| `agents/apex/livewire/src/persistence/sqlite.ts` | Add new tables (migration 008+) |

### New (Python - Autogen)

| File | Purpose |
|------|---------|
| `agents/python/livewire/livewire/team.py` | 4-agent SelectorGroupChat |
| `agents/python/livewire/livewire/tools/*.py` | Agent-specific tools |
| `agents/python/livewire/livewire/memory/intent_memory.py` | TeachableAgent storage |

### Frontend (COMPASS)

| File | Change |
|------|--------|
| `apps/compass/client/src/pages/livewire.tsx` | Add "Labeling" tab |
| `apps/compass/client/src/components/livewire/IntentLabelingPanel.tsx` | NEW |
| `apps/compass/client/src/components/livewire/PatternDashboard.tsx` | NEW |

---

## Success Criteria

### Phase 1-2 (Training Mode)
- [ ] Posts displayed WITHOUT auto-scores
- [ ] Human can label intent + provide reasoning
- [ ] Agent learns patterns from aggregate labels
- [ ] After 50+ labels, agent suggests with confidence shown
- [ ] Human can confirm or correct agent suggestions

### Phase 3-4 (Active Mode)
- [ ] After 160+ labels, agent auto-classifies >75% confidence
- [ ] Human only reviews low-confidence posts
- [ ] Subreddit discovery finds new sources
- [ ] Message templates achieve >10% reply rate
- [ ] Continuous learning from new labels

---

## User Decisions (December 30, 2025)

| Question | Decision |
|----------|----------|
| **Labeling UI** | COMPASS UI - Richer interface with dropdowns, text fields, pattern highlighting |
| **Outreach** | Build in parallel - Templates ready when intent detection works |
| **Architecture** | Hybrid - TypeScript handles Reddit API/scanning, Python handles intent/learning only |

### Architecture Implications

**Hybrid Approach:**
```
TypeScript (existing)              Python (new)
─────────────────────             ─────────────────
• Reddit API/scanning             • Intent Analysis Agent (TeachableAgent)
• Lead storage (SQLite)           • Subreddit Research Agent
• COMPASS proxy                   • Outreach Agent
• Basic CRUD operations           • Pattern learning
                                  • Confidence scoring
         │                                 │
         └──────────┬──────────────────────┘
                    │
                    ▼
              SQLite (shared)
              • lead_candidates
              • intent_training_samples
              • learned_patterns
```

**Communication:** TypeScript LiveWire calls Python service at localhost:5010 for:
- `POST /intent/suggest` - Get intent suggestion for a post
- `POST /intent/learn` - Record human label
- `GET /patterns` - Get learned patterns
- `POST /outreach/generate` - Generate message template

---

## Key Insight

The current system tries to be too clever with keywords and patterns. The new system:

1. **Admits it doesn't know** - Surfaces posts without pretending to understand intent
2. **Learns from humans** - Every label teaches the system something
3. **Shows its work** - Explains WHY it suggests an intent
4. **Improves over time** - 160+ labels creates a real training dataset
5. **Handles ambiguity** - Same phrase can mean different things in different contexts

This is the path to reliable intent detection.
