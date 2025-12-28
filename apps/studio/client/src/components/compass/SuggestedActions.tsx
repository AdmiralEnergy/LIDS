import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SuggestedAction } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface SuggestedActionsProps {
  actions: SuggestedAction[];
  onExecute?: (action: SuggestedAction) => Promise<void>;
  className?: string;
}

export function SuggestedActions({ actions, onExecute, className }: SuggestedActionsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleClick = async (action: SuggestedAction) => {
    if (!onExecute) return;
    
    setLoadingId(action.id);
    try {
      await onExecute(action);
    } finally {
      setLoadingId(null);
    }
  };

  if (!actions.length) return null;

  return (
    <div className={cn("mt-4 flex flex-wrap gap-2", className)}>
      {actions.map((action, index) => {
        const isLoading = loadingId === action.id;
        
        return (
          <Button
            key={action.id}
            onClick={() => handleClick(action)}
            variant={action.destructive ? "destructive" : "secondary"}
            size="sm"
            disabled={isLoading}
            className={cn(
              "transition-all duration-150",
              !action.destructive && "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            data-testid={`button-action-${action.id}`}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <span className="font-mono text-xs mr-1.5 opacity-60">{index + 1}.</span>
            )}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
