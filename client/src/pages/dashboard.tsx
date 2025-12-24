import { useState, useEffect } from "react";
import { Card, Statistic, Row, Col, Progress, Typography, Space, Spin, Empty, Tag } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  RiseOutlined,
  DollarOutlined,
  ApiOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";
import { getLeadsStats, getLeadsByStage, getConnectionStatus } from "../providers/twentyDataProvider";
import type { Lead } from "@shared/schema";
import { PlayerCard } from "../features/progression";

const { Title, Text } = Typography;

interface PipelineStage {
  stage: string;
  count: number;
  percent: number;
  color: string;
}

export function DashboardPage() {
  const [stats, setStats] = useState({ totalLeads: 0, callsToday: 0, conversionRate: 0, pipelineValue: 0 });
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false, error: null as string | null });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [statsData, stageData] = await Promise.all([
          getLeadsStats(),
          getLeadsByStage(),
        ]);
        
        setStats(statsData);
        setConnectionStatus(getConnectionStatus());
        
        const stageColors: Record<string, string> = {
          new: "#1890ff",
          contacted: "#722ed1",
          qualified: "#c9a648",
          proposal: "#13c2c2",
          won: "#52c41a",
          lost: "#ff4d4f",
        };
        
        const stageLabels: Record<string, string> = {
          new: "New",
          contacted: "Contacted",
          qualified: "Qualified",
          proposal: "Proposal",
          won: "Won",
          lost: "Lost",
        };
        
        const totalLeads = Object.values(stageData).reduce((sum: number, leads: Lead[]) => sum + leads.length, 0);
        
        const pipeline = Object.entries(stageData).map(([stage, leads]) => ({
          stage: stageLabels[stage] || stage,
          count: (leads as Lead[]).length,
          percent: totalLeads > 0 ? Math.round(((leads as Lead[]).length / totalLeads) * 100) : 0,
          color: stageColors[stage] || "#666",
        }));
        
        setPipelineData(pipeline);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: <UserOutlined style={{ fontSize: 24, color: "#c9a648" }} />,
      suffix: "",
    },
    {
      title: "Calls Today",
      value: stats.callsToday,
      icon: <PhoneOutlined style={{ fontSize: 24, color: "#c9a648" }} />,
      suffix: "",
    },
    {
      title: "Conversion Rate",
      value: stats.conversionRate,
      icon: <RiseOutlined style={{ fontSize: 24, color: "#c9a648" }} />,
      suffix: "%",
    },
    {
      title: "Pipeline Value",
      value: stats.pipelineValue,
      icon: <DollarOutlined style={{ fontSize: 24, color: "#c9a648" }} />,
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

  const hasData = connectionStatus.isConnected && stats.totalLeads > 0;

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
          {connectionStatus.isConnected ? "Connected to Twenty" : "Not Connected"}
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
            {pipelineData.length > 0 && hasData ? (
              <Space direction="vertical" size={20} style={{ width: "100%" }}>
                {pipelineData.map((item) => (
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
                        {item.count} {item.count === 1 ? "lead" : "leads"}
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
            ) : (
              <Empty
                description={
                  <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                    {connectionStatus.isConnected 
                      ? "No leads in pipeline. Import leads or add them via Twenty CRM."
                      : "Connect to Twenty CRM in Settings to view pipeline data."}
                  </Text>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
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
            <Empty
              description={
                <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                  {connectionStatus.isConnected 
                    ? "No recent activity. Activities will appear here after making calls, sending emails, or logging notes."
                    : "Connect to Twenty CRM in Settings to view recent activity."}
                </Text>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        <Col xs={24} lg={12}>
          <PlayerCard />
        </Col>
      </Row>
    </div>
  );
}
