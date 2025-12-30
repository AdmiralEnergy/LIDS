# Codex Implementation Plan - Project 21: ADS Dashboard Consolidation

## System Prompt

```
You are implementing ADS Dashboard consolidation for LIDS.

Context:
- App: apps/ads-dashboard (React + TypeScript + Vite + Ant Design)
- Current problem: 10 navigation tabs causing context-switching; blank fields displayed
- Solution: Consolidate to 4 tabs; filter out blank fields

Key files:
- App.tsx - Navigation configuration
- pages/dashboard.tsx - Stats page (add leaderboard + progression)
- pages/leads.tsx - Lead management (add CRM tabs)
- pages/dialer.tsx - Power dialer (add call history + chat panels)
- providers/twentyDataProvider.ts - Data layer

Brand tokens:
- Navy: #0c2f4a
- Gold: #c9a648
- White: #f7f5f2
- Cyan accent: #00ffff

Data provider: Twenty CRM via GraphQL
Components: Ant Design + shadcn/ui
State: Refine.dev + React Query
```

---

## Phase 1: Smart Field Display (CRITICAL) - COMPLETED Dec 30, 2025

### IMPORTANT: Multi-Channel Sales Philosophy

**DO NOT just show the first populated phone. Show ALL populated contact methods.**

Per ADMIRAL_SALES_OPERATIVE_FRAMEWORK.md Section 4:
- Multi-channel sequencing is REQUIRED for effective sales
- Different prospects respond to different channels (cells, landlines, emails)
- Each contact method is a SEPARATE sales opportunity
- Older homeowners prefer landlines, some only respond to email
- **Filter BLANK fields, keep ALL ACTIONABLE fields**

### Task 1.1: Create Field Filtering Utility

**File:** `apps/ads-dashboard/client/src/lib/fieldUtils.ts` (NEW)

```typescript
/**
 * Field Utility Functions for Smart Display
 *
 * PHILOSOPHY: Show ALL populated contact methods, hide ONLY blanks.
 * Each phone, email, landline is a separate sales opportunity.
 * Per ADMIRAL_SALES_OPERATIVE_FRAMEWORK.md - multi-channel sequencing is required.
 */

// Check if a value is "empty" (null, undefined, empty string, whitespace)
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return false; // 0 is valid
  return false;
}

// Phone field definitions
export const PHONE_FIELDS = [
  { key: 'cell1', label: 'Cell', icon: '📱' },
  { key: 'cell2', label: 'Cell 2', icon: '📱' },
  { key: 'cell3', label: 'Cell 3', icon: '📱' },
  { key: 'cell4', label: 'Cell 4', icon: '📱' },
  { key: 'landline1', label: 'Landline', icon: '📞' },
  { key: 'landline2', label: 'Landline 2', icon: '📞' },
  { key: 'phone1', label: 'Phone', icon: '📞' },
  { key: 'phone2', label: 'Phone 2', icon: '📞' },
  { key: 'phone', label: 'Phone', icon: '📞' },
] as const;

// Email field definitions
export const EMAIL_FIELDS = [
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'email1', label: 'Email', icon: '📧' },
  { key: 'email2', label: 'Email 2', icon: '📧' },
  { key: 'email3', label: 'Email 3', icon: '📧' },
  { key: 'email4', label: 'Email 4', icon: '📧' },
] as const;

// Address field definitions
export const ADDRESS_FIELDS = [
  { key: 'street', label: 'Street' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zipCode', label: 'ZIP' },
] as const;

export interface ContactField {
  value: string;
  label: string;
  icon: string;
  key: string;
  type: 'phone' | 'email' | 'address';
}

/**
 * Get ALL populated phones from lead data
 * RETURNS: Array of all phones that have values - NOT just the first one
 */
export function getAllPopulatedPhones(lead: any): ContactField[] {
  return PHONE_FIELDS
    .filter(({ key }) => !isEmpty(lead[key]))
    .map(({ key, label, icon }) => ({
      value: lead[key],
      label,
      icon,
      key,
      type: 'phone' as const,
    }));
}

/**
 * Get ALL populated emails from lead data
 * RETURNS: Array of all emails that have values - NOT just the first one
 */
export function getAllPopulatedEmails(lead: any): ContactField[] {
  return EMAIL_FIELDS
    .filter(({ key }) => !isEmpty(lead[key]))
    .map(({ key, label, icon }) => ({
      value: lead[key],
      label,
      icon,
      key,
      type: 'email' as const,
    }));
}

/**
 * Get formatted location string (only populated parts)
 */
export function getFormattedLocation(lead: any): string | null {
  const parts = [];
  if (!isEmpty(lead.city)) parts.push(lead.city);
  if (!isEmpty(lead.state)) parts.push(lead.state);
  if (!isEmpty(lead.zipCode)) parts.push(lead.zipCode);
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Get full address if all parts populated
 */
export function getFullAddress(lead: any): string | null {
  const parts = [];
  if (!isEmpty(lead.street)) parts.push(lead.street);
  if (!isEmpty(lead.city)) parts.push(lead.city);
  if (!isEmpty(lead.state)) parts.push(lead.state);
  if (!isEmpty(lead.zipCode)) parts.push(lead.zipCode);
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Get ALL populated contact methods for a lead
 * This is the PRIMARY function for multi-channel display
 */
export function getAllContactMethods(lead: any): {
  phones: ContactField[];
  emails: ContactField[];
  location: string | null;
  hasAnyContact: boolean;
} {
  const phones = getAllPopulatedPhones(lead);
  const emails = getAllPopulatedEmails(lead);
  const location = getFormattedLocation(lead);

  return {
    phones,
    emails,
    location,
    hasAnyContact: phones.length > 0 || emails.length > 0,
  };
}

/**
 * Get the PRIMARY phone (first available) - ONLY for dialer auto-dial
 * For display purposes, use getAllPopulatedPhones() instead
 */
export function getPrimaryPhone(lead: any): ContactField | null {
  const phones = getAllPopulatedPhones(lead);
  return phones.length > 0 ? phones[0] : null;
}

/**
 * Filter object to only include non-empty values
 */
export function filterPopulatedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!isEmpty(value)) {
      result[key as keyof T] = value;
    }
  }
  return result;
}
```

