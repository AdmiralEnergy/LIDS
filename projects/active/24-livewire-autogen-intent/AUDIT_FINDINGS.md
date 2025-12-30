# LiveWire v2.0 Audit Findings

**Date:** December 30, 2025
**Auditor:** Terminal Claude + David Edwards

---

## Executive Summary

The current LiveWire v2.0 keyword-based scoring system has fundamental design flaws that cannot be fixed with incremental improvements. A complete architectural shift to human-trained intent detection is required.

---

## Critical Issues

### 1. Keywords Are Scored Atomically

**Problem:** When a user rejects a lead containing "powerwall", the system penalizes the keyword "powerwall" itself.

**Example:**
- Post: "Just installed my Powerwall 3 last week!"
- User rejects (already bought)
- System: `powerwall` weight -1

**Why It's Wrong:** The keyword "powerwall" isn't the problem. The phrase "just installed" indicates past tense (already bought). The same keyword in "want to buy a powerwall" should be positive.

**Root Cause:** `keyword-learning.ts` tracks per-keyword feedback without context awareness.

---

### 2. Context Analyzer Is Static

**Problem:** `context-analyzer.ts` uses hardcoded regex patterns that don't learn.

**Patterns:**
```typescript
ALREADY_BOUGHT = [
  /just\s+(installed|got|finished)/i,
  /loving\s+my\s+(solar|panels)/i,
  ...
]
```

**Why It's Wrong:**
- "just installed" could mean ALREADY BOUGHT or UPSELL OPPORTUNITY (battery, EV charger)
- "finally installed" could be positive (sharing excitement) or negative (done buying)
- Context depends on the FULL post, not regex fragments

**Root Cause:** No mechanism to learn new patterns or update existing ones from feedback.

---

### 3. Scoring Pretends to Know

**Problem:** Every post gets a score (0-100) and tier (HOT/WARM/COLD), creating false confidence.

**Reality:**
- 59 score doesn't mean "59% likely to buy"
- System has no idea what makes a good lead
- Human must review anyway

**Better Approach:** Surface posts WITHOUT scores. Let human label intent. Build confidence AFTER training.

---

### 4. Feedback Loop Adjusts Wrong Thing

**Problem:** `feedback-engine.ts` adjusts weights for:
- Keywords (which words matched)
- Subreddits (which community)
- Intent tiers (HOT/WARM/COLD)

**What It Should Adjust:**
- Context patterns ("just installed" → bought, "want to get" → buying)
- Intent signals (verb tense, question marks, call-to-action phrases)
- Semantic meaning (not surface text)

---

### 5. No Real Learning

**Problem:** The system adjusts numerical weights but doesn't learn concepts.

**Example of "learning":**
```
powerwall: baseWeight 8 → currentWeight 7 (after 1 negative)
```

**What actual learning looks like:**
```
Pattern: "[past_tense_verb] my [product]" → BOUGHT intent (0.92 confidence)
Source: 45 human labels with reasoning
```

---

## Data Evidence

From `/v2/keywords` endpoint (December 30, 2025):

| Keyword | Base | Current | Negative | Context |
|---------|------|---------|----------|---------|
| powerwall | 8 | 7 | 1 | "...Tesla Powerwall 3 • Whole-home backup..." |
| first home | 5 | 1 | 4 | "...This is my first home buy..." |
| backup power | 5 | 4 | 1 | "...backup power, and overcoming my kid's video game habits..." |

**Observation:** Keywords are being penalized for contexts they appear in, not for being bad keywords.

---

## Recommended Architecture

### Current (Broken)
```
Reddit Post → Keyword Match → Auto-Score → Human Validates → Adjust Keywords
```

### Proposed (Learning-First)
```
Reddit Post → Surface (no score) → Human Labels Intent + Reasoning → Learn Patterns → Progressive Autonomy
```

---

## Files Affected

| File | Current Role | Issue |
|------|--------------|-------|
| `keyword-learning.ts` | Per-keyword weight adjustment | Treats keywords atomically |
| `context-analyzer.ts` | Static regex patterns | Doesn't learn |
| `lead-scoring.ts` | V1/V2 scoring models | Creates false confidence |
| `feedback-engine.ts` | Weight adjustment | Adjusts wrong dimensions |
| `subreddit-tiers.ts` | Tier classification | Based on lead outcomes, not intent |

---

## Conclusion

The current system cannot be fixed with patches. The fundamental assumption—that keywords can indicate intent—is wrong. Context, verb tense, and semantic meaning determine intent, not keyword presence.

**Recommendation:** Build a new human-trained intent detection system (Project 24) that:
1. Stops auto-scoring
2. Collects human labels with reasoning
3. Learns patterns from aggregate data
4. Builds confidence through training, not heuristics

---

*Audit completed December 30, 2025*
