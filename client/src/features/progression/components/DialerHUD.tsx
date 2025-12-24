import { motion, AnimatePresence } from 'framer-motion';
import { useProgression } from '../hooks/useProgression';
import { Zap, Flame, Star, ChevronUp } from 'lucide-react';

export function DialerHUD() {
  const {
    progression,
    level,
    progressPercent,
    xpProgress,
    xpToNextLevel,
    currentRank,
    isLoading,
  } = useProgression();

  if (isLoading || !progression) {
    return null;
  }

  const rankColors: Record<string, string> = {
    sdr_1: '#8b9eb3',
    sdr_2: '#a3b5c9',
    sdr_3: '#b8c9db',
    operative: '#c9a648',
    senior_operative: '#d4b85a',
    team_lead: '#e0c96c',
    manager: '#f0d78c',
  };

  const rankColor = rankColors[progression.rank] || '#64748b';

  return (
    <div 
      className="dialer-hud"
      style={{
        background: 'linear-gradient(135deg, rgba(12, 47, 74, 0.95) 0%, rgba(10, 25, 41, 0.98) 100%)',
        borderRadius: 12,
        padding: '12px 16px',
        border: '1px solid rgba(201, 166, 72, 0.3)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        marginBottom: 16,
      }}
      data-testid="dialer-hud"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${rankColor} 0%, ${rankColor}99 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 12px ${rankColor}66`,
              border: `2px solid ${rankColor}`,
            }}
          >
            <Star size={18} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Rank
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: rankColor }}>
              {currentRank?.name || 'SDR I'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c9a648 0%, #9a7d35 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(201, 166, 72, 0.5)',
              border: '2px solid #c9a648',
              fontWeight: 700,
              fontSize: 14,
              color: '#0c2f4a',
            }}
          >
            {level}
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Level
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {progression.totalXp.toLocaleString()} XP
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Progress to Level {level + 1}
            </span>
            <span style={{ fontSize: 11, color: '#c9a648', fontWeight: 600 }}>
              {xpProgress} / {xpToNextLevel} XP
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #c9a648 0%, #f0d78c 50%, #c9a648 100%)',
                borderRadius: 4,
                boxShadow: '0 0 10px rgba(201, 166, 72, 0.5)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                borderRadius: 4,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {progression.streakDays > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, rgba(212, 168, 90, 0.2) 0%, rgba(212, 168, 90, 0.1) 100%)',
              padding: '6px 12px',
              borderRadius: 20,
              border: '1px solid rgba(212, 168, 90, 0.3)',
            }}
          >
            <Flame size={16} color="#d4a85a" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#d4a85a' }}>
              {progression.streakDays} Day Streak
            </span>
          </motion.div>
        )}

        {progression.specialization && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(201, 166, 72, 0.15)',
              padding: '6px 12px',
              borderRadius: 20,
              border: '1px solid rgba(201, 166, 72, 0.3)',
            }}
          >
            <Zap size={14} color="#c9a648" />
            <span style={{ fontSize: 12, color: '#c9a648', fontWeight: 500 }}>
              {progression.specialization.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