### Task 1.2: Create ContactMethodList Component

**File:** `apps/ads-dashboard/client/src/components/ContactMethodList.tsx` (NEW)

```typescript
/**
 * ContactMethodList - Displays ALL populated contact methods for a lead
 * Each phone/email is clickable for immediate action
 */
import { Space, Typography, Button, Tooltip } from "antd";
import { PhoneOutlined, MailOutlined } from "@ant-design/icons";
import { ContactField } from "../lib/fieldUtils";

const { Text } = Typography;

interface ContactMethodListProps {
  phones: ContactField[];
  emails: ContactField[];
  compact?: boolean; // For table rows - show stacked
  onCallPhone?: (phone: ContactField) => void;
  onSendEmail?: (email: ContactField) => void;
}

export function ContactMethodList({
  phones,
  emails,
  compact = false,
  onCallPhone,
  onSendEmail,
}: ContactMethodListProps) {
  if (phones.length === 0 && emails.length === 0) {
    return <Text type="secondary">No contact info</Text>;
  }

  if (compact) {
    // Stacked display for table rows
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {phones.map((phone, idx) => (
          <div key={`phone-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, width: 70 }}>
              {phone.icon} {phone.label}:
            </Text>
            <Button
              type="link"
              size="small"
              icon={<PhoneOutlined />}
              onClick={() => onCallPhone?.(phone)}
              style={{ padding: 0, color: '#00ffff' }}
            >
              {phone.value}
            </Button>
          </div>
        ))}
        {emails.map((email, idx) => (
          <div key={`email-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, width: 70 }}>
              {email.icon} {email.label}:
            </Text>
            <Button
              type="link"
              size="small"
              icon={<MailOutlined />}
              onClick={() => onSendEmail?.(email)}
              style={{ padding: 0, color: '#c9a648' }}
            >
              {email.value}
            </Button>
          </div>
        ))}
      </div>
    );
  }

  // Expanded display for detail views
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {phones.length > 0 && (
        <div>
          <Text strong style={{ color: '#fff', marginBottom: 4, display: 'block' }}>
            Phones ({phones.length})
          </Text>
          {phones.map((phone, idx) => (
            <Tooltip key={idx} title={`Click to call ${phone.label}`}>
              <Button
                type="text"
                icon={<PhoneOutlined />}
                onClick={() => onCallPhone?.(phone)}
                style={{ color: '#00ffff', marginRight: 8 }}
              >
                {phone.icon} {phone.label}: {phone.value}
              </Button>
            </Tooltip>
          ))}
        </div>
      )}
      {emails.length > 0 && (
        <div>
          <Text strong style={{ color: '#fff', marginBottom: 4, display: 'block' }}>
            Emails ({emails.length})
          </Text>
          {emails.map((email, idx) => (
            <Tooltip key={idx} title={`Click to email ${email.label}`}>
              <Button
                type="text"
                icon={<MailOutlined />}
                onClick={() => onSendEmail?.(email)}
                style={{ color: '#c9a648', marginRight: 8 }}
              >
                {email.icon} {email.value}
              </Button>
            </Tooltip>
          ))}
        </div>
      )}
    </Space>
  );
}
```

### Task 1.3: Update Leads Table to Show ALL Contact Methods

**File:** `apps/ads-dashboard/client/src/pages/leads.tsx`

**Action:** Replace single phone column with multi-contact display

Add imports at top:
```typescript
import { getAllContactMethods, getPrimaryPhone } from '../lib/fieldUtils';
import { ContactMethodList } from '../components/ContactMethodList';
```

Find the columns definition and update the Phone column:

```typescript
// REPLACE the single phone column:
{
  title: "Phone",
  dataIndex: "phone",
  key: "phone",
  render: (phone: string) => (
    <Text style={{ color: "rgba(255,255,255,0.85)" }}>{phone}</Text>
  ),
},

// WITH this multi-contact column:
{
  title: "Contact Methods",
  key: "contactMethods",
  width: 280,
  render: (_: any, record: Lead) => {
    const { phones, emails } = getAllContactMethods(record);
    return (
      <ContactMethodList
        phones={phones}
        emails={emails}
        compact={true}
        onCallPhone={(phone) => {
          // Trigger call or navigate to dialer with this number
          window.location.href = `tel:${phone.value}`;
        }}
        onSendEmail={(email) => {
          window.location.href = `mailto:${email.value}`;
        }}
      />
    );
  },
},
```

### Task 1.4: Update Dialer Lead Display

**File:** `apps/ads-dashboard/client/src/pages/dialer.tsx`

The dialer should:
1. Show ALL contact methods in the lead info panel
2. Use getPrimaryPhone() ONLY for auto-dial selection
3. Allow rep to select which number to dial from the list

```typescript
import { getAllContactMethods, getPrimaryPhone } from '../lib/fieldUtils';
import { ContactMethodList } from '../components/ContactMethodList';

// In the lead info section, show ALL phones:
const { phones, emails, location } = getAllContactMethods(currentLead);

// For auto-dial, get primary:
const primaryPhone = getPrimaryPhone(currentLead);

// In JSX - show all phones with ability to select which to dial:
<ContactMethodList
  phones={phones}
  emails={emails}
  compact={false}
  onCallPhone={(phone) => {
    // Set this as the active dial number
    setSelectedDialNumber(phone.value);
    initiateCall(phone.value);
  }}
  onSendEmail={(email) => {
    // Open SMS/Email tab with this email
    setActiveTab('email');
    setRecipientEmail(email.value);
  }}
/>
```

---

## Phase 2: Dashboard Enhancement - COMPLETED Dec 30, 2025

### Task 2.1: Extract LeaderboardTable Component

**File:** `apps/ads-dashboard/client/src/components/LeaderboardTable.tsx` (NEW)

```typescript
import { Table, Tag, Typography, Tooltip } from "antd";
import { TrophyOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface LeaderboardEntry {
  name: string;
  workspaceMemberId: string;
  totalXp: number;
  currentLevel: number;
  currentRank: string;
  todayDials?: number;
  todayAppointments?: number;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  currentUserId?: string;
  compact?: boolean;
  loading?: boolean;
}

const rankColors: Record<string, string> = {
  "E-1": "#64748b",
  "E-2": "#64748b",
  "E-3": "#64748b",
  "E-4": "#22c55e",
  "E-5": "#c9a648",
  "E-6": "#3b82f6",
  "E-7": "#8b5cf6",
};

export function LeaderboardTable({ data, currentUserId, compact = false, loading = false }: LeaderboardTableProps) {
  const getMedalEmoji = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return `#${position}`;
  };

  const columns = [
    {
      title: "",
      key: "position",
      width: 50,
      render: (_: any, __: any, index: number) => (
        <Text style={{ color: index < 3 ? "#c9a648" : "rgba(255,255,255,0.65)" }}>
          {getMedalEmoji(index + 1)}
        </Text>
      ),
    },
    {
      title: "Rep",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: LeaderboardEntry) => (
        <div>
          <Text strong style={{
            color: record.workspaceMemberId === currentUserId ? "#c9a648" : "#fff"
          }}>
            {name} {record.workspaceMemberId === currentUserId && "(You)"}
          </Text>
          <Tag color={rankColors[record.currentRank] || "#64748b"} style={{ marginLeft: 8 }}>
            {record.currentRank}
          </Tag>
        </div>
      ),
    },
    {
      title: "XP",
      dataIndex: "totalXp",
      key: "totalXp",
      render: (xp: number) => (
        <Text style={{ color: "#c9a648", fontWeight: 600 }}>
          {xp.toLocaleString()}
        </Text>
      ),
    },
    ...(compact ? [] : [
      {
        title: "Today",
        key: "today",
        render: (_: any, record: LeaderboardEntry) => (
          <Text style={{ color: "rgba(255,255,255,0.65)" }}>
            {record.todayDials || 0} dials
          </Text>
        ),
      },
    ]),
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="workspaceMemberId"
      loading={loading}
      pagination={false}
      size={compact ? "small" : "middle"}
      style={{ background: "transparent" }}
    />
  );
}
```

### Task 2.2: Extract ProgressionBar Component

**File:** `apps/ads-dashboard/client/src/components/ProgressionBar.tsx` (NEW)

```typescript
import { Progress, Typography, Tag, Space } from "antd";
import { RiseOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface ProgressionBarProps {
  currentXp: number;
  currentLevel: number;
  currentRank: string;
  xpToNextLevel: number;
  todayXp?: number;
}

const rankColors: Record<string, string> = {
  "E-1": "#64748b",
  "E-2": "#64748b",
  "E-3": "#64748b",
  "E-4": "#22c55e",
  "E-5": "#c9a648",
  "E-6": "#3b82f6",
  "E-7": "#8b5cf6",
};

export function ProgressionBar({
  currentXp,
  currentLevel,
  currentRank,
  xpToNextLevel,
  todayXp = 0
}: ProgressionBarProps) {
  const progress = Math.min((currentXp / xpToNextLevel) * 100, 100);

  return (
    <div style={{
      background: "#0f3654",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <Space>
          <Tag color={rankColors[currentRank]} style={{ fontSize: 14, padding: "4px 12px" }}>
            {currentRank}
          </Tag>
          <Text style={{ color: "#fff", fontSize: 16 }}>Level {currentLevel}</Text>
        </Space>
        <Space>
          <RiseOutlined style={{ color: "#52c41a" }} />
          <Text style={{ color: "#52c41a" }}>+{todayXp} XP today</Text>
        </Space>
      </div>
      <Progress
        percent={progress}
        strokeColor="#c9a648"
        trailColor="rgba(255,255,255,0.1)"
        format={() => (
          <Text style={{ color: "#c9a648" }}>
            {currentXp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
          </Text>
        )}
      />
    </div>
  );
}
```

### Task 2.3: Update Dashboard Page

**File:** `apps/ads-dashboard/client/src/pages/dashboard.tsx`

Add imports and integrate leaderboard + progression:

```typescript
// Add to imports
import { LeaderboardTable } from "../components/LeaderboardTable";
import { ProgressionBar } from "../components/ProgressionBar";
import { getLeaderboard, getRepProgression } from "../lib/twentyStatsApi";

// Add to component, after stats cards:
const [leaderboard, setLeaderboard] = useState<any[]>([]);
const [progression, setProgression] = useState<any>(null);

useEffect(() => {
  async function loadData() {
    const [lb, prog] = await Promise.all([
      getLeaderboard(),
      currentUser?.id ? getRepProgression(currentUser.id) : null,
    ]);
    setLeaderboard(lb);
    setProgression(prog);
  }
  loadData();
}, [currentUser?.id]);

// Add in JSX after stats cards:
{progression && (
  <ProgressionBar
    currentXp={progression.totalXp || 0}
    currentLevel={progression.currentLevel || 1}
    currentRank={progression.currentRank || "E-1"}
    xpToNextLevel={5000} // Calculate based on level
    todayXp={todayStats.xpEarned || 0}
  />
)}

<Card title="Team Leaderboard" style={{ marginTop: 16 }}>
  <LeaderboardTable
    data={leaderboard}
    currentUserId={currentUser?.id}
    compact={false}
    loading={false}
  />
</Card>
```

---

## Phase 3: Leads Enhancement (Merge CRM Tabs) - COMPLETED Dec 30, 2025

### Task 3.1: Add CRM Tabs to Leads Page

**File:** `apps/ads-dashboard/client/src/pages/leads.tsx`

Convert to tabbed interface with People (existing) + Companies, Notes, Tasks, Opportunities from crm.tsx.

Add Tabs component at top level:

```typescript
// Add to imports
import { Tabs } from "antd";

// Replace page structure with tabs:
export function LeadsPage() {
  const [activeTab, setActiveTab] = useState("people");

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <Title level={2} style={{ color: "#fff", margin: 0 }}>Leads & CRM</Title>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
            Import CSV
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            Add Lead
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "people", label: "People", children: <PeopleTab /> },
          { key: "companies", label: "Companies", children: <CompaniesTab /> },
          { key: "notes", label: "Notes", children: <NotesTab /> },
          { key: "tasks", label: "Tasks", children: <TasksTab /> },
          { key: "opportunities", label: "Opportunities", children: <OpportunitiesTab /> },
        ]}
      />
    </div>
  );
}
```

Extract each tab as a sub-component from current crm.tsx.

---

## Phase 4: Dialer Enhancement (Add History + Chat) - COMPLETED Dec 30, 2025

### Task 4.1: Extract CallHistoryPanel Component

**File:** `apps/ads-dashboard/client/src/components/CallHistoryPanel.tsx` (NEW)

Extract the core table and filter logic from call-history.tsx, make it embeddable.

### Task 4.2: Extract ChatPanel Component

**File:** `apps/ads-dashboard/client/src/components/ChatPanel.tsx` (NEW)

Extract channel list and message display from chat.tsx, make it embeddable.

### Task 4.3: Add Tabs to Dialer Right Panel

**File:** `apps/ads-dashboard/client/src/pages/dialer.tsx`

Add History and Chat tabs alongside existing SMS/Email tabs in the right panel.

---

## Phase 5: Navigation Cleanup - COMPLETED Dec 30, 2025

### Task 5.1: Update App.tsx Navigation

**File:** `apps/ads-dashboard/client/src/App.tsx`

```typescript
// BEFORE (10 items):
const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/leads", icon: <TeamOutlined />, label: "Leads" },
  { key: "/pipeline", icon: <FundOutlined />, label: "Pipeline" },
  { key: "/activity", icon: <HistoryOutlined />, label: "Activity" },
  { key: "/crm", icon: <DatabaseOutlined />, label: "Twenty CRM" },
  { key: "/dialer", icon: <PhoneOutlined />, label: "Dialer" },
  { key: "/call-history", icon: <ClockCircleOutlined />, label: "Call History" },
  { key: "/leaderboard", icon: <TrophyOutlined />, label: "Leaderboard" },
  { key: "/chat", icon: <MessageOutlined />, label: "Team Chat" },
  { key: "/settings", icon: <SettingOutlined />, label: "Settings" },
];

