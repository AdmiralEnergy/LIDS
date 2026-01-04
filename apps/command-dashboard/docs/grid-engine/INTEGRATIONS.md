# Grid Engine Integrations

**How Grid Engine connects to and powers other LIDS apps and services.**

---

## Integration Architecture

Grid Engine is a **core data service** that feeds real-time grid intelligence to multiple LIDS apps:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GRID ENGINE AS DATA HUB                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                           ┌─────────────────────┐                           │
│                           │    GRID ENGINE      │                           │
│                           │   Oracle ARM:4120   │                           │
│                           └──────────┬──────────┘                           │
│                                      │                                      │
│              ┌───────────────────────┼───────────────────────┐              │
│              │                       │                       │              │
│              ▼                       ▼                       ▼              │
│   ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐  │
│   │ COMMAND DASHBOARD   │ │ STUDIO              │ │ MARKETING (n8n)     │  │
│   │ Real-time display   │ │ Outage content      │ │ Automated campaigns │  │
│   │ Oracle ARM:3104     │ │ Droplet:3103        │ │ admiral:5678        │  │
│   └─────────────────────┘ └─────────────────────┘ └─────────────────────┘  │
│              │                       │                       │              │
│              ▼                       ▼                       ▼              │
│   ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐  │
│   │ ADS DASHBOARD       │ │ LIVEWIRE            │ │ SMS ALERTS          │  │
│   │ Rep opportunity     │ │ Lead scoring boost  │ │ Twilio via n8n      │  │
│   │ Droplet:5000        │ │ admiral:5000        │ │ admiral:4115        │  │
│   └─────────────────────┘ └─────────────────────┘ └─────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration: Command Dashboard

**Type:** Direct API consumer (same host)
**Purpose:** Real-time display of grid status

### How It Works

Command Dashboard runs on the same Oracle ARM host as Grid Engine. It proxies Grid Engine endpoints through its Express server:

```typescript
// command-dashboard/server/routes.ts
const GRID_ENGINE_URL = process.env.ORACLE_ARM_HOST === 'localhost'
  ? 'http://localhost:4120'
  : 'http://193.122.153.249:4120';

app.get('/api/grid/status', async (req, res) => {
  const response = await fetch(`${GRID_ENGINE_URL}/status`);
  res.json(await response.json());
});

app.get('/api/grid/counties', async (req, res) => {
  const response = await fetch(`${GRID_ENGINE_URL}/api/counties`);
  res.json(await response.json());
});
```

### Data Used

| Endpoint | Dashboard Feature |
|----------|-------------------|
| `/status` | Overall system health, feed status |
| `/api/counties` | County status grid, Cleveland focus |
| `/api/alerts/active` | NWS alerts banner |
| `/api/outages/current` | Outage summary table |

### UI Components

```
GridStatusPanel.tsx
├── Cleveland County Card (always visible at top)
├── Summary Stats (97 GREEN | 3 YELLOW | 0 BLACK)
├── Active Alerts Banner
└── Outages Table (sorted by customers affected)
```

---

## Integration: Studio (Marketing Dashboard)

**Type:** API consumer via proxy
**Purpose:** Outage-triggered content creation

### How It Works

Studio on the Droplet can fetch Grid Engine data to inform content creation:

```typescript
// studio/server/routes.ts
const GRID_ENGINE_URL = process.env.GRID_ENGINE_URL || 'http://193.122.153.249:4120';

app.get('/api/grid/status', async (req, res) => {
  const response = await fetch(`${GRID_ENGINE_URL}/status`);
  res.json(await response.json());
});
```

### Use Cases

1. **Outage Content Templates** - When county goes BLACK, suggest content about backup power
2. **Weather-Ready Campaigns** - When county goes YELLOW/RED, suggest preparedness content
3. **Market Intelligence** - Show which counties are experiencing grid stress

### Future: Sarai Integration

Sarai (AI agent) will use Grid Engine data to generate contextual marketing scripts:

```typescript
// Potential future integration
const gridStatus = await fetch('/api/grid/status');
const blackCounties = gridStatus.countyStates.filter(c => c.level === 'BLACK');

if (blackCounties.length > 0) {
  saraiPrompt = `Generate a TikTok script about why ${blackCounties[0].county} County
                 residents need battery backup. ${blackCounties[0].customersOut}
                 customers are currently without power.`;
}
```

---

## Integration: n8n Marketing Automation

**Type:** Webhook consumer
**Purpose:** Automated marketing campaigns

### Webhook Events

Grid Engine can POST to n8n workflows when state changes occur:

```typescript
// grid-engine/src/engine/state-machine.ts
async function onStateChange(county: string, from: Level, to: Level) {
  // Notify n8n
  await fetch('http://192.168.1.23:5678/webhook/grid-state-change', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      county,
      fromLevel: from,
      toLevel: to,
      timestamp: new Date().toISOString(),
      customersOut: getOutageCount(county)
    })
  });
}
```

### n8n Workflows

| Trigger | Action |
|---------|--------|
| County → YELLOW | Queue "Storm Prep" email to leads in county |
| County → BLACK | Send "Outage Alert" SMS to subscribers |
| County → BLACK (>1000) | Create Facebook ad for battery backup |
| County BLACK → GREEN | Send "Recovery" followup email |

### Campaign Mapping

