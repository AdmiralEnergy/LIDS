import { useState, useEffect } from 'react';
import { Phone, Clock, Star, MessageSquare, Shield, Settings, X, Globe, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeypadTab } from './KeypadTab';
import { RecentsTab } from './RecentsTab';
import { FavoritesTab } from './FavoritesTab';
import { InCallOverlay } from './InCallOverlay';
import { MessagePanel } from './MessagePanel';
import { QRCodeModal } from './QRCodeModal';
import { getSettings, saveSettings } from '../../lib/settings';
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
  const [useNativePhone, setUseNativePhone] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [outboundNumber, setOutboundNumber] = useState('');
  const [smsNumber, setSmsNumber] = useState('');

  const isOnCall = status === 'connecting' || status === 'connected';

  useEffect(() => {
    const settings = getSettings();
    setUseNativePhone(settings.useNativePhone);
    setOutboundNumber(settings.voicePhoneNumber || '+17047414684');
    setSmsNumber(settings.smsPhoneNumber || '+18333856399');
  }, []);

  const toggleMode = (personal: boolean) => {
    const settings = getSettings();
    settings.useNativePhone = personal;
    saveSettings(settings);
    setUseNativePhone(personal);
  };

  const formatPhoneDisplay = (num: string) => {
    if (!num) return '';
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return num;
  };

  const handleDial = () => {
    if (useNativePhone) {
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      dial();
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'keypad':
        return (
          <KeypadTab 
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            appendDigit={appendDigit}
            backspaceDigit={backspaceDigit}
            dial={handleDial}
            status={status}
          />
        );
      case 'recents':
        return (
          <RecentsTab 
            onDial={(num) => {
              setPhoneNumber(num);
              setActiveTab('keypad');
              // Auto-dial handled by handleDial if we wanted to add it here
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
      {/* Top Status Bar (Mode & Outbound Display) */}
      <div className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", useNativePhone ? "bg-orange-500" : "bg-green-500")} />
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-tight">
            {useNativePhone ? 'Personal' : 'ADS'}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-tighter">Calling from</span>
          <span className="text-sm font-mono text-[#00ffff] font-semibold">
            {useNativePhone ? 'Your Device' : formatPhoneDisplay(outboundNumber)}
          </span>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-500 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
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

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 z-[120] flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-2xl font-bold">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8 overflow-y-auto pr-2">
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Call & Message Mode</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => toggleMode(false)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                      !useNativePhone 
                        ? "bg-[#0c2f4a] border-[#00ffff]/50 text-white" 
                        : "bg-zinc-900 border-white/5 text-zinc-400"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                      !useNativePhone ? "bg-[#00ffff] text-black" : "bg-zinc-800 text-zinc-500"
                    )}>
                      <Globe size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">ADS Business Mode</p>
                      <p className="text-xs opacity-60">Uses Twilio and Resend for all communications. Professional caller ID.</p>
                    </div>
                  </button>

                  <div
                    className={cn(
                      "flex flex-col gap-4 p-4 rounded-2xl border transition-all text-left",
                      useNativePhone 
                        ? "bg-[#4a2f0c] border-orange-500/50 text-white" 
                        : "bg-zinc-900 border-white/5 text-zinc-400"
                    )}
                  >
                    <button
                      onClick={() => toggleMode(true)}
                      className="flex items-center gap-4 w-full text-left"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                        useNativePhone ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-500"
                      )}>
                        <User size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Personal Native Mode</p>
                        <p className="text-xs opacity-60">Opens your device's native phone, SMS, and mail apps.</p>
                      </div>
                    </button>

                    {useNativePhone && (
                      <div className="mt-2 space-y-3 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest text-center">Dial With</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            className="p-3 text-xs bg-zinc-800 hover:bg-zinc-700 font-bold uppercase rounded-xl transition-colors border border-white/5"
                            onClick={() => {/* default window.open(tel:) behavior */ setShowSettings(false); }}
                          >
                            Computer
                          </button>
                          <button
                            className="p-3 text-xs bg-orange-500 hover:bg-orange-400 text-black font-bold uppercase rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            onClick={() => {
                              setShowQRCode(true);
                            }}
                          >
                            Phone →
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 text-center px-4 leading-relaxed">
                          Scan a QR code to dial with your actual phone using the COMPASS PWA
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-tighter">Business SMS</span>
                  <span className="text-xs font-mono text-white/80">{formatPhoneDisplay(smsNumber)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-white/5 pt-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-tighter">Business Voice</span>
                  <span className="text-xs font-mono text-white/80">{formatPhoneDisplay(outboundNumber)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-auto w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform shrink-0"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* QR Code Modal for Phone Bridge */}
      <QRCodeModal 
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        phoneNumber={phoneNumber}
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

