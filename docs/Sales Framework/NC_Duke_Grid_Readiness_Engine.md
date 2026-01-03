# NC Duke Grid Readiness Engine (MVP Architecture)
**Project:** Admiral Energy – Duke Territory (North Carolina)  
**Purpose:** Build a *trustworthy* county-based alert + conversion system that uses **verifiable public signals** to notify subscribers about **grid stress** and **active outages**, then routes replies (“READY”) into booking + your dialer.

> **Blunt truth:** This only works long-term if you treat it like a warning system, not a hype funnel.  
> You must never promise outcomes you can’t verify. You *can* win by being faster, clearer, and more actionable than Duke—not by “predicting outages.”

---

## 0) What this is (and what it is not)

### It **is**
- A **county-level** intelligence engine for:
  - **Pre-event grid stress** (based on official weather alerts + historical vulnerability)
  - **Live failures** (based on Duke’s public outage reporting)
- A **segmented broadcast** system (county → subscribers) with strict anti-spam and compliance guardrails
- A **conversion router** (READY → booking + lead tagging + dialer)

### It is **not**
- A promise that power will go out at a specific address
- A replacement for Duke alerts
- A “one-source” system (single sources break; you need redundancy and safety modes)

---

## 1) Trust, accuracy, and language policy (non-negotiable)

### Trust contract with the user
Your system should explicitly frame itself as:
- **Monitoring public data** (Duke outage reporting + NOAA/NWS alerts)
- **Providing risk advisories** and **confirmed outage notifications**
- **Offering protection options** (battery backup + resilience plan)

Do **not** frame as “we know your power will go out.”

### Language rules (copy guardrails)
Allowed:
- “Grid stress risk rising in **{County}**…”
- “NWS has issued **{alert_type}** affecting **{County/Zone}**…”
- “Duke outage reports show **{customers_out}** customers out in **{County}**…”

Not allowed:
- “Your power will go out.”
- “We guarantee you’ll lose power.”
- “We know your neighborhood is next.”

### Accuracy rule: **2-of-3 confirmation**
Never trigger proactive alerts from a single weak signal.
Use:
1) **NWS Alerts (authoritative)** – watches/warnings/advisories citeturn0search13  
2) **Duke Live Outages (verifiable)** – outage map data source citeturn0search5  
3) **Historical Vulnerability (your dataset)** – learned patterns (county x event-type)

Triggering policy:
- **YELLOW (Heads-up):** (NWS Alert) + (County vulnerability high)
- **RED (Strong warning):** (NWS Alert) + (County vulnerability high) + (Event severity high OR forecast confidence high)
- **BLACK (Confirmed failures):** (Duke Live Outage) **alone** is sufficient to notify impacted counties

Fail-safe:
- If Duke feed is stale/unavailable → **suppress BLACK** (don’t guess outages).
- If NWS feed is stale/unavailable → **suppress proactive** warnings.

---

## 2) Data sources you’ll use

### A) Weather / hazard signals (authoritative)
Use the National Weather Service API and alerts web service:
- NWS API overview: https://api.weather.gov citeturn0search0
- Alerts service is explicitly designed for redistribution/decision tools citeturn0search13

**MVP recommendation:** Start with **active alerts** (watches/warnings/advisories), not raw wind modeling.  
Why: fewer false positives, more defensible, less engineering.

### B) Duke outage signals (verifiable)
Duke publishes outage status via its outage map experience and underlying APIs. citeturn0search1turn0search5

**Important:** Duke does not provide a stable, public “official developer API.”  
So you must build this like a **contract-verified scraper of a JSON service**:
- Discover the API calls via browser DevTools Network tab
- Store **sample payloads** as fixtures
- Implement **contract tests** to detect breaking changes
- Add **health checks** and a **safe mode** (pause outage messaging if data breaks)

---

## 3) System components (how many pieces?)

### MVP components (7 logical pieces, 4 services)
1) **Weather Scanner** (NWS alerts ingest)
2) **Duke Outage Scanner** (Duke ingest)
3) **Risk Brain** (rules + scoring + state transitions)
4) **Subscriber DB** (county segmentation + consent)
5) **SMS Engine** (broadcast + dedupe + compliance)
6) **Inbound SMS Router** (READY/STOP/HELP)
7) **Command View** (optional UI/dashboard)

