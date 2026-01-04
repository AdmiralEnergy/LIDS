import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Mail, Delete, ChevronLeft } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

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

  // Keypad button component for consistent sizing
  const KeypadButton = ({ value, onClick, className = '' }: { value: string; onClick: () => void; className?: string }) => (
    <button
      onClick={onClick}
      className={`w-[72px] h-[72px] rounded-full bg-zinc-900 text-2xl font-light
                 flex items-center justify-center active:bg-zinc-700 transition-colors ${className}`}
    >
      {value}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center justify-center border-b border-zinc-800/50 shrink-0">
        <div className="text-center">
          <h1 className="text-sm font-semibold text-orange-500 font-mono">Personal Phone</h1>
          <p className="text-[8px] uppercase tracking-widest text-zinc-600">Native Mode</p>
        </div>
      </div>

      {/* Number Display */}
      <div className="h-16 flex items-center justify-center shrink-0">
        <div className="text-2xl font-light tracking-wider font-mono text-center px-4">
          {formatPhoneDisplay(phoneNumber) || (
            <span className="text-zinc-700">Enter number</span>
          )}
        </div>
      </div>

      {/* Keypad Area - takes remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center pb-2 min-h-0">
        {/* Keypad Grid */}
        <div className="flex flex-col gap-3">
          {/* Row 1 */}
          <div className="flex gap-6 justify-center">
            <KeypadButton value="1" onClick={() => handleDigit('1')} />
            <KeypadButton value="2" onClick={() => handleDigit('2')} />
            <KeypadButton value="3" onClick={() => handleDigit('3')} />
          </div>
          {/* Row 2 */}
          <div className="flex gap-6 justify-center">
            <KeypadButton value="4" onClick={() => handleDigit('4')} />
            <KeypadButton value="5" onClick={() => handleDigit('5')} />
            <KeypadButton value="6" onClick={() => handleDigit('6')} />
          </div>
          {/* Row 3 */}
          <div className="flex gap-6 justify-center">
            <KeypadButton value="7" onClick={() => handleDigit('7')} />
            <KeypadButton value="8" onClick={() => handleDigit('8')} />
            <KeypadButton value="9" onClick={() => handleDigit('9')} />
          </div>
          {/* Row 4 */}
          <div className="flex gap-6 justify-center">
            <KeypadButton value="*" onClick={() => handleDigit('*')} />
            <KeypadButton value="0" onClick={() => handleDigit('0')} />
            <KeypadButton value="#" onClick={() => handleDigit('#')} />
          </div>
        </div>

        {/* Call Button */}
        <div className="mt-4">
          <button
            onClick={handleCall}
            disabled={phoneNumber.length < 10}
            className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500
                     disabled:bg-zinc-800 disabled:opacity-50
                     flex items-center justify-center transition-all active:scale-95
                     shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            <Phone className="w-7 h-7 text-white" fill="white" />
          </button>
        </div>

        {/* Action Row: SMS / Delete / Email */}
        <div className="flex gap-10 mt-4 items-center">
          <button
            onClick={() => { setMessageType('sms'); setShowMessages(true); }}
            disabled={phoneNumber.length < 10}
            className="flex flex-col items-center gap-1 opacity-100 disabled:opacity-30 transition-opacity"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-[9px] uppercase text-zinc-500">SMS</span>
          </button>

          <button
            onClick={handleBackspace}
            disabled={phoneNumber.length === 0}
            className="flex flex-col items-center gap-1 opacity-100 disabled:opacity-30 transition-opacity"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
              <Delete className="w-5 h-5 text-zinc-400" />
            </div>
            <span className="text-[9px] uppercase text-zinc-500 invisible">Del</span>
          </button>

          <button
            onClick={() => { setMessageType('email'); setShowMessages(true); }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
              <Mail className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-[9px] uppercase text-zinc-500">Email</span>
          </button>
        </div>
      </div>

      {/* Messages Overlay */}
      <AnimatePresence>
        {showMessages && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="h-14 flex items-center border-b border-zinc-800 px-2 shrink-0">
              <button
                onClick={() => setShowMessages(false)}
                className="p-2 rounded-full hover:bg-zinc-800"
              >
                <ChevronLeft className="w-6 h-6 text-zinc-400" />
              </button>
              <span className="flex-1 text-center font-bold text-sm uppercase tracking-widest">
                {messageType === 'sms' ? 'Send SMS' : 'Send Email'}
              </span>
              <div className="w-10" />
            </div>

            {/* Form */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {messageType === 'sms' ? (
                <>
                  <div>
                    <label className="text-xs uppercase font-bold text-zinc-500 mb-1 block">To</label>
                    <input
                      value={formatPhoneDisplay(phoneNumber)}
                      readOnly
                      className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-zinc-500 mb-1 block">Message</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Type your message..."
                      rows={4}
                      className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800 focus:border-orange-500/50 outline-none resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs uppercase font-bold text-zinc-500 mb-1 block">To (Email)</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      type="email"
                      className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800 focus:border-orange-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-zinc-500 mb-1 block">Subject</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject line"
                      className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800 focus:border-orange-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-zinc-500 mb-1 block">Message</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Type your message..."
                      rows={4}
                      className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800 focus:border-orange-500/50 outline-none resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Send Button */}
            <div className="p-4 border-t border-zinc-800 shrink-0">
              <button
                onClick={messageType === 'sms' ? handleSms : handleEmail}
                disabled={messageType === 'sms' ? phoneNumber.length < 10 : !email}
                className="w-full p-4 bg-orange-500 hover:bg-orange-400 rounded-xl font-bold uppercase tracking-wider
                         disabled:bg-zinc-800 disabled:text-zinc-600 transition-all active:scale-[0.98]"
              >
                {messageType === 'sms' ? 'Open Messages' : 'Open Mail'}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
