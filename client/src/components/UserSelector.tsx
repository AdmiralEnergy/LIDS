import { useUser, DEMO_USERS } from '@/lib/user-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, ChevronDown } from 'lucide-react';
import { getAgent } from '@/lib/compass/agents';

export function UserSelector() {
  const { currentUser, setCurrentUser } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-user-selector">
          <User className="w-4 h-4" />
          <span className="max-w-32 truncate">{currentUser?.name || 'Select User'}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch User (Demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DEMO_USERS.map((user) => {
          const agent = getAgent(user.fieldops_agent_id);
          return (
            <DropdownMenuItem
              key={user.id}
              onClick={() => setCurrentUser(user)}
              className={currentUser?.id === user.id ? 'bg-accent' : ''}
              data-testid={`menu-item-user-${user.id}`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {agent?.name || user.fieldops_agent_id.toUpperCase()} | {user.role}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
