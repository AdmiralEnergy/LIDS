import { useUser } from "@/lib/user-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, ChevronDown, LogOut, Loader2 } from "lucide-react";
import { getAgent } from "@/lib/compass/agents";

export function UserSelector() {
  const { currentUser, logout, isLoading } = useUser();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className="gap-2" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </Button>
    );
  }

  if (!currentUser) {
    return null;
  }

  const currentAgent = getAgent(currentUser.fieldops_agent_id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-user-selector">
          <User className="w-4 h-4" />
          <span className="max-w-32 truncate">{currentUser.name}</span>
          {currentAgent && (
            <span className="text-xs text-muted-foreground">({currentAgent.name})</span>
          )}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{currentUser.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {currentUser.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Role:</span>
            <span className="font-medium">{currentUser.role.toUpperCase()}</span>
          </div>
          {currentAgent && (
            <div className="flex items-center justify-between mt-1">
              <span>Agent:</span>
              <span
                className="font-medium px-1.5 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: `${currentAgent.color}20`, color: currentAgent.color }}
              >
                {currentAgent.name}
              </span>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