// AFTER (4 items):
const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/leads", icon: <TeamOutlined />, label: "Leads" },
  { key: "/dialer", icon: <PhoneOutlined />, label: "Dialer" },
  { key: "/settings", icon: <SettingOutlined />, label: "Settings" },
];
```

### Task 5.2: Remove Unused Routes

Remove these routes from App.tsx:
- `/pipeline`
- `/activity`
- `/crm`
- `/call-history`
- `/leaderboard`
- `/chat`

### Task 5.3: Delete Unused Page Files

Delete these files (after Phase 4 completion):
- `pages/pipeline.tsx`
- `pages/activity.tsx`
- `pages/crm.tsx` (after merge)
- `pages/call-history.tsx` (after component extraction)
- `pages/leaderboard.tsx` (after component extraction)
- `pages/chat.tsx` (after component extraction)

---

## Phase 6: DPC-Focused Efficiency Metrics (ADMIRAL_UNIFIED_SALES_FRAMEWORK.md) - COMPLETED

**Completed:** December 29, 2025
**QA Compliance Fix:** December 30, 2025 - Updated getDPCTier() to check BOTH DPC AND ECR requirements per framework Part 3.1

**Files Created:**
- `client/src/lib/dpcMetrics.ts` - DPC/ECR/EAR calculations and tier logic
- `client/src/components/DPCMetricsPanel.tsx` - Efficiency metrics display (compact + full)
- `client/src/hooks/useDPCMetrics.ts` - Metrics tracking hook with Dexie persistence
**Files Modified:**
- `client/src/components/dialer/MobileDialer.tsx` - Added dpcMetrics prop
- `client/src/pages/dialer.tsx` - Integrated useDPCMetrics hook
- `client/src/pages/dashboard.tsx` - Added full DPCMetricsPanel

**Framework Compliance (Part 3.1):**
- Elite: DPC < 30 **AND** ECR > 85%
- Above Satisfactory: DPC < 45 **AND** ECR > 75%
- Satisfactory: DPC < 70 **AND** ECR > 65%
- Developing: Does not meet above criteria
- Ramp: < 25 confirmed enrollments (no tier yet)

---

**Reference:** `docs/ADMIRAL_UNIFIED_SALES_FRAMEWORK.md`

This phase implements the DPC (Dials Per Confirmed) efficiency-focused metrics system, replacing raw dial volume tracking with quality-adjusted efficiency metrics.

**Key Metrics:**
- **DPE** (Dials Per Enrollment) - Raw efficiency
- **ECR** (Enrollment Confirmation Rate) - Quality gate
- **DPC** (Dials Per Confirmed) - PRIMARY metric (quality-adjusted efficiency)
- **EAR** (Enrollment-to-Appointment Rate) - Cadence effectiveness

### Task 6.1: Create DPC Metrics Utility

**File:** `apps/ads-dashboard/client/src/lib/dpcMetrics.ts` (NEW)

```typescript
/**
 * DPC-Focused Efficiency Metrics
 * Based on ADMIRAL_UNIFIED_SALES_FRAMEWORK.md
 *
 * Philosophy: Quality-adjusted efficiency tracking, not raw dial volume
 */

