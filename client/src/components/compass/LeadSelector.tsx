import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Lead } from '@shared/schema';
import { Search, MapPin, Phone, Mail, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadSelectorProps {
  leads: Lead[];
  selectedLead?: Lead;
  onSelectLead: (lead: Lead | undefined) => void;
  isLoading?: boolean;
}

const statusColors = {
  new: 'bg-chart-1/20 text-chart-1',
  contacted: 'bg-chart-2/20 text-chart-2',
  qualified: 'bg-chart-5/20 text-chart-5',
  proposal: 'bg-chart-4/20 text-chart-4',
  closed: 'bg-chart-3/20 text-chart-3',
};

const statusLabels = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  closed: 'Closed',
};

function LeadCard({ 
  lead, 
  isSelected, 
  onClick 
}: { 
  lead: Lead; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <Card 
      className={cn(
        "p-4 cursor-pointer transition-all hover-elevate",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
      data-testid={`card-lead-${lead.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground truncate">
              {lead.firstName} {lead.lastName}
            </h4>
            <Badge 
              variant="secondary" 
              className={cn("text-xs", statusColors[lead.status])}
            >
              {statusLabels[lead.status]}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{lead.address}, {lead.city}, {lead.state}</span>
            </p>
            {lead.phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                {lead.phone}
              </p>
            )}
            {lead.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                <span className="truncate">{lead.email}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function LeadSelector({ 
  leads, 
  selectedLead, 
  onSelectLead,
  isLoading 
}: LeadSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.firstName.toLowerCase().includes(query) ||
      lead.lastName.toLowerCase().includes(query) ||
      lead.address.toLowerCase().includes(query) ||
      lead.city.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-foreground">Leads</h3>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-leads"
          />
        </div>
      </div>

      {selectedLead && (
        <div className="p-4 bg-primary/5 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Selected Lead
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => onSelectLead(undefined)}
              data-testid="button-clear-lead"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <p className="font-semibold text-foreground">
            {selectedLead.firstName} {selectedLead.lastName}
          </p>
          <p className="text-xs text-muted-foreground">
            {selectedLead.address}
          </p>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No leads found' : 'No leads available'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                isSelected={selectedLead?.id === lead.id}
                onClick={() => onSelectLead(
                  selectedLead?.id === lead.id ? undefined : lead
                )}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
