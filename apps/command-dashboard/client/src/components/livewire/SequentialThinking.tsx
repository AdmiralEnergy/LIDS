import { Brain, Package, MapPin, Target, FileEdit, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

/**
 * Sequential Thinking Visualization Component
 *
 * Phase 4: LiveWire AutoGen Intelligence
 *
 * Displays the AI agent reasoning chain with:
 * - ProductSpecialist: Relevant products found
 * - LeadScout: Intent score and reasoning
 * - TerritoryAnalyst: State/rebate eligibility
 * - DraftingAgent: Final proposed message
 */

export interface ThinkingStep {
  agent: 'ProductSpecialist' | 'LeadScout' | 'TerritoryAnalyst' | 'DraftingAgent' | string;
  thought: string;
  status: 'complete' | 'processing' | 'rejected' | 'pending';
  data?: {
    // ProductSpecialist data
    products?: string[];
    knowledgeBaseContext?: string;
    // LeadScout data
    intentScore?: number;
    intentSignals?: string[];
    // TerritoryAnalyst data
    state?: string;
    rebates?: string[];
    eligible?: boolean;
    // DraftingAgent data
    draftMessage?: string;
    hooks?: string[];
  };
  timestamp?: string;
}

interface SequentialThinkingProps {
  steps: ThinkingStep[];
  isProcessing?: boolean;
}

// Agent configuration with icons and colors
const AGENT_CONFIG: Record<string, {
  icon: typeof Brain;
  label: string;
  color: string;
  bgColor: string;
}> = {
  ProductSpecialist: {
    icon: Package,
    label: 'Product Specialist',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
  },
  LeadScout: {
    icon: Target,
    label: 'Lead Scout',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
  },
  TerritoryAnalyst: {
    icon: MapPin,
    label: 'Territory Analyst',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
  },
  DraftingAgent: {
    icon: FileEdit,
    label: 'Drafting Agent',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/20',
  },
};

function getStatusIcon(status: ThinkingStep['status']) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'processing':
      return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pending':
      return <AlertCircle className="w-4 h-4 text-zinc-500" />;
  }
}

function StepCard({ step, isLast }: { step: ThinkingStep; isLast: boolean }) {
  const config = AGENT_CONFIG[step.agent] || {
    icon: Brain,
    label: step.agent,
    color: 'text-zinc-500',
    bgColor: 'bg-zinc-500/20',
  };
  const Icon = config.icon;

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className={`absolute left-[19px] top-10 w-0.5 h-full -mb-2 ${
          step.status === 'complete' ? 'bg-green-500/30' :
          step.status === 'rejected' ? 'bg-red-500/30' : 'bg-border'
        }`} />
      )}

      <div className={`flex gap-3 p-3 rounded-xl border transition-all ${
        step.status === 'processing' ? 'bg-yellow-500/5 border-yellow-500/30 shadow-lg shadow-yellow-500/10' :
        step.status === 'rejected' ? 'bg-red-500/5 border-red-500/20' :
        step.status === 'complete' ? 'bg-card border-border' : 'bg-muted/30 border-border opacity-50'
      }`}>
        {/* Agent Icon */}
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.bgColor}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`text-xs font-bold uppercase tracking-widest ${config.color}`}>
              {config.label}
            </h4>
            {getStatusIcon(step.status)}
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed">
            {step.thought}
          </p>

          {/* Agent-specific data displays */}
          {step.data && step.status === 'complete' && (
            <div className="mt-2 space-y-2">
              {/* ProductSpecialist: Products found */}
              {step.data.products && step.data.products.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.data.products.map((product, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full font-medium">
                      {product}
                    </span>
                  ))}
                </div>
              )}

              {/* LeadScout: Intent score */}
              {step.data.intentScore !== undefined && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        step.data.intentScore >= 80 ? 'bg-green-500' :
                        step.data.intentScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${step.data.intentScore}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${
                    step.data.intentScore >= 80 ? 'text-green-500' :
                    step.data.intentScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {step.data.intentScore}%
                  </span>
                </div>
              )}

              {/* LeadScout: Intent signals */}
              {step.data.intentSignals && step.data.intentSignals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.data.intentSignals.map((signal, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full font-medium">
                      {signal}
                    </span>
                  ))}
                </div>
              )}

              {/* TerritoryAnalyst: State and rebates */}
              {step.data.state && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full font-bold">
                    {step.data.state}
                  </span>
                  {step.data.eligible !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      step.data.eligible
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {step.data.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                    </span>
                  )}
                </div>
              )}

              {step.data.rebates && step.data.rebates.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.data.rebates.map((rebate, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full font-medium">
                      {rebate}
                    </span>
                  ))}
                </div>
              )}

              {/* DraftingAgent: Hooks used */}
              {step.data.hooks && step.data.hooks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.data.hooks.map((hook, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-500 rounded-full font-medium">
                      🎣 {hook}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          {step.timestamp && (
            <p className="text-[10px] text-muted-foreground mt-2">
              {step.timestamp}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SequentialThinking({ steps, isProcessing }: SequentialThinkingProps) {
  return (
    <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden h-full">
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" />
          Agent Reasoning Chain
        </h3>
        {isProcessing && (
          <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full animate-pulse">
            PROCESSING
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Brain className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">No reasoning data</p>
            <p className="text-xs mt-1">Select a lead to view the agent's thinking process</p>
          </div>
        ) : (
          steps.map((step, index) => (
            <StepCard
              key={`${step.agent}-${index}`}
              step={step}
              isLast={index === steps.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
