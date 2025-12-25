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
import { User, ChevronDown, CheckCircle, Loader2, Lock } from 'lucide-react';
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

  // Only owners and executives can switch users (for debugging)
  const canSwitchUsers = currentUser?.role === 'owner' || currentUser?.role === 'coo' || currentUser?.role === 'cmo';

  // If user can't switch, just show their info (no dropdown)
  if (!canSwitchUsers) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-sm">
        <User className="w-4 h-4 text-muted-foreground" />
        <span className="max-w-32 truncate">{currentUser?.name || 'User'}</span>
        {currentAgent && (
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${currentAgent.color}20`, color: currentAgent.color }}
          >
            {currentAgent.name}
          </span>
        )}
      </div>
    );
  }

  // Owner view - can switch users for debugging
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
          <Lock className="w-3 h-3" />
          <span>Owner Debug Mode</span>
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
          Switch users to test their agent view
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