// Efficiency Tiers (DPC-based, lower is better)
export const EFFICIENCY_TIERS = {
  RAMP: 'Building baseline',
  DEVELOPING: 'Developing',
  SATISFACTORY: 'Satisfactory',
  ABOVE_SATISFACTORY: 'Above Satisfactory',
  ELITE: 'Elite',
} as const;

export type EfficiencyTier = typeof EFFICIENCY_TIERS[keyof typeof EFFICIENCY_TIERS];

// Enrollment status
export type EnrollmentStatus = 'pending' | 'confirmed' | 'unconfirmed' | 'declined';

// Primary efficiency metrics
export interface DPCMetrics {
  // Core metrics
  dpe: number;               // Dials Per Enrollment (lower = better)
  ecr: number;               // Enrollment Confirmation Rate (higher = better)
  dpc: number;               // Dials Per Confirmed - PRIMARY (lower = better)
  ear: number;               // Enrollment-to-Appointment Rate (higher = better)

  // Tier assessments
  dpcTier: EfficiencyTier;
  ecrTier: 'low' | 'good' | 'high';

  // Trend
  dpcTrend: 'improving' | 'stable' | 'declining';

  // Raw counts
  rawData: {
    totalDials: number;
    totalEnrollments: number;
    confirmedEnrollments: number;
    unconfirmedEnrollments: number;
    declinedEnrollments: number;
    appointments: number;
  };

