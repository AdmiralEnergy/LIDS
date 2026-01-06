import { useState } from "react";
import { Check, X, Terminal, AlertTriangle, Loader2, AlertCircle, FolderOpen } from "lucide-react";
import type { CommandProposal as CommandProposalType } from "@/lib/deepseekTools";

interface CommandProposalProps {
  proposal: CommandProposalType;
  onApprove: (proposal: CommandProposalType) => Promise<void>;
  onReject: (proposal: CommandProposalType, reason?: string) => void;
}

/**
 * Component to display a shell command proposal with approve/reject actions
 * Shows warning for potentially dangerous commands
 */
export function CommandProposal({ proposal, onApprove, onReject }: CommandProposalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsExecuting(true);
    setError(null);
    try {
      await onApprove(proposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute command');
    } finally {
      setIsExecuting(false);
    }
  };

  const isPending = proposal.status === 'pending';
  const isApproved = proposal.status === 'approved';
  const isRejected = proposal.status === 'rejected';

  return (
    <div className={`rounded-lg border ${
      isApproved ? 'border-green-500/50 bg-green-500/5' :
      isRejected ? 'border-red-500/50 bg-red-500/5' :
      proposal.isDangerous ? 'border-amber-500/50 bg-amber-500/5' :
      'border-purple-500/50 bg-purple-500/5'
    } overflow-hidden my-3`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/20 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className={`w-4 h-4 ${proposal.isDangerous ? 'text-amber-400' : 'text-purple-400'}`} />
          <span className="text-sm font-medium text-white/90">Shell Command</span>
          {proposal.isDangerous && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Potentially Dangerous
            </span>
          )}
        </div>
        {isApproved && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check className="w-3 h-3" /> Executed
          </span>
        )}
        {isRejected && (
          <span className="text-xs text-red-400 flex items-center gap-1">
            <X className="w-3 h-3" /> Rejected
          </span>
        )}
      </div>

      {/* Description */}
      <div className="px-3 py-2 text-sm text-white/70 border-b border-white/10">
        {proposal.description}
      </div>

      {/* Working Directory */}
      <div className="px-3 py-1.5 text-xs text-white/50 border-b border-white/10 flex items-center gap-1">
        <FolderOpen className="w-3 h-3" />
        <span className="font-mono">{proposal.workingDir}</span>
      </div>

      {/* Command */}
      <div className="p-3 font-mono text-sm bg-black/30">
        <div className="flex items-start gap-2">
          <span className="text-green-400 select-none">$</span>
          <pre className="text-white/90 whitespace-pre-wrap break-all">{proposal.command}</pre>
        </div>
      </div>

      {/* Output (if executed) */}
      {proposal.output && (
        <div className="px-3 py-2 border-t border-white/10 bg-black/20">
          <div className="text-xs text-white/50 mb-1">Output:</div>
          <pre className="font-mono text-xs text-green-400/80 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {proposal.output}
          </pre>
        </div>
      )}

      {/* Error from execution */}
      {proposal.error && (
        <div className="px-3 py-2 border-t border-red-500/20 bg-red-500/10">
          <div className="text-xs text-red-400/60 mb-1">Error:</div>
          <pre className="font-mono text-xs text-red-400/80 whitespace-pre-wrap">
            {proposal.error}
          </pre>
        </div>
      )}

      {/* Error message from approval attempt */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Dangerous command warning */}
      {isPending && proposal.isDangerous && (
        <div className="px-3 py-2 bg-amber-500/10 border-t border-amber-500/20 flex items-start gap-2 text-xs text-amber-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            This command may modify or delete files. Please review carefully before approving.
          </span>
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex items-center justify-end gap-2 px-3 py-2 bg-black/20 border-t border-white/10">
          <button
            onClick={() => onReject(proposal)}
            disabled={isExecuting}
            className="px-3 py-1.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={isExecuting}
            className={`px-3 py-1.5 text-xs rounded transition-colors disabled:opacity-50 flex items-center gap-1 ${
              proposal.isDangerous
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                {proposal.isDangerous ? 'Execute Anyway' : 'Approve & Execute'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
