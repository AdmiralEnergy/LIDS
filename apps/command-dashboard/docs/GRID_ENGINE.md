# NC Duke Grid Readiness Engine

Real-time county-based alert system for NC Duke Energy territories. Monitors 100 NC counties for weather alerts and power outages, providing proactive notifications.

**Deployment:** Oracle ARM (193.122.153.249:4120)
**PM2 Name:** `grid-engine`
**Repo Location:** `~/grid-engine` on Oracle ARM

---

## Overview

The Grid Engine collects data from two primary sources:
1. **NWS (National Weather Service)** - Weather alerts for NC
2. **Duke Energy APIs** - Real-time outage data (DEC and DEP territories)

It processes this data through a state machine that transitions counties through escalating states: GREEN → YELLOW → RED → BLACK.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NC DUKE GRID READINESS ENGINE                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DATA SOURCES                         PROCESSING                            │
│  ┌────────────────────┐              ┌────────────────────────────────────┐│
│  │ NWS API            │──────────────│ Point-in-Polygon                   ││
│  │ api.weather.gov    │              │ (lat/lng → NC county)              ││
│  │                    │              └────────────────────────────────────┘│
│  │ • Active alerts    │                           │                        │
│  │ • Severity levels  │                           ▼                        │
│  │ • County mapping   │              ┌────────────────────────────────────┐│
│  └────────────────────┘              │ Risk Brain                         ││
│                                      │                                    ││
│  ┌────────────────────┐              │ 2-of-3 Confirmation Rule:          ││
│  │ Duke Energy APIs   │              │ • NWS Alert exists                 ││
│  │ DEC + DEP          │──────────────│ • County is vulnerable             ││
│  │                    │              │ • Severe weather type              ││
│  │ • Outage points    │              │                                    ││
│  │ • Customer counts  │              │ Thresholds:                        ││
│  │ • ETR data         │              │ • BLACK: 2000+ customers OR 1%     ││
│  └────────────────────┘              └────────────────────────────────────┘│
│                                                   │                        │
│                                                   ▼                        │
│                                      ┌────────────────────────────────────┐│
│                                      │ State Machine                      ││
│                                      │                                    ││
│                                      │ GREEN → YELLOW → RED → BLACK       ││
│                                      │                                    ││
│                                      │ Safe Mode Gates:                   ││
│                                      │ • DUKE_STALE (>15 min)            ││
│                                      │ • NWS_STALE (>20 min)             ││
│                                      └────────────────────────────────────┘│
│                                                   │                        │
│                                                   ▼                        │
│  OUTPUT                                                                    │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────────┐│
│  │ Command Dashboard  │  │ SMS Alerts         │  │ SQLite Persistence     ││
│  │ API Endpoints      │  │ (Twilio)           │  │ • State history        ││
│  └────────────────────┘  └────────────────────┘  │ • Feed health          ││
│                                                  │ • Subscribers          ││
│                                                  └────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Server | Fastify | High-performance HTTP server |
| Database | SQLite (better-sqlite3) | Local persistence |
| Scheduler | node-cron | Periodic data refresh |
| Geo | @turf/boolean-point-in-polygon | Lat/lng → county mapping |
| HTTP | Native fetch | API calls |
| Process | PM2 | Production management |

### Directory Structure

```
grid-engine/
├── README.md
├── package.json
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                    # Server entry point
│       │
│       ├── api/
│       │   └── routes.ts               # Fastify route definitions
│       │
│       ├── collectors/
│       │   ├── index.ts                # Unified collection trigger
│       │   ├── nws-client.ts           # NWS alert fetcher
│       │   ├── duke-client.ts          # Duke outage fetcher
│       │   └── county-mapper.ts        # Point-in-polygon mapping
│       │
│       ├── engine/
│       │   ├── index.ts                # Evaluation orchestrator
│       │   ├── risk-brain.ts           # 2-of-3 confirmation logic
│       │   └── state-machine.ts        # GREEN/YELLOW/RED/BLACK transitions
│       │
│       ├── health/
│       │   └── safe-mode.ts            # Stale data protection
│       │
│       ├── jobs/
│       │   └── scheduler.ts            # Cron job definitions
│       │
│       └── persistence/
│           └── db.ts                   # SQLite schema and queries
│
├── shared/
│   ├── types.ts                        # TypeScript interfaces
│   └── nc-counties.ts                  # 100 NC county definitions
│
├── data/
│   └── nc-counties.geojson             # County boundary polygons
│
└── fixtures/
    └── mock-*.json                     # Test data
```

---

## State Machine

Counties transition through four states based on conditions:

```
      ┌─────────────────────────────────────────────────────────────────────┐
      │                      COUNTY STATE MACHINE                           │
      └─────────────────────────────────────────────────────────────────────┘

  ┌─────────┐    NWS Alert +        ┌──────────┐    Severe Weather    ┌─────────┐
  │  GREEN  │    Vulnerability      │  YELLOW  │    Warning           │   RED   │
  │         │ ─────────────────────►│          │ ───────────────────► │         │
  │ Normal  │                       │ Elevated │                      │  High   │
  │         │ ◄─────────────────────│  Risk    │ ◄─────────────────── │  Risk   │
  └─────────┘    Alerts expire      └──────────┘    Conditions clear  └─────────┘
       ▲                                                                   │
       │                                                                   │
       │                                                                   ▼
       │                          ┌──────────┐                             │
       │                          │  BLACK   │                             │
       │                          │          │◄────────────────────────────┘
       └──────────────────────────│ Active   │     2000+ customers out
           Outage resolved        │ Outage   │     OR 1% of county
                                  └──────────┘
```

### State Definitions

| State | Color | Meaning | Trigger Conditions |
|-------|-------|---------|-------------------|
| **GREEN** | 🟢 | Normal operations | No alerts, no significant outages |
| **YELLOW** | 🟡 | Elevated risk | 2-of-3 confirmation: NWS alert + vulnerability + weather type |
| **RED** | 🔴 | High risk | Severe weather warning in effect |
| **BLACK** | 🟣 | Active outage | 2000+ customers out OR 1% of county population |

### 2-of-3 Confirmation Rule

For proactive (pre-outage) alerts (YELLOW/RED), the system requires 2 of these 3 signals:

1. **NWS Alert Exists** - Active weather alert affecting the county
2. **County is Vulnerable** - Historical outage frequency above threshold
3. **Severe Weather Type** - Alert type is grid-stress inducing:
   - Tornado Warning/Watch
   - Severe Thunderstorm Warning/Watch
   - Hurricane/Tropical Storm Warning/Watch
   - Ice Storm / Winter Storm / Blizzard Warning
   - High Wind Warning
   - Flash Flood Warning

This prevents false alarms from minor weather events.

---

## Data Sources

### NWS (National Weather Service)

**Endpoint:** `https://api.weather.gov/alerts/active?area=NC`
**Refresh:** Every 5 minutes

```typescript
interface NWSAlert {
  id: string;
  event: string;           // "Tornado Warning", "Winter Storm Watch", etc.
  severity: string;        // "Extreme", "Severe", "Moderate", "Minor"
  certainty: string;       // "Observed", "Likely", "Possible"
  urgency: string;         // "Immediate", "Expected", "Future"
  areaDesc: string;        // "Wake; Durham; Orange"
  affectedCounties: string[];
  onset: string;           // ISO 8601
  expires: string;         // ISO 8601
  headline: string;
}
```

**Severity Weights:**
- Extreme: 1.0
- Severe: 0.8
- Moderate: 0.5
- Minor: 0.3
- Unknown: 0.2

### Duke Energy

**Endpoints:**
- DEC: `https://prod.apigee.duke-energy.app/outage-maps/v1/outages?jurisdiction=DEC`
- DEP: `https://prod.apigee.duke-energy.app/outage-maps/v1/outages?jurisdiction=DEP`

**Refresh:** Every 5 minutes

```typescript
interface DukeOutagePoint {
  latitude: number;
  longitude: number;
  customersAffected: number;
  estimatedRestoration: string | null;
  cause: string;
}
```

Points are mapped to counties using point-in-polygon with NC county boundary GeoJSON.

---

## API Endpoints

### Health & Status

```
GET /health
  Returns: { status: "ok", version: "1.0.0" }

GET /status
  Returns: {
    feeds: [{ source: "NWS", lastSuccessAt, isStale, lastError }],
    countyStates: [{ county, level, reason, customersOut, nwsAlerts }],
    subscribers: { total, byCounty },
    safeMode: "NORMAL" | "DUKE_STALE" | "NWS_STALE" | "FULL_SAFE"
  }
```

### County Data

```
GET /api/counties
  Returns: { counties: CountyStatus[] }

GET /api/counties/:name
  Returns: Single county with full details

POST /api/counties/:name/vulnerability
  Body: { weight: 0.0-1.0 }
  Sets vulnerability weight for a county
```

### Live Data

```
GET /api/alerts/active
  Returns: { alerts: NWSAlert[] }
  Current NWS alerts affecting NC

GET /api/alerts/recent
  Returns: { alerts: SystemAlert[] }
  Recent state transitions from this system

GET /api/outages/current
  Returns: {
    counties: { "Wake": 162, "Macon": 96, ... },
    totalCountiesAffected: 7,
    totalCustomersAffected: 270
  }

POST /api/refresh
  Triggers immediate data refresh (manual override)
```

### Subscribers

```
GET /api/subscribers/stats
  Returns: { total, byCounty: { "Wake": 45, ... } }

POST /api/subscribe
  Body: { phone: "+1...", counties: ["Wake", "Durham"] }
  Registers for SMS alerts
```

---

## Safe Mode

The system enters safe mode when data sources become stale:

| Mode | Condition | Effect |
|------|-----------|--------|
| `NORMAL` | All feeds fresh | Full alerting enabled |
| `DUKE_STALE` | Duke data >15 min old | Suppress BLACK alerts |
| `NWS_STALE` | NWS data >20 min old | Suppress YELLOW/RED alerts |
| `FULL_SAFE` | Both stale | No alerts sent |

