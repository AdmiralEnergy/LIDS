# Twenty CRM Integration - Complete Reference

**Last Updated:** 2026-01-04
**Purpose:** Context preservation for AI assistants across conversation compactions

---

## Quick Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| Data Provider | `client/src/providers/twentyDataProvider.ts` | Refine.dev data layer for CRUD |
| Settings | `client/src/lib/settings.ts` | API URLs and configuration |
| Sync Service | `client/src/lib/twentySync.ts` | Dexie ↔ Twenty bidirectional sync |
| Stats API | `client/src/lib/twentyStatsApi.ts` | Call records, progression, leaderboard |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ADS DASHBOARD                                      │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   UI (React)    │───>│  Refine.dev     │───>│ twentyDataProvider│        │
│  │   Components    │<───│  Hooks          │<───│ (GraphQL)         │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│          │                                              │                    │
│          ▼                                              ▼                    │
│  ┌─────────────────┐                         ┌─────────────────┐           │
│  │ Dexie (IndexDB) │<──────────────────────>│ twentySync.ts   │           │
│  │ Local Cache     │                         │ Sync Service    │           │
│  └─────────────────┘                         └─────────────────┘           │
│                                                        │                    │
└────────────────────────────────────────────────────────│────────────────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────┐
                                              │  Twenty CRM     │
                                              │  GraphQL API    │
                                              │  Port 3001      │
                                              └─────────────────┘
```

---

## Twenty CRM URL Resolution

**File:** `client/src/lib/settings.ts`

```typescript
export function getTwentyCrmUrl(): string {
  // External HELM access → Cloudflare tunnel
  if (isExternalAccess()) {
    return 'https://twenty.ripemerchant.host';
  }
  // Development (localhost:3100) → Express proxy
  if (isDevelopment()) {
    return '/twenty-api';
  }
  // Direct LAN access
  return `http://${backendHost}:3001`;
}
```

| Environment | URL | Notes |
|-------------|-----|-------|
| Production (HELM) | `https://twenty.ripemerchant.host` | Cloudflare tunnel |
| Development | `/twenty-api` | Express proxy on :5000 |
| LAN Direct | `http://100.94.207.1:3001` | Docker on Droplet |

---

## Authentication

**Twenty CRM is the sole identity provider. No Supabase, no HELM Registry.**

### User Identity

```typescript
// Permanent identifier (never changes)
workspaceMemberId: string  // UUID from Twenty

// Mutable lookup key (can change)
email: string  // For login only
```

### Login Flow

```
1. User enters email → /twenty-api/rest/workspaceMembers
2. Find member by email → get workspaceMemberId
3. Store workspaceMemberId in localStorage
4. All data links to workspaceMemberId (NOT email)
```

### Key Functions

**File:** `client/src/lib/twentyStatsApi.ts`

```typescript
// Get current user from API key
getCurrentWorkspaceMember(): Promise<{id, name, userEmail}>

// Get all workspace members (for dropdowns, assignment)
getWorkspaceMembers(): Promise<Array<{id, name, userEmail}>>
```

**File:** `client/src/lib/twentySync.ts`

```typescript
// Set/get current user
setCurrentWorkspaceMember(id: string)
getCurrentWorkspaceMember(): string | null  // Returns workspaceMemberId
```

---

## Data Schema

### Person (Lead) Object

**File:** `client/src/providers/twentyDataProvider.ts` lines 13-54

```typescript
interface TwentyPerson {
  id: string;
  name?: { firstName?: string; lastName?: string };
  emails?: { primaryEmail?: string };
  phones?: { primaryPhoneNumber?: string };
  company?: { name?: string };
  createdAt?: string;
  jobTitle?: string;
  linkedinLink?: { primaryLinkUrl?: string; primaryLinkLabel?: string };

  // PropStream Custom Fields (added via CSV import)
  cell1?: string;
  cell2?: string;
  cell3?: string;
  cell4?: string;
  landline1?: string;
  landline2?: string;
  landline3?: string;
  landline4?: string;
  phone1?: string;
  phone2?: string;
  email1?: string;
  email2?: string;
  email3?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  tcpaStatus?: string;  // SAFE, MODERATE, DANGEROUS, DNC
  leadSource?: string;  // PROPSTREAM, WEBSITE, REFERRAL, DOOR_KNOCK, EVENT
}
```

### Phone Priority

**File:** `twentyDataProvider.ts` lines 127-130

