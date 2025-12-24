import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { AgentAvatar } from "./AgentAvatar";
import { getAllAgents, type AgentInfo } from "@/lib/compass/agents";
import { cn } from "@/lib/utils";
import { Compass, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentSidebarProps {
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}

const statusLabels = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

export function AgentSidebar({ selectedAgentId, onSelectAgent }: AgentSidebarProps) {
  const agents = getAllAgents();

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
            FieldOps Agents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agents.map((agent: AgentInfo) => {
                const isSelected = agent.id === selectedAgentId;
                
                return (
                  <SidebarMenuItem key={agent.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectAgent(agent.id)}
                      className={cn(
                        "w-full p-3 gap-3 h-auto",
                        isSelected && "bg-sidebar-accent"
                      )}
                      data-testid={`button-select-agent-${agent.id}`}
                    >
                      <AgentAvatar 
                        agentId={agent.id} 
                        size="sm" 
                        showStatus 
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-sidebar-foreground truncate">
                            {agent.name}
                          </span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-sidebar-foreground/60 truncate">
                          {agent.description}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        agent.status === 'online' && "text-status-online bg-status-online/10",
                        agent.status === 'away' && "text-status-away bg-status-away/10",
                        agent.status === 'busy' && "text-status-busy bg-status-busy/10",
                        agent.status === 'offline' && "text-status-offline bg-status-offline/10",
                      )}>
                        {statusLabels[agent.status]}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
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