**Philosophy:** It's better to send NO alert than a FALSE alert.

---

## Cleveland County Special Monitoring

Cleveland County (FIPS 37045) has enhanced monitoring:

**Market Context:**
- Buy-all-sell-all utility regulation discourages solar adoption
- Higher-than-average outage frequency
- Untapped market for battery backup and generators

**Population:** 99,519 (2020 Census)
**BLACK Threshold:** 995 customers (1%) or 2000+ customers

Cleveland County status is prominently displayed in Command Dashboard.

---

## Scheduler Jobs

| Job | Interval | Purpose |
|-----|----------|---------|
| `collect-all` | Every 5 minutes | Fetch NWS + Duke data |
| `evaluate-counties` | Every 5 minutes | Run risk brain, update states |
| `cleanup-old-alerts` | Daily at 3 AM | Archive expired alerts |
| `health-check` | Every 1 minute | Update feed staleness |

---

## Database Schema

```sql
-- County current state
CREATE TABLE county_states (
  county TEXT PRIMARY KEY,
  fips TEXT,
  level TEXT,           -- GREEN, YELLOW, RED, BLACK
  reason TEXT,
  customers_out INTEGER,
  percent_out REAL,
  last_updated TEXT
);

-- State transition history
CREATE TABLE state_history (
  id INTEGER PRIMARY KEY,
  county TEXT,
  from_level TEXT,
  to_level TEXT,
  reason TEXT,
  timestamp TEXT
);

-- Feed health tracking
CREATE TABLE feed_health (
  source TEXT PRIMARY KEY,  -- NWS, DUKE_DEC, DUKE_DEP
  last_success_at TEXT,
  last_error TEXT,
  is_stale INTEGER
);

-- County vulnerability weights
CREATE TABLE county_vulnerability (
  county TEXT PRIMARY KEY,
  weight REAL             -- 0.0 to 1.0
);

-- SMS subscribers
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY,
  phone TEXT,
  counties TEXT,          -- JSON array
  created_at TEXT,
  verified INTEGER
);
```

---

## Operations

### Start/Stop

```bash
# SSH to Oracle ARM
ssh -i ~/.ssh/oci_arm ubuntu@193.122.153.249

# Check status
pm2 list

# View logs
pm2 logs grid-engine --lines 100

# Restart
pm2 restart grid-engine

# Stop
pm2 stop grid-engine

# Start from scratch
cd ~/grid-engine
PORT=4120 pm2 start 'npx tsx server/src/index.ts' --name grid-engine
pm2 save
```

### Manual Data Refresh

```bash
curl -X POST http://localhost:4120/api/refresh
```

### Check Current State

```bash
# Full status
curl http://localhost:4120/status | jq

# Just outages
curl http://localhost:4120/api/outages/current | jq

# Specific county
curl http://localhost:4120/api/counties/Cleveland | jq
```

### Force Safe Mode

```bash
curl -X POST http://localhost:4120/admin/safe-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "FULL_SAFE"}'
```

---

## Build & Development

### Local Development

```bash
cd grid-engine
npm install
npm run dev:server    # → http://localhost:4120
```

### Deploy to Oracle ARM

```bash
# From local machine
scp -r -i ~/.ssh/oci_arm ./grid-engine ubuntu@193.122.153.249:~/

# On Oracle ARM
cd ~/grid-engine
npm install
PORT=4120 pm2 start 'npx tsx server/src/index.ts' --name grid-engine
pm2 save
```

### Health Verification

```bash
# Check all systems
curl http://193.122.153.249:4120/health
curl http://193.122.153.249:4120/status | jq '.feeds'

# Should show:
# - NWS: not stale, recent success
# - DUKE_DEC: not stale, recent success
# - DUKE_DEP: not stale, recent success
```

---

## Troubleshooting

### No Data Coming Through

```bash
# Check if process is running
pm2 list

# Check logs for errors
pm2 logs grid-engine --lines 50

# Test external APIs directly
curl https://api.weather.gov/alerts/active?area=NC | jq '.features | length'
```

### All Counties Showing GREEN Despite Outages

Check if Duke data is reaching the system:
```bash
curl http://localhost:4120/api/outages/current | jq
```

If empty, the Duke API credentials may have changed. Check `duke-client.ts` for the auth header.

### Safe Mode Stuck On

```bash
# Check feed health
curl http://localhost:4120/status | jq '.feeds'

# Force refresh
curl -X POST http://localhost:4120/api/refresh

# If still stuck, restart
pm2 restart grid-engine
```

---

## Integration with Command Dashboard

Command Dashboard connects to Grid Engine via Express proxy routes:

| Dashboard Route | Grid Engine Endpoint |
|-----------------|---------------------|
| `/api/grid/status` | `/status` |
| `/api/grid/counties` | `/api/counties` |
| `/api/grid/alerts` | `/api/alerts/active` |
| `/api/grid/outages` | `/api/outages/current` |

The dashboard uses `ORACLE_ARM_HOST=localhost` when running on the same host.

---

*Last Updated: January 3, 2026*
*Engine Version: 1.0.0*
*Owner: Admiral Energy LLC*
