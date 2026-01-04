import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mail, X, Send, Share2 } from 'lucide-react';
import { cn } from './PhoneApp';
import { useSms, sendSmsToNumber } from '../../hooks/useSms';
import { useEmail } from '../../hooks/useEmail';
import { message } from 'antd';

interface MessagePanelProps {
  visible: boolean;
  onClose: () => void;
  initialPhoneNumber?: string;
  initialEmail?: string;
}

type Mode = 'sms' | 'email' | 'combined';

export function MessagePanel({
  visible,
  onClose,
  initialPhoneNumber = '',
  initialEmail = ''
}: MessagePanelProps) {
  const [mode, setMode] = useState<Mode>('sms');
  const [phone, setPhone] = useState(initialPhoneNumber);
  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const { sendEmail } = useEmail(email);

  const handleSend = async () => {
    setSending(true);
    try {
      if (mode === 'sms' || mode === 'combined') {
        if (!phone) throw new Error('Phone number required');
        await sendSmsToNumber(phone, body);
        message.success(`SMS sent to ${phone}`);
      }
      
      if (mode === 'email' || mode === 'combined') {
        if (!email) throw new Error('Email address required');
        await sendEmail(subject || 'Message from Admiral Energy', body);
        message.success(`Email sent to ${email}`);
      }
      
      onClose();
      setBody('');
      setSubject('');
    } catch (err: any) {
      message.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md z-[110] flex flex-col"
        >
          {/* Header */}
          <div className="pt-12 pb-4 px-6 shrink-0 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold">New Message</h2>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex p-1 bg-zinc-900 mx-6 mt-4 rounded-lg shrink-0">
            <ModeTab 
              active={mode === 'sms'} 
              onClick={() => setMode('sms')} 
              icon={MessageSquare} 
              label="SMS" 
            />
            <ModeTab 
              active={mode === 'email'} 
              onClick={() => setMode('email')} 
              icon={Mail} 
              label="Email" 
            />
            <ModeTab 
              active={mode === 'combined'} 
              onClick={() => setMode('combined')} 
              icon={Share2} 
              label="Both" 
            />
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {(mode === 'sms' || mode === 'combined') && (
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-1">To (Phone)</label>
                <input 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(704) 555-0123"
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#00ffff]/50"
                />
              </div>
            )}

            {(mode === 'email' || mode === 'combined') && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-1">To (Email)</label>
                  <input 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#00ffff]/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-1">Subject</label>
                  <input 
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Quick question"
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#00ffff]/50"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-1">Message</label>
              <textarea 
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={6}
                placeholder="Type your message here..."
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#00ffff]/50 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 shrink-0 border-t border-white/5 bg-zinc-900/50">
            <button
              onClick={handleSend}
              disabled={sending || !body || (mode === 'sms' && !phone) || (mode === 'email' && !email)}
              className="w-full bg-[#00ffff] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_4px_20px_rgba(0,255,255,0.2)]"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModeTab({ active, onClick, icon: Icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all",
        active ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      <Icon size={16} />
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}