  // Ramp tracking
  isRampPeriod: boolean;
  rampProgress: number;      // X/25 confirmed to exit ramp
}

// Enrollment record
export interface EnrollmentRecord {
  id: string;
  leadId: string;
  repId: string;
  source: 'offensive' | 'passive';
  status: EnrollmentStatus;
  qualificationScore: number; // 0-100 based on fields filled
  enrolledAt: Date;
  confirmationSentAt?: Date;
  confirmedAt?: Date;
  metadata: {
    homeowner?: boolean;
    roofAge?: number;
    monthlyBill?: number;
    decisionMaker?: boolean;
  };
}

/**
 * Calculate DPE (Dials Per Enrollment)
 * Lower is better - how many dials to get one enrollment
 */
export function calculateDPE(dials: number, enrollments: number): number {
  if (enrollments === 0) return Infinity;
  return Math.round(dials / enrollments);
}

/**
 * Calculate ECR (Enrollment Confirmation Rate)
 * Higher is better - quality gate for enrollments
 */
export function calculateECR(confirmed: number, totalEnrollments: number): number {
  if (totalEnrollments === 0) return 0;
  return (confirmed / totalEnrollments) * 100;
}

/**
 * Calculate DPC (Dials Per Confirmed) - PRIMARY METRIC
 * Lower is better - quality-adjusted efficiency
 */
export function calculateDPC(dials: number, confirmedEnrollments: number): number {
  if (confirmedEnrollments === 0) return Infinity;
  return Math.round(dials / confirmedEnrollments);
}

/**
 * Calculate EAR (Enrollment-to-Appointment Rate)
 * Higher is better - cadence effectiveness
 */
export function calculateEAR(appointments: number, confirmedEnrollments: number): number {
  if (confirmedEnrollments === 0) return 0;
  return (appointments / confirmedEnrollments) * 100;
}

/**
 * Get DPC tier based on value
 * Elite: <30, Above Satisfactory: 30-45, Satisfactory: 45-70, Developing: >70
 */
export function getDPCTier(dpc: number, confirmedEnrollments: number): EfficiencyTier {
  // Ramp period: less than 25 confirmed enrollments
  if (confirmedEnrollments < 25) {
    return EFFICIENCY_TIERS.RAMP;
  }

  if (dpc < 30) return EFFICIENCY_TIERS.ELITE;
  if (dpc < 45) return EFFICIENCY_TIERS.ABOVE_SATISFACTORY;
  if (dpc < 70) return EFFICIENCY_TIERS.SATISFACTORY;
  return EFFICIENCY_TIERS.DEVELOPING;
}

/**
 * Get ECR quality level
 */
export function getECRLevel(ecr: number): 'low' | 'good' | 'high' {
  if (ecr >= 85) return 'high';
  if (ecr >= 65) return 'good';
  return 'low';
}

/**
 * Calculate qualification score based on fields filled
 */
export function calculateQualificationScore(metadata: EnrollmentRecord['metadata']): number {
  const fields = ['homeowner', 'roofAge', 'monthlyBill', 'decisionMaker'];
  const filledCount = fields.filter(field =>
    metadata[field as keyof typeof metadata] !== undefined &&
    metadata[field as keyof typeof metadata] !== null
  ).length;
  return (filledCount / fields.length) * 100;
}

/**
 * Check if rep needs coaching based on metrics
 */
export function needsCoaching(metrics: DPCMetrics, consecutiveDays: number = 1): {
  needed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (metrics.ecr < 60 && consecutiveDays >= 7) {
    reasons.push('ECR below 60% for 7+ days - review qualification technique');
  }
  if (metrics.dpc > 80 && consecutiveDays >= 7) {
    reasons.push('DPC above 80 for 7+ days - review opener/engagement');
  }
  if (metrics.rawData.confirmedEnrollments === 0 && consecutiveDays >= 2) {
    reasons.push('Zero confirmed enrollments for 2+ days - same-day shadowing needed');
  }

  return { needed: reasons.length > 0, reasons };
}

