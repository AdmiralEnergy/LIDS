import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KineticADSLogoProps {
  size?: number;
}

export function KineticADSLogo({ size = 48 }: KineticADSLogoProps) {
  const [arcPhase, setArcPhase] = useState(0);
  const fontSize = size * 0.38;

  useEffect(() => {
    const interval = setInterval(() => {
      setArcPhase(prev => (prev + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0077b6" />
            <stop offset="50%" stopColor="#00b4d8" />
            <stop offset="100%" stopColor="#0096c7" />
          </linearGradient>
          
          <linearGradient id="deepCerulean" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#023e8a">
              <animate
                attributeName="stop-color"
                values="#023e8a;#0077b6;#023e8a"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#0077b6">
              <animate
                attributeName="stop-color"
                values="#0077b6;#00b4d8;#0077b6"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#00b4d8">
              <animate
                attributeName="stop-color"
                values="#00b4d8;#48cae4;#00b4d8"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          <filter id="liquidDisplace" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.015" 
              numOctaves="2" 
              seed="1"
            >
              <animate
                attributeName="baseFrequency"
                values="0.015;0.025;0.015"
                dur="4s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="electricGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="10"
          fill="url(#deepCerulean)"
          filter="url(#liquidDisplace)"
        />

        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="10"
          fill="none"
          stroke="rgba(0, 180, 216, 0.4)"
          strokeWidth="0.5"
        />
      </svg>

      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className="absolute inset-0 pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        <motion.path
          d="M14 4 L44 4 L44 14"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#electricGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: arcPhase === 0 ? [0, 1] : 0,
            opacity: arcPhase === 0 ? [0, 1, 0] : 0,
          }}
          transition={{ duration: 0.12, ease: "linear" }}
        />
        <motion.path
          d="M44 14 L44 44 L34 44"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#electricGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: arcPhase === 1 ? [0, 1] : 0,
            opacity: arcPhase === 1 ? [0, 1, 0] : 0,
          }}
          transition={{ duration: 0.12, ease: "linear" }}
        />
        <motion.path
          d="M34 44 L4 44 L4 34"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#electricGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: arcPhase === 2 ? [0, 1] : 0,
            opacity: arcPhase === 2 ? [0, 1, 0] : 0,
          }}
          transition={{ duration: 0.12, ease: "linear" }}
        />
        <motion.path
          d="M4 34 L4 4 L14 4"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#electricGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: arcPhase === 3 ? [0, 1] : 0,
            opacity: arcPhase === 3 ? [0, 1, 0] : 0,
          }}
          transition={{ duration: 0.12, ease: "linear" }}
        />
      </svg>

      <svg
        width={size * 0.8}
        height={size * 0.4}
        viewBox="0 0 60 24"
        className="relative z-10"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="textDisplace" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.02" 
              numOctaves="2"
            >
              <animate
                attributeName="baseFrequency"
                values="0.02;0.04;0.02"
                dur="3s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <linearGradient id="textGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#023e8a" />
            <stop offset="50%" stopColor="#0077b6" />
            <stop offset="100%" stopColor="#00b4d8" />
          </linearGradient>
        </defs>
        <text
          x="30"
          y="18"
          textAnchor="middle"
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.15em',
            fill: 'url(#textGradient)',
            filter: 'url(#textDisplace)',
          }}
        >
          ADS
        </text>
        <text
          x="30"
          y="18"
          textAnchor="middle"
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.15em',
            fill: 'none',
            stroke: 'rgba(255, 255, 255, 0.9)',
            strokeWidth: 0.5,
          }}
        >
          ADS
        </text>
      </svg>
    </div>
  );
}
