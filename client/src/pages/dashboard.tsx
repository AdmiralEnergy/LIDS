import { useState, useEffect } from "react";
import { Card, Statistic, Row, Col, Progress, Typography, Space, Spin, Alert, Tag } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  RiseOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ApiOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";
import { getLeadsStats, getConnectionStatus } from "../providers/twentyDataProvider";

const { Title, Text } = Typography;

export function DashboardPage() {
  const [stats, setStats] = useState({ totalLeads: 0, callsToday: 0, conversionRate: 0, pipelineValue: 0 });
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false, error: null as string | null });

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const data = await getLeadsStats();
        setStats(data);
        setConnectionStatus(getConnectionStatus());
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: <UserOutlined style={{ fontSize: 24, color: "#c9a648" }} />,
      trend: "+12%",
      trendUp: true,
      suffix: "",
    },
    {
      title: "Calls Today",
      value: stats.callsToday,
      icon: <PhoneOutlined style={{ fontSize: 24, color: "#c9a648" }} />,
      trend: "+3",
      trendUp: true,
      suffix: "",
    },
    {
      title: "Conversion Rate",
      value: stats.conversionRate,
      icon: <RiseOutlined style={{ fontSize: 24, color: "#c9a648" }} />,
      trend: "+5%",
      trendUp: true,
      suffix: "%",
    },
    {
      title: "Pipeline Value",
      value: stats.pipelineValue,
      icon: <DollarOutlined style={{ fontSize: 24, color: "#c9a648" }} />,
      trend: "+$25K",
      trendUp: true,
      prefix: "$",
      formatter: (val: number) => val.toLocaleString(),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <Spin size="large" />
        <Text style={{ color: "rgba(255,255,255,0.65)", display: "block", marginTop: 16 }}>
          Loading dashboard...
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <Title level={2} style={{ color: "#fff", margin: 0 }}>
          Dashboard Overview
        </Title>
        <Tag
          icon={connectionStatus.isConnected ? <ApiOutlined /> : <DisconnectOutlined />}
          color={connectionStatus.isConnected ? "success" : "default"}
          style={{ fontSize: 12 }}
        >
          {connectionStatus.isConnected ? "Connected to Twenty" : "Using Sample Data"}
        </Tag>
      </div>

      <Row gutter={[24, 24]}>
        {statCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                background: "linear-gradient(135deg, #0f3654 0%, #0c2f4a 100%)",
                borderRadius: 12,
                height: "100%",
              }}
              styles={{ body: { padding: 24 } }}
            >
              <Space
                direction="vertical"
                size={16}
                style={{ width: "100%" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "rgba(201, 166, 72, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: stat.trendUp ? "#52c41a" : "#ff4d4f",
                      fontSize: 14,
                    }}
                  >
                    <ArrowUpOutlined />
                    <span>{stat.trend}</span>
                  </div>
                </div>
                <div>
                  <Statistic
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    formatter={stat.formatter ? (val) => stat.formatter(val as number) : undefined}
                    valueStyle={{
                      color: "#fff",
                      fontSize: 32,
                      fontWeight: 600,
                    }}
                  />
                  <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                    {stat.title}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ color: "#fff" }}>Pipeline Overview</span>
            }
            style={{
              background: "#0f3654",
              borderRadius: 12,
            }}
            styles={{
              header: { borderBottom: "1px solid rgba(255,255,255,0.12)" },
              body: { padding: 24 },
            }}
          >
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              {[
                { stage: "New", count: 2, percent: 20, color: "#1890ff" },
                { stage: "Contacted", count: 2, percent: 20, color: "#722ed1" },
                { stage: "Qualified", count: 2, percent: 20, color: "#c9a648" },
                { stage: "Proposal", count: 2, percent: 20, color: "#13c2c2" },
                { stage: "Won", count: 1, percent: 10, color: "#52c41a" },
                { stage: "Lost", count: 1, percent: 10, color: "#ff4d4f" },
              ].map((item) => (
                <div key={item.stage}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                      {item.stage}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.65)" }}>
                      {item.count} leads
                    </Text>
                  </div>
                  <Progress
                    percent={item.percent}
                    showInfo={false}
                    strokeColor={item.color}
                    trailColor="rgba(255,255,255,0.1)"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ color: "#fff" }}>Recent Activity</span>
            }
            style={{
              background: "#0f3654",
              borderRadius: 12,
            }}
            styles={{
              header: { borderBottom: "1px solid rgba(255,255,255,0.12)" },
              body: { padding: 24 },
            }}
          >
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              {[
                {
                  action: "Call completed",
                  lead: "Sarah Johnson",
                  time: "10 minutes ago",
                  type: "call",
                },
                {
                  action: "Email sent",
                  lead: "Michael Chen",
                  time: "1 hour ago",
                  type: "email",
                },
                {
                  action: "Meeting scheduled",
                  lead: "David Kim",
                  time: "2 hours ago",
                  type: "meeting",
                },
                {
                  action: "Lead qualified",
                  lead: "Robert Martinez",
                  time: "3 hours ago",
                  type: "status",
                },
                {
                  action: "Note added",
                  lead: "Amanda Foster",
                  time: "5 hours ago",
                  type: "note",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#c9a648",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", display: "block" }}>
                      {activity.action}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                      {activity.lead}
                    </Text>
                  </div>
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                    {activity.time}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
