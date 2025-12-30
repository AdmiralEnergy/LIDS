/**
 * CallHistoryPanel.tsx - Embeddable call history component
 *
 * Extracted from pages/call-history.tsx for use in Dialer panel.
 * Shows recent calls with disposition, duration, and actions.
 */

import { useState, useEffect, useMemo } from "react";
import { Typography, Table, Tag, Space, Select, Button, Input, Empty, Tooltip, Spin } from "antd";
import {
  PhoneOutlined,
  SearchOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getSettings, getTwentyCrmUrl } from "../lib/settings";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

interface CallRecord {
  id: string;
  disposition: string;
  duration: string;
  durationSeconds: number;
  leadName: string;
  leadId: string;
  phoneNumber?: string;
  createdAt: Date;
  rawTitle: string;
}

interface TwentyNote {
  id: string;
  title?: string;
  createdAt?: string;
  person?: {
    id: string;
    name?: { firstName?: string; lastName?: string };
    phones?: { primaryPhoneNumber?: string };
    cell1?: string;
    phone1?: string;
  };
}

interface CallHistoryPanelProps {
  /** Optional rep ID to filter calls */
  repId?: string;
  /** Compact mode for embedding */
  compact?: boolean;
  /** Max entries to show */
  maxEntries?: number;
  /** Callback when call button is clicked */
  onCallPhone?: (phone: string, leadName: string) => void;
}

const DISPOSITION_COLORS: Record<string, string> = {
  "CONTACTED": "#52c41a",
  "NO ANSWER": "#ff7875",
  "VOICEMAIL": "#faad14",
  "CALLBACK": "#1890ff",
  "NOT INTERESTED": "#ff4d4f",
  "APPOINTMENT": "#c9a648",
  "BUSY": "#fa8c16",
  "WRONG NUMBER": "#8c8c8c",
  "DNC": "#ff0000",
  "DISCONNECTED": "#595959",
};

const TIMEFRAME_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "all", label: "All Time" },
];

