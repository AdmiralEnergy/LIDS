import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber?: string;
}

export function QRCodeModal({ isOpen, onClose, phoneNumber }: QRCodeModalProps) {
  const url = phoneNumber
    ? `https://compass.ripemerchant.host/phone?number=${encodeURIComponent(phoneNumber)}`
    : 'https://compass.ripemerchant.host/phone';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-zinc-900 border border-white/10 p-8 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Use Your Phone</h3>
              <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
                <QRCodeSVG value={url} size={220} level="H" includeMargin={true} />
              </div>
              
              <p className="text-sm text-zinc-400 text-center mb-8 px-4">
                Scan this code with your phone's camera to open the COMPASS native dialer.
              </p>

              {phoneNumber && (
                <div className="w-full bg-black/40 rounded-lg p-3 border border-white/5 mb-6">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest text-center mb-1">Pre-filled Number</p>
                  <p className="text-lg font-mono text-[#00ffff] text-center font-semibold tracking-wider">
                    {phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors active:scale-95 shadow-lg"
              >
                Close
              </button>
            </div>
            
            {/* Decorative background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00ffff]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
