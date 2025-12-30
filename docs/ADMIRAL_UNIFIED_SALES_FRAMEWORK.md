# Admiral Energy Unified Sales Framework

**Version:** 2.0
**Effective Date:** December 2025
**Document ID:** AE-USF-2025-001
**Classification:** Internal Operations

---

## Executive Summary

This document unifies all Admiral Energy sales systems into a single reference:
- **Progression System** (XP, ranks, levels)
- **Sales Metrics** (DPC-focused efficiency tracking)
- **RedHawk Academy** (training alignment)
- **Twenty CRM** (data layer)
- **Multi-channel Cadences** (engagement hierarchy)

**Core Philosophy:** Self-diagnostic efficiency tracking, not enforcement. Reps track their own improvement using quality-adjusted metrics that reward efficient, qualified enrollment over raw dial volume.

---

## Part 1: Philosophy & Principles

### 1.1 The Admiral Energy Sales Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MULTI-CHANNEL CADENCE APPROACH                                             │
│                                                                             │
│  Cold Calling Only:     ~2% conversion to appointment                       │
│  Multi-Channel Cadence: 5-7% conversion to appointment                     │
│                                                                             │
│  The difference is ENROLLMENT - getting leads into a structured            │
│  follow-up sequence across multiple channels (SMS, Email, Call)            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Three Pillars of ADS

| Pillar | Purpose | System |
|--------|---------|--------|
| **LEADS** | PropStream imports with TCPA compliance | Twenty CRM |
| **STRUCTURE** | Dialer, agents, training | ADS Dashboard, RedHawk Academy |
| **PROGRESSION** | Efficiency tracking + improvement visibility | Progression System |

### 1.3 Quality Over Quantity

**Old Model (Dial-Focused):**
- 150 dials/day = Elite performer
- Gaming: Rep makes 200 calls but never enrolls anyone

**New Model (Efficiency-Focused):**
- DPC (Dials Per Confirmed) = Primary metric
- Gaming-resistant: Confirmation touch validates enrollment quality
- A rep with 80 dials and 4 confirmed enrollments (DPC=20) outperforms a rep with 150 dials and 2 confirmed enrollments (DPC=75)

---

## Part 2: Metrics Defined

### 2.1 Primary Efficiency Metrics

| Metric | Formula | What It Measures | Lower/Higher Better |
|--------|---------|------------------|---------------------|
| **DPE** | Dials / Enrollments | Raw enrollment efficiency | Lower = Better |
| **ECR** | Confirmed / Enrolled | Enrollment quality (gaming detector) | Higher = Better |
| **DPC** | Dials / Confirmed Enrollments | **PRIMARY** - Quality-adjusted efficiency | Lower = Better |
| **EAR** | Appointments / Confirmed Enrollments | Cadence effectiveness | Higher = Better |

### 2.2 The Efficiency Cascade

```
DPE: Dials Per Enrollment
 │   "How many dials to get someone into your cadence?"
 ↓
ECR: Enrollment Confirmation Rate
 │   "What % of enrollees are actually interested?" (Quality gate)
 ↓
DPC: Dials Per Confirmed  ← PRIMARY METRIC
 │   "How many dials to get a QUALITY enrollment?"
 ↓
EAR: Enrollment-to-Appointment Rate
 │   "What % of confirmed enrollments become appointments?"
 ↓
ACR: Appointment-to-Close Rate
 │   "What % of appointments become deals?"
 ↓
RPE: Revenue Per Enrollment
     "How much revenue does each enrollment generate?"
```

### 2.3 Secondary Metrics (Context, Not Graded)

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Raw Dials** | Count | Activity context (no tiers) |
| **Connect Rate** | Connects / Dials | List quality + timing indicator |
| **2+ Min Rate** | Long calls / Connects | Engagement quality |
| **CCR** | Cadences Completed / Started | Follow-through discipline |
| **TUR** | Touches Completed / Touches Possible | Tool utilization |

