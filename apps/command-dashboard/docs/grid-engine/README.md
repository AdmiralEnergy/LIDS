# NC Duke Grid Readiness Engine

**The intelligence layer that powers proactive outage marketing.**

---

## What is Grid Engine?

Grid Engine is a real-time monitoring system that tracks weather alerts and power outages across all 100 NC counties. It processes data from the National Weather Service and Duke Energy to provide proactive alerts BEFORE outages happen, enabling:

1. **Marketing Automation** - Trigger campaigns when counties enter elevated states
2. **Sales Intelligence** - Reps know which areas are experiencing grid stress
3. **Customer Notifications** - SMS alerts to subscribers in affected areas
4. **Operational Awareness** - Command Dashboard shows live grid status

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GRID ENGINE - PROACTIVE OUTAGE INTELLIGENCE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   NWS API ──────┐                                                           │
│                 │                                                           │
│                 ▼                                                           │
│            ┌─────────────┐      ┌──────────────┐      ┌─────────────────┐  │
│            │ Risk Brain  │─────►│ State Machine │─────►│ Outputs         │  │
│            │ 2-of-3 rule │      │ G→Y→R→B       │      │ • Dashboard     │  │
│            └─────────────┘      └──────────────┘      │ • SMS Alerts    │  │
│                 ▲                                     │ • Marketing     │  │
│                 │                                     │ • Studio        │  │
│   Duke API ─────┘                                     └─────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment

| Property | Value |
|----------|-------|
| **Host** | Oracle ARM (193.122.153.249) |
| **Port** | 4120 |
| **PM2 Name** | grid-engine |
| **Repo Location** | `~/grid-engine` on Oracle ARM |
| **Production URL** | Internal only (via Command Dashboard) |

---

## Quick Start

### Check Status

```bash
# From any machine with access to Oracle ARM
curl http://193.122.153.249:4120/health
curl http://193.122.153.249:4120/status | jq
```

### View Logs

```bash
ssh -i ~/.ssh/oci_arm ubuntu@193.122.153.249
pm2 logs grid-engine --lines 50
```

### Restart

```bash
pm2 restart grid-engine
```

---

## County States

Counties transition through four states based on conditions:

| State | Color | Meaning | Trigger |
|-------|-------|---------|---------|
| **GREEN** | Normal | No alerts, no significant outages |
| **YELLOW** | Elevated Risk | 2-of-3 confirmation (NWS alert + vulnerability + weather type) |
| **RED** | High Risk | Severe weather warning in effect |
| **BLACK** | Active Outage | 2000+ customers OR 1% of county population out |

---

## Cleveland County Focus

Cleveland County receives enhanced monitoring because:

- **Buy-All-Sell-All Regulation** - Discourages solar adoption, creates opportunity
- **Higher Outage Frequency** - Historical data shows above-average grid instability
- **Market Opportunity** - Untapped demand for battery backup and generators
- **Home Base** - Real-world testing ground

Cleveland is prominently displayed at the top of Command Dashboard.

---

## Admiral Energy Website Integration

The Grid Engine integrates with the public-facing Admiral Energy website (admiralenergy.ai) to capture outage alert subscribers.

### Landing Page

**URL:** `https://admiralenergy.ai/duke-outage-landing.html`

**Purpose:** Lead magnet for cold calling - reps offer free outage alerts as a value-first approach.

**Source Repo:** `github.com/AdmiralEnergy/admiralenergy-website` → `dukeoutage/duke-outage-landing.html`

### Form Submission Flow

```
User fills form on admiralenergy.ai
    │
    ├──► Grid Engine API (primary)
    │    POST https://command.ripemerchant.host/api/grid/subscribe
    │    Body: { phone, county, utility, email, source }
    │    → Subscriber stored in SQLite for SMS alerts
    │
    └──► Netlify Forms (backup)
         POST / with form-name: outage-alerts
         → Captured in Netlify dashboard for CRM tracking
```

### Dual-Submit Pattern

The landing page submits to **both** APIs for redundancy:

| Target | Purpose | Failure Mode |
|--------|---------|--------------|
| Grid Engine | SMS alert enrollment | Falls back to Netlify only |
| Netlify Forms | CRM/backup capture | Always succeeds if Grid fails |

Success is shown if **either** API responds OK.

### County-to-Utility Mapping

Duke Energy serves NC through two jurisdictions. The landing page auto-maps counties:

```javascript
const COUNTY_UTILITY_MAP = {
  'Mecklenburg': 'DEC',  // Charlotte area
  'Wake': 'DEP',         // Raleigh area
  'Guilford': 'DEC',
  'Forsyth': 'DEC',
  'Cumberland': 'DEP',
  'Durham': 'DEC',
  'Buncombe': 'DEC',
  'Gaston': 'DEC',
  'Union': 'DEC',
  'Cabarrus': 'DEC',
  'Iredell': 'DEC',
  'Rowan': 'DEC',
  'Catawba': 'DEC',
  'Cleveland': 'DEC',
  'Lincoln': 'DEC',
  'other': 'DEP'  // Default
};
```

### Grid Engine Subscribe API

**Endpoint:** `POST /api/grid/subscribe` (via Command Dashboard proxy)

**Request:**
```json
{
  "phone": "9195551234",
  "county": "Wake",
  "utility": "DEP",
  "email": "optional@email.com",
  "source": "landing-page"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "You are now subscribed to Duke Energy outage alerts for Wake County. Reply STOP to unsubscribe.",
  "subscriberId": "uuid-xxx"
}
```

**Response (duplicate):**
```json
{
  "success": true,
  "message": "You are already subscribed to alerts for this number.",
  "alreadySubscribed": true
}
```

### Subscriber Database Schema

Subscribers are stored in Grid Engine's SQLite database:

```sql
CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,        -- E.164 format (+19195551234)
  county TEXT NOT NULL,
  utility TEXT NOT NULL,             -- 'DEC' or 'DEP'
  email TEXT,
  consent_timestamp TEXT NOT NULL,
  consent_source TEXT NOT NULL,      -- 'landing-page'
  status TEXT DEFAULT 'active',      -- 'active' or 'stopped'
  last_alert_sent_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

### Monitoring Subscribers

```bash
# Get subscriber count
curl https://command.ripemerchant.host/api/grid/subscribers/stats

# Response:
# {"total":2,"byCounty":{"Wake":1,"Mecklenburg":1}}
```

### SMS Inbound Handling

Grid Engine handles SMS responses via Twilio webhooks:

| Keyword | Action |
|---------|--------|
| `STOP` | Unsubscribe (status → 'stopped') |
| `START` | Resubscribe (status → 'active') |
| `READY` | Flag as sales-ready lead |
| `HELP` | Send help message |

**Webhook URL:** `POST /api/sms/inbound` (configure in Twilio)

---

## Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical deep dive, system components |
| [API_REFERENCE.md](./API_REFERENCE.md) | Complete API documentation |
| [STATE_MACHINE.md](./STATE_MACHINE.md) | State transitions and Risk Brain logic |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | Connections to Studio, Marketing, LIDS |
| [OPERATIONS.md](./OPERATIONS.md) | Ops runbook, troubleshooting |

---

*Owner: Admiral Energy LLC*
*Version: 1.0.0*