```
┌─────────────┬───────────────────────────────────────────────────────────────┐
│ Grid State  │ Marketing Action                                              │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ YELLOW      │ "Storm Approaching" awareness content                         │
│             │ - Email: "Is your home ready for the storm?"                  │
│             │ - Social: Weather prep tips                                   │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ RED         │ "Outage Imminent" urgency content                             │
│             │ - SMS: "High risk of outage in your area"                     │
│             │ - Social: Last-minute prep reminders                          │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ BLACK       │ "Active Outage" response content                              │
│             │ - SMS to subscribers: "Power out in [County]"                 │
│             │ - Social: "X customers affected in [County]"                  │
│             │ - Ads: Battery backup, generator offers                       │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ BLACK→GREEN │ "Recovery" follow-up content                                  │
│             │ - Email: "Power's back - here's how to prevent next time"     │
│             │ - Social: Customer testimonials about backup power            │
└─────────────┴───────────────────────────────────────────────────────────────┘
```

---

## Integration: ADS Dashboard (Sales Rep Tool)

**Type:** Embedded widget / API consumer
**Purpose:** Opportunity identification for reps

### How It Works

ADS Dashboard can display grid status to help reps prioritize calls:

```typescript
// ads-dashboard/client/src/components/GridWidget.tsx
function GridWidget() {
  const { data } = useQuery({
    queryKey: ['grid-status'],
    queryFn: () => fetch('/api/grid/outages/current').then(r => r.json()),
    refetchInterval: 60000
  });

  const hotCounties = Object.entries(data?.counties || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid-widget">
      <h3>Active Outages</h3>
      {hotCounties.map(([county, count]) => (
        <div key={county} className="hot-county">
          {county}: {count} customers out
        </div>
      ))}
    </div>
  );
}
```

### Sales Intelligence

When a county is BLACK:
- Leads in that county get a "Hot Opportunity" badge
- Reps can filter leads by county status
- Call scripts include outage context

---

## Integration: LiveWire (Lead Scanner)

**Type:** Scoring modifier
**Purpose:** Boost lead scores for affected areas

### How It Works

LiveWire can query Grid Engine to adjust lead scores:

```typescript
// livewire/src/scoring/grid-bonus.ts
async function getGridBonus(county: string): Promise<number> {
  const status = await fetch(`http://193.122.153.249:4120/api/counties/${county}`);
  const data = await status.json();

  switch (data.level) {
    case 'BLACK': return 30;  // +30 points for active outage
    case 'RED': return 20;    // +20 points for imminent outage
    case 'YELLOW': return 10; // +10 points for elevated risk
    default: return 0;
  }
}
```

### Lead Prioritization

Leads from outage-affected areas are prioritized:
1. BLACK county leads → Top of queue
2. RED/YELLOW county leads → Elevated priority
3. GREEN county leads → Normal priority

---

## Integration: Twilio SMS (via n8n)

**Type:** Outbound notifications
**Purpose:** Subscriber alerts

### How It Works

Grid Engine stores subscribers and triggers n8n to send SMS:

```
Grid Engine (state change)
    ↓
n8n webhook receives event
    ↓
n8n queries subscribers for county
    ↓
n8n sends SMS via Twilio (192.168.1.23:4115)
```

### Message Templates

| State | Message |
|-------|---------|
| YELLOW | "⚠️ Elevated grid risk in {county}. Storm approaching - consider preparing backup power. Reply STOP to opt out." |
| RED | "🔴 High grid risk in {county}. Power outage likely. Prepare now. Reply STOP to opt out." |
| BLACK | "⚡ Power outage in {county}. {count} customers affected. ETR: {time}. Reply STOP to opt out." |

---

## Integration: Twenty CRM

**Type:** Lead enrichment
**Purpose:** County status on lead records

### How It Works

Twenty CRM leads can be tagged with current county status:

```typescript
// Potential future: n8n workflow
// When lead is created/updated:
const countyStatus = await fetch(`http://193.122.153.249:4120/api/counties/${lead.county}`);
await updateLead(lead.id, {
  customFields: {
    gridStatus: countyStatus.level,
    gridCustomersOut: countyStatus.customersOut
  }
});
```

### CRM Fields

| Field | Type | Description |
|-------|------|-------------|
| `gridStatus` | Enum | GREEN/YELLOW/RED/BLACK |
| `gridCustomersOut` | Number | Current outage count |
| `gridLastUpdated` | DateTime | When status was checked |

---

## API Keys & Authentication

Grid Engine currently has no authentication (internal use only). For external integrations:

### Future: API Key Auth

```typescript
// Proposed header-based auth
const response = await fetch('http://193.122.153.249:4120/api/counties', {
  headers: {
    'X-API-Key': process.env.GRID_ENGINE_API_KEY
  }
});
```

### Network Security

- Grid Engine only accessible from:
  - Same host (localhost)
  - Tailscale network (100.x.x.x)
  - VPN-connected clients
- Not exposed to public internet

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GRID ENGINE DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUTS                          OUTPUTS                                    │
│  ──────                          ───────                                    │
│                                                                             │
│  NWS API ───────────┐            ┌─────────► Command Dashboard (display)   │
│                     │            │                                          │
│  Duke DEC API ──────┤            ├─────────► Studio (content triggers)     │
│                     │            │                                          │
│  Duke DEP API ──────┤            ├─────────► n8n (marketing automation)    │
│                     │            │                                          │
│                     ▼            │                                          │
│               ┌───────────┐      ├─────────► ADS Dashboard (rep intel)     │
│               │   GRID    │──────┤                                          │
│               │  ENGINE   │      ├─────────► LiveWire (lead scoring)       │
│               └───────────┘      │                                          │
│                     ▲            ├─────────► Twilio SMS (subscriber alerts)│
│                     │            │                                          │
│  Vulnerability ─────┘            └─────────► Twenty CRM (lead enrichment)  │
│  Weights (manual)                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*See also: [API_REFERENCE.md](./API_REFERENCE.md) | [OPERATIONS.md](./OPERATIONS.md)*
