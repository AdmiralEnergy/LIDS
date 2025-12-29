import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Delete, X, PhoneCall } from 'lucide-react';
import { ApexKeypad } from '../ApexKeypad';

interface DialpadSheetProps {
  visible: boolean;
  onClose: () => void;
  phoneNumber: string;
  onPhoneNumberChange: (number: string) => void;
  onDial: () => void;
  isDialing?: boolean;
  isOnCall?: boolean;
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // 11 digits (with country code)
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits[0] === '1');
}

export function DialpadSheet({
  visible,
  onClose,
  phoneNumber,
  onPhoneNumberChange,
  onDial,
  isDialing = false,
  isOnCall = false,
}: DialpadSheetProps) {
  const [localNumber, setLocalNumber] = useState(phoneNumber);

  // Sync local number with prop
  useEffect(() => {
    if (!visible) {
      setLocalNumber('');
    }
  }, [visible]);

  const handleDigitPress = useCallback((digit: string) => {
    setLocalNumber((prev) => {
      const newNumber = prev + digit;
      onPhoneNumberChange(newNumber);
      return newNumber;
    });
  }, [onPhoneNumberChange]);

  const handleBackspace = useCallback(() => {
    setLocalNumber((prev) => {
      const newNumber = prev.slice(0, -1);
      onPhoneNumberChange(newNumber);
      return newNumber;
    });
  }, [onPhoneNumberChange]);

  const handleClear = useCallback(() => {
    setLocalNumber('');
    onPhoneNumberChange('');
  }, [onPhoneNumberChange]);

  const handleDial = useCallback(() => {
    if (isValidPhone(localNumber)) {
      onDial();
    }
  }, [localNumber, onDial]);

  const canDial = isValidPhone(localNumber) && !isDialing && !isOnCall;

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
              zIndex: 80,
            }}
          />

          {/* Sheet */}
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
              background: 'linear-gradient(180deg, #0c2f4a 0%, #061a2e 100%)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              zIndex: 85,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '75vh',
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
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#f7f5f2',
                }}
              >
                Dial a Number
              </h3>
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

            {/* Phone Number Display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 20px',
                minHeight: 60,
              }}
            >
              <span
                style={{
                  fontSize: localNumber.length > 12 ? 24 : 32,
                  fontWeight: 600,
                  color: localNumber ? '#00ffff' : 'rgba(255, 255, 255, 0.3)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.5px',
                  textAlign: 'center',
                }}
              >
                {localNumber ? formatPhoneDisplay(localNumber) : 'Enter number'}
              </span>
            </div>

            {/* Keypad */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '0 20px 20px',
              }}
            >
              <ApexKeypad onPress={handleDigitPress} disabled={isOnCall} />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                padding: '0 20px 24px',
              }}
            >
              {/* Clear Button */}
              <button
                onClick={handleClear}
                disabled={!localNumber}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: localNumber
                    ? 'rgba(255, 68, 68, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: localNumber
                    ? '1px solid rgba(255, 68, 68, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: localNumber ? 'pointer' : 'not-allowed',
                  opacity: localNumber ? 1 : 0.5,
                }}
              >
                <X size={22} color={localNumber ? '#ff4444' : 'rgba(255, 255, 255, 0.3)'} />
              </button>

              {/* Dial Button */}
              <motion.button
                onClick={handleDial}
                disabled={!canDial}
                whileTap={canDial ? { scale: 0.95 } : undefined}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: canDial
                    ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: canDial ? 'pointer' : 'not-allowed',
                  boxShadow: canDial ? '0 4px 20px rgba(0, 255, 136, 0.4)' : 'none',
                }}
              >
                {isDialing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <PhoneCall size={28} color="#0c2f4a" />
                  </motion.div>
                ) : (
                  <Phone size={28} color={canDial ? '#0c2f4a' : 'rgba(255, 255, 255, 0.3)'} />
                )}
              </motion.button>

              {/* Backspace Button */}
              <button
                onClick={handleBackspace}
                disabled={!localNumber}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: localNumber
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: localNumber ? 'pointer' : 'not-allowed',
                  opacity: localNumber ? 1 : 0.5,
                }}
              >
                <Delete size={22} color={localNumber ? '#f7f5f2' : 'rgba(255, 255, 255, 0.3)'} />
              </button>
            </div>

            {/* Validation Hint */}
            {localNumber && !isValidPhone(localNumber) && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '0 20px 16px',
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                Enter a valid 10-digit phone number
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