**Service layout (recommended):**
- `collector` (jobs): weather + duke ingest → DB
- `decision` (jobs): scoring + alert events → DB
- `messaging` (API): outbound SMS + inbound webhook
- `dashboard` (optional): status and analytics

For MVP, you can combine into **one Node.js service** with:
- a scheduler (node-cron)
- an Express API
- modules for each domain

---

## 4) Data model (minimal but real)

### Tables

#### `subscribers`
- `id` (uuid)
- `phone_e164` (string, unique)
- `county` (string)
- `utility` (enum: `duke_carolinas`, `duke_progress`) — required
- `email` (string, optional)
- `consent_timestamp` (timestamp)
- `consent_source` (string; e.g., `duke-outage-landing`)
- `status` (enum: `active`, `stopped`)
- `last_alert_sent_at` (timestamp, nullable)
- `last_alert_county` (string, nullable)
- `created_at`, `updated_at`

#### `nws_alerts_ingest`
- `id`
- `event` (e.g., High Wind Warning)
- `severity` / `certainty` / `urgency`
- `affected_geos` (zones/counties)
- `starts_at`, `ends_at`
- `raw_hash`
- `captured_at`

#### `duke_outage_snapshots`
- `id`
- `county`
- `customers_out` (int)
- `total_customers` (int, nullable)
- `percent_out` (float, nullable)
- `captured_at`
- `raw_hash`

#### `county_state`
- `county`
- `level` (enum: `green`, `yellow`, `red`, `black`)
- `reason` (string)
- `as_of` (timestamp)
- `inputs` (json: the 2-of-3 evidence summary)

#### `alert_events`
- `id`
- `county`
- `level` (yellow/red/black)
- `reason` (string)
- `created_at`

#### `messages`
- `id`
- `subscriber_id`
- `alert_event_id` (nullable)
- `direction` (inbound/outbound)
- `body`
- `status` (queued/sent/delivered/failed)
- `provider_id` (Twilio SID)
- `created_at`

---

## 5) Scoring + trigger logic (MVP rules)

### County Level State Machine
Each county has a level:
- **GREEN:** normal
- **YELLOW:** elevated weather stress (proactive heads-up)
- **RED:** high likelihood conditions (strong warning)
- **BLACK:** confirmed outage activity (Duke outage)

### Weather mapping (alerts → stress)
Start with this mapping (tune later):
- **BLACK** is *never* set by weather alone.
- **RED candidates:**
  - Hurricane/Tropical Storm Warnings/ Watches
  - High Wind Warning
  - Ice Storm Warning
  - Severe Thunderstorm Watch (optional)
- **YELLOW candidates:**
  - Wind Advisory
  - Winter Weather Advisory
  - Flood Watch (optional)

Implementation detail:
- Use `/alerts/active?area=NC` then filter and map affected counties/zones. citeturn0search13  
  (NWS uses different geolocation methods; sometimes alerts are county-based, sometimes zone-based—plan for both.) citeturn0search3

### Duke outage mapping (snapshot → failure)
For each county snapshot:
- Compute `percent_out` if total customers available.
- Determine outage severity:
  - **BLACK threshold:** `customers_out >= 2000` OR `percent_out >= 1.0%`
  - **BLACK “light”** (optional): `customers_out >= 500` (still BLACK but message softer)

### Dedupe + cooldown (anti-spam)
Per subscriber:
- Max **1 proactive** message per 24 hours
- Max **1 escalation** message when county goes YELLOW→RED
- Max **1 outage** message per 8 hours during BLACK unless:
  - percent_out changes by ±25% or
  - restoration ETA becomes available/unavailable
- If subscriber replies READY, pause alerts for 24 hours (avoid annoyance; treat as “in flow”)

---

## 6) Messaging workflows (conversion-safe)