/**
 * Check if rep earned recognition
 */
export function earnedRecognition(metrics: DPCMetrics): {
  earned: boolean;
  achievements: string[];
} {
  const achievements: string[] = [];

  if (metrics.dpc < 30 && !metrics.isRampPeriod) {
    achievements.push('Elite DPC (<30) achieved');
  }
  if (metrics.ecr >= 90 && metrics.rawData.totalEnrollments >= 20) {
    achievements.push('Quality Champion - ECR 90%+ with 20+ enrollments');
  }
  if (metrics.ear >= 30) {
    achievements.push('Conversion Elite - EAR 30%+');
  }

  return { earned: achievements.length > 0, achievements };
}

/**
 * Get performance tier for Dials per Day
 * From framework: <80 ❌, 80-120 ✅, 121-150 ⭐, 150+ 🏆
 */
export function getDialsPerDayTier(dials: number): string {
  if (dials < 80) return PERFORMANCE_TIERS.UNSATISFACTORY;
  if (dials <= 120) return PERFORMANCE_TIERS.SATISFACTORY;
  if (dials <= 150) return PERFORMANCE_TIERS.ABOVE_SATISFACTORY;
  return PERFORMANCE_TIERS.ELITE;
}

/**
 * Get performance tier for Connect Rate
 * From framework: <8% ❌, 8-12% ✅, 13-18% ⭐, 18%+ 🏆
 */
export function getConnectRateTier(rate: number): string {
  if (rate < 8) return PERFORMANCE_TIERS.UNSATISFACTORY;
  if (rate <= 12) return PERFORMANCE_TIERS.SATISFACTORY;
  if (rate <= 18) return PERFORMANCE_TIERS.ABOVE_SATISFACTORY;
  return PERFORMANCE_TIERS.ELITE;
}

/**
 * Get performance tier for Sub-30s Drop Rate (LOWER is better)
 * From framework: >70% ❌, 50-70% ✅, 35-49% ⭐, <35% 🏆
 */
export function getSub30sDropRateTier(rate: number): string {
  if (rate > 70) return PERFORMANCE_TIERS.UNSATISFACTORY;
  if (rate >= 50) return PERFORMANCE_TIERS.SATISFACTORY;
  if (rate >= 35) return PERFORMANCE_TIERS.ABOVE_SATISFACTORY;
  return PERFORMANCE_TIERS.ELITE;
}

/**
 * Get performance tier for Call-to-Appointment Rate
 * From framework: <2% ❌, 2-4% ✅, 5-6% ⭐, 6.7%+ 🏆
 */
export function getCallToAppointmentTier(rate: number): string {
  if (rate < 2) return PERFORMANCE_TIERS.UNSATISFACTORY;
  if (rate <= 4) return PERFORMANCE_TIERS.SATISFACTORY;
  if (rate <= 6) return PERFORMANCE_TIERS.ABOVE_SATISFACTORY;
  return PERFORMANCE_TIERS.ELITE;
}

/**
 * Get performance tier for 2+ Min Conversation Rate
 * From framework: <15% ❌, 15-25% ✅, 26-35% ⭐, 35%+ 🏆
 */
export function getTwoMinConversationTier(rate: number): string {
  if (rate < 15) return PERFORMANCE_TIERS.UNSATISFACTORY;
  if (rate <= 25) return PERFORMANCE_TIERS.SATISFACTORY;
  if (rate <= 35) return PERFORMANCE_TIERS.ABOVE_SATISFACTORY;
  return PERFORMANCE_TIERS.ELITE;
}

/**
 * Check if coaching is automatically required
 * From framework Section 1.4
 */
export function isCoachingRequired(metrics: ActivityMetrics, consecutiveDays: number = 1): {
  required: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (metrics.sub30sDropRate > 60 && consecutiveDays >= 3) {
    reasons.push('Sub-30s Drop Rate exceeds 60% for 3+ consecutive days');
  }
  if (metrics.connectRate < 10) {
    reasons.push('Connect Rate below 10%');
  }
  if (metrics.appointmentsSet === 0 && consecutiveDays >= 2) {
    reasons.push('Zero appointments for 2+ consecutive days');
  }

  return { required: reasons.length > 0, reasons };
}

/**
 * Check if automatic recognition is triggered
 * From framework Section 1.4
 */
export function isRecognitionEarned(metrics: ActivityMetrics & OutcomeMetrics, weeklyData?: any): {
  earned: boolean;
  achievements: string[];
} {
  const achievements: string[] = [];

  if (metrics.callToAppointmentRate > 5) {
    achievements.push('Call-to-Appointment Rate exceeds 5%');
  }
  if (weeklyData?.appointmentsThisWeek >= 15) {
    achievements.push('15+ appointments set this week');
  }
  if (weeklyData?.appointmentShowRate === 100) {
    achievements.push('100% appointment show rate this week');
  }

  return { earned: achievements.length > 0, achievements };
}
```

### Task 6.2: Create SalesMetricsPanel Component

**File:** `apps/ads-dashboard/client/src/components/SalesMetricsPanel.tsx` (NEW)

```typescript
/**
 * SalesMetricsPanel - Displays real-time sales metrics during dialer session
 * Based on ADMIRAL_SALES_OPERATIVE_FRAMEWORK.md
 */
import { Card, Statistic, Row, Col, Progress, Tag, Tooltip, Typography } from "antd";
import {
  PhoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  WarningOutlined
} from "@ant-design/icons";
import {
  ActivityMetrics,
  getDialsPerDayTier,
  getConnectRateTier,
  getSub30sDropRateTier,
  getCallToAppointmentTier,
  getTwoMinConversationTier,
} from "../lib/salesMetrics";