### 2.4 Compliance Metrics (Binary - 100% Required)

| Metric | Requirement | Consequence |
|--------|-------------|-------------|
| **DNC Compliance** | 100% | $500-$50,120 per violation |
| **Call Time Compliance** | 100% (8am-9pm local) | $500-$1,500 per violation |
| **Consent Documentation** | 100% | Lawsuit exposure |

---

## Part 3: Performance Tiers

### 3.1 DPC-Based Efficiency Tiers

| Tier | DPC Range | ECR Required | Description |
|------|-----------|--------------|-------------|
| **Elite** | < 30 | > 85% | Top 10% efficiency + high quality |
| **Above Satisfactory** | 30 - 45 | > 75% | Strong performer |
| **Satisfactory** | 45 - 70 | > 65% | Meeting expectations |
| **Developing** | > 70 | Any | Room for improvement |
| **Ramp** | N/A | < 25 confirmed | Still building baseline |

### 3.2 Tier Interpretation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WHAT YOUR DPC MEANS                                                        │
│                                                                             │
│  DPC 25:  "I get a quality enrollment every 25 dials" → Elite              │
│  DPC 40:  "I get a quality enrollment every 40 dials" → Above Satisfactory │
│  DPC 60:  "I get a quality enrollment every 60 dials" → Satisfactory       │
│  DPC 100: "I get a quality enrollment every 100 dials" → Developing        │
│                                                                             │
│  WHAT YOUR ECR MEANS                                                        │
│                                                                             │
│  ECR 90%: "9 out of 10 enrollees confirm interest" → High quality          │
│  ECR 70%: "7 out of 10 enrollees confirm interest" → Good quality          │
│  ECR 50%: "5 out of 10 enrollees confirm interest" → Heavy-handed?         │
│  ECR 30%: "3 out of 10 enrollees confirm interest" → Needs coaching        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Ramp Period (New Reps)

New reps are in "Ramp" period until they have **25 confirmed enrollments**. During ramp:
- No DPC tier is shown (still collecting data)
- Progress bar shows: "Building baseline (X/25 confirmed)"
- Focus on learning, not metrics

---

## Part 4: Enrollment Quality System

### 4.1 Enrollment Types

| Type | Who Initiates | Quality Level | Confirmation Needed |
|------|---------------|---------------|---------------------|
| **Offensive** | Rep during call | Needs validation | Yes (24-48hr touch) |
| **Passive** | Lead fills form in cadence | Pre-confirmed | No (self-service) |

### 4.2 Offensive Enrollment (Rep-Initiated)

**During the call, rep:**
1. Gets verbal opt-in from lead
2. Fills qualification form with required fields:
   - Homeowner? (Y/N)
   - Roof age (approximate years)
   - Monthly electric bill ($)
   - Decision maker? (Y/N)
3. Logs enrollment immediately

**24-48 hours later (automated):**
4. Confirmation SMS sent: *"Hey [Name], confirming you're interested in learning about solar savings for your home. Reply YES to continue, or STOP to opt out."*
5. Lead responds → Status updated

### 4.3 Enrollment Status Flow

```
ENROLLED (rep logs)
    ↓ (24-48 hours)
CONFIRMATION SENT
    ↓
    ├─→ "YES" reply    → CONFIRMED (counts in DPC)
    ├─→ No response    → UNCONFIRMED (flagged)
    ├─→ "STOP" reply   → DECLINED (red flag if pattern)
    └─→ Answered call  → CONFIRMED (verbal confirmation)
```

### 4.4 Qualification Score

Each offensive enrollment gets a qualification score based on data captured:

| Fields Filled | Score | Quality Level |
|---------------|-------|---------------|
| 4/4 (all fields) | 100% | Full qualification |
| 3/4 | 75% | Good |
| 2/4 | 50% | Partial |
| 1/4 | 25% | Minimal |
| 0/4 | 0% | Unqualified |

