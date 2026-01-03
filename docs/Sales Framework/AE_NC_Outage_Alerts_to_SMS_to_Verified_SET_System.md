# Admiral Energy — NC Duke Outage Alerts → SMS Enrollment → Readiness Review SET System (v1.1)

**Purpose:** A single, end-to-end operating system that turns cold calling + email into **(1) SMS enrollments** (trust asset) and **(2) REACH-paid “Verified SETs”** (cash engine), while staying compliant and not spammy.

**Scope:** North Carolina, Duke territory. Battery-backup first, solar as an add-on when appropriate.

> **Not legal advice.** TCPA/CTIA/carrier enforcement is real. Have counsel review final scripts/disclosures, and confirm state rules, dialing methodology, and consent language.

**Changelog (v1.1):** Clarified that *documented written/electronic consent* is the default gateway for ongoing SMS; verbal permission is treated as permission to send a one-time enrollment text/email, but the lead is not marked SMS-enrolled until they complete a checkbox/keyword opt-in.

---

## 0) North Star (keep it simple)

### One funnel. Two exits. One promise.
- **Primary Offer (Front Door):** **Free NC Duke Power Outage Alerts + Grid Readiness Updates**
- **Primary Cash Outcome:** **Readiness Review HELD** → REACH **Verified SET** ($50–$100)
- **Secondary Asset Outcome:** SMS + Email enrolled list (event-driven nurture)

### The Power Home rule (adapted)
**We do not “win” when they book. We win when they show.**  
Cadence **continues until the Readiness Review is HELD**.

---

## 1) Definitions (so the team doesn’t get confused)

### 1.1 Outcomes
- **SMS Enrollment (Success – Asset):** Lead has valid SMS consent (checkbox/form or keyword opt-in or compliant written consent) and can receive alerts.
- **Booked Review (Not Success yet):** A calendar event exists; no payment unless **held**.
- **Review HELD (Success – Cash):** Readiness Review completed with required REACH fields: **roof + credit band + bill/usage + property/address + estimate inputs**.
- **Proposal Call Booked:** Next-step call with closer (or same rep if blended role).
- **Sale Closed:** Install contract signed.

### 1.2 Roles
- **SDR / Setter:** Drives **Alert enrollment** + **Readiness Review attendance**. Owns cadence until **HELD**.
- **Closer / Sales Rep:** Runs **Proposal/Sales** after Review is held (or runs the review + proposal in one session if you’re operating as hybrid).

---

## 2) Core Positioning (what we say, consistently)

### 2.1 Lead with the tool (NOT a fallback)
**Always lead with**: *Free Duke Outage Alerts + Readiness updates*  
This is your Power Home “free estimate.” It builds trust instantly.

### 2.2 The Readiness Review is framed as “accuracy”
Discovery/Readiness Review is not “a sales call.” It’s:
- **Confirming correct information on file**
- Turning county-level alerts into **home-specific preparedness**
- Mapping **1–2 day, 3–5 day, extended** outage scenarios

**Key line:**
> “You’ll still get alerts either way — the review just makes it accurate and personalized for your home.”

That makes the SET feel natural, not pushy.

---

## 3) Compliance guardrails (non-negotiables)

### 3.1 Calling
- Call only within legal hours (default 8am–9pm local; confirm per state/lead location).
- Maintain **National DNC + internal DNC**.
- Log opt-outs immediately (never contact again for marketing).

### 3.2 Email marketing consent
- Email consent can be obtained verbally (“Yes, email me the link.”) and logged.
- Include unsubscribe in every marketing email.

### 3.3 SMS consent (do this right)
Because you’ll use “alerts” to invite homeowners into readiness reviews (a marketing/telemarketing outcome), operate as if **prior express written consent (PEWC)** is required for the *ongoing* SMS program.

**Default (recommended): Email-gated SMS (paper-trail).**
- Rep gets permission to email the enrollment link.
- Homeowner opts into SMS by completing a **web form checkbox** (with disclosures) or a **keyword opt-in** (e.g., “Text JOIN to …”).
- Only after that action do we mark them **ENROLLED (SMS)**.

