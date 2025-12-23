# LIDS Development Prompt for Replit

## What This App Is

LIDS is an internal sales operations dashboard for Admiral Energy. It connects to Twenty CRM as a headless backend - no Supabase, no authentication, just direct CRM access.

## Current State

The app has:
- Basic dashboard, leads, pipeline, activity pages
- CSV import wizard (basic)
- Twenty CRM data provider (GraphQL)
- TCPA compliance utilities in client/src/lib/tcpa/

## What Needs to Be Built

### 1. Twenty CRM Headless Page (/crm)

Create a full-access page to Twenty CRM that exposes all CRM functionality.

Route: /crm

Features:
- Tab-based navigation: People | Companies | Opportunities | Notes | Tasks
- Full CRUD for each entity (list, create, edit, delete)
- Search and filtering
- Inline editing
- Quick actions (add note to person, create task, etc.)

Each tab should use Refine useTable hook with the twentyDataProvider.

### 2. Enhanced CSV Importer with TCPA Classification

Update CSVImportWizard.tsx to use the TCPA utilities in client/src/lib/tcpa/:

Features:
- PropStream template recognition (auto-map columns)
- TCPA 4-tier classification:
  - SAFE (0 DNC) -> Import to CRM
  - MODERATE (1 DNC) -> Flag for review
  - DANGEROUS (2 DNC) -> Quarantine
  - DNC_DATABASE (3+ DNC) -> Do not import
- Show classification stats before import
- Only import SAFE leads to Twenty CRM

Usage:

import { classifyLead, getPropstreamPhoneDncPairs, mapPropstreamRow, calculateSafePercentage } from "../lib/tcpa";

const classifiedLeads = csvData.map(row => {
  const mapped = mapPropstreamRow(row);
  const analysis = classifyLead(mapped, getPropstreamPhoneDncPairs());
  return { ...mapped, tcpaAnalysis: analysis };
});

const safeLeads = classifiedLeads.filter(l => l.tcpaAnalysis.riskLevel === 'SAFE');

### 3. Update App.tsx Routes

Add the CRM page to the router:

In menuItems:
{ key: "/crm", icon: <DatabaseOutlined />, label: <Link href="/crm">Twenty CRM</Link> }

In Routes:
<Route path="/crm" component={CRMPage} />

## Twenty CRM REST API

Endpoints (proxied via /api/twenty):
- GET /people - List all people
- GET /people/:id - Get single person
- POST /people - Create person
- PATCH /people/:id - Update person
- DELETE /people/:id - Delete person

Same for: /companies, /opportunities, /notes, /tasks

Person Schema:
{
  id: string,
  name: { firstName: string, lastName: string },
  emails: { primaryEmail: string },
  phones: { primaryPhoneNumber: string },
  company?: { name: string },
  jobTitle?: string,
  city?: string,
  createdAt: string
}

## Success Criteria

1. /crm page shows all Twenty CRM data with tabs
2. Can create, edit, delete records in Twenty CRM
3. CSV import shows TCPA classification breakdown
4. Only SAFE leads get imported
5. Import stats show: X SAFE, Y MODERATE, Z DANGEROUS, W DNC

## Don't Do

- Don't add Supabase
- Don't add authentication
- Don't add agent integrations
- Keep it simple - headless CRM viewer + CSV importer
