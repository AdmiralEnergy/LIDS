import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  Voicemail,
  PhoneMissed,
  UserX,
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';

interface MobileDispositionPanelProps {
  visible: boolean;
  callDuration: string;
  xpAmount?: number;
  onDisposition: (disposition: string, notes: string) => void;
  onSkip: () => void;
}

const DISPOSITIONS = [
  { id: 'contact', label: 'Contact', icon: CheckCircle, color: '#00ff88', xp: 5 },
  { id: 'callback', label: 'Callback', icon: Clock, color: '#0096ff', xp: 25 },
  { id: 'voicemail', label: 'Voicemail', icon: Voicemail, color: '#722ed1', xp: 8 },
  { id: 'no_answer', label: 'No Answer', icon: PhoneMissed, color: '#8c8c8c', xp: 2 },
  { id: 'not_interested', label: 'Not Interested', icon: UserX, color: '#fa8c16', xp: 2 },
  { id: 'wrong_number', label: 'Wrong #', icon: AlertTriangle, color: '#ff4d4f', xp: 2 },
  { id: 'dnc', label: 'DNC', icon: Ban, color: '#000', xp: 0 },
];

export function MobileDispositionPanel({
  visible,
  callDuration,
  xpAmount,
  onDisposition,
  onSkip,
}: MobileDispositionPanelProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState<string | null>(null);

  const handleDispositionSelect = (dispositionId: string) => {
    setSelectedDisposition(dispositionId);
    if (!showNotes) {
      // Quick select - submit immediately
      onDisposition(dispositionId, '');
    }
  };

  const handleSubmitWithNotes = () => {
    if (selectedDisposition) {
      onDisposition(selectedDisposition, notes);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5, 5, 5, 0.98)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px 20px',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'rgba(0, 255, 136, 0.2)',
                border: '2px solid rgba(0, 255, 136, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={32} color="#00ff88" />
            </motion.div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#f7f5f2',
                margin: '0 0 8px',
              }}
            >
              Call Completed
            </h2>
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#00ffff',
                fontFamily: 'var(--font-mono)',
                margin: 0,
              }}
            >
              {callDuration}
            </p>
            {xpAmount && xpAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 12,
                  padding: '6px 14px',
                  background: 'rgba(201, 166, 72, 0.2)',
                  border: '1px solid rgba(201, 166, 72, 0.4)',
                  borderRadius: 20,
                }}
              >
                <Zap size={16} color="#c9a648" />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#c9a648',
                  }}
                >
                  +{xpAmount} XP
                </span>
              </motion.div>
            )}
          </div>

          {/* Disposition grid */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Select Outcome
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
              }}
            >
              {DISPOSITIONS.map((disp, index) => {
                const Icon = disp.icon;
                const isSelected = selectedDisposition === disp.id;

                return (
                  <motion.button
                    key={disp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDispositionSelect(disp.id)}
                    style={{
                      padding: '16px 12px',
                      background: isSelected
                        ? `${disp.color}20`
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected
                        ? `2px solid ${disp.color}`
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={24} color={disp.color} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isSelected ? disp.color : 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      {disp.label}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'rgba(201, 166, 72, 0.8)',
                      }}
                    >
                      +{disp.xp} XP
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Notes section */}
            <motion.div
              style={{
                marginTop: 20,
              }}
            >
              <button
                onClick={() => setShowNotes(!showNotes)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: 14,
                }}
              >
                <span>Add Note</span>
                {showNotes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              <AnimatePresence>
                {showNotes && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Quick notes about this call..."
                      style={{
                        width: '100%',
                        marginTop: 12,
                        padding: 12,
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        color: '#f7f5f2',
                        fontSize: 14,
                        resize: 'none',
                        minHeight: 80,
                      }}
                    />
                    {selectedDisposition && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmitWithNotes}
                        style={{
                          width: '100%',
                          marginTop: 12,
                          padding: '14px',
                          background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                          border: 'none',
                          borderRadius: 8,
                          color: '#0c2f4a',
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Save & Next Lead
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Skip button */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              onClick={onSkip}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Skip (No XP)
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