### Proactive YELLOW
> Heads up: NWS issued **{alert_type}** affecting **{County}**.  
> Grid stress risk rising. Want the “keep-the-lights-on” backup plan? Reply **READY**.

### Proactive RED
> ⚠️ **{County}** is under **{alert_type}** (NWS).  
> Outages become more likely in these conditions.  
> Reply **READY** to see battery backup + rebate options.

### Confirmed BLACK (Duke outage)
> ⚡ Duke outage reports show **{customers_out}** customers out in **{County}** right now.  
> Homes with battery backup stay online. Reply **READY** for the fast plan.

### READY autoresponder
> Got it. Here’s the fastest way to lock a resilience consult: **{booking_link}**  
> Reply STOP to opt out.

### STOP/HELP compliance
Twilio supports standardized opt-out keywords (STOP, UNSUBSCRIBE, etc.) and expects compliant behavior. citeturn0search2turn0search12  
You should still handle STOP/HELP yourself in case you later change providers.

---

## 7) Subscription capture (landing page → DB)

### Fields to collect (MVP)
Required:
- phone
- county (dropdown)
- utility confirmation (checkbox or select: “Duke Energy (Carolinas/Progress)”)
- explicit consent checkbox + timestamp

Optional:
- email
- “biggest concern during outages” (segmentation for messaging)

### Double opt-in (recommended)
After submit:
- Send: “Reply YES to confirm alerts for {County}.”
If YES:
- activate subscriber

This improves list quality and reduces compliance risk.

---

## 8) APIs + internal jobs

### Public API endpoints
- `POST /api/subscribe`
  - validates phone, county, utility, consent
  - creates subscriber
  - optionally sends double-opt-in message
- `POST /api/sms/inbound` (Twilio webhook)
  - READY → create lead event + send booking link
  - STOP → set `status=stopped`
  - HELP → send help text
- `GET /api/status`
  - returns latest county_state + top outage stats (for dashboard)
- `GET /health`
  - includes: last successful NWS ingest time, last Duke ingest time, queue depth

### Scheduled jobs
- `job:nws_ingest` every 5–10 minutes
- `job:duke_ingest` every 5 minutes (faster during storms, optional)
- `job:state_eval` every 5 minutes
- `job:send_messages` continuously (queue worker) or every minute

---

## 9) Reliability & “it actually works” requirements

### A) Health checks (hard gates)
Before sending **any** messages:
- Duke data freshness must be within X minutes (e.g., <= 15)
- NWS data freshness must be within X minutes (<= 20)
- If stale → pause sending + log an error

### B) Contract tests (prevents silent breakage)
Because Duke endpoints may change, you need:
- A stored fixture: `fixtures/duke_sample.json`
- Parser contract test:
  - ensures county + customers_out parse correctly
  - fails build if parsing breaks
- A daily CI run that fetches and validates schema; if breaks → alert you

### C) Safe modes
- **Safe Mode 1:** Duke down → allow only **NWS proactive** alerts (YELLOW/RED) with calm language
- **Safe Mode 2:** NWS down → allow only **Duke confirmed** outage alerts (BLACK)
- **Safe Mode 3:** both down → send nothing

### D) Observability
Log + chart:
- ingest success/fail
- time since last successful ingest
- number of counties in each state
- message sends, delivery failures
- inbound READY rate
- STOP rate (if STOP spikes, you’re over-messaging or too salesy)

---

## 10) Deployment (Ubuntu mini-server friendly)

### Recommended packaging
- Docker Compose:
  - `app` (Node/TS)
  - `db` (Postgres) **or** SQLite volume for MVP
  - optional `redis` for queues (later)

### Secrets
- `.env` on server with file permissions
- Twilio credentials
- Booking link base URL
- Admin token for dashboard

### Process management
- If not Docker:
  - systemd service for node app
  - systemd timer/cron for scheduled jobs (or node-cron inside app)

---

## 11) Security + privacy (keep it simple and safe)
- Store minimal PII (phone + county + consent)
- Encrypt DB volume at rest if possible
- Never log raw phone numbers in plaintext logs (mask them)
- Rate-limit inbound webhook
- Use signed Twilio webhook validation (recommended)

