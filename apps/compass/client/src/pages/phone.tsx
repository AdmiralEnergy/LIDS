import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Mail, Delete, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Helper to format phone display
function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

// Format for tel: link
function formatForTel(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

export default function PhonePage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const [messageType, setMessageType] = useState<'sms' | 'email'>('sms');
  const [messageBody, setMessageBody] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');

  // Check for phone number in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const number = params.get('number');
    if (number) {
      setPhoneNumber(number.replace(/\D/g, ''));
    }
  }, []);

  const handleDigit = (digit: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (phoneNumber.length >= 10) {
      const telUrl = `tel:${formatForTel(phoneNumber)}`;
      window.open(telUrl, '_self');
      // Save to recent (optional)
      saveToRecent(phoneNumber);
    }
  };

  const handleSms = () => {
    if (phoneNumber.length >= 10) {
      const body = encodeURIComponent(messageBody);
      const smsUrl = messageBody
        ? `sms:${formatForTel(phoneNumber)}?body=${body}`
        : `sms:${formatForTel(phoneNumber)}`;
      window.open(smsUrl, '_self');
    }
  };

  const handleEmail = () => {
    if (email) {
      const params = new URLSearchParams();
      if (subject) params.set('subject', subject);
      if (messageBody) params.set('body', messageBody);
      const mailtoUrl = `mailto:${email}?${params.toString()}`;
      window.open(mailtoUrl, '_self');
    }
  };

  const saveToRecent = (number: string) => {
    try {
      const recent = JSON.parse(localStorage.getItem('compass_recent_calls') || '[]');
      const updated = [number, ...recent.filter((n: string) => n !== number)].slice(0, 10);
      localStorage.setItem('compass_recent_calls', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent call:', e);
    }
  };

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-black text-white overflow-hidden">
      {/* Header - compact */}
      <div className="py-2 text-center border-b border-zinc-800 shrink-0">
        <h1 className="text-base font-semibold text-orange-500 font-mono">Personal Phone</h1>
        <p className="text-[9px] uppercase tracking-widest text-zinc-500">Native Mode</p>
      </div>

      {/* Phone number display - compact */}
      <div className="flex-shrink-0 py-3 px-4 text-center">
        <div className="text-2xl sm:text-3xl font-light tracking-wider min-h-[36px] font-mono">
          {formatPhoneDisplay(phoneNumber) || (
            <span className="text-zinc-700">Enter number</span>
          )}
        </div>
      </div>

      {/* Keypad - responsive sizing */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 min-h-0">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-[280px] sm:max-w-sm mx-auto w-full">
          {digits.map((row, rowIndex) => (
            row.map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                className="aspect-square rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-800
                           text-2xl sm:text-3xl font-light flex items-center justify-center
                           active:scale-95 transition-all shadow-lg max-w-[80px] sm:max-w-none mx-auto w-full"
              >
                {digit}
              </button>
            ))
          ))}
        </div>
      </div>

      {/* Action buttons - always visible */}
      <div className="flex-shrink-0 px-4 sm:px-8 pb-4 pt-2 safe-area-inset-bottom">
        {/* Call button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleCall}
            disabled={phoneNumber.length < 10}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 hover:bg-green-400
                       disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed
                       flex items-center justify-center transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-90"
          >
            <Phone className="w-7 h-7 sm:w-9 sm:h-9 text-white" fill="currentColor" />
          </button>
        </div>

        {/* Secondary buttons - SMS, Backspace, Email */}
        <div className="flex justify-center gap-8 sm:gap-12">
          <button
            onClick={() => { setMessageType('sms'); setShowMessages(true); }}
            disabled={phoneNumber.length < 10}
            className="p-3 sm:p-4 rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-800
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90
                       flex flex-col items-center gap-1"
            title="Send SMS"
          >
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <span className="text-[8px] uppercase text-zinc-500">SMS</span>
          </button>

          <button
            onClick={handleBackspace}
            disabled={phoneNumber.length === 0}
            className="p-3 sm:p-4 rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-800
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
          >
            <Delete className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" />
          </button>

          <button
            onClick={() => { setMessageType('email'); setShowMessages(true); }}
            className="p-3 sm:p-4 rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-800
                       transition-all active:scale-90 flex flex-col items-center gap-1"
            title="Send Email"
          >
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            <span className="text-[8px] uppercase text-zinc-500">Email</span>
          </button>
        </div>
      </div>

      {/* Messages overlay */}
      <AnimatePresence>
        {showMessages && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col h-[100dvh]">
            <div className="p-3 flex items-center border-b border-zinc-800 bg-zinc-900/50 shrink-0">
              <button onClick={() => setShowMessages(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <span className="flex-1 text-center font-bold text-xs uppercase tracking-widest">
                {messageType === 'sms' ? 'Send SMS' : 'Send Email'}
              </span>
              <div className="w-9" />
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {messageType === 'sms' ? (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1 block">To (Phone)</label>
                    <input
                      value={formatPhoneDisplay(phoneNumber)}
                      readOnly
                      className="w-full p-3 bg-zinc-900 rounded-xl border border-white/5 font-mono text-base text-zinc-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1 block">Message</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Type your message..."
                      rows={5}
                      className="w-full p-3 bg-zinc-900 rounded-xl border border-white/5 focus:border-orange-500/50 outline-none transition-all resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1 block">To (Email)</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      type="email"
                      className="w-full p-3 bg-zinc-900 rounded-xl border border-white/5 focus:border-orange-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1 block">Subject</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject line"
                      className="w-full p-3 bg-zinc-900 rounded-xl border border-white/5 focus:border-orange-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1 block">Message</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Type your message..."
                      rows={4}
                      className="w-full p-3 bg-zinc-900 rounded-xl border border-white/5 focus:border-orange-500/50 outline-none transition-all resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-zinc-900/50 border-t border-white/5 shrink-0">
              <button
                onClick={messageType === 'sms' ? handleSms : handleEmail}
                disabled={messageType === 'sms' ? phoneNumber.length < 10 : !email}
                className="w-full p-4 bg-orange-500 hover:bg-orange-400 rounded-xl font-bold uppercase tracking-widest text-sm
                           disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
              >
                {messageType === 'sms' ? 'Open Messages App' : 'Open Mail App'}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { AnimatePresence } from 'framer-motion';
