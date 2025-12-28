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
import { getAgent, getAgentsForRole } from "@/lib/compass/agents";
import { Compass, Settings, HelpCircle, Zap, MessageSquare, Home, Sliders, ChevronDown, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { currentUser, hasLiveWireAccess, hasGuardianAccess, setSelectedAgentId } = useUser();
  const [location] = useLocation();
  const agent = getAgent(agentId);
  const availableAgents = getAgentsForRole(currentUser?.role);
  console.log("[COMPASS] role:", currentUser?.role, "guardian:", hasGuardianAccess, "agents:", availableAgents.map(a=>a.id));

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
                  {hasGuardianAccess ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-1 text-xl font-bold p-0 h-auto" style={{ color: agent.color }}>
                          {agent.name}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        {availableAgents.map((a) => (
                          <DropdownMenuItem key={a.id} onClick={() => setSelectedAgentId(a.id)} className="gap-2">
                            {a.id === 'guardian' && <Shield className="w-4 h-4 text-purple-500" />}
                            <span style={{ color: a.color }}>{a.name}</span>
                            {a.id === agentId && <span className="text-xs text-muted-foreground">(current)</span>}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <h2 className="font-bold text-xl" style={{ color: agent.color }} data-testid="text-agent-name">
                      {agent.name}
                    </h2>
                  )}
                  <p className="text-sm text-sidebar-foreground/60 mt-1">{agent.description}</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-500' : agent.status === 'away' ? 'bg-yellow-500' : agent.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'}`} />
                    <span className="text-xs text-sidebar-foreground/60">{statusLabels[agent.status]}</span>
                  </div>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">Navigation</SidebarGroupLabel>
          <SidebarGroupContent className="px-4 space-y-2">
            <Link href="/"><Button variant={location === '/' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" size="sm"><Home className="w-4 h-4" />Commands</Button></Link>
            <Link href="/chat"><Button variant={location === '/chat' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" size="sm"><MessageSquare className="w-4 h-4" />Chat</Button></Link>
            {hasLiveWireAccess && (
              <>
                <Link href="/livewire"><Button variant={location === '/livewire' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" size="sm"><Zap className="w-4 h-4 text-amber-400" /><span className="text-amber-400">LiveWire</span></Button></Link>
                <Link href="/livewire/settings"><Button variant={location === '/livewire/settings' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2 pl-8" size="sm"><Sliders className="w-4 h-4 text-amber-400/70" /><span className="text-amber-400/70">Settings</span></Button></Link>
              </>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/40 mb-2">Logged in as: {currentUser?.name}</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-sidebar-foreground/60" data-testid="button-settings"><Settings className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground/60" data-testid="button-help"><HelpCircle className="w-4 h-4" /></Button>
          <div className="flex-1" />
          <span className="text-xs text-sidebar-foreground/40">v1.0.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