---

## 12) MVP acceptance criteria (what “done” means)
A) Subscription
- user submits phone + county + consent → subscriber stored
- optional double opt-in works

B) Ingest
- NWS active alerts ingest runs reliably
- Duke outage ingest runs reliably

C) State evaluation
- counties transition GREEN↔YELLOW↔RED based on NWS+history
- counties transition to BLACK based on Duke outages

D) Messaging
- subscribers in a county receive correct message with dedupe
- READY triggers booking link + lead record
- STOP immediately disables future messages

E) Safety
- If Duke feed breaks → outage messaging pauses automatically

---

## 13) What you need (inventory checklist)

### Accounts / keys
- Twilio Messaging Service + phone number
- Hosting: Ubuntu server (you already have it) or Railway/Fly
- Domain for API (subdomain like `api.admiralenergy.ai`)

### Data artifacts
- NC county list (dropdown)
- County vulnerability table (start with manual weights; evolve later)
- Duke API payload sample captured from DevTools (required)

### Engineering modules
- `nwsClient` (alerts ingest)
- `dukeClient` (outage ingest + parser)
- `riskEngine` (2-of-3 + state machine)
- `messageEngine` (queue + dedupe)
- `inboundRouter` (READY/STOP/HELP)
- `health` (freshness + safe modes)

---

## 14) Implementation prompts (Claude MAX / VS Code)

> Use these as your build instructions. They assume **VS Code local** development.

### Prompt A — build skeleton service + DB schema + safe modes
```text
Start prompt
You are in VS Code on my local machine. [LOCAL ONLY]
Build a Node.js + TypeScript service called nc-duke-grid-engine with:
- Express API
- Postgres (preferred) OR SQLite (acceptable for MVP)
- Tables exactly as described in the architecture doc: subscribers, duke_outage_snapshots, nws_alerts_ingest, county_state, alert_events, messages
- Cron jobs:
  - nws_ingest every 10 minutes
  - duke_ingest every 5 minutes
  - state_eval every 5 minutes
- Safe mode gating:
  - if duke ingest stale > 15 min, do not send BLACK alerts
  - if nws ingest stale > 20 min, do not send YELLOW/RED alerts
- Twilio adapter with SMS_ENABLED=false default
- Endpoints: /api/subscribe, /api/sms/inbound, /api/status, /health
Return:
1) file tree
2) .env.example
3) run scripts
4) basic tests for dedupe + safe mode gating
End prompt
```

### Prompt B — implement NWS active alerts ingest (authoritative)
```text
Start prompt
You are in VS Code on my local machine. [LOCAL ONLY]
Implement NWS active alerts ingest using api.weather.gov:
- Fetch active alerts for North Carolina (area=NC)
- Persist alerts with hash dedupe
- Extract affected counties/zones (store in affected_geos JSON)
- Map alert types to stress levels (YELLOW/RED candidates per doc)
- Add unit tests with sample payload fixture
End prompt
```

### Prompt C — implement Duke outage ingest (requires sample payload)
```text
Start prompt
You are in VS Code on my local machine. [LOCAL ONLY]
I will paste a Duke outage JSON payload captured from the outage map network calls.
Implement:
- Parser that outputs county snapshots {county, customers_out, total_customers?, percent_out?}
- Normalization for county names
- Snapshot storage + change detection
- Contract tests using the fixture payload
Do not guess fields; use only what exists in the payload.
End prompt
```

---

## 15) Future upgrades (after MVP proves itself)
- Add numeric forecast (wind gusts) via NWS gridpoints (more proactive power) citeturn0search4turn0search7
- Add subscriber “OUT” confirmations as a third redundancy signal
- Add zip→county autofill (geocoding)
- Add dashboard map + campaign analytics
- Add county-level “resilience score” lead magnet integration

---

## 16) Final reality check
If you do the above:
- You’ll be accurate because you’re grounded in authoritative + verifiable signals.
- You’ll avoid the “we missed it” disaster because **you never promise certainty**.
- And you’ll still win because your value isn’t “Duke alerts”… it’s **preparedness + conversion + speed**.

