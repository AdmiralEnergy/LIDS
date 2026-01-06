import { useState } from "react";
import { Check, X, FileText, FilePlus, Loader2, AlertCircle } from "lucide-react";
import type { EditProposal } from "@/lib/deepseekTools";

interface CodeEditProposalProps {
  proposal: EditProposal;
  onApprove: (proposal: EditProposal) => Promise<void>;
  onReject: (proposal: EditProposal, reason?: string) => void;
}

/**
 * Component to display a code edit proposal with approve/reject actions
 * Shows a diff-like view of the proposed changes
 */
export function CodeEditProposal({ proposal, onApprove, onReject }: CodeEditProposalProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsApplying(true);
    setError(null);
    try {
      await onApprove(proposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply edit');
    } finally {
      setIsApplying(false);
    }
  };

  const isNewFile = proposal.type === 'newFile';
  const isPending = proposal.status === 'pending';
  const isApproved = proposal.status === 'approved';
  const isRejected = proposal.status === 'rejected';

  return (
    <div className={`rounded-lg border ${
      isApproved ? 'border-green-500/50 bg-green-500/5' :
      isRejected ? 'border-red-500/50 bg-red-500/5' :
      'border-blue-500/50 bg-blue-500/5'
    } overflow-hidden my-3`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/20 border-b border-white/10">
        <div className="flex items-center gap-2">
          {isNewFile ? (
            <FilePlus className="w-4 h-4 text-green-400" />
          ) : (
            <FileText className="w-4 h-4 text-blue-400" />
          )}
          <span className="text-sm font-mono text-white/90">{proposal.path}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            isNewFile ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {isNewFile ? 'New File' : 'Edit'}
          </span>
        </div>
        {isApproved && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check className="w-3 h-3" /> Applied
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

      {/* Content Preview */}
      <div className="p-3 font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
        {isNewFile ? (
          // New file: show content preview
          <div className="text-green-400/80">
            <pre className="whitespace-pre-wrap">{proposal.content?.slice(0, 1000)}{(proposal.content?.length || 0) > 1000 ? '\n...(truncated)' : ''}</pre>
          </div>
        ) : (
          // Edit: show diff-like view
          <div className="space-y-2">
            <div className="rounded bg-red-500/10 p-2 border border-red-500/20">
              <div className="text-red-400/60 text-[10px] mb-1">- REMOVE</div>
              <pre className="text-red-400/80 whitespace-pre-wrap">{proposal.search}</pre>
            </div>
            <div className="rounded bg-green-500/10 p-2 border border-green-500/20">
              <div className="text-green-400/60 text-[10px] mb-1">+ ADD</div>
              <pre className="text-green-400/80 whitespace-pre-wrap">{proposal.replace}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex items-center justify-end gap-2 px-3 py-2 bg-black/20 border-t border-white/10">
          <button
            onClick={() => onReject(proposal)}
            disabled={isApplying}
            className="px-3 py-1.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={isApplying}
            className="px-3 py-1.5 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                Approve & Apply
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
