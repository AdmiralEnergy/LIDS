# Grid Engine State Machine

**How counties transition between GREEN, YELLOW, RED, and BLACK states.**

---

## State Definitions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COUNTY STATE MACHINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                                                             │
│   ┌─────────────┐                                 ┌─────────────┐          │
│   │   GREEN     │─────── 2-of-3 Confirmation ────►│   YELLOW    │          │
│   │             │                                 │             │          │
│   │  Normal     │◄─────── Alerts Expire ─────────│  Elevated   │          │
│   │  Operations │                                 │  Risk       │          │
│   └──────┬──────┘                                 └──────┬──────┘          │
│          │                                               │                  │
│          │                                               │                  │
│          │ 2000+ customers OR                            │ Severe Weather   │
│          │ 1% of population                              │ Warning          │
│          │                                               │                  │
│          │                                               ▼                  │
│          │                                        ┌─────────────┐          │
│          │                                        │    RED      │          │
│          │                                        │             │          │
│          │                                        │  High Risk  │          │
│          │                                        └──────┬──────┘          │
│          │                                               │                  │
│          │                    2000+ customers OR 1%      │                  │
│          │                    of population              │                  │
│          │                                               │                  │
│          ▼                                               ▼                  │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                           BLACK                                  │      │
│   │                                                                  │      │
│   │                      Active Power Outage                        │      │
│   │                                                                  │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│          │                                                                  │
│          │ Outage resolved (customers < threshold)                         │
│          │                                                                  │
│          └───────────────────────► Returns to GREEN ◄───────────────────── │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## State Details

### GREEN - Normal Operations

**Meaning:** No significant weather alerts or power outages affecting the county.

**Conditions to be GREEN:**
- No active NWS alerts with severe weather type
- Less than 2000 customers without power
- Less than 1% of county population without power

**Actions:**
- No alerts sent
- Baseline state for marketing

---

### YELLOW - Elevated Risk

**Meaning:** Conditions indicate increased probability of power outage. This is a PROACTIVE state.

**Trigger Conditions (2-of-3 Confirmation):**

| Signal | Description |
|--------|-------------|
| **NWS Alert Exists** | Active weather alert affecting this county |
| **County is Vulnerable** | Historical outage frequency above threshold (weight > 0.5) |
| **Severe Weather Type** | Alert is grid-stress inducing (see list below) |

**Severe Weather Types:**
- Tornado Warning/Watch
- Severe Thunderstorm Warning/Watch
- Hurricane Warning/Watch
- Tropical Storm Warning/Watch
- Ice Storm Warning
- Winter Storm Warning/Watch
- Blizzard Warning/Watch
- High Wind Warning
- Flash Flood Warning

**Actions:**
- SMS alert to county subscribers: "Elevated grid risk in [County]. Consider preparing backup power."
- Marketing trigger: "Pre-outage awareness" campaign
- Dashboard shows yellow indicator

---

### RED - High Risk

**Meaning:** Severe weather warning is active and power outage is likely imminent.

**Trigger Conditions:**
- Currently YELLOW, AND
- NWS alert with:
  - `severity: "Extreme"` or `"Severe"`, AND
  - `urgency: "Immediate"`, AND
  - `certainty: "Observed"` or `"Likely"`

**Actions:**
- SMS alert: "High grid risk in [County]. Power outage likely. Prepare now."
- Marketing trigger: "Imminent outage" campaign
- Dashboard shows red indicator

---

### BLACK - Active Outage

**Meaning:** Significant power outage is currently affecting the county.

**Trigger Conditions (from ANY state):**
- 2000+ customers without power, OR
- 1%+ of county population without power

**Black Thresholds by County (examples):**

| County | Population | 1% Threshold | Applied Threshold |
|--------|------------|--------------|-------------------|
| Wake | 1,129,410 | 11,294 | 2,000 (min) |
| Cleveland | 99,519 | 995 | 995 |
| Hyde | 4,937 | 49 | 49 |

For small counties, 1% threshold is used. For large counties, 2000 minimum is used.

**Actions:**
- SMS alert: "Power outage in [County]. [X] customers affected. ETR: [time]."
- Marketing trigger: "Active outage response" campaign
- Dashboard shows black/purple indicator
- Sales reps notified of opportunity

---

## Risk Brain Logic

The Risk Brain evaluates each county every 5 minutes:

