import { useState } from "react";
import { Settings, RefreshCw } from "lucide-react";
import { getSettings, saveSettings, type ServiceSettings } from "@/lib/settings";
import { DeepSeekChat } from "@/components/chat/DeepSeekChat";
import { GridStatusPanel } from "@/components/grid/GridStatusPanel";
import { InfraHealthPanel } from "@/components/infra/InfraHealthPanel";

/**
 * Command Dashboard - Main Page
 * Phase 2: Complete UI with mock data
 */
export function DashboardPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ServiceSettings>(getSettings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useMockData, setUseMockData] = useState(true); // Start with mock, toggle to live

  const handleSettingChange = (key: keyof ServiceSettings, value: string | number) => {
    const updated = saveSettings({ [key]: value });
    setSettings(updated);
  };

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    // In Phase 3+, this will trigger real API calls
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎛️</span>
          <h1 className="text-lg font-semibold">Command Dashboard</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">v1.0</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mock/Live toggle */}
          <button
            onClick={() => setUseMockData(!useMockData)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
              useMockData
                ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
            }`}
            title={useMockData ? "Switch to Live Data" : "Switch to Mock Data"}
          >
            {useMockData ? "MOCK" : "LIVE"}
          </button>
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dashboard Area */}
        <main className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Left Column: DeepSeek Chat */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <DeepSeekChat useMockData={useMockData} />
            </div>

            {/* Right Column: Grid Status + Health */}
            <div className="flex flex-col gap-4">
              {/* Grid Engine Status */}
              <div className="flex-1 min-h-0">
                <GridStatusPanel useMockData={useMockData} />
              </div>

              {/* Infrastructure Health */}
              <InfraHealthPanel
                useMockData={useMockData}
                onRefresh={handleRefreshAll}
                isRefreshing={isRefreshing}
              />
            </div>
          </div>
        </main>

        {/* Settings Panel (Slide-out) */}
        {showSettings && (
          <aside className="w-80 border-l border-border bg-card p-4 overflow-auto">
            <h2 className="font-semibold mb-4">Settings</h2>

            {/* Oracle ARM Services */}
            <SettingsSection title="Oracle ARM (193.122.153.249)">
              <SettingsInput
                label="Grid Engine URL"
                value={settings.gridEngineUrl}
                onChange={(v) => handleSettingChange("gridEngineUrl", v)}
              />
              <SettingsInput
                label="DeepSeek URL"
                value={settings.deepSeekUrl}
                onChange={(v) => handleSettingChange("deepSeekUrl", v)}
              />
            </SettingsSection>

            {/* Admiral-Server Services */}
            <SettingsSection title="Admiral-Server (192.168.1.23)">
              <SettingsInput
                label="LiveWire URL"
                value={settings.liveWireUrl}
                onChange={(v) => handleSettingChange("liveWireUrl", v)}
              />
              <SettingsInput
                label="Agent-Claude URL"
                value={settings.agentClaudeUrl}
                onChange={(v) => handleSettingChange("agentClaudeUrl", v)}
              />
              <SettingsInput
                label="Oracle Memory URL"
                value={settings.oracleMemoryUrl}
                onChange={(v) => handleSettingChange("oracleMemoryUrl", v)}
              />
              <SettingsInput
                label="Twilio Service URL"
                value={settings.twilioServiceUrl}
                onChange={(v) => handleSettingChange("twilioServiceUrl", v)}
              />
              <SettingsInput
                label="n8n URL"
                value={settings.n8nUrl}
                onChange={(v) => handleSettingChange("n8nUrl", v)}
              />
            </SettingsSection>

            {/* Droplet Services */}
            <SettingsSection title="Droplet (localhost)">
              <SettingsInput
                label="Twenty CRM URL"
                value={settings.twentyCrmUrl}
                onChange={(v) => handleSettingChange("twentyCrmUrl", v)}
              />
            </SettingsSection>

            {/* Polling Intervals */}
            <SettingsSection title="Polling Intervals">
              <SettingsInput
                label="Health Check (ms)"
                value={String(settings.healthCheckInterval)}
                onChange={(v) => handleSettingChange("healthCheckInterval", parseInt(v) || 30000)}
                type="number"
              />
              <SettingsInput
                label="Grid Refresh (ms)"
                value={String(settings.gridRefreshInterval)}
                onChange={(v) => handleSettingChange("gridRefreshInterval", parseInt(v) || 60000)}
                type="number"
              />
            </SettingsSection>

            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={() => {
                  localStorage.removeItem("command-dashboard-settings");
                  setSettings(getSettings());
                }}
                className="w-full py-2 px-3 text-sm bg-destructive/20 text-destructive hover:bg-destructive/30 rounded transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// Helper Components

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