function parseCallNote(note: TwentyNote): CallRecord | null {
  if (!note.title?.startsWith("Call -")) return null;

  const parts = note.title.replace("Call - ", "").split(" | ");
  if (parts.length < 2) return null;

  const disposition = parts[0]?.trim() || "UNKNOWN";
  const duration = parts[1]?.trim() || "0:00";
  const leadName = parts[2]?.trim() ||
    (note.person?.name ? `${note.person.name.firstName || ""} ${note.person.name.lastName || ""}`.trim() : "Unknown");

  const [minutes, seconds] = duration.split(":").map(Number);
  const durationSeconds = (minutes || 0) * 60 + (seconds || 0);

  const phoneNumber = note.person?.phones?.primaryPhoneNumber || note.person?.cell1 || note.person?.phone1;

  return {
    id: note.id,
    disposition,
    duration,
    durationSeconds,
    leadName,
    leadId: note.person?.id || "",
    phoneNumber,
    createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
    rawTitle: note.title,
  };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function CallHistoryPanel({
  repId,
  compact = false,
  maxEntries = compact ? 10 : 20,
  onCallPhone,
}: CallHistoryPanelProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("today");
  const [searchText, setSearchText] = useState<string>("");

  const fetchCalls = async () => {
    setLoading(true);
    setError(null);

    try {
      const settings = getSettings();
      const apiUrl = getTwentyCrmUrl();

      if (!apiUrl || !settings.twentyApiKey) {
        throw new Error("Twenty CRM not configured");
      }

      const query = `
        query GetCallNotes($first: Int) {
          notes(first: $first, orderBy: { createdAt: DESC }) {
            edges {
              node {
                id
                title
                createdAt
                person {
                  id
                  name { firstName lastName }
                  phones { primaryPhoneNumber }
                  cell1
                  phone1
                }
              }
            }
          }
        }
      `;

      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.twentyApiKey}`,
        },
        body: JSON.stringify({ query, variables: { first: 200 } }),
      });

      const result = await response.json();
      if (result.errors) throw new Error(result.errors[0]?.message || "GraphQL error");

      const notes = result.data?.notes?.edges || [];
      const callRecords: CallRecord[] = [];

      for (const edge of notes) {
        const record = parseCallNote(edge.node);
        if (record) callRecords.push(record);
      }

      setCalls(callRecords);
    } catch (err) {
      console.error("[CallHistoryPanel] Failed to fetch calls:", err);
      setError(err instanceof Error ? err.message : "Failed to load call history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  // Filter by timeframe
  const filteredByTime = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    return calls.filter((call) => {
      switch (timeframe) {
        case "today": return call.createdAt >= todayStart;
        case "week": return call.createdAt >= weekStart;
        default: return true;
      }
    });
  }, [calls, timeframe]);

  // Filter by search
  const filteredCalls = useMemo(() => {
    if (!searchText.trim()) return filteredByTime.slice(0, maxEntries);
    const search = searchText.toLowerCase();
    return filteredByTime.filter(
      (call) =>
        call.leadName.toLowerCase().includes(search) ||
        call.phoneNumber?.includes(search) ||
        call.disposition.toLowerCase().includes(search)
    ).slice(0, maxEntries);
  }, [filteredByTime, searchText, maxEntries]);

  const columns: ColumnsType<CallRecord> = compact ? [
    {
      title: "Contact",
      dataIndex: "leadName",
      key: "leadName",
      render: (name: string) => (
        <Text style={{ color: "#fff", fontWeight: 500, fontSize: 12 }}>{name}</Text>
      ),
    },
    {
      title: "Disposition",
      dataIndex: "disposition",
      key: "disposition",
      width: 100,
      render: (disposition: string) => (
        <Tag
          style={{
            background: `${DISPOSITION_COLORS[disposition] || "#595959"}20`,
            border: "none",
            color: DISPOSITION_COLORS[disposition] || "#595959",
            borderRadius: 4,
            fontSize: 10,
          }}
        >
          {disposition}
        </Tag>
      ),
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 80,
      render: (date: Date) => (
        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
          {formatTimeAgo(date)}
        </Text>
      ),
    },
  ] : [
    {
      title: "Contact",
      dataIndex: "leadName",
      key: "leadName",
      render: (name: string, record: CallRecord) => (
        <div>
          <div style={{ color: "#fff", fontWeight: 500 }}>{name}</div>
          {record.phoneNumber && (
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              {record.phoneNumber}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Disposition",
      dataIndex: "disposition",
      key: "disposition",
      render: (disposition: string) => (
        <Tag
          style={{
            background: `${DISPOSITION_COLORS[disposition] || "#595959"}20`,
            border: "none",
            color: DISPOSITION_COLORS[disposition] || "#595959",
            borderRadius: 4,
          }}
        >
          {disposition}
        </Tag>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      width: 80,
      render: (duration: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }} />
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{duration}</Text>
        </Space>
      ),
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      render: (date: Date) => (
        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
          {formatTimeAgo(date)}
        </Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_: unknown, record: CallRecord) => record.phoneNumber ? (
        <Tooltip title="Call again">
          <Button
            type="text"
            size="small"
            icon={<PhoneOutlined />}
            onClick={() => {
              if (onCallPhone) {
                onCallPhone(record.phoneNumber!, record.leadName);
              } else {
                window.location.href = `tel:${record.phoneNumber}`;
              }
            }}
            style={{ color: "#00ffff" }}
          />
        </Tooltip>
      ) : null,
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: compact ? 24 : 48 }}>
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <Empty
        description={<Text style={{ color: "rgba(255,255,255,0.45)" }}>{error}</Text>}
        style={{ padding: compact ? 24 : 48 }}
      />
    );
  }

  return (
    <div>
      {!compact && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <Select
            value={timeframe}
            onChange={setTimeframe}
            options={TIMEFRAME_OPTIONS}
            style={{ width: 120 }}
            size="small"
          />
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined style={{ color: "rgba(255,255,255,0.25)" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 180 }}
            size="small"
            allowClear
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchCalls}
            size="small"
            style={{ marginLeft: "auto" }}
          >
            Refresh
          </Button>
        </div>
      )}

      {filteredCalls.length === 0 ? (
        <Empty
          description={<Text style={{ color: "rgba(255,255,255,0.5)" }}>No calls found</Text>}
          style={{ padding: compact ? 24 : 48 }}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredCalls}
          rowKey="id"
          pagination={false}
          size="small"
          style={{ background: "transparent" }}
        />
      )}
    </div>
  );
}

export default CallHistoryPanel;
