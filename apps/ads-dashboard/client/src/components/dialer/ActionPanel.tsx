import { useState, useRef, useEffect } from 'react';
import { Phone as PhoneIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  X,
  Calendar,
  Sparkles,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { SmsMessage } from '../../hooks/useSms';

interface ActionPanelProps {
  visible: boolean;
  onClose: () => void;
  leadName?: string;
  leadPhone?: string;
  leadId?: string;
  onSendSms: (message: string, phoneNumber?: string) => void;
  isSending?: boolean;
  messages?: SmsMessage[];
}

const QUICK_MESSAGES = [
  { id: 'intro', label: 'Intro', message: "Hi! This is {rep} from Admiral Energy. I just tried calling - do you have a moment to chat about reducing your electric bill?" },
  { id: 'followup', label: 'Follow Up', message: "Hey, just following up on our conversation. Let me know if you have any questions about going solar!" },
  { id: 'missed', label: 'Missed Call', message: "Sorry I missed you! I was calling about the solar savings program in your area. When's a good time to connect?" },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusIcon(status?: string) {
  switch (status) {
    case 'pending':
      return <Clock size={12} color="rgba(255, 255, 255, 0.4)" />;
    case 'sent':
      return <Check size={12} color="rgba(255, 255, 255, 0.5)" />;
    case 'delivered':
      return <CheckCheck size={12} color="#00ff88" />;
    case 'failed':
      return <AlertCircle size={12} color="#ff4444" />;
    default:
      return null;
  }
}

export function ActionPanel({
  visible,
  onClose,
  leadName,
  leadPhone,
  leadId,
  onSendSms,
  isSending = false,
  messages = [],
}: ActionPanelProps) {
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'sms' | 'schedule'>('sms');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize/reset phone number when panel opens or lead changes
  useEffect(() => {
    if (visible) {
      setPhoneNumber(leadPhone || '');
    }
  }, [visible, leadPhone]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (visible && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, visible]);

  const handleQuickMessage = (template: string) => {
    // Replace {rep} with placeholder - would come from user context
    const filled = template.replace('{rep}', 'your rep');
    setMessage(filled);
  };

  const handleSend = () => {
    if (message.trim() && !isSending && phoneNumber.trim()) {
      onSendSms(message.trim(), phoneNumber.trim());
      setMessage('');
    }
  };

  // Format phone for display
  const formatPhoneDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const canSend = message.trim() && phoneNumber.trim() && !isSending;

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = formatDate(new Date(msg.timestamp));
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(msg);
    return groups;
  }, {} as Record<string, SmsMessage[]>);

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
              maxHeight: '80vh',
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
              <div style={{ flex: 1, marginRight: 12 }}>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#f7f5f2',
                    margin: 0,
                  }}
                >
                  {leadName || 'New Message'}
                </h3>
                {/* Editable phone number input */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 8,
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    borderRadius: 8,
                  }}
                >
                  <PhoneIcon size={16} color="#00ffff" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#00ffff',
                      fontSize: 15,
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                    }}
                  />
                </div>
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
                {messages.length > 0 && (
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 10,
                      background: 'rgba(0, 255, 255, 0.3)',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {messages.length}
                  </span>
                )}
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
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {activeTab === 'sms' ? (
                <>
                  {/* Message History */}
                  {messages.length > 0 && (
                    <div
                      style={{
                        flex: 1,
                        marginBottom: 16,
                        maxHeight: 200,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                          {/* Date Separator */}
                          <div
                            style={{
                              textAlign: 'center',
                              padding: '8px 0',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: 'rgba(255, 255, 255, 0.4)',
                                background: 'rgba(0, 0, 0, 0.3)',
                                padding: '4px 12px',
                                borderRadius: 12,
                              }}
                            >
                              {date}
                            </span>
                          </div>

                          {/* Messages */}
                          {msgs.map((msg) => (
                            <div
                              key={msg.id}
                              style={{
                                display: 'flex',
                                justifyContent: msg.direction === 'sent' ? 'flex-end' : 'flex-start',
                                marginBottom: 4,
                              }}
                            >
                              <div
                                style={{
                                  maxWidth: '75%',
                                  padding: '10px 14px',
                                  borderRadius: msg.direction === 'sent' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                  background: msg.direction === 'sent'
                                    ? 'linear-gradient(135deg, #0096ff 0%, #0078cc 100%)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                  border: msg.direction === 'received' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                                }}
                              >
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 14,
                                    color: '#f7f5f2',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {msg.text}
                                </p>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: 4,
                                    marginTop: 4,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: 'rgba(255, 255, 255, 0.5)',
                                    }}
                                  >
                                    {formatTime(new Date(msg.timestamp))}
                                  </span>
                                  {msg.direction === 'sent' && getStatusIcon(msg.status)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}

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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 50px 14px 14px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 12,
                        color: '#f7f5f2',
                        fontSize: 15,
                        resize: 'none',
                        minHeight: 80,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!canSend}
                      style={{
                        position: 'absolute',
                        right: 10,
                        bottom: 10,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: canSend
                          ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                          : 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: canSend ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Send
                        size={18}
                        color={canSend ? '#0c2f4a' : 'rgba(255, 255, 255, 0.3)'}
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