**Live-call shortcut (still ends in written/electronic consent):**
- Rep can ask for **verbal permission to send one enrollment message** (email or a single text containing the opt-in link/keyword + disclosures).
- The homeowner completes the written step (checkbox/keyword reply). That step is the “receipt.”
- Record the call and log the verbal permission as supporting evidence, but **don’t treat verbal alone as SMS enrollment**.

**Never** run ongoing SMS on “implied” permission from a call. Documented consent is the whole point.

### 3.4 Proof of consent (must be stored)
For every SMS opt-in, store:
- Phone number
- Seller-specific consent: consent language should name **Admiral Energy** as the sender
- Consent checkbox state / keyword
- Timestamp
- IP address (web form)
- URL + consent text version/hash
- Source (web form, live call, keyword)
- STOP/HELP handling

---

## 4) The State Machine (single funnel, clean branching)

### 4.1 Lead lifecycle states
1. **NEW (Callable)**
2. **CONTACTED (No Enroll)**
3. **EMAIL CONSENTED (Link sent)**
4. **ENROLLED (Email)**
5. **ENROLLED (SMS)** *(asset win)*
6. **REVIEW BOOKED (Not Held)**
7. **REVIEW HELD (Verified SET)** *(cash win)*
8. **PROPOSAL CALL BOOKED**
9. **SOLD**
10. **NOT QUALIFIED / NOT NOW (Nurture)**
11. **OPTOUT / DNC (Do not contact)**

### 4.2 Cadence rule
- **Cadence runs from NEW → until REVIEW HELD (Verified SET)**
- Booking does **not** stop cadence; it changes tone to **attendance assurance**.

---

## 5) The End-to-End Sequence (beginning → end)

### Phase A — Lead intake & prep (Day 0)
**Sources:** cold list (Duke territory), TikTok leads, website form, referrals, other lists.  
**Before dialing:**
- DNC scrub + call-window compliance
- Tag territory/county if known
- Prep a “reason for calling” (Helene, maintenance, outage patterns)

---

### Phase B — Live cold call flow (primary workflow)

#### B1) Opener (utility-style, not salesy)
Goal: earn 20 seconds.
- “We’re notifying Duke customers in *[county]* about outage patterns and readiness options after Helene / recent grid maintenance.”

#### B2) Micro-qualification (build yeses)
Ask 2–4 quick questions:
- Generator/backup currently? (Y/N)
- Lost power recently / during Helene? (Y/N)
- If power was out 1–2 days, what breaks first? (food, medical, work internet)
- Would you want alerts + a simple plan for longer outages?

**If pain + interest exists → proceed.**

#### B3) Primary offer: Free Alerts (email permission)
> “We offer free Duke outage alerts and readiness updates. I can email you the enrollment link—okay?”

If yes:
- Collect email
- Send email immediately (or within 5 minutes)
- Log **email consent**

#### B4) SMS enrollment (paper-trail safe)
**Default:** keep SMS enrollment **behind the email link** (best compliance + best quality).  
> “If you want the fastest alerts, the enrollment link also lets you turn on text updates. Want me to email it to you?”

**Optional live shortcut:** if they’re engaged, ask permission to send **one** enrollment text (not an ongoing program yet):  
> “If you prefer, I can send a single text right now with the opt‑in link. You’ll only get texts if you complete the opt‑in—okay?”

If yes:
- Send **one** enrollment text containing the opt-in link/keyword + required disclosures (STOP/HELP).
- **Do not** mark them SMS-enrolled until they complete the checkbox/keyword reply.
- Log: timestamp, number, consent text version, and their opt-in action (checkbox/keyword).

If hesitant:
- “No worries—email works great. SMS is optional.”

#### B5) Set the Readiness Review (the cash step)
Immediately after agreeing to alerts (or after micro-qualification):
> “Most people also do a short readiness walkthrough so our alerts and recommendations are accurate for their home—1–2 days vs 3–5 vs longer. Would you like to schedule that?”

If yes:
- Book review
- Confirm details
- Explain what’s needed (roof + bill + credit band + address)

If no:
- Keep them on alerts
- Cadence continues with soft invites to review

---

### Phase C — No-answer workflow (missed contact)