```typescript
function evaluateCounty(county: County): Level {
  const currentOutage = getOutageData(county);
  const alerts = getNWSAlerts(county);
  const vulnerability = getVulnerability(county);

  // BLACK check first (highest priority)
  if (currentOutage.customersOut >= 2000 ||
      currentOutage.percentOut >= 0.01) {
    return 'BLACK';
  }

  // Count signals for 2-of-3 confirmation
  let signals = 0;

  if (alerts.length > 0) signals++;
  if (vulnerability.weight > 0.5) signals++;
  if (alerts.some(a => isSevereWeatherType(a.event))) signals++;

  // RED check
  if (signals >= 2 && hasImmediateSevereAlert(alerts)) {
    return 'RED';
  }

  // YELLOW check
  if (signals >= 2) {
    return 'YELLOW';
  }

  return 'GREEN';
}
```

---

## 2-of-3 Confirmation Philosophy

**Why 2-of-3?**

The 2-of-3 rule prevents false alarms:

| Scenario | Signal 1 | Signal 2 | Signal 3 | Result |
|----------|----------|----------|----------|--------|
| Minor rain | NWS Alert | Low Vuln. | Not Severe | GREEN (1/3) |
| Winter weather in hardy county | NWS Alert | Low Vuln. | Severe Type | YELLOW (2/3) |
| Storm in vulnerable area | NWS Alert | High Vuln. | Severe Type | YELLOW (3/3) |
| No weather, grid issue | No Alert | High Vuln. | - | GREEN (1/3) |

This prevents alerting on:
- Minor weather events
- Historical vulnerability alone
- Weather types that rarely cause outages

---

## State Transitions

### Allowed Transitions

```
GREEN  → YELLOW  (2-of-3 confirmation)
GREEN  → BLACK   (major outage, skip intermediate)
YELLOW → RED     (severe warning escalation)
YELLOW → GREEN   (alerts expire)
YELLOW → BLACK   (outage occurs)
RED    → BLACK   (outage occurs)
RED    → YELLOW  (downgrade from extreme)
RED    → GREEN   (alerts expire)
BLACK  → GREEN   (outage resolved)
```

### Transition Logging

Every state change is logged to `state_history` table:

```sql
INSERT INTO state_history (county, from_level, to_level, reason, timestamp)
VALUES ('Cleveland', 'GREEN', 'YELLOW', '2-of-3: NWS alert + vulnerability + ice storm', '2026-01-03T14:30:00Z');
```

---

## Safe Mode Gates

The state machine respects safe mode restrictions:

| Safe Mode | Effect on State Machine |
|-----------|------------------------|
| `NORMAL` | All transitions allowed |
| `DUKE_STALE` | Cannot transition TO BLACK (outage data unreliable) |
| `NWS_STALE` | Cannot transition TO YELLOW/RED (alert data unreliable) |
| `FULL_SAFE` | Cannot transition TO any elevated state |

**Philosophy:** Better to send NO alert than a FALSE alert.

---

## Hysteresis (Bounce Prevention)

To prevent rapid state changes, the system implements hysteresis:

- **Exit delay:** Must stay in GREEN conditions for 10+ minutes before transitioning out of YELLOW/RED
- **Entry delay:** Must meet YELLOW conditions for 5+ minutes before transitioning from GREEN

This prevents:
- Rapid GREEN → YELLOW → GREEN → YELLOW oscillation
- Alert fatigue from brief weather fluctuations

---

## Example Scenarios

### Scenario 1: Ice Storm Approaching Cleveland County

```
Time 0:00  - County: GREEN, No alerts
Time 0:05  - NWS issues Ice Storm Warning for Cleveland
            - Signal check: NWS ✓, Vulnerability (0.7) ✓, Severe Type ✓
            - Result: 3/3 → YELLOW
            - SMS sent: "Elevated grid risk in Cleveland..."
Time 0:45  - Ice begins, alert upgraded to "Observed"
            - Severity: Severe, Urgency: Immediate, Certainty: Observed
            - Result: YELLOW → RED
            - SMS sent: "High grid risk in Cleveland..."
Time 1:30  - Power lines down, 3,500 customers out
            - Outage > 2000 threshold
            - Result: RED → BLACK
            - SMS sent: "Power outage in Cleveland. 3,500 affected..."
Time 4:00  - Crews restore power, 200 customers remaining
            - Outage < threshold, alert expired
            - Result: BLACK → GREEN
```

### Scenario 2: False Alarm Prevention

```
Time 0:00  - County: GREEN
Time 0:05  - NWS issues Frost Advisory
            - Signal check: NWS ✓, Vulnerability (0.3) ✗, Severe Type ✗
            - Result: 1/3 → Stays GREEN
            - No alert sent
Time 0:10  - Advisory expires
            - Still GREEN
```

---

*See also: [ARCHITECTURE.md](./ARCHITECTURE.md) | [INTEGRATIONS.md](./INTEGRATIONS.md)*