const { Text } = Typography;

interface SalesMetricsPanelProps {
  metrics: ActivityMetrics;
  sessionDuration: number; // minutes
  compact?: boolean;
}

export function SalesMetricsPanel({ metrics, sessionDuration, compact = false }: SalesMetricsPanelProps) {
  const dialsPerHour = sessionDuration > 0
    ? Math.round((metrics.dialsPerDay / sessionDuration) * 60)
    : 0;

  const MetricCard = ({
    title,
    value,
    suffix,
    tier,
    tooltip
  }: {
    title: string;
    value: number;
    suffix?: string;
    tier: string;
    tooltip: string;
  }) => (
    <Tooltip title={tooltip}>
      <Card size="small" style={{ background: "#0f3654", borderColor: "#1a4a6e" }}>
        <Statistic
          title={<Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>{title}</Text>}
          value={value}
          suffix={suffix}
          valueStyle={{ color: "#fff", fontSize: compact ? 18 : 24 }}
          prefix={<span style={{ marginRight: 8 }}>{tier}</span>}
        />
      </Card>
    </Tooltip>
  );

  if (compact) {
    // Single row for embedding in dialer
    return (
      <div style={{
        display: "flex",
        gap: 8,
        padding: 8,
        background: "#0c2f4a",
        borderRadius: 8,
        marginBottom: 8
      }}>
        <Tag color="blue">
          <PhoneOutlined /> {metrics.dialsPerDay} dials
        </Tag>
        <Tag color={metrics.connectRate >= 8 ? "green" : "orange"}>
          {metrics.connectRate.toFixed(1)}% connect
        </Tag>
        <Tag color={metrics.sub30sDropRate < 50 ? "green" : "red"}>
          {metrics.sub30sDropRate.toFixed(1)}% drop
        </Tag>
        <Tag color="gold">
          {metrics.appointmentsSet} appts
        </Tag>
        <Tag>
          {dialsPerHour}/hr
        </Tag>
      </div>
    );
  }

  // Full panel for dashboard or expanded view
  return (
    <Card
      title="Session Metrics"
      style={{ background: "#0c2f4a", marginBottom: 16 }}
      extra={<Text style={{ color: "rgba(255,255,255,0.5)" }}>
        Session: {Math.floor(sessionDuration / 60)}h {sessionDuration % 60}m
      </Text>}
    >
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <MetricCard
            title="Dials Today"
            value={metrics.dialsPerDay}
            tier={getDialsPerDayTier(metrics.dialsPerDay)}
            tooltip="Target: 80-120 for Satisfactory, 150+ for Elite"
          />
        </Col>
        <Col span={6}>
          <MetricCard
            title="Connect Rate"
            value={parseFloat(metrics.connectRate.toFixed(1))}
            suffix="%"
            tier={getConnectRateTier(metrics.connectRate)}
            tooltip="% of dials answered. Target: 8-12% Satisfactory, 18%+ Elite"
          />
        </Col>
        <Col span={6}>
          <MetricCard
            title="Sub-30s Drop"
            value={parseFloat(metrics.sub30sDropRate.toFixed(1))}
            suffix="%"
            tier={getSub30sDropRateTier(metrics.sub30sDropRate)}
            tooltip="% of calls under 30 seconds (opener failures). Lower is better."
          />
        </Col>
        <Col span={6}>
          <MetricCard
            title="2+ Min Conversations"
            value={parseFloat(metrics.twoMinConversationRate.toFixed(1))}
            suffix="%"
            tier={getTwoMinConversationTier(metrics.twoMinConversationRate)}
            tooltip="% of connects exceeding 2 minutes. Target: 35%+ for Elite"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card size="small" style={{ background: "#0f3654" }}>
            <Statistic
              title={<Text style={{ color: "rgba(255,255,255,0.65)" }}>Dials/Hour</Text>}
              value={dialsPerHour}
              valueStyle={{ color: "#00ffff" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: "#0f3654" }}>
            <Statistic
              title={<Text style={{ color: "rgba(255,255,255,0.65)" }}>Appointments Set</Text>}
              value={metrics.appointmentsSet}
              valueStyle={{ color: "#c9a648" }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: "#0f3654" }}>
            <Statistic
              title={<Text style={{ color: "rgba(255,255,255,0.65)" }}>Call-to-Appt Rate</Text>}
              value={metrics.connectRate > 0
                ? ((metrics.appointmentsSet / (metrics.dialsPerDay * metrics.connectRate / 100)) * 100).toFixed(1)
                : 0}
              suffix="%"
              valueStyle={{ color: "#52c41a" }}
              prefix={getCallToAppointmentTier(
                metrics.connectRate > 0
                  ? (metrics.appointmentsSet / (metrics.dialsPerDay * metrics.connectRate / 100)) * 100
                  : 0
              )}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
```

### Task 6.3: Create useSessionMetrics Hook

**File:** `apps/ads-dashboard/client/src/hooks/useSessionMetrics.ts` (NEW)

```typescript
/**
 * useSessionMetrics - Tracks real-time sales metrics during dialer session
 */
import { useState, useCallback, useEffect } from "react";
import { ActivityMetrics } from "../lib/salesMetrics";

interface CallRecord {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  disposition?: string;
  answered: boolean;
}

export function useSessionMetrics() {
  const [sessionStart] = useState<Date>(new Date());
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [appointmentsSet, setAppointmentsSet] = useState(0);

  // Calculate derived metrics
  const getMetrics = useCallback((): ActivityMetrics => {
    const totalDials = calls.length;
    const answeredCalls = calls.filter(c => c.answered).length;
    const shortCalls = calls.filter(c => c.answered && c.duration < 30).length;
    const longCalls = calls.filter(c => c.answered && c.duration >= 120).length;

    return {
      dialsPerDay: totalDials,
      dialsPerHour: 0, // Calculated in component based on session duration
      connectRate: totalDials > 0 ? (answeredCalls / totalDials) * 100 : 0,
      sub30sDropRate: answeredCalls > 0 ? (shortCalls / answeredCalls) * 100 : 0,
      twoMinConversationRate: answeredCalls > 0 ? (longCalls / answeredCalls) * 100 : 0,
      appointmentsSet,
    };
  }, [calls, appointmentsSet]);

  // Record a new dial
  const recordDial = useCallback((callId: string) => {
    setCalls(prev => [...prev, {
      id: callId,
      startTime: new Date(),
      duration: 0,
      answered: false,
    }]);
  }, []);

  // Update call when answered
  const recordAnswer = useCallback((callId: string) => {
    setCalls(prev => prev.map(c =>
      c.id === callId ? { ...c, answered: true } : c
    ));
  }, []);

  // End call with duration
  const endCall = useCallback((callId: string, disposition?: string) => {
    setCalls(prev => prev.map(c => {
      if (c.id === callId) {
        const endTime = new Date();
        const duration = (endTime.getTime() - c.startTime.getTime()) / 1000;
        return { ...c, endTime, duration, disposition };
      }
      return c;
    }));
  }, []);

  // Record appointment set
  const recordAppointment = useCallback(() => {
    setAppointmentsSet(prev => prev + 1);
  }, []);

  // Get session duration in minutes
  const getSessionDuration = useCallback(() => {
    return Math.floor((new Date().getTime() - sessionStart.getTime()) / 60000);
  }, [sessionStart]);

  return {
    metrics: getMetrics(),
    sessionStart,
    sessionDuration: getSessionDuration(),
    recordDial,
    recordAnswer,
    endCall,
    recordAppointment,
    totalCalls: calls.length,
  };
}
```

### Task 6.4: Integrate Metrics into Dialer

**File:** `apps/ads-dashboard/client/src/pages/dialer.tsx`

Add metrics tracking to the dialer:

```typescript
import { useSessionMetrics } from "../hooks/useSessionMetrics";
import { SalesMetricsPanel } from "../components/SalesMetricsPanel";

// In the component:
const {
  metrics,
  sessionDuration,
  recordDial,
  recordAnswer,
  endCall,
  recordAppointment
} = useSessionMetrics();

// When initiating a call:
const handleDial = (phoneNumber: string) => {
  const callId = `call-${Date.now()}`;
  recordDial(callId);
  // ... existing dial logic
};

// When call is answered:
const handleCallAnswered = () => {
  recordAnswer(currentCallId);
};

// When call ends:
const handleCallEnd = (disposition: string) => {
  endCall(currentCallId, disposition);
  if (disposition === 'APPOINTMENT') {
    recordAppointment();
  }
};

// In the JSX - add compact metrics bar at top of dialer:
<SalesMetricsPanel
  metrics={metrics}
  sessionDuration={sessionDuration}
  compact={true}
/>
```

### Task 6.5: Add Metrics to Dashboard

**File:** `apps/ads-dashboard/client/src/pages/dashboard.tsx`

Show daily/weekly metrics summary on dashboard:

```typescript
import { SalesMetricsPanel } from "../components/SalesMetricsPanel";

// Fetch today's metrics from Twenty CRM callRecords
const [todayMetrics, setTodayMetrics] = useState<ActivityMetrics | null>(null);

useEffect(() => {
  async function loadTodayMetrics() {
    // Query Twenty CRM for today's call records
    // Aggregate into ActivityMetrics
  }
  loadTodayMetrics();
}, []);

// In JSX - after stats cards:
{todayMetrics && (
  <SalesMetricsPanel
    metrics={todayMetrics}
    sessionDuration={0} // Not a live session
    compact={false}
  />
)}
```

---

## Verification Commands

```bash
# Build to check for TypeScript errors
cd apps/ads-dashboard && npm run build

# Start dev server and verify:
# 1. Only 4 nav items show
# 2. Dashboard has leaderboard + progression
# 3. Leads has CRM tabs
# 4. Dialer has History + Chat tabs
# 5. No blank fields displayed anywhere
npm run dev
```

---

## Rollback

If issues arise:
1. Navigation changes: Revert App.tsx menuItems array
2. Component extractions: Keep original pages intact until verified
3. Full rollback: `git checkout HEAD~1 -- apps/ads-dashboard/`

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Navigation tabs | 10 | 4 |
| Pages to view call history | 2 (nav + click) | 1 (tab in dialer) |
| Pages to chat with team | 2 | 1 (tab in dialer) |
| Blank fields visible | Yes | No |
| Leaderboard visibility | Separate page | Dashboard (first view) |

---

*Created: December 29, 2025*
*Completed: December 30, 2025*
*Status: ✅ ALL PHASES COMPLETE*

---

## Completion Summary

| Phase | Description | Status | Date |
|-------|-------------|--------|------|
| Phase 1 | Smart Field Display (Multi-Channel) | ✅ COMPLETE | Dec 30, 2025 |
| Phase 2 | Dashboard Enhancement | ✅ COMPLETE | Dec 30, 2025 |
| Phase 3 | Leads Enhancement (CRM Merge) | ✅ COMPLETE | Dec 30, 2025 |
| Phase 4 | Dialer Enhancement (History + Chat) | ✅ COMPLETE | Dec 30, 2025 |
| Phase 5 | Navigation Cleanup | ✅ COMPLETE | Dec 30, 2025 |
| Phase 6 | DPC-Focused Efficiency Metrics | ✅ COMPLETE | Dec 29, 2025 |

**QA Fix Applied:** Dec 30, 2025 - ECR tier gates updated to strict framework compliance
