import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { AgentAvatar } from "./AgentAvatar";
import { getAgent } from "@/lib/compass/agents";
import { Compass, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user-context";

interface AgentSidebarProps {
  agentId: string;
}

const statusLabels = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

export function AgentSidebar({ agentId }: AgentSidebarProps) {
  const { currentUser } = useUser();
  const agent = getAgent(agentId);

  if (!agent) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center">
            <Compass className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground tracking-tight">COMPASS</h1>
            <p className="text-xs text-sidebar-foreground/60">AI Sales Assistant</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
            Your Agent Partner
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="p-4">
              <div className="flex flex-col items-center text-center gap-4">
                <AgentAvatar agentId={agent.id} size="lg" showStatus />
                <div>
                  <h2 className="font-bold text-xl" style={{ color: agent.color }} data-testid="text-agent-name">
                    {agent.name}
                  </h2>
                  <p className="text-sm text-sidebar-foreground/60 mt-1">
                    {agent.description}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      agent.status === 'online' ? 'bg-green-500' :
                      agent.status === 'away' ? 'bg-yellow-500' :
                      agent.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-xs text-sidebar-foreground/60">
                      {statusLabels[agent.status]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-sidebar-accent/50 text-center">
                  <div className="text-2xl font-bold text-sidebar-foreground">24</div>
                  <div className="text-xs text-sidebar-foreground/60">Leads Enriched</div>
                </div>
                <div className="p-3 rounded-lg bg-sidebar-accent/50 text-center">
                  <div className="text-2xl font-bold text-sidebar-foreground">156</div>
                  <div className="text-xs text-sidebar-foreground/60">Messages Today</div>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-4 space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" size="sm" data-testid="button-enrich-top-leads">
              Enrich Top Leads
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm" data-testid="button-pipeline-summary">
              Pipeline Summary
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm" data-testid="button-daily-briefing">
              Daily Briefing
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/40 mb-2">
          Logged in as: {currentUser?.name}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/60"
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/60"
            data-testid="button-help"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-sidebar-foreground/40">v1.0.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