```typescript
// First available phone wins:
const phone = person.cell1 || person.cell2 || person.cell3 || person.cell4 ||
              person.landline1 || person.landline2 || person.phone1 || person.phone2 ||
              person.phones?.primaryPhoneNumber || "";
```

### TCPA Status → Lead Stage Mapping

**File:** `twentyDataProvider.ts` lines 141-147

```typescript
const stageMap: Record<string, string> = {
  'SAFE': 'new',
  'MODERATE': 'contacted',
  'DANGEROUS': 'qualified',
  'DNC': 'lost',
};
```

---

## GraphQL Queries

### Get People (Leads)

**File:** `twentyDataProvider.ts` lines 191-242

```graphql
query GetPeople($first: Int, $after: String) {
  people(first: $first, after: $after) {
    edges {
      node {
        id
        name { firstName lastName }
        emails { primaryEmail }
        phones { primaryPhoneNumber }
        company { name }
        linkedinLink { primaryLinkUrl primaryLinkLabel }
        createdAt
        # PropStream custom fields
        cell1 cell2 cell3 cell4
        landline1 landline2
        phone1 phone2
        email1 email2 email3
        street city state zipCode
        tcpaStatus
        leadSource
      }
    }
    pageInfo { hasNextPage endCursor }
    totalCount
  }
}
```

### Create Person

**File:** `twentyDataProvider.ts` lines 547-581

```graphql
mutation CreatePerson($data: PersonCreateInput!) {
  createPerson(data: $data) {
    id
    name { firstName lastName }
    emails { primaryEmail }
    phones { primaryPhoneNumber }
    # ... all custom fields
    createdAt
  }
}
```

### Update Person

**File:** `twentyDataProvider.ts` lines 778-805

```graphql
mutation UpdatePerson($id: ID!, $data: PersonUpdateInput!) {
  updatePerson(id: $id, data: $data) {
    id
    name { firstName lastName }
    emails { primaryEmail }
    phones { primaryPhoneNumber }
    createdAt
  }
}
```

---

## Custom Objects

### Call Records

**Object:** `callRecords` (Custom object in Twenty)

**File:** `client/src/lib/twentyStatsApi.ts` lines 20-34

```typescript
interface CallRecord {
  id?: string;
  name: string;           // Lead name
  duration: number;       // seconds
  disposition: string;    // CONTACT, CALLBACK, VOICEMAIL, NO_ANSWER, NOT_INTERESTED, WRONG_NUMBER, DNC
  xpAwarded: number;
  wasSubThirty: boolean;
  wasTwoPlusMin: boolean;
  leadId: string;
  createdAt?: string;
  createdBy?: {
    workspaceMemberId: string | null;  // Links to who made the call
    name: string;
  };
}
```

### Rep Progression

**Object:** `repProgressions` (Custom object in Twenty)

**File:** `client/src/lib/twentyStatsApi.ts` lines 36-52

```typescript
interface RepProgression {
  id?: string;
  name: string;                // Rep's name
  workspaceMemberId: string;   // Permanent user ID
  totalXp: number;
  currentLevel: number;
  currentRank: string;         // E-1 through E-7
  closedDeals: number;
  badges: string;              // JSON array
  streakDays: number;
  // Optional fields for expansion
  completedModules?: string;
  certifications?: string;
  defeatedBosses?: string;
  passedExams?: string;
  efficiencyMetrics?: string;
  lastActivityDate?: string;
}
```

---

## Sync Architecture

### Local-First Pattern

1. **On Action:** Save to Dexie (instant UI) + Push to Twenty (persistence)
2. **On Load:** Pull from Twenty → Update Dexie
3. **Periodic:** Every 5 minutes, sync both directions

### Sync Functions

**File:** `client/src/lib/twentySync.ts`

```typescript
// Pull from Twenty to local
syncFromTwenty(): Promise<void>

// Push from local to Twenty
syncToTwenty(): Promise<void>

// Queue for offline operations
flushSyncQueue(): Promise<void>

// Start periodic sync (default: 5 min)
startPeriodicSync(intervalMs?: number): void

// Record a call (saves to both)
recordCall(params: {
  name: string;
  duration: number;
  disposition: string;
  xpAwarded: number;
  leadId: string;
}): Promise<void>
```

### Call Recording Flow

