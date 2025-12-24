import { useEffect } from "react";
import { Refine } from "@refinedev/core";
import { ConfigProvider, Layout, Menu, theme, Alert } from "antd";
import { AchievementPopup } from "./features/progression";
import { CursorGlow } from "./components/ui/CursorGlow";
import {
  DashboardOutlined,
  UserOutlined,
  FunnelPlotOutlined,
  HistoryOutlined,
  DatabaseOutlined,
  PhoneOutlined,
  SettingOutlined,
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
import { getSettings } from "./lib/settings";
import { startAutoSync } from "./lib/sync";
import "./index.css";

const { Sider, Content } = Layout;

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const settings = getSettings();
  const isConfigured = Boolean(settings.twentyApiKey);

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
          background: "rgba(8, 8, 8, 0.95)",
          backdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #00ffff 0%, #0088aa 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                color: "#050505",
                boxShadow: "0 0 20px rgba(0, 255, 255, 0.4)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
              }}
            >
              ADS
            </div>
            <div>
              <div
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.02em",
                }}
              >
                ADS Dashboard
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
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
              background: "rgba(20, 20, 20, 0.95)",
              backdropFilter: "blur(8px)",
              border: "none",
              borderBottom: "1px solid rgba(255, 191, 0, 0.2)",
            }}
          />
        )}
        <Content
          style={{
            background: "#050505",
            flex: 1,
            overflow: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
      <CursorGlow />
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
    return cleanup;
  }, []);

  return (
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
  );
}

export default App;
