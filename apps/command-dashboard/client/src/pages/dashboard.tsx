import { useState } from "react";
import { Settings, RefreshCw, Activity, Cpu, Brain, Zap, LogOut, User, Shield } from "lucide-react";
import { getSettings, saveSettings, type ServiceSettings } from "@/lib/settings";
import { DeepSeekChat } from "@/components/chat/DeepSeekChat";
import { GridStatusPanel } from "@/components/grid/GridStatusPanel";
import { InfraHealthPanel } from "@/components/infra/InfraHealthPanel";
import { LiveWirePanel } from "@/components/livewire/LiveWirePanel";
import { useAuth } from "@/providers/AuthProvider";

type TabType = "infrastructure" | "livewire";

/**
 * Command Dashboard - Main Page
 * Phase 2: Complete UI with mock data
 */
export function DashboardPage() {
  const { user, logout, canConfigure, canApprove } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("infrastructure");
  const [settings, setSettings] = useState<ServiceSettings>(getSettings);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎛️</span>
            <h1 className="text-lg font-semibold tracking-tight">Command Dashboard</h1>
          </div>
          
          {/* Tab Navigation */}
          <nav className="flex items-center bg-muted/50 p-1 rounded-lg gap-1">
            <button
              onClick={() => setActiveTab("infrastructure")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "infrastructure"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              SYSTEM HEALTH
            </button>
            <button
              onClick={() => setActiveTab("livewire")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "livewire"
                  ? "bg-background text-[#00ffff] shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              LIVEWIRE INTEL
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-500">
            LIVE
          </span>
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

          {/* User Info & Logout */}
          <div className="h-6 w-px bg-border mx-1" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-lg">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">{user?.name || 'User'}</span>
              {canConfigure && (
                <span className="text-[8px] font-bold bg-cyan-500/20 text-cyan-500 px-1 py-0.5 rounded uppercase">
                  {user?.role}
                </span>
              )}
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-destructive/10 text-destructive/70 hover:text-destructive rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dashboard Area */}
        <main className="flex-1 p-4 overflow-hidden bg-muted/20">
          {activeTab === "infrastructure" ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Left Column: DeepSeek Chat */}
              <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
                <DeepSeekChat />
              </div>

              {/* Right Column: Grid Status + Health */}
              <div className="flex flex-col gap-4 overflow-hidden">
                {/* Grid Engine Status */}
                <div className="flex-1 min-h-0">
                  <GridStatusPanel />
                </div>

                {/* Infrastructure Health */}
                <InfraHealthPanel
                  onRefresh={handleRefreshAll}
                  isRefreshing={isRefreshing}
                />
              </div>
            </div>
          ) : (
            <div className="h-full">
              <LiveWirePanel />
            </div>
          )}
        </main>

        {/* Settings Panel (Slide-out) */}
        {showSettings && (
          <aside className="w-80 border-l border-border bg-card p-4 overflow-auto shrink-0 shadow-2xl z-50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LiveWire Intelligence Config */}
            <SettingsSection title="LiveWire Intelligence">
              <SettingsInput
                label="Intelligence Core (5100)"
                value={settings.liveWireIntelUrl}
                onChange={(v) => handleSettingChange("liveWireIntelUrl", v)}
              />
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg mt-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Teachable Memory</span>
                <span className="text-[10px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
              </div>
            </SettingsSection>

            <div className="h-px bg-border my-4" />

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

            <div className="mt-8 pt-4 border-t border-border">
              <button
                onClick={() => {
                  localStorage.removeItem("command-dashboard-settings");
                  setSettings(getSettings());
                }}
                className="w-full py-3 px-3 text-xs font-bold uppercase tracking-widest bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-xl transition-all"
              >
                Reset Dashboard
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// Helper Components
import { X } from "lucide-react";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
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
      <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 text-sm bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary transition-all"
      />
    </div>
  );
}
