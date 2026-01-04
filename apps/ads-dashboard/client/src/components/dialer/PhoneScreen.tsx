import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PhoneScreenProps {
  children: ReactNode;
  isCallActive?: boolean;
}

/**
 * PhoneScreen - Main container with phone aesthetic
 * Full viewport height, dark background, subtle glow when call active
 */
export function PhoneScreen({ children, isCallActive = false }: PhoneScreenProps) {
  return (
    <motion.div
      className="phone-screen w-full max-w-[420px] lg:max-w-none mx-auto lg:mx-0 h-[100dvh] bg-[#050505] flex flex-col relative overflow-hidden rounded-none lg:rounded-lg lg:border lg:border-border"
      style={{
        // Phone aesthetic - subtle border glow
        boxShadow: isCallActive
          ? '0 0 60px rgba(0, 255, 136, 0.15), inset 0 0 30px rgba(0, 0, 0, 0.5)'
          : '0 0 40px rgba(0, 255, 255, 0.08), inset 0 0 30px rgba(0, 0, 0, 0.5)',
      }}
      animate={{
        boxShadow: isCallActive
          ? [
              '0 0 60px rgba(0, 255, 136, 0.15), inset 0 0 30px rgba(0, 0, 0, 0.5)',
              '0 0 80px rgba(0, 255, 136, 0.25), inset 0 0 30px rgba(0, 0, 0, 0.5)',
              '0 0 60px rgba(0, 255, 136, 0.15), inset 0 0 30px rgba(0, 0, 0, 0.5)',
            ]
          : undefined,
      }}
      transition={{
        duration: 2,
        repeat: isCallActive ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      {/* Safe area top (notch handling) */}
      <div
        style={{
          height: 'env(safe-area-inset-top, 0px)',
          background: '#050505',
          flexShrink: 0,
        }}
      />

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>

      {/* Safe area bottom (home indicator handling) */}
      <div
        style={{
          height: 'env(safe-area-inset-bottom, 0px)',
          background: '#050505',
          flexShrink: 0,
        }}
      />
    </motion.div>
  );
}
