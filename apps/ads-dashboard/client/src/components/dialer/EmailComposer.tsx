import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, X, Sparkles, Clock, Check, AlertCircle } from 'lucide-react';
import { useEmail } from '../../hooks/useEmail';

interface EmailComposerProps {
  visible: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName?: string;
}

const EMAIL_TEMPLATES = [
  {
    id: 'intro',
    label: 'Introduction',
    subject: 'Quick Question About Your Home Energy',
    body: `Hi {name},

I hope this message finds you well! I recently reached out about an exciting opportunity to reduce your electric bill through solar energy.

Would you be open to a quick 5-minute conversation to see if this could be a good fit for your home?

Best regards,
Admiral Energy Team`,
  },
  {
    id: 'followup',
    label: 'Follow Up',
    subject: 'Following Up - Solar Savings for Your Home',
    body: `Hi {name},

I wanted to follow up on our recent conversation about solar energy for your home.

Do you have any questions I can help answer? I'd be happy to provide more information about how much you could save.

Looking forward to hearing from you!

Best,
Admiral Energy Team`,
  },
  {
    id: 'quote',
    label: 'Quote Request',
    subject: 'Your Custom Solar Quote is Ready',
    body: `Hi {name},

Great news! Based on your home's information, we've prepared a custom solar savings estimate just for you.

Would you like to schedule a quick call to go over the details? I'm available at your convenience.

Best regards,
Admiral Energy Team`,
  },
];

export function EmailComposer({
  visible,
  onClose,
  recipientEmail,
  recipientName,
}: EmailComposerProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const { sendEmail, sending, error } = useEmail(recipientEmail);

  const applyTemplate = useCallback((template: typeof EMAIL_TEMPLATES[0]) => {
    const name = recipientName?.split(' ')[0] || 'there';
    setSubject(template.subject);
    setBody(template.body.replace(/{name}/g, name));
  }, [recipientName]);

  const handleSend = useCallback(async () => {
    if (!subject.trim() || !body.trim()) return;

    setSendStatus('sending');
    try {
      await sendEmail(subject.trim(), body.trim());
      setSendStatus('sent');
      // Reset after showing success
      setTimeout(() => {
        setSubject('');
        setBody('');
        setSendStatus('idle');
        onClose();
      }, 1500);
    } catch (e) {
      setSendStatus('error');
      setTimeout(() => setSendStatus('idle'), 3000);
    }
  }, [subject, body, sendEmail, onClose]);

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
              maxHeight: '85vh',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(201, 166, 72, 0.2)',
                    border: '1px solid rgba(201, 166, 72, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mail size={18} color="#c9a648" />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#f7f5f2',
                      margin: 0,
                    }}
                  >
                    Compose Email
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.5)',
                      margin: '4px 0 0',
                    }}
                  >
                    To: {recipientEmail}
                  </p>
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

            {/* Content */}
            <div
              style={{
                flex: 1,
                padding: '16px 20px 20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Templates */}
              <div>
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
                  Quick Templates
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {EMAIL_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(201, 166, 72, 0.15)',
                        border: '1px solid rgba(201, 166, 72, 0.3)',
                        borderRadius: 20,
                        color: '#c9a648',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: 6,
                  }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    color: '#f7f5f2',
                    fontSize: 15,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Body */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: 6,
                  }}
                >
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Compose your email..."
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: '14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    color: '#f7f5f2',
                    fontSize: 15,
                    resize: 'none',
                    minHeight: 150,
                    outline: 'none',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    background: 'rgba(255, 68, 68, 0.15)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    borderRadius: 10,
                  }}
                >
                  <AlertCircle size={16} color="#ff4444" />
                  <span style={{ fontSize: 13, color: '#ff4444' }}>{error}</span>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!subject.trim() || !body.trim() || sending || sendStatus === 'sent'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '14px 24px',
                  background:
                    sendStatus === 'sent'
                      ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                      : sendStatus === 'error'
                        ? 'rgba(255, 68, 68, 0.2)'
                        : subject.trim() && body.trim() && !sending
                          ? 'linear-gradient(135deg, #c9a648 0%, #a68a3a 100%)'
                          : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: 12,
                  cursor:
                    subject.trim() && body.trim() && !sending && sendStatus !== 'sent'
                      ? 'pointer'
                      : 'not-allowed',
                  fontSize: 16,
                  fontWeight: 600,
                  color: sendStatus === 'sent' ? '#0c2f4a' : subject.trim() && body.trim() ? '#0c2f4a' : 'rgba(255, 255, 255, 0.3)',
                }}
              >
                {sendStatus === 'sending' ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Clock size={20} />
                    </motion.div>
                    Sending...
                  </>
                ) : sendStatus === 'sent' ? (
                  <>
                    <Check size={20} />
                    Sent!
                  </>
                ) : sendStatus === 'error' ? (
                  <>
                    <AlertCircle size={20} />
                    Failed - Try Again
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