```
User ends call
    │
    ▼
recordCall() in twentySync.ts
    │
    ├──> Create Note in Twenty: "Call - DISPOSITION | Duration | Name"
    │    (Notes prefixed with "Call -" are counted as calls by dashboard)
    │
    └──> Update local Dexie dailyMetrics
         - dials++
         - connects++ (if CONTACT)
         - appointments++ (if CALLBACK)
         - callsUnder30s++ (if < 30s)
         - callsOver2Min++ (if >= 120s)
```

---

## Role Detection

**File:** `client/src/lib/twentyStatsApi.ts` lines 281-331

```typescript
const EXECUTIVE_EMAILS: Record<string, {
  role: 'owner' | 'coo' | 'cmo' | 'rep';
  agentId: string;
  name: string;
  features: string[];
}> = {
  'davide@admiralenergy.ai': {
    role: 'owner',
    agentId: 'APEX-001',
    name: 'David Edwards',
    features: ['livewire', 'gideon', 'admin', 'analytics']
  },
  'nathanielj@admiralenergy.ai': {
    role: 'coo',
    agentId: 'APEX-003',
    name: 'Nathaniel Jenkins',
    features: ['livewire', 'analytics', 'team-management']
  },
  'leighe@ripemerchant.host': {
    role: 'cmo',
    agentId: 'APEX-002',
    name: 'Leigh Edwards',
    features: ['sarai', 'marketing', 'analytics']
  },
};

// Check if user has specific feature access
hasFeatureAccess(email: string, feature: string): boolean
```

---

## Stats & Metrics

### Get Today's Stats

**File:** `twentyStatsApi.ts` lines 116-139

```typescript
getTodayStats(workspaceMemberId?: string): Promise<{
  dials: number;
  connects: number;
  appointments: number;
  xpEarned: number;
  callsUnder30s: number;
  callsOver2Min: number;
}>
```

### Efficiency Metrics

**File:** `twentyStatsApi.ts` lines 335-359

```typescript
calculateEfficiencyMetrics(workspaceMemberId: string, daysBack?: number): Promise<{
  sub30sDropRate: number;    // % of connects under 30s (bad - needs opener training)
  callToApptRate: number;    // % of connects that became callbacks
  twoPlusMinRate: number;    // % of connects over 2 min (good - quality calls)
}>
```

---

## Missing Feature: Lead Assignment

**CURRENT STATE:** No per-rep lead assignment exists.

**PROBLEM:** All leads visible to all reps - no way to:
- Assign leads to specific reps
- Filter leads by assigned rep
- Have per-rep lead lists

**SOLUTION (Project 31):**
1. Add `assignedToWorkspaceMemberId` field to Person object
2. Update GraphQL queries to include field
3. Add filtering logic to dialer/leads pages
4. Create AssignRepDropdown component

See: `projects/active/31-lead-assignment-by-rep/`

---

## Environment Variables

**File:** `.env` (required)

```bash
VITE_TWENTY_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BACKEND_HOST=100.66.42.81  # admiral-server Tailscale IP
VITE_EXTERNAL_DOMAIN=ripemerchant.host
```

---

## Troubleshooting

### "Twenty CRM not configured"
- Check `VITE_TWENTY_API_KEY` in `.env`
- Verify key is valid at `twenty.ripemerchant.host`

### No leads showing
- Check Settings page → Twenty CRM status
- Verify API key has read access
- Check browser console for GraphQL errors

### Progression not syncing
- Check `localStorage.getItem('twentyWorkspaceMemberId')`
- Verify user exists in Twenty workspace
- Check console for `[syncToTwenty]` logs

### Calls not being recorded
- Check console for `[recordCall]` logs
- Verify Twenty API is accessible
- Check Notes in Twenty CRM (should show "Call - ...")

---

## Key Files Reference

```
apps/ads-dashboard/
├── client/src/
│   ├── providers/
│   │   └── twentyDataProvider.ts    # 1208 lines - All CRUD operations
│   ├── lib/
│   │   ├── settings.ts              # 191 lines - URLs, configuration
│   │   ├── twentySync.ts            # 570 lines - Sync logic
│   │   ├── twentyStatsApi.ts        # 360 lines - Stats, progression
│   │   ├── db.ts                    # Dexie schema
│   │   └── progressionDb.ts         # Local progression storage
│   └── pages/
│       ├── dialer.tsx               # Uses leads from Twenty
│       ├── leads.tsx                # Lead management table
│       └── dashboard.tsx            # Stats from Twenty
└── server/
    └── routes.ts                    # /twenty-api proxy route
```