**Impact:** Low qualification scores correlate with low ECR (unconfirmed enrollments).

### 4.5 Passive Enrollment (Lead-Initiated)

Leads who fill out forms in cadences are **pre-confirmed**:
- Beginning of cadence: Interest form
- Middle of cadence: Quote request form
- End of cadence: Schedule consultation form

These count as confirmed immediately (lead took action).

---

## Part 5: Engagement Hierarchy

### 5.1 Channel Value Ranking

```
EMAIL ENGAGEMENT (Gateway)
 │  Lead opens emails, clicks links
 │  Purpose: Warm them up, build familiarity
 ↓
SMS OPT-IN (King)
 │  Lead agrees to receive text messages
 │  This is THE enrollment that matters
 ↓
CONFIRMED ENROLLMENT (Quality-Validated)
 │  Lead confirms interest via confirmation touch
 │  NOW they're in your quality pipeline
 ↓
APPOINTMENT SET (Conversion)
 │  Lead agrees to scheduled consultation
 ↓
DEAL CLOSED (Revenue)
     Lead signs contract
```

### 5.2 Why SMS is King

| Channel | Open Rate | Response Rate | Speed |
|---------|-----------|---------------|-------|
| Email | 20-30% | 2-5% | Hours to days |
| SMS | 98% | 45%+ | Minutes |
| Phone | 8-15% connect | Variable | Immediate if answered |

SMS has the highest engagement and fastest response. Email is the gateway TO SMS opt-in.

### 5.3 Cadence Touch Sequence

**NC Solar Trust-Builder Cadence (14 days):**

| Day | Action | Channel | Purpose |
|-----|--------|---------|---------|
| 0 | Lead magnet / Speed-to-lead call | Call | Initial enrollment attempt |
| 1 | Let them read | - | Absorption |
| 2 | Email 2 + Value call | Email + Call | Reference email, build bridge |
| 3 | Social touch | LinkedIn | Soft research signal |
| 5 | Email 3 (Case study) | Email | Local social proof |
| 6 | Call 3 (Power Hour) | Call | Overcome trust deficit |
| 8 | Email 4 (Urgency + SMS CTA) | Email | Push for SMS opt-in |
| 9 | Break-up call | Call | Elicit decision |
| 12 | Email 5 (Final nudge) | Email | Last chance |
| 14 | Recycle to long-term nurture | - | Monthly email |

---

## Part 6: Progression System Integration

### 6.1 XP Sources (Outcome-Weighted)

| Activity | XP | Category | Notes |
|----------|-----|----------|-------|
| **Dial Made** | 1 | Activity | Minimal - just confirms activity |
| **Call Connected** | 3 | Activity | Slightly more than dial |
| **2+ Min Conversation** | 20 | Engagement | Quality conversation |
| **Voicemail Left** | 5 | Activity | Cadence touch |
| **Email Sent** | 5 | Activity | Cadence touch |
| **Email Reply Received** | 40 | Engagement | Lead engaged |
| **SMS Sent** | 5 | Activity | Cadence touch |
| **SMS Reply Received** | 30 | Engagement | Lead engaged |
| **SMS Enrollment** | 75 | Outcome | Primary enrollment metric |
| **Confirmation Bonus** | +25 | Quality | When enrollment confirmed |
| **Appointment Set** | 125 | Outcome | Major milestone |
| **Appointment Held** | 75 | Outcome | Show rate matters |
| **Deal Closed** | 400 | Outcome | Ultimate goal |
| **Cadence Completed** | 50 | Discipline | Full 14-day sequence |
| **First Dial of Day** | 25 | Streak | Consistency bonus |
| **Streak Day** | 10 | Streak | Multiplied by streak count |

### 6.2 XP Weight Distribution

**Daily Example (Efficient Rep):**
- 80 dials = 80 XP (14%)
- 8 connects = 24 XP (4%)
- 2 long conversations = 40 XP (7%)
- 3 enrollments = 225 XP (39%)
- 2 confirmations = 50 XP (9%)
- 2 appointments = 250 XP (44%)
- **Total: ~580 XP**

