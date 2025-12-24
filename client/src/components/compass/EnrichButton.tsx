import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Lead, EnrichmentResult } from "@shared/schema";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface EnrichButtonProps {
  lead: Lead;
  onComplete?: (result: EnrichmentResult) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export function EnrichButton({ 
  lead, 
  onComplete, 
  onError,
  className,
  variant = 'default'
}: EnrichButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnrich = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest<EnrichmentResult>('POST', '/api/enrichment/enrich', {
        leadId: lead.id,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        county: lead.county,
        mortgageBalance: lead.mortgageBalance,
      });

      onComplete?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enrich lead';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Button
        onClick={handleEnrich}
        variant="destructive"
        size={variant === 'compact' ? 'sm' : 'default'}
        className={cn("gap-2", className)}
        data-testid="button-enrich-retry"
      >
        <AlertCircle className="w-4 h-4" />
        Retry Enrichment
      </Button>
    );
  }

  return (
    <Button
      onClick={handleEnrich}
      disabled={isLoading}
      variant="default"
      size={variant === 'compact' ? 'sm' : 'default'}
      className={cn(
        "gap-2 bg-gradient-to-r from-chart-3 to-chart-1",
        className
      )}
      data-testid="button-enrich-lead"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Enriching...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          {variant === 'compact' ? 'Enrich' : 'Enrich Lead'}
        </>
      )}
    </Button>
  );
}
