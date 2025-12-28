import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EnrichmentResult } from "@shared/schema";
import { 
  Home, 
  Calendar, 
  Ruler, 
  DollarSign, 
  Zap, 
  TrendingUp,
  Building,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrichmentSummaryProps {
  result: EnrichmentResult;
  className?: string;
}

interface DataItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  unit?: string;
  highlight?: boolean;
}

function DataItem({ icon, label, value, unit, highlight }: DataItemProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-md transition-colors",
      highlight && "bg-primary/5"
    )}>
      <div className="text-muted-foreground mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={cn(
          "text-lg font-semibold mt-0.5 truncate",
          highlight && "text-primary"
        )}>
          {value ?? 'N/A'}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export function EnrichmentSummary({ result, className }: EnrichmentSummaryProps) {
  const { property, utility, calculations, source } = result;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <Card className={cn("p-6 border-l-4 border-l-chart-5", className)} data-testid="card-enrichment-summary">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-chart-5/20 flex items-center justify-center">
          <Check className="w-4 h-4 text-chart-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Lead Enriched</h3>
          <p className="text-xs text-muted-foreground">
            Data source: {source === 'scraped' ? 'Property records' : 'Calculated estimates'}
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto text-xs">
          {source === 'scraped' ? 'Verified' : 'Estimated'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <DataItem 
          icon={<Ruler className="w-4 h-4" />}
          label="Square Feet"
          value={formatNumber(property.sqft)}
          unit="sqft"
        />
        <DataItem 
          icon={<Calendar className="w-4 h-4" />}
          label="Year Built"
          value={property.yearBuilt}
        />
        <DataItem 
          icon={<Home className="w-4 h-4" />}
          label="Property Type"
          value={property.propertyType || 'Single Family'}
        />
        <DataItem 
          icon={<Building className="w-4 h-4" />}
          label="Roof Type"
          value={property.roofType || 'Standard'}
        />
      </div>

      <div className="h-px bg-border my-4" />

      <div className="grid grid-cols-2 gap-1">
        <DataItem 
          icon={<DollarSign className="w-4 h-4" />}
          label="Estimated Value"
          value={formatCurrency(calculations.estimatedValue)}
          highlight
        />
        <DataItem 
          icon={<Zap className="w-4 h-4" />}
          label="Monthly Electric"
          value={formatCurrency(calculations.monthlyElectricBill)}
          unit="/mo"
        />
        {calculations.estimatedEquity !== null && (
          <DataItem 
            icon={<TrendingUp className="w-4 h-4" />}
            label="Estimated Equity"
            value={formatCurrency(calculations.estimatedEquity)}
            highlight
          />
        )}
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-md">
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Zap className="w-3 h-3" />
          <span>Utility Provider: <span className="font-medium text-foreground">{utility.name}</span></span>
        </p>
      </div>
    </Card>
  );
}