**Outcome Focus:** Enrollment + Appointment + Confirmation = 72% of daily XP

### 6.3 Rank Structure

| Rank | Code | XP Required | Efficiency Gate |
|------|------|-------------|-----------------|
| SDR I | E-1 | 0 | None (starting) |
| SDR II | E-2 | 500 | None |
| SDR III | E-3 | 1,500 | DPC < 80 (if 25+ confirmed) |
| **Sales Operative** | E-4 | 3,000 | DPC < 60 + ECR > 70% |
| **Senior Operative** | E-5 | 8,000 | DPC < 45 + EAR > 20% |
| **Team Lead** | E-6 | 15,000 | DPC < 35 + CCR > 70% |
| Manager | E-7 | 30,000 | Team avg DPC < 55 |

### 6.4 Level Progression

16 levels with XP thresholds:

| Level | XP Required | Level | XP Required |
|-------|-------------|-------|-------------|
| 1 | 0 | 9 | 4,000 |
| 2 | 100 | 10 | 5,000 |
| 3 | 250 | 11 | 7,000 |
| 4 | 500 | 12 | 10,000 |
| 5 | 1,000 | 13 | 14,000 |
| 6 | 1,500 | 14 | 18,000 |
| 7 | 2,000 | 15 | 22,000 |
| 8 | 3,000 | 16+ | +5,000 each |

### 6.5 Efficiency Badges

| Badge | Requirement | What It Proves |
|-------|-------------|----------------|
| **Enrollment Elite** | DPC < 25 for 7 days | Top-tier efficiency |
| **Quality Champion** | ECR > 90% (min 20 enrollments) | High-quality enrollments |
| **Cadence Master** | CCR > 85% for 30 days | Disciplined follow-through |
| **Conversion King** | EAR > 30% for 30 days | Effective cadence execution |
| **Consistency Star** | 30-day streak | Shows up every day |

---

## Part 7: RedHawk Academy Alignment

### 7.1 Training Modules → Metric Impact

| Module | Focus | Metrics Improved |
|--------|-------|------------------|
| **Module 1: Opener Mastery** | First 10 seconds, pattern interrupts | DPE, Connect Rate |
| **Module 2: Qualification** | Discovery questions, buying signals | ECR, Qualification Score |
| **Module 3: Cadence Execution** | Multi-channel discipline | CCR, TUR, EAR |
| **Module 4: Objection Handling** | Curiosity exploration, not battle | 2+ Min Rate |
| **Module 5: TCPA Compliance** | Legal requirements, consent | Compliance metrics |

### 7.2 Boss Battle Scoring → Real Metric Correlation

| Battle Score Category | Real-World Metric |
|----------------------|-------------------|
| Opener effectiveness | DPE (fewer dials to engage) |
| Qualification depth | ECR (higher confirmation rate) |
| Objection handling | 2+ Min Rate (longer conversations) |
| Closing technique | EAR (enrollments become appointments) |
| Overall performance | DPC (quality-adjusted efficiency) |

### 7.3 Certification Levels

| Level | Requirements | Unlocks |
|-------|--------------|---------|
| **Trainee** | Enrolled in RedHawk | Practice mode |
| **Associate** | Modules 1-2 + 80% exam | COMPASS field assistant |
| **Specialist** | Modules 1-5 + 85% exam + E-3 rank | Full ADS dialer access |
| **Expert** | Full certification + E-5 rank | Advanced features, mentoring |

---

## Part 8: Twenty CRM Data Model

### 8.1 repProgressions Object

