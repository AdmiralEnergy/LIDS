import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAgent, DEFAULT_AVATAR } from "@/lib/compass/agents";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  agentId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const statusSizeClasses = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

const statusColors = {
  online: 'bg-status-online',
  away: 'bg-status-away',
  busy: 'bg-status-busy',
  offline: 'bg-status-offline',
};

export function AgentAvatar({ 
  agentId, 
  size = 'md', 
  showStatus = false,
  showName = false,
  className 
}: AgentAvatarProps) {
  const agent = getAgent(agentId);
  const avatar = agent?.avatar || DEFAULT_AVATAR;
  const name = agent?.name || 'Agent';
  const status = agent?.status || 'offline';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <Avatar className={cn(
          sizeClasses[size],
          "ring-2 ring-border"
        )}
        style={{ 
          boxShadow: agent?.color ? `0 0 12px ${agent.color}40` : undefined 
        }}
        >
          <AvatarImage 
            src={avatar} 
            alt={name}
            className="object-cover"
            data-testid={`img-avatar-${agentId}`}
          />
          <AvatarFallback className="bg-muted text-muted-foreground font-medium">
            {name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        {showStatus && (
          <span 
            className={cn(
              "absolute bottom-0 right-0 rounded-full ring-2 ring-background",
              statusSizeClasses[size],
              statusColors[status]
            )}
            data-testid={`status-${agentId}`}
          />
        )}
      </div>
      {showName && (
        <div className="flex flex-col">
          <span 
            className="font-semibold text-foreground"
            data-testid={`text-agent-name-${agentId}`}
          >
            {name}
          </span>
          {agent?.description && (
            <span className="text-xs text-muted-foreground">
              {agent.description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
