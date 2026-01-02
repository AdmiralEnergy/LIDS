import { AlertTriangle, Zap, MapPin } from "lucide-react";
import { generateMockCountyStates, MOCK_NWS_ALERTS, MOCK_OUTAGES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface GridStatusPanelProps {
  useMockData?: boolean;
}

export function GridStatusPanel({ useMockData = true }: GridStatusPanelProps) {
  const counties = generateMockCountyStates();
  const alerts = MOCK_NWS_ALERTS;
  const outages = MOCK_OUTAGES;

  // Count by status
  const statusCounts = counties.reduce(
    (acc, c) => {
      acc[c.level]++;
      return acc;
    },
    { GREEN: 0, YELLOW: 0, RED: 0, BLACK: 0 }
  );

  return (
    <div className="bg-card border border-border rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <h2 className="text-sm font-medium">NC Grid Engine</h2>
          {useMockData && (
            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">MOCK</span>
          )}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-4 gap-2 p-3 border-b border-border">
        <StatBox label="Normal" value={statusCounts.GREEN} color="text-green-500" />
        <StatBox label="Alert" value={statusCounts.YELLOW} color="text-yellow-500" />
        <StatBox label="Warning" value={statusCounts.RED} color="text-red-500" />
        <StatBox label="Outage" value={statusCounts.BLACK} color="text-purple-500" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Active NWS Alerts ({alerts.length})
            </h3>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-2 rounded border text-xs",
                    alert.severity === "Severe" || alert.severity === "Extreme"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-yellow-500/10 border-yellow-500/30"
                  )}
                >
                  <div className="font-medium">{alert.event}</div>
                  <div className="text-muted-foreground mt-1">{alert.headline}</div>
                  <div className="text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {alert.affectedCounties.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Outages */}
        {outages.totalCustomersAffected > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Current Outages ({outages.totalCustomersAffected.toLocaleString()} customers)
            </h3>
            <div className="space-y-1">
              {Object.entries(outages.counties)
                .sort(([, a], [, b]) => b - a)
                .map(([county, customers]) => (
                  <div key={county} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                    <span>{county}</span>
                    <span className="text-red-400">{customers.toLocaleString()} out</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Counties with elevated status */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">Elevated Counties</h3>
          <div className="grid grid-cols-2 gap-1">
            {counties
              .filter((c) => c.level !== "GREEN")
              .map((county) => (
                <div
                  key={county.county}
                  className={cn(
                    "text-xs p-2 rounded flex items-center gap-2",
                    county.level === "YELLOW" && "bg-yellow-500/10",
                    county.level === "RED" && "bg-red-500/10",
                    county.level === "BLACK" && "bg-purple-500/10"
                  )}
                >
                  <StatusDot level={county.level} />
                  <span>{county.county}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-2 bg-muted/50 rounded">
      <div className={cn("text-lg font-bold", color)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusDot({ level }: { level: string }) {
  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full",
        level === "GREEN" && "bg-green-500",
        level === "YELLOW" && "bg-yellow-500",
        level === "RED" && "bg-red-500",
        level === "BLACK" && "bg-purple-500"
      )}
    />
  );
}
