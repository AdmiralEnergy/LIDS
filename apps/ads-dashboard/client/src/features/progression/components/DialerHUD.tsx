import { motion, AnimatePresence } from 'framer-motion';
import { useProgression } from '../hooks/useProgression';
import { useEfficiencyMetrics, TIER_COLORS, TIER_ICONS, EfficiencyTier } from '../hooks/useEfficiencyMetrics';
import { Zap, Flame, Star, TrendingUp, Target, Phone, Calendar, CheckCircle } from 'lucide-react';
import { PlasmaXPBar } from '../../../components/ui/PlasmaXPBar';

interface MetricCardProps {
  label: string;
  value: number;
  format: 'percent';
  tier: EfficiencyTier;
  target: string;
  lowerIsBetter?: boolean;
  primary?: boolean;
}

function MetricCard({ label, value, tier, target, lowerIsBetter, primary }: MetricCardProps) {
  const tierColor = TIER_COLORS[tier];
  const tierIcon = TIER_ICONS[tier];
  const displayValue = `${(value * 100).toFixed(1)}%`;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: primary ? 'rgba(0, 255, 255, 0.08)' : 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        padding: '10px 12px',
        border: primary 
          ? '1px solid rgba(0, 255, 255, 0.3)' 
          : `1px solid ${tierColor}30`,
        minWidth: 100,
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {primary && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
          }}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 12 }}>{tierIcon}</span>
        <span style={{ 
          fontSize: 9, 
          color: 'rgba(255,255,255,0.5)', 
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: 'var(--font-mono)',
        }}>
          {label}
        </span>
      </div>
      <div style={{ 
        fontSize: 16, 
        fontWeight: 700, 
        color: tierColor,
        fontFamily: 'var(--font-mono)',
      }}>
        {displayValue}
      </div>
      <div style={{ 
        fontSize: 8, 
        color: 'rgba(255,255,255,0.35)',
        marginTop: 2,
        fontFamily: 'var(--font-mono)',
      }}>
        Target: {target}
      </div>
    </motion.div>
  );
}

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

  const metrics = useEfficiencyMetrics(7);

  if (isLoading || !progression) {
    return null;
  }

  const isHotStreak = progression.streakDays >= 3;

  return (
    <div 
      className="dialer-hud gpu-accelerated"
      style={{
        background: '#050505',
        borderRadius: 12,
        padding: '16px 20px',
        border: '0.5px solid rgba(0, 255, 255, 0.2)',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.05), inset 0 0 20px rgba(0, 0, 0, 0.5)',
        marginBottom: 20,
      }}
      data-testid="dialer-hud"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
        <motion.div 
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          animate={isHotStreak ? {
            filter: ['drop-shadow(0 0 5px rgba(255, 215, 0, 0.3))', 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.5))', 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.3))'],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)',
            }}
          >
            <Star size={20} color="#00ffff" fill="rgba(0, 255, 255, 0.3)" />
          </div>
          <div>
            <div style={{ 
              fontSize: 9, 
              color: 'rgba(255,255,255,0.4)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em',
              fontFamily: 'var(--font-mono)',
            }}>
              Rank
            </div>
            <div style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: '#00ffff',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
            }}>
              {currentRank?.name || 'SDR I'}
            </div>
          </div>
        </motion.div>

        <div style={{ flex: 1, minWidth: 250 }}>
          <PlasmaXPBar
            currentXP={xpProgress}
            maxXP={xpToNextLevel}
            level={level}
            isHotStreak={isHotStreak}
          />
        </div>

        {progression.streakDays > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 215, 0, 0.1)',
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255, 215, 0, 0.3)',
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1],
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <Flame size={18} color="#ffd700" fill="rgba(255, 215, 0, 0.5)" />
            </motion.div>
            <span style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: '#ffd700',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
            }}>
              {progression.streakDays} DAY STREAK
            </span>
          </motion.div>
        )}

        {progression.specialization && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0, 255, 255, 0.1)',
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid rgba(0, 255, 255, 0.2)',
            }}
          >
            <Zap size={14} color="#00ffff" />
            <span style={{ 
              fontSize: 11, 
              color: '#00ffff', 
              fontWeight: 500,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {progression.specialization.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {metrics && (
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 12,
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            marginBottom: 10,
          }}>
            <TrendingUp size={12} color="rgba(255,255,255,0.4)" />
            <span style={{ 
              fontSize: 9, 
              color: 'rgba(255,255,255,0.4)', 
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontFamily: 'var(--font-mono)',
            }}>
              Efficiency Metrics (7-Day)
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <MetricCard
              label="Sub-30s Drop"
              value={metrics.sub30sDropRate}
              format="percent"
              tier={metrics.sub30sTier}
              target="<50%"
              lowerIsBetter
            />
            <MetricCard
              label="Call-to-Appt"
              value={metrics.callToApptRate}
              format="percent"
              tier={metrics.callToApptTier}
              target="5%+"
              primary
            />
            <MetricCard
              label="2+ Minute"
              value={metrics.twoPlusMinRate}
              format="percent"
              tier={metrics.twoPlusMinTier}
              target="25%+"
            />
            <MetricCard
              label="Show Rate"
              value={metrics.showRate}
              format="percent"
              tier={metrics.showRateTier}
              target="75%+"
            />
            <MetricCard
              label="SMS Enroll"
              value={metrics.smsEnrollmentRate}
              format="percent"
              tier={metrics.smsEnrollmentTier}
              target="3%+"
            />
          </div>
        </div>
      )}
    </div>
  );
}
