# Grid Engine Architecture

**Technical deep dive into the NC Duke Grid Readiness Engine.**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ORACLE ARM (193.122.153.249)                                               │
│  24GB RAM | 4 ARM OCPUs | Ubuntu                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  GRID ENGINE (:4120)                                                    ││
│  │                                                                          ││
│  │  ┌────────────────┐    ┌─────────────────┐    ┌────────────────────────┐││
│  │  │ DATA COLLECTORS │    │ PROCESSING      │    │ OUTPUT                │││
│  │  │                 │    │                 │    │                       │││
│  │  │ • NWS Client    │───►│ • County Mapper │───►│ • REST API            │││
│  │  │ • Duke Client   │    │ • Risk Brain    │    │ • WebSocket (future)  │││
│  │  │ • Scheduler     │    │ • State Machine │    │ • Twilio SMS          │││
│  │  └────────────────┘    └─────────────────┘    └────────────────────────┘││
│  │                                                                          ││
│  │  ┌────────────────────────────────────────────────────────────────────┐ ││
│  │  │ PERSISTENCE (SQLite)                                                │ ││
│  │  │ • County states | State history | Feed health | Subscribers        │ ││
│  │  └────────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌──────────────────────────────────┐    ┌────────────────────────────────┐│
│  │ command-dashboard (:3104)        │◄──►│ ollama (:11434)                ││
│  │ Consumes Grid Engine data        │    │ DeepSeek R1 14B                ││
│  └──────────────────────────────────┘    └────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Server** | Fastify | High-performance HTTP server (4x faster than Express) |
| **Database** | SQLite (better-sqlite3) | Zero-config persistence, survives restarts |
| **Scheduler** | node-cron | Periodic data refresh jobs |
| **Geo** | @turf/boolean-point-in-polygon | Map outage lat/lng to NC counties |
| **HTTP** | Native fetch | External API calls to NWS and Duke |
| **Process** | PM2 | Production process management |
| **Runtime** | tsx | TypeScript execution without build step |

---

## Directory Structure

```
grid-engine/
├── README.md
├── package.json
│
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
│   └── nc-counties.ts                  # 100 NC county definitions with FIPS codes
│
├── data/
│   └── nc-counties.geojson             # County boundary polygons (for point-in-polygon)
│
└── fixtures/
    └── mock-*.json                     # Test data for development
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EVERY 5 MINUTES                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. COLLECT                                                                 │
│     ┌─────────────────────────┐    ┌───────────────────────────────────────┐│
│     │ NWS API                 │    │ Duke Energy API (DEC + DEP)          ││
│     │ api.weather.gov/alerts  │    │ prod.apigee.duke-energy.app/outages  ││
│     │                         │    │                                       ││
│     │ Returns:                │    │ Returns:                              ││
│     │ • Active alerts for NC  │    │ • Outage points (lat/lng)            ││
│     │ • Severity, urgency     │    │ • Customers affected                 ││
│     │ • Affected counties     │    │ • Estimated restoration              ││
│     └───────────┬─────────────┘    └───────────────────┬───────────────────┘│
│                 │                                       │                    │
│                 ▼                                       ▼                    │
│  2. PROCESS                                                                 │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ County Mapper                                                        │ │
│     │                                                                      │ │
│     │ • Parse NWS areaDesc → county names                                 │ │
│     │ • Duke outage lat/lng → point-in-polygon → county                  │ │
│     │ • Aggregate customers affected per county                           │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                       │                                      │
│                                       ▼                                      │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ Risk Brain (2-of-3 Confirmation)                                     │ │
│     │                                                                      │ │
│     │ For each county, check:                                             │ │
│     │ ✓ NWS alert exists?                                                 │ │
│     │ ✓ County is vulnerable (historical frequency)?                      │ │
│     │ ✓ Severe weather type (tornado, ice storm, etc.)?                  │ │
│     │                                                                      │ │
│     │ 2+ signals = YELLOW/RED                                             │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                       │                                      │
│                                       ▼                                      │
│  3. EVALUATE                                                                │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ State Machine                                                        │ │
│     │                                                                      │ │
│     │ Current: GREEN    Conditions: 2-of-3 met → YELLOW                  │ │
│     │ Current: YELLOW   Conditions: Severe warning → RED                  │ │
│     │ Current: ANY      Conditions: 2000+ customers out → BLACK          │ │
│     │ Current: ELEVATED Conditions: All clear → GREEN                     │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                       │                                      │
│                                       ▼                                      │
│  4. PERSIST + NOTIFY                                                        │
│     ┌──────────────────────┐    ┌────────────────────┐    ┌───────────────┐ │
│     │ SQLite               │    │ State Transition   │    │ SMS Alerts    │ │
│     │ • Update county_states│   │ • Log to history    │    │ • Twilio API  │ │
│     │ • Update feed_health │    │ • Broadcast event   │    │ • Subscribers │ │
│     └──────────────────────┘    └────────────────────┘    └───────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
-- Current state for each of 100 NC counties
CREATE TABLE county_states (
  county TEXT PRIMARY KEY,           -- "Wake", "Cleveland", etc.
  fips TEXT,                         -- "37183", "37045", etc.
  level TEXT,                        -- GREEN, YELLOW, RED, BLACK
  reason TEXT,                       -- Human-readable explanation
  customers_out INTEGER DEFAULT 0,
  percent_out REAL DEFAULT 0.0,
  last_updated TEXT                  -- ISO 8601 timestamp
);

-- Historical record of all state changes
CREATE TABLE state_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  county TEXT NOT NULL,
  from_level TEXT NOT NULL,
  to_level TEXT NOT NULL,
  reason TEXT,
  timestamp TEXT NOT NULL            -- ISO 8601
);

-- Track health of external data feeds
CREATE TABLE feed_health (
  source TEXT PRIMARY KEY,           -- NWS, DUKE_DEC, DUKE_DEP
  last_success_at TEXT,
  last_error TEXT,
  is_stale INTEGER DEFAULT 0         -- 1 if data is stale
);

-- Vulnerability weights for proactive alerting
CREATE TABLE county_vulnerability (
  county TEXT PRIMARY KEY,
  weight REAL DEFAULT 0.5            -- 0.0 to 1.0, higher = more vulnerable
);

-- SMS subscribers for alerts
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  counties TEXT NOT NULL,            -- JSON array: ["Wake", "Durham"]
  created_at TEXT NOT NULL,
  verified INTEGER DEFAULT 0
);
```

