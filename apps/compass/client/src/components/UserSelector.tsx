import { useUser, HELM_USERS } from '@/lib/user-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import { getAgent } from '@/lib/compass/agents';

export function UserSelector() {
  const { currentUser, setCurrentUser, isLoading } = useUser();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className="gap-2" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </Button>
    );
  }

  const currentAgent = currentUser ? getAgent(currentUser.fieldops_agent_id) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-user-selector">
          <User className="w-4 h-4" />
          <span className="max-w-32 truncate">{currentUser?.name || 'Select User'}</span>
          {currentAgent && (
            <span className="text-xs text-muted-foreground">({currentAgent.name})</span>
          )}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <span>Assigned Agent</span>
          {currentUser && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {HELM_USERS.map((user) => {
          const agent = getAgent(user.fieldops_agent_id);
          const isCurrentUser = currentUser?.id === user.id;
          return (
            <DropdownMenuItem
              key={user.id}
              onClick={() => setCurrentUser(user)}
              className={isCurrentUser ? 'bg-accent' : ''}
              data-testid={`menu-item-user-${user.id}`}
            >
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{user.name}</span>
                  {isCurrentUser && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <span className="text-xs text-muted-foreground">
                  {agent?.name || user.fieldops_agent_id.toUpperCase()} | {user.role}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Agent assigned via helm_registry
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
