import { useState } from 'react';
import { Phone, Clock, Star, MessageSquare, Shield, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeypadTab } from './KeypadTab';
import { RecentsTab } from './RecentsTab';
import { FavoritesTab } from './FavoritesTab';
import { InCallOverlay } from './InCallOverlay';
import { MessagePanel } from './MessagePanel';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'keypad' | 'recents' | 'favorites';

interface PhoneAppProps {
  // From useDialer
  phoneNumber: string;
  setPhoneNumber: (n: string) => void;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  duration: number;
  formattedDuration: string;
  muted: boolean;
  dial: () => void;
  hangup: () => void;
  toggleMute: () => void;
  appendDigit: (d: string) => void;
  backspaceDigit: () => void;
  clearNumber: () => void;
  
  // App context
  currentUserId?: string;
}

export function PhoneApp({
  phoneNumber,
  setPhoneNumber,
  status,
  duration,
  formattedDuration,
  muted,
  dial,
  hangup,
  toggleMute,
  appendDigit,
  backspaceDigit,
  clearNumber,
  currentUserId
}: PhoneAppProps) {
  const [activeTab, setActiveTab] = useState<Tab>('keypad');
  const [showMessagePanel, setShowMessagePanel] = useState(false);

  const isOnCall = status === 'connecting' || status === 'connected';

  const renderTab = () => {
    switch (activeTab) {
      case 'keypad':
        return (
          <KeypadTab 
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            appendDigit={appendDigit}
            backspaceDigit={backspaceDigit}
            dial={dial}
            status={status}
          />
        );
      case 'recents':
        return (
          <RecentsTab 
            onDial={(num) => {
              setPhoneNumber(num);
              setActiveTab('keypad');
              // Optional: auto-dial
            }}
          />
        );
      case 'favorites':
        return (
          <FavoritesTab 
            onDial={(num) => {
              setPhoneNumber(num);
              setActiveTab('keypad');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full max-w-[420px] h-[100dvh] bg-black text-white flex flex-col overflow-hidden mx-auto shadow-2xl border-x border-white/5">
      {/* Top Status Bar (Fake) */}
      <div className="h-12 flex items-center justify-between px-6 shrink-0">
        <span className="text-sm font-semibold">9:41</span>
        <div className="flex items-center gap-1.5">
          <Shield size={14} className="text-green-500" />
          <div className="w-5 h-2.5 border border-white/40 rounded-sm relative">
            <div className="absolute inset-[1px] bg-white rounded-[0.5px] w-[80%]" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tab Bar (Bottom) */}
      <div className="h-20 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 pb-safe shrink-0">
        <TabButton 
          active={activeTab === 'favorites'} 
          onClick={() => setActiveTab('favorites')}
          icon={Star}
          label="Favorites"
        />
        <TabButton 
          active={activeTab === 'recents'} 
          onClick={() => setActiveTab('recents')}
          icon={Clock}
          label="Recents"
        />
        <TabButton 
          active={activeTab === 'keypad'} 
          onClick={() => setActiveTab('keypad')}
          icon={Phone}
          label="Keypad"
        />
        <TabButton 
          active={showMessagePanel} 
          onClick={() => setShowMessagePanel(true)}
          icon={MessageSquare}
          label="Messages"
        />
      </div>

      {/* In-Call Overlay */}
      <InCallOverlay 
        visible={isOnCall}
        phoneNumber={phoneNumber}
        status={status}
        duration={formattedDuration}
        muted={muted}
        onHangup={hangup}
        onMute={toggleMute}
        onKeypad={() => {}} // Could show DTMF keypad
      />

      {/* Message Panel Modal */}
      <MessagePanel 
        visible={showMessagePanel}
        onClose={() => setShowMessagePanel(false)}
        initialPhoneNumber={phoneNumber}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-[#00ffff]" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      <Icon size={24} fill={active ? "currentColor" : "none"} />
      <span className="text-[10px] font-medium uppercase tracking-tighter">{label}</span>
    </button>
  );
}