```typescript
{
  id: string;                    // UUID
  name: string;                  // Display name
  workspaceMemberId: string;     // Permanent user ID (never changes)
  totalXp: number;               // Cumulative XP
  currentLevel: number;          // 1-16+
  currentRank: string;           // E-1 through E-7
  closedDeals: number;           // Verified deal count
  badges: string[];              // Badge IDs earned
  streakDays: number;            // Consecutive activity days
  completedModules: string[];    // Training module IDs
  certifications: string[];      // Certification IDs
}
```

### 8.2 enrollmentRecords Object (NEW)

```typescript
{
  id: string;                    // UUID
  leadId: string;                // Person ID in Twenty
  repId: string;                 // workspaceMemberId
  source: 'offensive' | 'passive';
  status: 'pending' | 'confirmed' | 'unconfirmed' | 'declined';
  qualificationScore: number;    // 0-100 based on fields filled
  confirmationSentAt: Date;      // When confirmation touch sent
  confirmedAt: Date | null;      // When lead confirmed
  enrolledAt: Date;              // Initial enrollment timestamp
  metadata: {
    homeowner: boolean | null;
    roofAge: number | null;
    monthlyBill: number | null;
    decisionMaker: boolean | null;
  }
}
```

### 8.3 dailyMetrics Object

```typescript
{
  id: string;
  date: string;                  // YYYY-MM-DD
  repId: string;                 // workspaceMemberId

  // Activity
  dials: number;
  connects: number;
  callsUnder30s: number;
  callsOver2Min: number;
  voicemailsLeft: number;

  // Enrollment
  enrollments: number;           // Total enrolled
  confirmedEnrollments: number;  // Confirmed (quality)
  unconfirmedEnrollments: number;
  declinedEnrollments: number;

  // Conversion
  appointments: number;
  shows: number;
  deals: number;
  revenue: number;

  // Cadence
  cadencesTouchesAttempted: number;
  cadenceTouchesCompleted: number;
  cadencesCompleted: number;

  // Calculated (7-day rolling in app)
  dpe: number;
  ecr: number;
  dpc: number;
  ear: number;
}
```

### 8.4 Data Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LOCAL (IndexedDB/Dexie)                                                    │
│  - Instant UI updates                                                       │
│  - Offline resilience                                                       │
│  - Daily metrics cache                                                      │
│  - XP events log                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                              ↕ Sync every 5 min                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  TWENTY CRM (Source of Truth)                                               │
│  - repProgressions (permanent record)                                       │
│  - enrollmentRecords                                                        │
│  - callRecords                                                              │
│  - Conflict resolution: Twenty wins                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 9: Dashboard Display

### 9.1 Primary HUD Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [E-4 OPERATIVE]  Level 12 ████████████░░░░░ 2,450/3,000 XP   5-Day Streak  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  DPC: 32                                              (improving)   │    │
│  │  ████████████████████░░░░░░░░░░                                    │    │
│  │  Elite: <30  │  You: 32  │  Satisfactory: 70                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │  Dials       │ │  Enrolled    │ │  Confirmed   │ │  Appointments│       │
│  │     127      │ │      5       │ │      4       │ │      2       │       │
│  │  (today)     │ │  (today)     │ │  ECR: 80%    │ │  (today)     │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                                             │
│  Secondary (7-Day Rolling)                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ EAR: 28% │ │CCR: 75%  │ │TUR: 82%  │ │ Streak:5 │                       │
│  │   Elite  │ │   Good   │ │   Elite  │ │   Good   │                       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Self-Diagnostic Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WHAT YOUR NUMBERS MEAN                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DPC: 32 (Above Satisfactory)                                               │
│  You get a quality enrollment every 32 dials. Strong efficiency.            │
│  Elite reps average 25 or fewer. Focus: Opener refinement.                  │
│                                                                             │
│  ECR: 80% (Good)                                                            │
│  8 out of 10 enrollees confirm interest. Your enrollments are quality.      │
│                                                                             │
│  EAR: 28% (Elite)                                                           │
│  28% of confirmed enrollees become appointments. Cadence is effective.      │
│                                                                             │
│  IMPROVEMENT FOCUS:                                                         │
│  Your ECR is good but not elite (85%+). Try:                                │
│  - Deeper qualification before enrolling                                    │
│  - Make sure lead understands what they're opting into                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 10: Optimal Timing Reference