If no answer:
- Leave voicemail (short, non-salesy): “free outage alerts + readiness updates”
- Send **Email 1** (if email known) OR continue call attempts per cadence
- Goal remains: **enroll** and/or **set**

---

### Phase D — 14-Day Cadence (single cadence; adaptive)

**Cadence objective:** move leads to **REVIEW HELD**.  
**Cadence tactic:** first get **enrollment**, then convert enrollment → **attendance**.

#### Cadence phases
- **Week 1 (Authority + Trust):** “Why outages happen, what to do, what backup covers”
- **Week 2 (Urgency + Decision):** “Storm season readiness, incentive timing, schedule your walkthrough”
- **Breakup (Day 12–14):** “Last follow-up; keep alerts only or schedule the walkthrough”

> **Important:** If a lead is already SMS-enrolled, emails/calls should shift from “enroll” to **“make it accurate / schedule / attend.”**

---

## 6) Messaging Architecture (what each channel is for)

### 6.1 Email’s job
- Deliver the **enrollment link** (and value)
- Gatekeep SMS opt-in (self-initiated)
- Reinforce the *reason* to do the readiness review
- Drive scheduling via one CTA

### 6.2 SMS’s job (after consent)
SMS is **event-driven** and operational:
- Alerts (weather/grid/outage)
- Review reminders & reschedules
- Readiness nudges (low frequency, high relevance)

**SMS is not your promo channel.** It’s your trust channel.

---

## 7) Templates (usable immediately)

### 7.1 Live call script (condensed)
**Opener:**
> “Hey [Name], this is [Rep] with Admiral Energy—quick one. We’re enrolling Duke customers in [county] for free outage alerts and grid readiness updates after Helene and recent maintenance. Not selling anything—just making sure people have reliable info.”

**Qualify:**
> “Do you have any backup power today—generator or battery?”  
> “Did you lose power during Helene or any storms this year?”  
> “If power was out for 2 days, what’s the biggest issue—food, medical, or work/internet?”

**Enroll:**
> “I can email you the free enrollment link so you get alerts—what’s the best email?”  
> “Optional—would you like these alerts by text too? It’s faster than email.”

**Set:**
> “By default alerts are county-level. A lot of people do a quick readiness walkthrough so it’s accurate for their home—1–2 days vs 3–5 vs longer. Want to schedule that now?”

---

### 7.2 Email 1 — Enrollment link (with SMS opt-in path)
**Subject:** Your free Duke outage alerts + readiness updates (enroll here)

Body:
- 1–2 sentence value promise
- Link to enrollment: `https://admiralenergy.ai/duke-outage-landing.html`
- Explain what they’ll get
- Optional SMS CTA:
  - “Want faster alerts by text? Enroll here and check the SMS box.”

CTA: **Enroll for alerts** (single primary CTA)

---

### 7.3 SMS welcome (after consent)
> “Admiral Energy Alerts: You’re enrolled for NC outage/readiness updates. Msg frequency varies. Reply STOP to opt out, HELP for help.”

---

### 7.4 Review booked but not held (SMS reminder)
> “Reminder: Your Grid Readiness Walkthrough is [day] at [time]. Reply 1 to confirm, 2 to reschedule. STOP to opt out.”

---

### 7.5 No-show recovery (SMS)
> “Hey [Name]—we missed you today. Want to reschedule your readiness walkthrough? Reply 1 for next available times, or 2 to stay on alerts only.”

---

### 7.6 Breakup email (Day 12–14)
Subject: Should I close your file?

Body:
- “Seems like readiness isn’t a priority right now.”
- “No problem—you’ll stay enrolled for alerts.”
- “If you want the walkthrough, schedule here.”
- “Otherwise, we’ll stop follow-ups.”

CTA: **Schedule walkthrough** / Secondary: “Stay alerts-only”

---

## 8) “Booked ≠ Held” — Attendance assurance mini-playbook

Once a review is booked, cadence continues with a lighter “show-up” track:

### T-24 hours
- SMS reminder (confirm/reschedule)
- Email reminder (what to have ready: bill, address, roof age estimate)

### T-2 hours
- SMS quick confirm

### If no-show
- SMS reschedule prompt within 10 minutes
- Call within 30–90 minutes
- Email follow-up same day

**Goal:** salvage attendance within 72 hours.

