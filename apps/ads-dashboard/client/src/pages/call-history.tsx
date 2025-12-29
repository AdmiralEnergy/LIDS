import { useState, useEffect, useMemo } from "react";
import { Typography, Table, Tag, Space, Select, Button, Input, Empty, Tooltip } from "antd";
import {
  PhoneOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getSettings, getTwentyCrmUrl } from "../lib/settings";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

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
    name?: {
      firstName?: string;
      lastName?: string;
    };
    phones?: {
      primaryPhoneNumber?: string;
    };
    cell1?: string;
    phone1?: string;
  };
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
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

const DISPOSITION_OPTIONS = [
  { value: "all", label: "All Dispositions" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "NO ANSWER", label: "No Answer" },
  { value: "VOICEMAIL", label: "Voicemail" },
  { value: "CALLBACK", label: "Callback" },
  { value: "APPOINTMENT", label: "Appointment" },
  { value: "NOT INTERESTED", label: "Not Interested" },
  { value: "BUSY", label: "Busy" },
  { value: "WRONG NUMBER", label: "Wrong Number" },
  { value: "DNC", label: "DNC" },
  { value: "DISCONNECTED", label: "Disconnected" },
];

function parseCallNote(note: TwentyNote): CallRecord | null {
  if (!note.title?.startsWith("Call -")) {
    return null;
  }

  // Format: "Call - DISPOSITION | M:SS | Lead Name"
  const parts = note.title.replace("Call - ", "").split(" | ");

  if (parts.length < 2) {
    return null;
  }

  const disposition = parts[0]?.trim() || "UNKNOWN";
  const duration = parts[1]?.trim() || "0:00";
  const leadName = parts[2]?.trim() ||
    (note.person?.name ? `${note.person.name.firstName || ""} ${note.person.name.lastName || ""}`.trim() : "Unknown");

  // Parse duration to seconds
  const [minutes, seconds] = duration.split(":").map(Number);
  const durationSeconds = (minutes || 0) * 60 + (seconds || 0);

  // Get phone number from person
  const phoneNumber = note.person?.phones?.primaryPhoneNumber ||
    note.person?.cell1 ||
    note.person?.phone1;

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

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function CallHistoryPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("today");
  const [dispositionFilter, setDispositionFilter] = useState<string>("all");
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

      // Query notes with person details including phone numbers
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
                  name {
                    firstName
                    lastName
                  }
                  phones {
                    primaryPhoneNumber
                  }
                  cell1
                  phone1
                }
              }
            }
            totalCount
          }
        }
      `;

      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.twentyApiKey}`,
        },
        body: JSON.stringify({ query, variables: { first: 500 } }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }

      const notes = result.data?.notes?.edges || [];
      const callRecords: CallRecord[] = [];

      for (const edge of notes) {
        const record = parseCallNote(edge.node);
        if (record) {
          callRecords.push(record);
        }
      }

      setCalls(callRecords);
    } catch (err) {
      console.error("[CallHistory] Failed to fetch calls:", err);
      setError(err instanceof Error ? err.message : "Failed to load call history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  // Filter calls by timeframe
  const filteredByTime = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return calls.filter((call) => {
      switch (timeframe) {
        case "today":
          return call.createdAt >= todayStart;
        case "week":
          return call.createdAt >= weekStart;
        case "month":
          return call.createdAt >= monthStart;
        default:
          return true;
      }
    });
  }, [calls, timeframe]);

  // Filter by disposition
  const filteredByDisposition = useMemo(() => {
    if (dispositionFilter === "all") return filteredByTime;
    return filteredByTime.filter((call) => call.disposition === dispositionFilter);
  }, [filteredByTime, dispositionFilter]);

  // Filter by search text
  const filteredCalls = useMemo(() => {
    if (!searchText.trim()) return filteredByDisposition;
    const search = searchText.toLowerCase();
    return filteredByDisposition.filter(
      (call) =>
        call.leadName.toLowerCase().includes(search) ||
        call.phoneNumber?.includes(search) ||
        call.disposition.toLowerCase().includes(search)
    );
  }, [filteredByDisposition, searchText]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCalls = filteredCalls.length;
    const totalDuration = filteredCalls.reduce((acc, call) => acc + call.durationSeconds, 0);
    const contacted = filteredCalls.filter((c) => c.disposition === "CONTACTED").length;
    const appointments = filteredCalls.filter((c) => c.disposition === "APPOINTMENT").length;

    return {
      totalCalls,
      totalDuration: `${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toString().padStart(2, "0")}`,
      contacted,
      appointments,
      connectRate: totalCalls > 0 ? ((contacted / totalCalls) * 100).toFixed(1) : "0",
    };
  }, [filteredCalls]);

  const columns: ColumnsType<CallRecord> = [
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
      render: (duration: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: "rgba(255,255,255,0.45)" }} />
          <Text style={{ color: "rgba(255,255,255,0.75)" }}>{duration}</Text>
        </Space>
      ),
      sorter: (a, b) => a.durationSeconds - b.durationSeconds,
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: Date) => (
        <Tooltip title={formatDateTime(date)}>
          <Text style={{ color: "rgba(255,255,255,0.45)" }}>{formatTimeAgo(date)}</Text>
        </Tooltip>
      ),
      sorter: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      defaultSortOrder: "ascend",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: CallRecord) => (
        <Space>
          {record.phoneNumber && (
            <Tooltip title="Call again">
              <Button
                type="text"
                size="small"
                icon={<PhoneOutlined />}
                onClick={() => {
                  window.location.href = `tel:${record.phoneNumber}`;
                }}
                style={{ color: "#00ffff" }}
              />
            </Tooltip>
          )}
          {record.leadId && (
            <Tooltip title="View lead">
              <Button
                type="text"
                size="small"
                icon={<UserOutlined />}
                onClick={() => {
                  window.location.href = `/crm?leadId=${record.leadId}`;
                }}
                style={{ color: "#c9a648" }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2} style={{ color: "#fff", margin: 0 }}>
          <PhoneOutlined style={{ marginRight: 12, color: "#c9a648" }} />
          Call History
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchCalls}
          loading={loading}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ background: "#0f3654", padding: 16, borderRadius: 8 }}>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Total Calls</Text>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: 600 }}>{stats.totalCalls}</div>
        </div>
        <div style={{ background: "#0f3654", padding: 16, borderRadius: 8 }}>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Total Time</Text>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: 600 }}>{stats.totalDuration}</div>
        </div>
        <div style={{ background: "#0f3654", padding: 16, borderRadius: 8 }}>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Contacted</Text>
          <div style={{ color: "#52c41a", fontSize: 24, fontWeight: 600 }}>{stats.contacted}</div>
        </div>
        <div style={{ background: "#0f3654", padding: 16, borderRadius: 8 }}>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Connect Rate</Text>
          <div style={{ color: "#c9a648", fontSize: 24, fontWeight: 600 }}>{stats.connectRate}%</div>
        </div>
      </div>

      {/* Filters Row */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <Select
          value={timeframe}
          onChange={setTimeframe}
          options={TIMEFRAME_OPTIONS}
          style={{ width: 140 }}
          suffixIcon={<CalendarOutlined />}
        />
        <Select
          value={dispositionFilter}
          onChange={setDispositionFilter}
          options={DISPOSITION_OPTIONS}
          style={{ width: 180 }}
        />
        <Input
          placeholder="Search by name or phone..."
          prefix={<SearchOutlined style={{ color: "rgba(255,255,255,0.25)" }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
          allowClear
        />
      </div>

      {/* Table */}
      {error ? (
        <div style={{ textAlign: "center", padding: 64 }}>
          <Text style={{ color: "#ff4d4f" }}>{error}</Text>
          <br />
          <Button type="link" onClick={fetchCalls}>
            Try Again
          </Button>
        </div>
      ) : filteredCalls.length === 0 && !loading ? (
        <Empty
          description={<Text style={{ color: "rgba(255,255,255,0.5)" }}>No calls found</Text>}
          style={{ padding: 64 }}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredCalls}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `${total} calls`,
          }}
          style={{
            background: "rgba(10, 10, 10, 0.6)",
            borderRadius: 8,
          }}
        />
      )}
    </div>
  );
}
