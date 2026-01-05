import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { ServiceCard } from "./ServiceCard";
import { useServiceHealth } from "@/hooks/useServiceHealth";

interface InfraHealthPanelProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function InfraHealthPanel({
  onRefresh: externalRefresh,
  isRefreshing: externalRefreshing = false,
}: InfraHealthPanelProps) {
  const healthHook = useServiceHealth();

  // Fetch real data on mount
  useEffect(() => {
    healthHook.refresh();
  }, []);

  const data = healthHook.services;
  const isRefreshing = healthHook.isLoading;

  const handleRefresh = () => {
    healthHook.refresh();
    externalRefresh?.();
  };

  // Group by location (handle both naming conventions)
  const oracleArm = data.filter(s => ["grid-engine", "deepseek", "gridEngine", "deepSeek"].includes(s.name));
  const admiralServer = data.filter(s => ["livewire", "agent-claude", "oracle-memory", "twilio-service", "n8n", "liveWire", "agentClaude", "oracleMemory", "twilioService"].includes(s.name));
  const droplet = data.filter(s => ["twenty-crm", "twentyCrm"].includes(s.name));

  // Calculate summary
  const healthy = data.filter(s => s.status === "healthy").length;
  const degraded = data.filter(s => s.status === "degraded").length;
  const offline = data.filter(s => s.status === "offline").length;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Infrastructure Health</h2>
          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">LIVE</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Summary badges */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-500">{healthy} up</span>
            {degraded > 0 && <span className="text-yellow-500">{degraded} slow</span>}
            {offline > 0 && <span className="text-red-500">{offline} down</span>}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 hover:bg-muted rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Service Groups */}
      <div className="grid grid-cols-3 gap-3">
        {/* Oracle ARM */}
        <ServiceGroup title="Oracle ARM" subtitle="193.122.153.249" services={oracleArm} />

        {/* Admiral-Server */}
        <ServiceGroup title="Admiral-Server" subtitle="192.168.1.23" services={admiralServer} />

        {/* Droplet */}
        <ServiceGroup title="Droplet" subtitle="165.227.111.24" services={droplet} />
      </div>
    </div>
  );
}

function ServiceGroup({ title, subtitle, services }: { title: string; subtitle: string; services: ServiceHealthResult[] }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="mb-2">
        <p className="text-xs font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-1">
        {services.map((service) => (
          <ServiceCard key={service.name} service={service} compact />
        ))}
      </div>
    </div>
  );
}
