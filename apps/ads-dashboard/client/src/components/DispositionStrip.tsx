import { Button, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Voicemail, PhoneMissed, XCircle, AlertTriangle, Ban, MessageSquare, SkipForward } from 'lucide-react';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  visible: boolean;
  callDuration: string;
  onDisposition: (disposition: string, notes: string) => void;
  onSkip: () => void;
}

const DISPOSITIONS = [
  { key: 'contact', label: 'Contact', shortLabel: 'Contact', color: '#52c41a', icon: CheckCircle },
  { key: 'callback', label: 'Callback', shortLabel: 'CB', color: '#1890ff', icon: Clock },
  { key: 'voicemail', label: 'VM', shortLabel: 'VM', color: '#722ed1', icon: Voicemail },
  { key: 'no_answer', label: 'NA', shortLabel: 'NA', color: '#8c8c8c', icon: PhoneMissed },
  { key: 'not_interested', label: 'NI', shortLabel: 'NI', color: '#fa8c16', icon: XCircle },
  { key: 'wrong_number', label: 'WN', shortLabel: 'WN', color: '#f5222d', icon: AlertTriangle },
  { key: 'dnc', label: 'DNC', shortLabel: 'DNC', color: '#000000', icon: Ban },
];

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
        initial={{ opacity: 0, y: 20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          marginTop: 16,
          padding: 16,
          background: 'rgba(0, 255, 255, 0.03)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          borderRadius: 12,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: 2 }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#faad14',
                boxShadow: '0 0 10px #faad14',
              }}
            />
            <Text style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
            }}>
              Call ended • {callDuration}
            </Text>
          </div>
          <Button
            type="text"
            size="small"
            icon={<SkipForward size={14} />}
            onClick={handleSkip}
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          >
            Skip
          </Button>
        </div>

        {/* Disposition Chips - Single Row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: showNotes ? 12 : 0,
        }}>
          {DISPOSITIONS.map(d => {
            const Icon = d.icon;
            const isSelected = pendingDisposition === d.key;
            return (
              <motion.div
                key={d.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="small"
                  onClick={() => handleDispositionClick(d.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    height: 32,
                    backgroundColor: isSelected ? d.color : 'rgba(255,255,255,0.05)',
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.85)',
                    border: `1px solid ${isSelected ? d.color : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  data-testid={`disposition-chip-${d.key}`}
                >
                  <Icon size={14} />
                  {d.shortLabel}
                </Button>
              </motion.div>
            );
          })}

          {/* Add Note toggle */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="small"
              type={showNotes ? 'primary' : 'text'}
              onClick={() => setShowNotes(!showNotes)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                height: 32,
                borderRadius: 16,
                fontSize: 12,
                color: showNotes ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
              data-testid="disposition-add-note"
            >
              <MessageSquare size={14} />
              Note
            </Button>
          </motion.div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <TextArea
                  placeholder="Quick notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  autoFocus
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                  data-testid="disposition-notes-input"
                />
                {pendingDisposition && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        setPendingDisposition(null);
                        setShowNotes(false);
                        setNotes('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleSubmitWithNotes}
                      style={{ background: '#00ff88', borderColor: '#00ff88', color: '#000' }}
                      data-testid="disposition-save-with-notes"
                    >
                      Save & Next
                    </Button>
                  </div>
                )}
                {!pendingDisposition && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Select a disposition above, then Save & Next
                  </Text>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