### 10.1 Power Hours

| Day | Best Times | Connect Rate Index |
|-----|------------|-------------------|
| Tuesday | 10:00-11:30 AM, 4:00-6:00 PM | 100 (baseline) |
| Wednesday | 10:00-11:30 AM, 4:00-6:00 PM | 98 |
| Thursday | 10:00-11:30 AM, 4:00-6:00 PM | 95 |
| Monday | 10:00-11:30 AM | 82 |
| Friday | 10:00-11:30 AM | 75 |

### 10.2 Times to Avoid

| Time | Impact | Reason |
|------|--------|--------|
| 8:00-9:30 AM | -40% | Morning chaos |
| 12:00-1:30 PM | -35% | Lunch break |
| 6:30-9:00 PM | -50% | Dinner/family time |
| Monday 8-10 AM | -55% | Absolute worst |
| Friday 3-5 PM | -45% | Weekend mode |

### 10.3 State-by-State Call Windows

| State | Legal Hours | Notes |
|-------|-------------|-------|
| NC | 8am-9pm | Federal default |
| FL | 8am-8pm | Max 3 calls/24hr |
| TX | 9am-9pm | Sunday: Noon-9pm only |
| SC, VA, GA | 8am-9pm | Federal default |

---

## Part 11: Compliance Checklist

### 11.1 Before Every Calling Session

- [ ] Lead list scrubbed against National DNC (within last 31 days)
- [ ] Lead list cross-checked against Internal DNC
- [ ] Dialing restricted to legal hours for target time zones
- [ ] Caller ID displays real company number
- [ ] Ready to log opt-out requests immediately

### 11.2 When Lead Says "Take Me Off Your List"

1. **Acknowledge:** "Absolutely, removing you right now."
2. **Confirm:** "Can you confirm this is [read number back]?"
3. **Log Immediately:** Flag as DNC in CRM before hanging up
4. **Never Contact Again:** No calls, texts, or emails for marketing

---

## Part 12: Coaching Triggers

### 12.1 Automatic Coaching Required When:

| Trigger | Threshold | Coaching Focus |
|---------|-----------|----------------|
| Low ECR | < 60% for 7 days | Qualification technique |
| High DPC | > 80 for 7 days | Opener/engagement |
| Zero enrollments | 2 consecutive days | Same-day call shadowing |
| Low EAR | < 10% (min 20 confirmed) | Cadence execution |

### 12.2 Automatic Recognition When:

| Achievement | Threshold | Recognition |
|-------------|-----------|-------------|
| DPC Elite | < 30 for 7 days | Team shoutout |
| ECR Champion | > 90% (min 20 enrollments) | Quality badge |
| Cadence Master | CCR > 85% for 30 days | Discipline badge |
| 15+ Appointments | In one week | Performance bonus eligible |

---

## Document References

This unified framework consolidates and supersedes:

| Document | Status | Purpose |
|----------|--------|---------|
| `PROGRESSION_SYSTEM.md` | Keep | Detailed implementation reference |
| `REDHAWK_ACADEMY.md` | Keep | Training system reference |
| `ADMIRAL_SALES_OPERATIVE_FRAMEWORK.md` | Keep | Cold calling methodology |
| `00_SALES_METRICS_FRAMEWORK.md` | Keep | Detailed tier definitions |
| `OPTIMAL_COLD_CALLING_TIMES.md` | Keep | Timing data reference |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2025 | Initial framework (dial-focused) |
| 2.0 | Dec 2025 | DPC-focused, enrollment quality system, ECR gate |

---

*"Efficiency over volume. Quality over quantity. Every enrollment should be a real opportunity."*

**— Admiral Energy Sales Philosophy v2.0**
