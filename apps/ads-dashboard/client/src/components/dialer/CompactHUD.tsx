import { motion } from 'framer-motion';
import { Flame, Zap, TrendingUp } from 'lucide-react';

interface CompactHUDProps {
  rankTitle: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  streak: number;
  callsToday?: number;
}

export function CompactHUD({
  rankTitle,
  level,
  currentXP,
  xpToNextLevel,
  streak,
  callsToday = 0,
}: CompactHUDProps) {
  const progress = xpToNextLevel > 0 ? (currentXP / xpToNextLevel) * 100 : 0;

  return (
    <div
      style={{
        padding: '12px 16px',
        background: 'rgba(12, 47, 74, 0.8)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Rank badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #c9a648 0%, #a68a3a 100%)',
            border: '1px solid rgba(201, 166, 72, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
            color: '#0c2f4a',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {level}
        </div>
        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#c9a648',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {rankTitle}
          </p>
          <p
            style={{
              fontSize: 10,
              color: 'rgba(255, 255, 255, 0.4)',
              margin: 0,
              fontFamily: 'var(--font-mono)',
            }}
          >
            Lv.{level}
          </p>
        </div>
      </div>

      {/* XP bar */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Zap size={12} color="#c9a648" />
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {currentXP.toLocaleString()} / {xpToNextLevel.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 6,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #c9a648 0%, #d4b35d 100%)',
              borderRadius: 3,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Streak */}
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              background: 'rgba(255, 136, 0, 0.2)',
              border: '1px solid rgba(255, 136, 0, 0.4)',
              borderRadius: 12,
            }}
          >
            <Flame size={14} color="#ff8800" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#ff8800',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {streak}
            </span>
          </motion.div>
        )}

        {/* Calls today */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <TrendingUp size={14} color="rgba(255, 255, 255, 0.5)" />
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.6)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {callsToday}
          </span>
        </div>
      </div>
    </div>
  );
}
