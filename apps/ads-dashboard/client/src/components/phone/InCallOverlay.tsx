import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, MicOff, Mic, Grid3X3, User, Volume2, Plus, Video, MessageSquare } from 'lucide-react';
import { cn } from './PhoneApp';

interface InCallOverlayProps {
  visible: boolean;
  phoneNumber: string;
  status: 'connecting' | 'connected' | 'error' | 'idle';
  duration: string;
  muted: boolean;
  onHangup: () => void;
  onMute: () => void;
  onKeypad: () => void;
}

export function InCallOverlay({
  visible,
  phoneNumber,
  status,
  duration,
  muted,
  onHangup,
  onMute,
  onKeypad
}: InCallOverlayProps) {
  if (status === 'idle') return null;

  const formatDisplay = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return num;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute inset-0 bg-[#0c2f4a]/95 backdrop-blur-xl z-[100] flex flex-col pt-20 pb-16 px-8"
        >
          {/* Header */}
          <div className="flex flex-col items-center flex-1">
             <div className="w-24 h-24 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6 border-2 border-[#00ffff]/20">
               <User size={48} className="text-zinc-500" />
             </div>
             
             <h2 className="text-3xl font-normal text-white mb-2">
               {formatDisplay(phoneNumber)}
             </h2>
             
             <div className="flex flex-col items-center gap-1">
               <span className={cn(
                 "text-sm font-medium tracking-wide uppercase",
                 status === 'connected' ? "text-green-400" : "text-[#00ffff]/70"
               )}>
                 {status === 'connected' ? duration : 'Calling...'}
               </span>
               {status === 'connecting' && (
                 <motion.span 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[10px] text-white/40 uppercase tracking-[0.2em]"
                 >
                   Mobile
                 </motion.span>
               )}
             </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-3 gap-y-8 gap-x-4 mb-16 px-4">
             <ControlButton 
              onClick={onMute} 
              active={muted} 
              icon={muted ? MicOff : Mic} 
              label={muted ? "unmute" : "mute"} 
             />
             <ControlButton onClick={onKeypad} icon={Grid3X3} label="keypad" />
             <ControlButton onClick={() => {}} icon={Volume2} label="speaker" />
             <ControlButton onClick={() => {}} icon={Plus} label="add call" />
             <ControlButton onClick={() => {}} icon={Video} label="FaceTime" />
             <ControlButton onClick={() => {}} icon={User} label="contacts" />
          </div>

          {/* Hangup Button */}
          <div className="flex justify-center shrink-0">
            <button
              onClick={onHangup}
              className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
            >
              <PhoneOff size={32} className="text-white" fill="currentColor" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ControlButton({ icon: Icon, label, onClick, active = false }: { 
  icon: any; 
  label: string; 
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all",
          active 
            ? "bg-white text-black" 
            : "bg-white/10 text-white hover:bg-white/20"
        )}
      >
        <Icon size={24} />
      </button>
      <span className="text-[10px] text-white font-medium uppercase tracking-tight">{label}</span>
    </div>
  );
}
