import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  X,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ActionPanelProps {
  visible: boolean;
  onClose: () => void;
  leadName?: string;
  leadPhone?: string;
  onSendSms: (message: string) => void;
  isSending?: boolean;
}

const QUICK_MESSAGES = [
  { id: 'intro', label: 'Intro', message: "Hi! This is {rep} from Admiral Energy. I just tried calling - do you have a moment to chat about reducing your electric bill?" },
  { id: 'followup', label: 'Follow Up', message: "Hey, just following up on our conversation. Let me know if you have any questions about going solar!" },
  { id: 'missed', label: 'Missed Call', message: "Sorry I missed you! I was calling about the solar savings program in your area. When's a good time to connect?" },
];

export function ActionPanel({
  visible,
  onClose,
  leadName,
  leadPhone,
  onSendSms,
  isSending = false,
}: ActionPanelProps) {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'sms' | 'schedule'>('sms');

  const handleQuickMessage = (template: string) => {
    // Replace {rep} with placeholder - would come from user context
    const filled = template.replace('{rep}', 'your rep');
    setMessage(filled);
  };

  const handleSend = () => {
    if (message.trim() && !isSending) {
      onSendSms(message.trim());
      setMessage('');
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 90,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(12, 47, 74, 0.98)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '70vh',
              zIndex: 95,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Handle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '12px 0 8px',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: 2,
                }}
              />
            </div>

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 20px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#f7f5f2',
                    margin: 0,
                  }}
                >
                  {leadName || 'Send Message'}
                </h3>
                {leadPhone && (
                  <p
                    style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.5)',
                      margin: '4px 0 0',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {leadPhone}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} color="rgba(255, 255, 255, 0.7)" />
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                padding: '12px 20px',
                gap: 8,
              }}
            >
              <button
                onClick={() => setActiveTab('sms')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: activeTab === 'sms' ? 'rgba(0, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: activeTab === 'sms' ? '1px solid rgba(0, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: activeTab === 'sms' ? '#00ffff' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <MessageSquare size={16} />
                SMS
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: activeTab === 'schedule' ? 'rgba(201, 166, 72, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: activeTab === 'schedule' ? '1px solid rgba(201, 166, 72, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: activeTab === 'schedule' ? '#c9a648' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <Calendar size={16} />
                Schedule
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                padding: '0 20px 20px',
                overflowY: 'auto',
              }}
            >
              {activeTab === 'sms' ? (
                <>
                  {/* Quick messages */}
                  <div style={{ marginBottom: 16 }}>
                    <p
                      style={{
                        fontSize: 11,
                        color: 'rgba(255, 255, 255, 0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 10,
                      }}
                    >
                      <Sparkles size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      Quick Messages
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {QUICK_MESSAGES.map((qm) => (
                        <button
                          key={qm.id}
                          onClick={() => handleQuickMessage(qm.message)}
                          style={{
                            padding: '8px 14px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: 20,
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          {qm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message input */}
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      style={{
                        width: '100%',
                        padding: '14px 50px 14px 14px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 12,
                        color: '#f7f5f2',
                        fontSize: 15,
                        resize: 'none',
                        minHeight: 100,
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!message.trim() || isSending}
                      style={{
                        position: 'absolute',
                        right: 10,
                        bottom: 10,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: message.trim() && !isSending
                          ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                          : 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: message.trim() && !isSending ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Send
                        size={18}
                        color={message.trim() && !isSending ? '#0c2f4a' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </button>
                  </div>

                  <p
                    style={{
                      fontSize: 11,
                      color: 'rgba(255, 255, 255, 0.3)',
                      marginTop: 12,
                      textAlign: 'center',
                    }}
                  >
                    Message will be sent from your configured number
                  </p>
                </>
              ) : (
                // Schedule tab - placeholder
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      margin: '0 auto 16px',
                      borderRadius: '50%',
                      background: 'rgba(201, 166, 72, 0.2)',
                      border: '2px dashed rgba(201, 166, 72, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Calendar size={28} color="#c9a648" />
                  </div>
                  <h4
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#f7f5f2',
                      margin: '0 0 8px',
                    }}
                  >
                    Scheduling Coming Soon
                  </h4>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.5)',
                      margin: 0,
                    }}
                  >
                    Book appointments directly from the dialer
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
