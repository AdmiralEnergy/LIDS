import { motion } from 'framer-motion';
import { Phone, Delete } from 'lucide-react';
import { cn } from './PhoneApp';

interface KeypadTabProps {
  phoneNumber: string;
  setPhoneNumber: (n: string) => void;
  appendDigit: (d: string) => void;
  backspaceDigit: () => void;
  dial: () => void;
  status: 'idle' | 'connecting' | 'connected' | 'error';
}

const KEYPAD = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

export function KeypadTab({
  phoneNumber,
  setPhoneNumber,
  appendDigit,
  backspaceDigit,
  dial,
  status
}: KeypadTabProps) {
  
  const formatDisplay = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return num;
  };

  return (
    <div className="flex flex-col h-full py-8">
      {/* Number Display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full text-center overflow-hidden">
          <motion.div
            key={phoneNumber}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="text-4xl font-normal text-white tracking-tight break-all"
            style={{ minHeight: '3rem' }}
          >
            {formatDisplay(phoneNumber)}
          </motion.div>
          {phoneNumber.length > 0 && (
            <button 
              onClick={() => {}} // Could be "Add to Contacts"
              className="text-[#00ffff] text-sm font-medium mt-2 hover:brightness-110"
            >
              Add Number
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-y-4 gap-x-8 px-12 shrink-0">
        {KEYPAD.map((btn) => (
          <button
            key={btn.digit}
            onClick={() => appendDigit(btn.digit)}
            className="group flex flex-col items-center justify-center w-20 h-20 rounded-full bg-zinc-800/50 hover:bg-zinc-700/70 active:bg-zinc-600 transition-colors"
          >
            <span className="text-3xl font-normal leading-none">{btn.digit}</span>
            <span className="text-[9px] font-bold text-zinc-500 tracking-widest mt-1 group-hover:text-zinc-300">
              {btn.letters}
            </span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-x-8 px-12 mt-8 shrink-0 pb-4">
        <div /> {/* Spacer */}
        <button
          onClick={dial}
          disabled={status !== 'idle' || phoneNumber.length < 3}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all",
            phoneNumber.length >= 3 
              ? "bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.2)] active:scale-95" 
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          )}
        >
          <Phone size={32} fill="currentColor" />
        </button>
        <div className="flex items-center justify-center">
          {phoneNumber.length > 0 && (
            <button
              onClick={backspaceDigit}
              onDoubleClick={() => setPhoneNumber('')}
              className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <Delete size={28} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
