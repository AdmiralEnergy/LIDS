import { useEffect } from "react";
import { Refine } from "@refinedev/core";
import { ConfigProvider, Layout, Menu, theme, Alert } from "antd";
import { AchievementPopup } from "./features/progression";
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
          background: "#0a2438",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "linear-gradient(135deg, #c9a648 0%, #b8953d 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
                color: "#0c2f4a",
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
                }}
              >
                ADS Dashboard
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
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
                <Link href="/settings" style={{ color: "#c9a648" }}>Open Settings</Link>
              </span>
            }
            type="warning"
            showIcon
            banner
            style={{ position: "sticky", top: 0, zIndex: 100 }}
          />
        )}
        <Content
          style={{
            background: "#0c2f4a",
            flex: 1,
            overflow: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
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
          colorPrimary: "#c9a648",
          colorBgContainer: "#0f3654",
          colorBgElevated: "#0f3654",
          colorBorder: "rgba(255,255,255,0.12)",
          colorText: "rgba(255,255,255,0.85)",
          colorTextSecondary: "rgba(255,255,255,0.65)",
          borderRadius: 6,
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        },
        components: {
          Layout: {
            siderBg: "#0a2438",
            bodyBg: "#0c2f4a",
          },
          Menu: {
            darkItemBg: "transparent",
            darkItemSelectedBg: "rgba(201, 166, 72, 0.15)",
            darkItemSelectedColor: "#c9a648",
            darkItemHoverBg: "rgba(255,255,255,0.05)",
          },
          Table: {
            headerBg: "rgba(255,255,255,0.04)",
            headerColor: "rgba(255,255,255,0.65)",
            rowHoverBg: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.08)",
          },
          Card: {
            colorBgContainer: "#0f3654",
            colorBorderSecondary: "rgba(255,255,255,0.08)",
          },
          Modal: {
            contentBg: "#0f3654",
            headerBg: "#0f3654",
          },
          Input: {
            colorBgContainer: "rgba(255,255,255,0.06)",
            colorBorder: "rgba(255,255,255,0.12)",
          },
          Select: {
            colorBgContainer: "rgba(255,255,255,0.06)",
            colorBorder: "rgba(255,255,255,0.12)",
            optionSelectedBg: "rgba(201, 166, 72, 0.2)",
          },
          Button: {
            primaryColor: "#0c2f4a",
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
