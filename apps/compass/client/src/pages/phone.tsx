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
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="p-4 text-center border-b border-zinc-800 shrink-0">
        <h1 className="text-lg font-semibold text-orange-500 font-mono">Personal Phone</h1>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Native Mode</p>
      </div>

      {/* Phone number display */}
      <div className="flex-shrink-0 p-6 text-center">
        <div className="text-4xl font-light tracking-wider min-h-[48px] font-mono">
          {formatPhoneDisplay(phoneNumber) || (
            <span className="text-zinc-700">Enter number</span>
          )}
        </div>
      </div>

      {/* Keypad */}
      <div className="flex-1 flex flex-col justify-center px-8 pb-4">
        <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto w-full">
          {digits.map((row, rowIndex) => (
            row.map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                className="aspect-square rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-800
                           text-3xl font-light flex items-center justify-center
                           active:scale-95 transition-all shadow-lg"
              >
                {digit}
              </button>
            ))
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 px-8 pb-12">
        {/* Call button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleCall}
            disabled={phoneNumber.length < 10}
            className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-400
                       disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed
                       flex items-center justify-center transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-90"
          >
            <Phone className="w-9 h-9 text-white" fill="currentColor" />
          </button>
        </div>

        {/* Secondary buttons */}
        <div className="flex justify-center gap-12">
          <button
            onClick={() => { setMessageType('sms'); setShowMessages(true); }}
            disabled={phoneNumber.length < 10}
            className="p-4 rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-800
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
          >
            <MessageSquare className="w-6 h-6 text-blue-400" />
          </button>

          <button
            onClick={handleBackspace}
            disabled={phoneNumber.length === 0}
            className="p-4 rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-800
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
          >
            <Delete className="w-6 h-6 text-zinc-400" />
          </button>

          <button
            onClick={() => { setMessageType('email'); setShowMessages(true); }}
            className="p-4 rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-800
                       transition-all active:scale-90"
          >
            <Mail className="w-6 h-6 text-orange-400" />
          </button>
        </div>
      </div>

      {/* Messages overlay */}
      <AnimatePresence>
        {showMessages && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="p-4 flex items-center border-b border-zinc-800 bg-zinc-900/50">
              <button onClick={() => setShowMessages(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6 text-zinc-400" />
              </button>
              <span className="flex-1 text-center font-bold text-sm uppercase tracking-widest">
                {messageType === 'sms' ? 'Send SMS' : 'Send Email'}
              </span>
              <div className="w-10" />
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {messageType === 'sms' ? (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 block">To (Phone)</label>
                    <input
                      value={formatPhoneDisplay(phoneNumber)}
                      readOnly
                      className="w-full p-4 bg-zinc-900 rounded-xl border border-white/5 font-mono text-lg text-zinc-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 block">Message</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Type your message..."
                      rows={6}
                      className="w-full p-4 bg-zinc-900 rounded-xl border border-white/5 focus:border-orange-500/50 outline-none transition-all resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 block">To (Email)</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full p-4 bg-zinc-900 rounded-xl border border-white/5 focus:border-orange-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 block">Subject</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject line"
                      className="w-full p-4 bg-zinc-900 rounded-xl border border-white/5 focus:border-orange-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 block">Message</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Type your message..."
                      rows={6}
                      className="w-full p-4 bg-zinc-900 rounded-xl border border-white/5 focus:border-orange-500/50 outline-none transition-all resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-zinc-900/50 border-t border-white/5">
              <button
                onClick={messageType === 'sms' ? handleSms : handleEmail}
                disabled={messageType === 'sms' ? phoneNumber.length < 10 : !email}
                className="w-full p-5 bg-orange-500 hover:bg-orange-400 rounded-xl font-bold uppercase tracking-widest
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
