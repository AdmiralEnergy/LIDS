import { useState, useEffect } from "react";
import { Card, Statistic, Row, Col, Progress, Typography, Space, Spin, Empty, Tag } from "antd";
import { motion } from "framer-motion";
import {
  UserOutlined,
  PhoneOutlined,
  RiseOutlined,
  DollarOutlined,
  ApiOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { getLeadsStats, getLeadsByStage, getConnectionStatus } from "../providers/twentyDataProvider";
import type { Lead } from "@shared/schema";
import { PlayerCard, SpecializationDisplay } from "../features/progression";
import { PageHeader } from "../components/ui/PageHeader";
import { ScanningLoader } from "../components/ui/ScanningLoader";

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

  const { result: activitiesResult, query: activitiesQuery } = useList({
    resource: "activities",
    pagination: { pageSize: 5 },
    sorters: [{ field: "createdAt", order: "desc" }],
  });

  const recentActivities = activitiesResult?.data || [];
  const activitiesLoading = activitiesQuery.isLoading;

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
      icon: <UserOutlined style={{ fontSize: 24, color: "#00ffff" }} />,
      suffix: "",
      glowColor: "rgba(0, 255, 255, 0.15)",
    },
    {
      title: "Calls Today",
      value: stats.callsToday,
      icon: <PhoneOutlined style={{ fontSize: 24, color: "#ff00ff" }} />,
      suffix: "",
      glowColor: "rgba(255, 0, 255, 0.15)",
    },
    {
      title: "Conversion Rate",
      value: stats.conversionRate,
      icon: <RiseOutlined style={{ fontSize: 24, color: "#00ff88" }} />,
      suffix: "%",
      glowColor: "rgba(0, 255, 136, 0.15)",
    },
    {
      title: "Pipeline Value",
      value: stats.pipelineValue,
      icon: <DollarOutlined style={{ fontSize: 24, color: "#ffbf00" }} />,
      prefix: "$",
      formatter: (val: number) => val.toLocaleString(),
      glowColor: "rgba(255, 191, 0, 0.15)",
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <ScanningLoader text="LOADING SYSTEMS" />
      </div>
    );
  }

  const hasData = connectionStatus.isConnected && stats.totalLeads > 0;

  return (
    <div style={{ padding: 32 }}>
      <PageHeader 
        title="Dashboard Overview" 
        subtitle="Real-time metrics and analytics"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Tag
            icon={connectionStatus.isConnected ? <ApiOutlined /> : <DisconnectOutlined />}
            color={connectionStatus.isConnected ? "success" : "default"}
            style={{ 
              fontSize: 11, 
              padding: "4px 12px",
              borderRadius: 20,
              background: connectionStatus.isConnected 
                ? "rgba(0, 255, 128, 0.1)" 
                : "rgba(255, 255, 255, 0.05)",
              border: connectionStatus.isConnected 
                ? "1px solid rgba(0, 255, 128, 0.3)" 
                : "1px solid rgba(255, 255, 255, 0.1)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
            }}
          >
            {connectionStatus.isConnected ? "Connected to Twenty" : "Not Connected"}
          </Tag>
        </motion.div>
      </PageHeader>

      <Row gutter={[24, 24]}>
        {statCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
                style={{
                  background: "#0D0D0D",
                  borderRadius: 12,
                  height: "100%",
                  border: "0.5px solid rgba(0, 150, 200, 0.25)",
                  boxShadow: `0 0 30px ${stat.glowColor}`,
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
                    <motion.div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: stat.glowColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                      animate={{
                        boxShadow: [
                          `0 0 20px ${stat.glowColor}`,
                          `0 0 35px ${stat.glowColor}`,
                          `0 0 20px ${stat.glowColor}`,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {stat.icon}
                    </motion.div>
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
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "var(--font-mono)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {stat.title}
                    </Text>
                  </div>
                </Space>
              </Card>
            </motion.div>
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
            {activitiesLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Spin />
              </div>
            ) : recentActivities.length > 0 ? (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {recentActivities.map((activity: any) => (
                  <div
                    key={activity.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: activity.type === "call" ? "#00ff88" : activity.type === "email" ? "#00bfff" : "#c9a648",
                        marginTop: 6,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", display: "block" }}>
                        {activity.description || activity.content || activity.type}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ""}
                      </Text>
                    </div>
                  </div>
                ))}
              </Space>
            ) : (
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
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        <Col xs={24} lg={12}>
          <PlayerCard />
        </Col>
        <Col xs={24} lg={12}>
          <SpecializationDisplay />
        </Col>
      </Row>
    </div>
  );
}
