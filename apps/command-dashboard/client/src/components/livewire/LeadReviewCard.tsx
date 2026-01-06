import { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Edit3,
  X,
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

/**
 * Lead Review Card Component
 *
 * Phase 4: LiveWire AutoGen Intelligence
 *
 * Features:
 * - Split view: Raw content (left) + AI Analysis & Draft (right)
 * - Approve & Send action
 * - Edit Draft capability
 * - Reject with required reason (feedback loop)
 */

export interface LeadContent {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  url?: string;
  createdAt?: string;
}

export interface LeadReviewCardProps {
  lead: LeadContent;
  draftMessage?: string;
  intentScore: number;
  isOverridden?: boolean;
  onApprove: (message: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onOverride?: () => Promise<void>;
  isSubmitting?: boolean;
}

// Predefined rejection reasons for quick selection
const REJECTION_REASONS = [
  { id: 'not_intent', label: 'No buying intent', description: 'User is not looking to purchase' },
  { id: 'wrong_territory', label: 'Wrong territory', description: 'Outside service area' },
  { id: 'diy_user', label: 'DIY user', description: 'Already installed or doing DIY' },
  { id: 'commercial', label: 'Commercial lead', description: 'Business/commercial, not residential' },
  { id: 'competitor', label: 'Competitor', description: 'Industry professional or competitor' },
  { id: 'spam', label: 'Spam/Bot', description: 'Automated or spam content' },
  { id: 'other', label: 'Other', description: 'Custom reason' },
];

export function LeadReviewCard({
  lead,
  draftMessage,
  intentScore,
  isOverridden = false,
  onApprove,
  onReject,
  onOverride,
  isSubmitting = false,
}: LeadReviewCardProps) {
  const { canApprove } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(draftMessage || '');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOverriding, setIsOverriding] = useState(false);

  const handleOverride = async () => {
    if (!onOverride) return;
    setError(null);
    setIsOverriding(true);
    try {
      await onOverride();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Override failed');
    } finally {
      setIsOverriding(false);
    }
  };

  const handleApprove = async () => {
    if (!canApprove) return;
    setError(null);

    const messageToSend = isEditing ? editedMessage : (draftMessage || '');
    if (!messageToSend.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      await onApprove(messageToSend);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleReject = async () => {
    setError(null);

    const reason = selectedReason === 'other' ? customReason : selectedReason;
    if (!reason) {
      setError('Please select or enter a rejection reason');
      return;
    }

    try {
      await onReject(reason);
      setShowRejectModal(false);
      setSelectedReason(null);
      setCustomReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  const handleStartEdit = () => {
    setEditedMessage(draftMessage || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedMessage(draftMessage || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-500" />
          Human Review
        </h3>
        <div className="flex items-center gap-2">
          {isOverridden && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
              Overridden
            </span>
          )}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            intentScore >= 80 ? 'bg-green-500/20 text-green-500' :
            intentScore >= 50 ? 'bg-yellow-500/20 text-yellow-500' :
            'bg-red-500/20 text-red-500'
          }`}>
            Intent: {intentScore}%
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {/* Raw Lead Content Section */}
        <div className="bg-muted/30 rounded-xl border border-border p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {lead.subreddit}
              </span>
              <span className="text-[10px] text-muted-foreground mx-2">•</span>
              <span className="text-[10px] text-muted-foreground italic">
                u/{lead.author}
              </span>
            </div>
            {lead.url && (
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="View original post"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <h4 className="font-semibold text-sm mb-2">{lead.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {lead.content}
          </p>
        </div>

        {/* Draft Message Section */}
        {draftMessage ? (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                AI-Generated Draft
              </span>
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 min-h-[120px] p-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
                  placeholder="Edit your message..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-4 relative overflow-auto">
                <span className="absolute top-2 right-2 text-[8px] font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded uppercase">
                  Draft
                </span>
                <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                  {draftMessage}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-muted/30 rounded-xl border border-dashed border-border">
            <AlertTriangle className="w-10 h-10 mb-3 text-amber-500/50" />
            <p className="text-sm font-medium text-muted-foreground">No draft generated</p>
            <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
              Lead was filtered by the agent chain (Intent: {intentScore}%)
            </p>
            {onOverride && (
              <button
                onClick={handleOverride}
                disabled={isOverriding || isSubmitting}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-all font-bold text-xs uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOverriding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Draft...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Override AI & Generate Draft
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {draftMessage && canApprove && (
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-bold text-xs uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ThumbsDown className="w-4 h-4" />
              )}
              Reject Lead
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-green-500 text-black rounded-xl hover:bg-green-400 transition-all font-bold text-xs uppercase tracking-wide shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4" />
                  Approve & Send
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg">Reject Lead</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Select a reason for rejection. This feedback helps improve the AI.
              </p>

              {REJECTION_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedReason === reason.id
                      ? 'bg-red-500/10 border-red-500/30 ring-1 ring-red-500/30'
                      : 'bg-muted/30 border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="font-medium text-sm">{reason.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{reason.description}</div>
                </button>
              ))}

              {selectedReason === 'other' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom reason..."
                  className="w-full mt-2 p-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                  rows={3}
                />
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting || (!selectedReason || (selectedReason === 'other' && !customReason.trim()))}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-400 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