---

## External API Details

### NWS (National Weather Service)

**Endpoint:** `https://api.weather.gov/alerts/active?area=NC`
**Auth:** None required
**Rate Limit:** Generous (no issues at 5-minute polling)

```typescript
// Response structure (simplified)
interface NWSResponse {
  features: {
    properties: {
      id: string;
      event: string;           // "Tornado Warning", "Winter Storm Watch"
      severity: string;        // "Extreme", "Severe", "Moderate", "Minor"
      certainty: string;       // "Observed", "Likely", "Possible"
      urgency: string;         // "Immediate", "Expected", "Future"
      areaDesc: string;        // "Wake; Durham; Orange" (semicolon-separated)
      onset: string;           // ISO 8601
      expires: string;         // ISO 8601
      headline: string;
    }
  }[]
}
```

### Duke Energy

**Endpoints:**
- DEC: `https://prod.apigee.duke-energy.app/outage-maps/v1/outages?jurisdiction=DEC`
- DEP: `https://prod.apigee.duke-energy.app/outage-maps/v1/outages?jurisdiction=DEP`

**Auth:** API key in header (stored in env)
**Rate Limit:** Unknown, 5-minute polling works

```typescript
// Response structure (simplified)
interface DukeResponse {
  outages: {
    latitude: number;
    longitude: number;
    customersAffected: number;
    estimatedRestoration: string | null;
    cause: string;
  }[]
}
```

---

## Configuration

### Environment Variables

```bash
PORT=4120                         # Server port
NODE_ENV=production               # Environment mode

# Optional overrides
NWS_REFRESH_INTERVAL=300000       # 5 minutes in ms
DUKE_REFRESH_INTERVAL=300000      # 5 minutes in ms
STALE_THRESHOLD_NWS=1200000       # 20 minutes - when to enter safe mode
STALE_THRESHOLD_DUKE=900000       # 15 minutes - when to enter safe mode
```

### Scheduler Jobs

| Job | Interval | Purpose |
|-----|----------|---------|
| `collect-all` | Every 5 minutes | Fetch NWS + Duke data |
| `evaluate-counties` | Every 5 minutes | Run risk brain, update states |
| `cleanup-old-alerts` | Daily at 3 AM | Archive expired alerts |
| `health-check` | Every 1 minute | Update feed staleness flags |

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| **Memory** | ~50-80 MB | SQLite + Node.js overhead |
| **CPU** | Negligible | Spikes briefly during data collection |
| **Disk** | ~10 MB | SQLite database + logs |
| **Latency** | <50ms | API response time for most endpoints |
| **Startup** | <3 seconds | Cold start with SQLite |

The ARM processor handles this workload easily alongside DeepSeek R1 and Command Dashboard.

---

*See also: [API_REFERENCE.md](./API_REFERENCE.md) | [STATE_MACHINE.md](./STATE_MACHINE.md)*
