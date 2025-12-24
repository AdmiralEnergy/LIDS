import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatInterface } from '@/components/compass/ChatInterface';
import { LeadSelector } from '@/components/compass/LeadSelector';
import { AgentAvatar } from '@/components/compass/AgentAvatar';
import { getAgent } from '@/lib/compass/agents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Lead } from '@shared/schema';
import { PanelRightClose, PanelRightOpen, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeProps {
  selectedAgentId: string;
}

export default function Home({ selectedAgentId }: HomeProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();
  const [showLeadPanel, setShowLeadPanel] = useState(true);

  const agent = getAgent(selectedAgentId);

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between gap-4 px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <AgentAvatar agentId={selectedAgentId} size="sm" showStatus />
            <div>
              <h2 className="font-semibold text-foreground" style={{ color: agent?.color }}>
                {agent?.name || 'Agent'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {agent?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedLead && (
              <Badge variant="secondary" className="gap-1.5">
                <Users className="w-3 h-3" />
                {selectedLead.firstName} {selectedLead.lastName}
              </Badge>
            )}
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLeadPanel(!showLeadPanel)}
              data-testid="button-toggle-leads"
            >
              {showLeadPanel ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <ChatInterface
            agentId={selectedAgentId}
            lead={selectedLead}
          />
        </div>
      </div>

      <div 
        className={cn(
          "w-80 border-l border-border bg-card transition-all duration-300 flex-shrink-0",
          !showLeadPanel && "w-0 border-l-0 overflow-hidden"
        )}
      >
        <LeadSelector
          leads={leads}
          selectedLead={selectedLead}
          onSelectLead={setSelectedLead}
          isLoading={leadsLoading}
        />
      </div>
    </div>
  );
}
