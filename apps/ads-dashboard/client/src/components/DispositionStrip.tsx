import { Button, Input, Typography } from 'antd';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Voicemail, PhoneMissed, XCircle, AlertTriangle, Ban, MessageSquare, SkipForward } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const { TextArea } = Input;
const { Text } = Typography;

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  visible: boolean;
  callDuration: string;
  onDisposition: (disposition: string, notes: string) => void;
  onSkip: () => void;
}

const DISPOSITIONS = [
  { key: 'contact', label: 'Contact', shortLabel: 'Contact', color: 'bg-green-500', borderColor: 'border-green-500', icon: CheckCircle },
  { key: 'callback', label: 'Callback', shortLabel: 'CB', color: 'bg-blue-500', borderColor: 'border-blue-500', icon: Clock },
  { key: 'voicemail', label: 'VM', shortLabel: 'VM', color: 'bg-purple-600', borderColor: 'border-purple-600', icon: Voicemail },
  { key: 'no_answer', label: 'NA', shortLabel: 'NA', color: 'bg-gray-500', borderColor: 'border-gray-500', icon: PhoneMissed },
  { key: 'not_interested', label: 'NI', shortLabel: 'NI', color: 'bg-orange-500', borderColor: 'border-orange-500', icon: XCircle },
  { key: 'wrong_number', label: 'WN', shortLabel: 'WN', color: 'bg-red-500', borderColor: 'border-red-500', icon: AlertTriangle },
  { key: 'dnc', label: 'DNC', shortLabel: 'DNC', color: 'bg-black', borderColor: 'border-white/20', icon: Ban },
];

const containerVariants = {
  hidden: { opacity: 0, y: 20, height: 0 },
  visible: { 
    opacity: 1, 
    y: 0, 
    height: 'auto',
    transition: { 
      duration: 0.3,
      when: "beforeChildren",
      staggerChildren: 0.05
    }
  },
  exit: { opacity: 0, y: -20, height: 0 }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.8 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

/**
 * DispositionStrip - Inline one-click disposition UI
 *
 * Replaces the old modal with a fast, inline workflow:
 * - Single row of disposition chips
 * - One-click to save and auto-advance
 * - Optional notes (click "Add Note" to expand)
 * - Skip button to advance without logging
 */
export function DispositionStrip({ visible, callDuration, onDisposition, onSkip }: Props) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [pendingDisposition, setPendingDisposition] = useState<string | null>(null);

  const handleDispositionClick = (disposition: string) => {
    if (showNotes) {
      // If notes panel is open, set pending and wait for submit
      setPendingDisposition(disposition);
    } else {
      // One-click: immediately save and advance
      onDisposition(disposition, '');
      resetState();
    }
  };

  const handleSubmitWithNotes = () => {
    if (pendingDisposition) {
      onDisposition(pendingDisposition, notes);
      resetState();
    }
  };

  const resetState = () => {
    setShowNotes(false);
    setNotes('');
    setPendingDisposition(null);
  };

  const handleSkip = () => {
    resetState();
    onSkip();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full mt-4 p-4 bg-[#0a1929]/80 backdrop-blur-md border border-[#00ffff]/20 rounded-xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: 2 }}
              className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
            />
            <span className="font-mono text-[11px] tracking-widest uppercase text-white/70">
              Call ended • {callDuration}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white transition-colors"
          >
            <SkipForward size={14} />
            Skip
          </button>
        </div>

        {/* Disposition Chips - Single Row */}
        <div className={cn("flex flex-wrap gap-2", showNotes ? "mb-3" : "mb-0")}>
          {DISPOSITIONS.map(d => {
            const Icon = d.icon;
            const isSelected = pendingDisposition === d.key;
            return (
              <motion.button
                key={d.key}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDispositionClick(d.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-medium transition-all",
                  isSelected 
                    ? cn(d.color, d.borderColor, "text-white shadow-md") 
                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                )}
                data-testid={`disposition-chip-${d.key}`}
              >
                <Icon size={14} />
                {d.shortLabel}
              </motion.button>
            );
          })}

          {/* Add Note toggle */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotes(!showNotes)}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-colors",
              showNotes ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10"
            )}
            data-testid="disposition-add-note"
          >
            <MessageSquare size={14} />
            Note
          </motion.button>
        </div>

        {/* Notes Panel (collapsible) */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col gap-3 pt-2">
                <TextArea
                  placeholder="Quick notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  autoFocus
                  className="!bg-black/30 !border-white/10 !text-white !placeholder-white/30 !rounded-lg focus:!border-[#00ffff]/40"
                  data-testid="disposition-notes-input"
                />
                
                <div className="flex justify-between items-center">
                   {!pendingDisposition ? (
                    <span className="text-[11px] text-white/40 italic">
                      Select a disposition above to continue
                    </span>
                   ) : <span />}
                   
                   {pendingDisposition && (
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        ghost
                        onClick={() => {
                          setPendingDisposition(null);
                          setShowNotes(false);
                          setNotes('');
                        }}
                        className="!text-white/60 hover:!text-white border-none"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        onClick={handleSubmitWithNotes}
                        className="!bg-[#00ff88] !border-[#00ff88] !text-black font-semibold hover:!bg-[#00cc6a]"
                        data-testid="disposition-save-with-notes"
                      >
                        Save & Next
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}