import { motion } from 'framer-motion';

interface KineticADSLogoProps {
  size?: number;
}

export function KineticADSLogo({ size = 48 }: KineticADSLogoProps) {
  const rays = 12;
  const rayAngles = Array.from({ length: rays }, (_, i) => (360 / rays) * i);

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff">
              <animate
                attributeName="stop-color"
                values="#00a8cc;#00d4ff;#00a8cc"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="70%" stopColor="#0088aa">
              <animate
                attributeName="stop-color"
                values="#006688;#0099bb;#006688"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#004455" />
          </radialGradient>

          <filter id="sunGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="rayGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <motion.circle
          cx="24"
          cy="24"
          r="14"
          fill="url(#sunCore)"
          filter="url(#sunGlow)"
          animate={{
            opacity: [0.7, 1, 0.7],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: 'center' }}
        />

        {rayAngles.map((angle, i) => (
          <motion.line
            key={i}
            x1="24"
            y1="24"
            x2={24 + Math.cos((angle * Math.PI) / 180) * 22}
            y2={24 + Math.sin((angle * Math.PI) / 180) * 22}
            stroke="#00d4ff"
            strokeWidth="1.5"
            strokeLinecap="round"
            filter="url(#rayGlow)"
            initial={{ opacity: 0.3, pathLength: 0.3 }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              pathLength: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
            style={{ transformOrigin: 'center' }}
          />
        ))}

        <circle
          cx="24"
          cy="24"
          r="10"
          fill="none"
          stroke="rgba(0, 212, 255, 0.3)"
          strokeWidth="0.5"
        />
      </svg>

      <span
        className="absolute z-10 font-bold"
        style={{
          fontSize: size * 0.22,
          color: '#ffffff',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          textShadow: '0 0 8px rgba(0, 212, 255, 0.8)',
        }}
      >
        ADS
      </span>
    </div>
  );
}
