import { useState, useEffect } from "react";
import { Card, Statistic, Row, Col, Progress, Typography, Space, Spin, Empty, Tag, Button } from "antd";
import { motion } from "framer-motion";
import {
  UserOutlined,
  PhoneOutlined,
  RiseOutlined,
  DollarOutlined,
  ApiOutlined,
  DisconnectOutlined,
  ThunderboltOutlined,
  RedditOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { Link } from "wouter";
import { getLeadsStats, getLeadsByStage, getConnectionStatus } from "../providers/twentyDataProvider";
import type { Lead } from "@shared/schema";
import { PlayerCard, SpecializationDisplay } from "../features/progression";
import { PageHeader } from "../components/ui/PageHeader";
import { ScanningLoader } from "../components/ui/ScanningLoader";
import { getCurrentWorkspaceMember, isLiveWireUser } from "../lib/twentyStatsApi";

const { Title, Text } = Typography;

// LiveWire backend URL
const LIVEWIRE_API = 'http://192.168.1.23:5000';

interface PipelineStage {
  stage: string;
  count: number;
  percent: number;
  color: string;
}

interface LiveWireStats {
  total: number;
  hot: number;
  warm: number;
  actionable: number;
}

// LiveWire Quick Access Banner Component
function LiveWireBanner({ stats, loading }: { stats: LiveWireStats | null; loading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ marginBottom: 24 }}
    >
      <Link href="/livewire" style={{ textDecoration: 'none' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 69, 0, 0.15) 0%, rgba(201, 166, 72, 0.15) 100%)',
            border: '1px solid rgba(255, 69, 0, 0.3)',
            borderRadius: 16,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 69, 0, 0.6)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 69, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 69, 0, 0.3)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255, 69, 0, 0.3)',
                  '0 0 40px rgba(255, 69, 0, 0.5)',
                  '0 0 20px rgba(255, 69, 0, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'rgba(255, 69, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 69, 0, 0.4)',
              }}
            >
              <ThunderboltOutlined style={{ fontSize: 28, color: '#ff4500' }} />
            </motion.div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{
                  color: '#ff4500',
                  fontSize: 18,
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                }}>
                  LiveWire Control Room
                </Text>
                <Tag color="red" style={{ marginLeft: 8 }}>
                  <RedditOutlined /> {loading ? '...' : stats?.total || 0} Reddit Leads
                </Tag>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                {loading ? 'Loading...' : (
                  <>
                    <span style={{ color: '#ff4500', fontWeight: 600 }}>{stats?.hot || 0} HOT</span>
                    {' · '}
                    <span style={{ color: '#c9a648', fontWeight: 600 }}>{stats?.warm || 0} WARM</span>
                    {' · '}
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{stats?.actionable || 0} Actionable</span>
                  </>
                )}
              </Text>
            </div>
          </div>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            style={{
              background: 'linear-gradient(135deg, #ff4500 0%, #c9a648 100%)',
              border: 'none',
              height: 40,
              paddingInline: 24,
              fontWeight: 600,
            }}
          >
            Open LiveWire
          </Button>
        </div>
      </Link>
    </motion.div>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState({ totalLeads: 0, callsToday: 0, conversionRate: 0, pipelineValue: 0 });
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false, error: null as string | null });
  const [showLiveWire, setShowLiveWire] = useState(true);
  const [liveWireStats, setLiveWireStats] = useState<LiveWireStats | null>(null);
  const [liveWireLoading, setLiveWireLoading] = useState(true);

  const { result: activitiesResult, query: activitiesQuery } = useList({
    resource: "activities",
    pagination: { pageSize: 5 },
    sorters: [{ field: "createdAt", order: "desc" }],
  });

  const recentActivities = activitiesResult?.data || [];
  const activitiesLoading = activitiesQuery.isLoading;

  // Check if user has LiveWire access and fetch stats
  useEffect(() => {
    async function checkLiveWireAccess() {
      try {
        const member = await getCurrentWorkspaceMember();
        if (member?.userEmail && isLiveWireUser(member.userEmail)) {
          setShowLiveWire(true);
          // Fetch LiveWire stats
          try {
            const response = await fetch(`${LIVEWIRE_API}/leads`);
            if (response.ok) {
              const data = await response.json();
              const leads = data.leads || [];
              setLiveWireStats({
                total: leads.length,
                hot: leads.filter((l: any) => l.intentTier === 'HOT').length,
                warm: leads.filter((l: any) => l.intentTier === 'WARM').length,
                actionable: leads.filter((l: any) => l.isActionable).length,
              });
            }
          } catch (err) {
            console.warn('Failed to fetch LiveWire stats:', err);
          }
          setLiveWireLoading(false);
        }
      } catch (err) {
        console.warn('Could not detect user for LiveWire access:', err);
        // Default to showing for now
        setShowLiveWire(true);
        setLiveWireLoading(false);
      }
    }
    checkLiveWireAccess();
  }, []);

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

      {/* LiveWire Quick Access Banner - shown for authorized users */}
      {showLiveWire && (
        <LiveWireBanner stats={liveWireStats} loading={liveWireLoading} />
      )}

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
