import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlasmaXPBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
  isHotStreak?: boolean;
}

export function PlasmaXPBar({ currentXP, maxXP, level, isHotStreak = false }: PlasmaXPBarProps) {
  const [displayXP, setDisplayXP] = useState(currentXP);
  const [isFlashing, setIsFlashing] = useState(false);
  const [shockwaveActive, setShockwaveActive] = useState(false);
  const prevXPRef = useRef(currentXP);
  const progress = Math.min((displayXP / maxXP) * 100, 100);

  useEffect(() => {
    if (currentXP > prevXPRef.current) {
      setIsFlashing(true);
      setShockwaveActive(true);

      const flashTimer = setTimeout(() => setIsFlashing(false), 300);
      const shockwaveTimer = setTimeout(() => setShockwaveActive(false), 600);

      const startXP = displayXP;
      const diff = currentXP - startXP;
      const duration = 400;
      const startTime = Date.now();

      const animateXP = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayXP(Math.floor(startXP + diff * eased));

        if (progress < 1) {
          requestAnimationFrame(animateXP);
        }
      };

      requestAnimationFrame(animateXP);

      return () => {
        clearTimeout(flashTimer);
        clearTimeout(shockwaveTimer);
      };
    }
    prevXPRef.current = currentXP;
  }, [currentXP]);

  return (
    <div className="relative flex items-center gap-3" style={{ width: '100%' }}>
      <motion.div
        className="relative flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
          border: isHotStreak ? '1.5px solid #ffd700' : '1px solid rgba(255, 215, 0, 0.3)',
        }}
        animate={isHotStreak ? {
          boxShadow: [
            '0 0 10px rgba(255, 215, 0, 0.3)',
            '0 0 25px rgba(255, 215, 0, 0.6)',
            '0 0 10px rgba(255, 215, 0, 0.3)',
          ],
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            color: isHotStreak ? '#ffd700' : '#ffffff',
            textShadow: isHotStreak ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
          }}
        >
          {level}
        </span>
      </motion.div>

      <div className="flex-1 relative">
        <div
          style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Progress to Level {level + 1}
        </div>

        <div
          className="relative"
          style={{
            height: 20,
            borderRadius: 10,
            background: 'rgba(0, 0, 0, 0.6)',
            border: '2px solid rgba(0, 255, 255, 0.2)',
            boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              width: `${progress}%`,
              background: isFlashing
                ? 'linear-gradient(90deg, #ffffff, #ffffff)'
                : 'linear-gradient(90deg, #00b4d8, #00ffff, #48cae4, #00ffff, #00b4d8)',
              backgroundSize: '200% 100%',
              borderRadius: 8,
              boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.5)',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '200% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          <AnimatePresence>
            {shockwaveActive && (
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'absolute',
                  left: `${progress}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </AnimatePresence>

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%)',
              borderRadius: '8px 8px 0 0',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.7)',
          minWidth: 80,
          textAlign: 'right',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'baseline' }}>
          {String(displayXP).split('').map((digit, i) => (
            <motion.span
              key={`${i}-${digit}`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: i * 0.05,
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              style={{
                color: '#00ffff',
                fontWeight: 600,
                textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                display: 'inline-block',
              }}
            >
              {digit}
            </motion.span>
          ))}
        </div>
        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}> / {maxXP} XP</span>
      </div>
    </div>
  );
}