---

## 9) REACH Verified SET checklist (what SDR must capture)

A “Verified SET” requires enough data to produce a proposal:
- Property address & utility territory
- Roof type/age/shading considerations (basic)
- Utility bill / avg kWh or bill amount
- Credit band / financing direction (good/ok/unknown)
- Homeowner / decision-maker status
- Backup goals (circuits, duration: 1–2 / 3–5 / extended)
- Appointment held + proposal call scheduled

> The readiness review is where you turn “alerts” into “proposal-ready.”

---

## 10) KPI alignment (so behavior matches cash)

### Primary SDR metrics
- **Held Reviews / Verified SETs** (top line)
- Show rate (% booked → held)
- Dials per Held (your real DPC variant)
- Enrollment-to-Set conversion

### Secondary metrics (supporting)
- Email consent rate
- SMS opt-in rate
- Reply rate (SMS)
- Opt-out rate (SMS + email)

**Important:** reward what you’re paid for (Held / Verified), not vanity bookings.

---

## 11) How this stays non-spammy (the “trust budget” rules)

### SMS frequency rules (baseline)
- Normal month: 0–2 texts (unless they’re in scheduling/reminder flow)
- Storm/outage: 1–3 texts in a short window
- Incentive updates: rare and only when material, and only if it fits your consent language

### Content rules
- Every SMS must be:
  - event-driven OR operational
  - readable in 5 seconds
  - include STOP compliance

### Sales rule
- SMS is not where you pitch a solar package.
- You pitch the **walkthrough** and use calls for actual selling.

---

## 12) Recommended system architecture (lightweight)

### Minimum viable stack
- **Landing + Form:** current Duke Outage page
- **Email system:** sends enrollment link + cadence
- **SMS system:** stores consent + sends reminders/alerts (Twilio or equivalent)
- **CRM (Twenty):** states + tasks + call outcomes
- **Calendar:** booking links per territory/rep

### Automations (high impact)
- If email link clicked → task created: “Call: convert to readiness review”
- If SMS opt-in completed → tag “SMS_ENROLLED”
- If review booked → switch to “Attendance Assurance” touch set
- If review held → stop cadence; start sales handoff + long-term nurture

---

## 13) The “Simple Funnel” summary (what you train reps on)

1. **Offer free alerts** (value first)
2. **Collect email** to send the link
3. **Collect SMS** when possible (or via email form)
4. **Set the readiness walkthrough** as “accuracy/personalization”
5. **Don’t stop until held**
6. **Then handoff to proposal/sales**
7. **Everyone goes into long-term nurture** after held (sold or not)

---

## 14) Operational decision rules (quick reference)

### When to ask for SMS live
- Only after you’ve earned trust and they say yes to email enrollment
- Or after they explicitly want faster alerts

### When to push the SET harder
- Pain present (outages, WFH, medical, freezer/sump pump)
- Decision-maker on phone
- Motivated by duration scenarios (3–5 days, extended)

### When to back off
- They only want alerts; they’re annoyed; they say “not now”
- Keep them enrolled; protect trust; long-term wins later

---

## 15) Next build targets (if you want to implement fast)

1) **Attendance Assurance Track** automation (booked → held)
2) **One-click scheduling CTA** across email + post-enrollment pages
3) **REACH Verified SET form** embedded in review workflow
4) **Consent logging** (checkbox text version + timestamp + ip + source)

---

### Appendix A — Suggested email cadence map (high level)

- **Day 0:** Enrollment link + what alerts are / optional SMS
- **Day 2:** “Why outages happen + what backup actually covers” + schedule walkthrough
- **Day 5:** Local mini-case study / scenario + schedule
- **Day 8:** Storm season urgency + schedule
- **Day 12:** Breakup email: schedule or alerts-only
- **Day 14:** Final nudge / move to long-term

---

### Appendix B — Long-term nurture (post-held or Day 14)

Event-driven (not weekly drip):
- Seasonal readiness reminders
- Material incentive updates
- Major outage recap (“here’s what we saw”)
- Referral asks (only after value delivered)

---

**System mantra:**  
**Lead with alerts. Earn SMS. Use readiness as “accuracy.” Don’t stop until held.**
