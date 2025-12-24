import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApexADSLogoProps {
  size?: number;
}

export function ApexADSLogo({ size = 44 }: ApexADSLogoProps) {
  const [showArc, setShowArc] = useState(false);

  useEffect(() => {
    const triggerArc = () => {
      setShowArc(true);
      setTimeout(() => setShowArc(false), 400);
    };

    triggerArc();
    const interval = setInterval(triggerArc, 4000);
    return () => clearInterval(interval);
  }, []);

  const letterWidth = size * 0.28;
  const letterHeight = size * 0.5;
  const fontSize = size * 0.32;

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="waterGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#00CED1">
              <animate
                attributeName="offset"
                values="0;0.15;0.05;0.1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="0%" stopColor="#006994">
              <animate
                attributeName="offset"
                values="0;0.15;0.05;0.1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#001a33" />
          </linearGradient>
          
          <linearGradient id="waterFill" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0891b2" />
            <stop offset="50%" stopColor="#0e7490" />
            <stop offset="100%" stopColor="#164e63" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect
          x="4"
          y="4"
          width="36"
          height="36"
          rx="8"
          fill="url(#waterFill)"
          stroke="rgba(0, 206, 209, 0.3)"
          strokeWidth="0.5"
        />

        <rect
          x="4"
          y="4"
          width="36"
          height="36"
          rx="8"
          fill="none"
          stroke="url(#waterGradient)"
          strokeWidth="1"
          opacity="0.6"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-20"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>

      <AnimatePresence>
        {showArc && (
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            width={size}
            height={size}
            viewBox="0 0 44 44"
            className="absolute inset-0 pointer-events-none"
          >
            <motion.rect
              x="4"
              y="4"
              width="36"
              height="36"
              rx="8"
              fill="none"
              stroke="#00ffff"
              strokeWidth="2"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ 
                duration: 0.35,
                ease: "easeOut",
              }}
              style={{
                strokeDasharray: "1 0",
              }}
            />
            
            <motion.circle
              cx="40"
              cy="22"
              r="2"
              fill="#ffffff"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0],
                cx: [4, 40, 40, 4, 4],
                cy: [4, 4, 40, 40, 4],
              }}
              transition={{ 
                duration: 0.35,
                ease: "linear",
              }}
              filter="url(#glow)"
            />
          </motion.svg>
        )}
      </AnimatePresence>

      <span
        className="relative z-10 font-bold tracking-wider"
        style={{
          fontSize: fontSize,
          color: '#ffffff',
          fontFamily: 'var(--font-mono)',
          textShadow: '0 0 10px rgba(0, 206, 209, 0.5)',
          letterSpacing: '0.1em',
        }}
      >
        ADS
      </span>
    </div>
  );
}
