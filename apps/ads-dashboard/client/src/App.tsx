import { useEffect, useState, Component, ErrorInfo, ReactNode } from "react";
import { Refine } from "@refinedev/core";
import { ConfigProvider, Layout, Menu, theme, Alert } from "antd";
import { AchievementPopup } from "./features/progression";
import { CursorGlow } from "./components/ui/CursorGlow";
import { KineticADSLogo } from "./components/ui/KineticADSLogo";
import { ParticleBackground } from "./components/ui/ParticleBackground";
import {
  DashboardOutlined,
  UserOutlined,
  FunnelPlotOutlined,
  HistoryOutlined,
  DatabaseOutlined,
  PhoneOutlined,
  SettingOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Switch, Route, useLocation, Link } from "wouter";
import { twentyDataProvider } from "./providers/twentyDataProvider";
import { DashboardPage } from "./pages/dashboard";
import { LeadsPage } from "./pages/leads";
import { PipelinePage } from "./pages/pipeline";
import { ActivityPage } from "./pages/activity";
import { CRMPage } from "./pages/crm";
import DialerPage from "./pages/dialer";
import SettingsPage from "./pages/settings";
import LeaderboardPage from "./pages/leaderboard";
import LiveWirePage from "./pages/livewire";
import { getSettings } from "./lib/settings";
import { startAutoSync } from "./lib/sync";
import { initializeSync, startPeriodicSync, stopPeriodicSync } from "./lib/twentySync";
import { getCurrentWorkspaceMember, isLiveWireUser } from "./lib/twentyStatsApi";
import "./index.css";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40,
          textAlign: "center",
          background: "#0a0a0a",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <h1 style={{ color: "#ff4d4f", marginBottom: 16 }}>Something went wrong</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 24 }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#c9a648",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              color: "#000",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const { Sider, Content } = Layout;

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const settings = getSettings();
  const isConfigured = Boolean(settings.twentyApiKey);
  const [showLiveWire, setShowLiveWire] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check if current user has LiveWire access
  useEffect(() => {
    getCurrentWorkspaceMember().then(member => {
      if (member?.userEmail) {
        setUserEmail(member.userEmail);
        setShowLiveWire(isLiveWireUser(member.userEmail));
      }
    }).catch(err => {
      console.warn('Could not detect user for LiveWire access:', err);
      // Default to showing LiveWire for now (can be removed later)
      setShowLiveWire(true);
    });
  }, []);

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: <Link href="/">Dashboard</Link>,
    },
    {
      key: "/leads",
      icon: <UserOutlined />,
      label: <Link href="/leads">Leads</Link>,
    },
    {
      key: "/pipeline",
      icon: <FunnelPlotOutlined />,
      label: <Link href="/pipeline">Pipeline</Link>,
    },
    {
      key: "/activity",
      icon: <HistoryOutlined />,
      label: <Link href="/activity">Activity</Link>,
    },
    {
      key: "/crm",
      icon: <DatabaseOutlined />,
      label: <Link href="/crm">Twenty CRM</Link>,
    },
    {
      key: "/dialer",
      icon: <PhoneOutlined />,
      label: <Link href="/dialer">Dialer</Link>,
    },
    // LiveWire - conditional based on user role
    ...(showLiveWire ? [{
      key: "/livewire",
      icon: <ThunderboltOutlined style={{ color: "#c9a648" }} />,
      label: <Link href="/livewire" style={{ color: "#c9a648" }}>LiveWire</Link>,
    }] : []),
    {
      key: "/leaderboard",
      icon: <TrophyOutlined />,
      label: <Link href="/leaderboard">Leaderboard</Link>,
    },
    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: <Link href="/settings">Settings</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={256}
        style={{
          background: "#000000",
          borderRight: "0.5px solid rgba(0, 255, 255, 0.15)",
        }}
      >
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <KineticADSLogo size={48} />
            <div>
              <div
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.03em",
                }}
              >
                ADS Dashboard
              </div>
              <div style={{
                fontSize: 9,
                color: "rgba(0, 206, 209, 0.8)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>
                Admiral Dialer System
              </div>
            </div>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location]}
          items={menuItems}
          style={{
            background: "transparent",
            border: "none",
            padding: "16px 0",
          }}
        />
      </Sider>

      <Layout style={{ display: "flex", flexDirection: "column" }}>
        {!isConfigured && (
          <Alert
            message="Not Connected"
            description={
              <span>
                Configure your network settings to connect to services.{" "}
                <Link href="/settings" style={{ color: "#00ffff" }}>Open Settings</Link>
              </span>
            }
            type="warning"
            showIcon
            banner
            style={{
              position: "sticky",
              top: 0,
              zIndex: 100,
              background: "#141414",
              border: "none",
              borderBottom: "1px solid rgba(255, 191, 0, 0.3)",
            }}
          />
        )}
        <Content
          style={{
            background: "#000000",
            flex: 1,
            overflow: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
      <CursorGlow />
      <ParticleBackground />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/pipeline" component={PipelinePage} />
      <Route path="/activity" component={ActivityPage} />
      <Route path="/crm" component={CRMPage} />
      <Route path="/dialer" component={DialerPage} />
      <Route path="/livewire" component={LiveWirePage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route>
        <div style={{ padding: 32, color: "#fff" }}>
          <h1>404 - Page Not Found</h1>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const cleanup = startAutoSync();

    initializeSync().catch(err => {
      console.warn('Twenty sync initialization failed:', err);
    });

    startPeriodicSync(5 * 60 * 1000);

    return () => {
      cleanup?.();
      stopPeriodicSync();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#00ffff",
            colorBgContainer: "rgba(10, 10, 10, 0.6)",
            colorBgElevated: "rgba(15, 15, 15, 0.95)",
            colorBorder: "rgba(255,255,255,0.08)",
            colorText: "rgba(255,255,255,0.9)",
            colorTextSecondary: "rgba(255,255,255,0.6)",
            borderRadius: 8,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          },
          components: {
            Layout: {
              siderBg: "rgba(8, 8, 8, 0.95)",
              bodyBg: "#050505",
            },
            Menu: {
              darkItemBg: "transparent",
              darkItemSelectedBg: "rgba(0, 255, 255, 0.08)",
              darkItemSelectedColor: "#00ffff",
              darkItemHoverBg: "rgba(255,255,255,0.05)",
            },
            Table: {
              headerBg: "rgba(0, 0, 0, 0.4)",
              headerColor: "rgba(255,255,255,0.6)",
              rowHoverBg: "rgba(0, 255, 255, 0.03)",
              borderColor: "rgba(255,255,255,0.06)",
            },
            Card: {
              colorBgContainer: "rgba(10, 10, 10, 0.6)",
              colorBorderSecondary: "rgba(255,255,255,0.08)",
            },
            Modal: {
              contentBg: "rgba(10, 10, 10, 0.95)",
              headerBg: "rgba(10, 10, 10, 0.95)",
            },
            Input: {
              colorBgContainer: "rgba(0, 0, 0, 0.4)",
              colorBorder: "rgba(255,255,255,0.1)",
            },
            Select: {
              colorBgContainer: "rgba(0, 0, 0, 0.4)",
              colorBorder: "rgba(255,255,255,0.1)",
              optionSelectedBg: "rgba(0, 255, 255, 0.15)",
            },
            Button: {
              primaryColor: "#050505",
            },
          },
        }}
      >
        <Refine
          dataProvider={twentyDataProvider}
          resources={[
            {
              name: "leads",
              list: "/leads",
              create: "/leads/create",
              edit: "/leads/edit/:id",
              show: "/leads/show/:id",
            },
            {
              name: "activities",
              list: "/activity",
            },
          ]}
          options={{
            syncWithLocation: false,
            disableTelemetry: true,
          }}
        >
          <AppLayout>
            <Router />
          </AppLayout>
          <AchievementPopup />
        </Refine>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
