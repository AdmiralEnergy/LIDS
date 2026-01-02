import { cn, formatResponseTime, getStatusColor, getStatusBgColor, getStatusBorderColor } from "@/lib/utils";
import type { ServiceHealthResult } from "@shared/schema";

interface ServiceCardProps {
  service: ServiceHealthResult;
  compact?: boolean;
}

export function ServiceCard({ service, compact = true }: ServiceCardProps) {
  const statusDot = (
    <div
      className={cn(
        "w-2 h-2 rounded-full",
        service.status === "healthy" && "bg-green-500 status-pulse-healthy",
        service.status === "degraded" && "bg-yellow-500 status-pulse-degraded",
        service.status === "offline" && "bg-red-500",
        service.status === "unknown" && "bg-gray-500"
      )}
    />
  );

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs py-1">
        <div className="flex items-center gap-2">
          {statusDot}
          <span className={cn(service.status === "offline" && "text-muted-foreground")}>
            {formatServiceName(service.name)}
          </span>
        </div>
        {service.responseTime && service.status !== "offline" && (
          <span className="text-muted-foreground">{formatResponseTime(service.responseTime)}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        getStatusBgColor(service.status),
        getStatusBorderColor(service.status)
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusDot}
          <span className="font-medium text-sm">{formatServiceName(service.name)}</span>
        </div>
        <span className={cn("text-xs capitalize", getStatusColor(service.status))}>
          {service.status}
        </span>
      </div>
      {service.responseTime && service.status !== "offline" && (
        <div className="text-xs text-muted-foreground mt-1">
          Response: {formatResponseTime(service.responseTime)}
        </div>
      )}
      {service.error && (
        <div className="text-xs text-red-400 mt-1">{service.error}</div>
      )}
    </div>
  );
}

function formatServiceName(name: string): string {
  const names: Record<string, string> = {
    // kebab-case (from mock data)
    "grid-engine": "Grid Engine",
    "deepseek": "DeepSeek R1",
    "livewire": "LiveWire",
    "agent-claude": "Agent-Claude",
    "oracle-memory": "Oracle Memory",
    "twilio-service": "Twilio",
    "n8n": "n8n",
    "twenty-crm": "Twenty CRM",
    // camelCase (from server)
    "gridEngine": "Grid Engine",
    "deepSeek": "DeepSeek R1",
    "liveWire": "LiveWire",
    "agentClaude": "Agent-Claude",
    "oracleMemory": "Oracle Memory",
    "twilioService": "Twilio",
    "twentyCrm": "Twenty CRM",
  };
  return names[name] || name;
}
