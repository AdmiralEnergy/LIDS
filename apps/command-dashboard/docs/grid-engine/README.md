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
