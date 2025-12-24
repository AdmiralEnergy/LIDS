import { Card, Skeleton } from 'antd';
import { motion } from 'framer-motion';
import { useProgression } from '../hooks/useProgression';
import { LevelProgress } from './LevelProgress';
import { BadgeDisplay } from './BadgeDisplay';
import { Trophy, TrendingUp, Flame, Target, Zap, Award, Shield, BookOpen, CheckCircle } from 'lucide-react';
import { FRAMEWORK_MODULES, getModuleProgress } from '../config/modules';

export function PlayerCard() {
  const {
    isLoading,
    progression,
    level,
    xpProgress,
    xpToNextLevel,
    progressPercent,
    currentRank,
    nextRank,
    rankEligibility,
    specialization,
    completedModules,
  } = useProgression();

  if (isLoading || !progression) {
    return (
      <Card
        style={{
          background: 'linear-gradient(135deg, #0f3654 0%, #0c2f4a 100%)',
          borderRadius: 12,
        }}
      >
        <Skeleton active avatar paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  const rankColors: Record<string, { primary: string; glow: string }> = {
    sdr_1: { primary: '#8b9eb3', glow: 'rgba(139, 158, 179, 0.4)' },
    sdr_2: { primary: '#a3b5c9', glow: 'rgba(163, 181, 201, 0.4)' },
    sdr_3: { primary: '#b8c9db', glow: 'rgba(184, 201, 219, 0.5)' },
    operative: { primary: '#c9a648', glow: 'rgba(201, 166, 72, 0.4)' },
    senior_operative: { primary: '#d4b85a', glow: 'rgba(212, 184, 90, 0.5)' },
    team_lead: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
    manager: { primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
  };

  const colors = rankColors[progression.rank] || rankColors.sdr_1;
  const moduleProgress = getModuleProgress(completedModules);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        data-testid="card-player-profile"
        style={{
          background: 'linear-gradient(145deg, #0a1929 0%, #0c2f4a 50%, #0a1929 100%)',
          borderRadius: 16,
          overflow: 'hidden',
          border: `1px solid ${colors.primary}40`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px ${colors.glow}`,
          position: 'relative',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            background: `linear-gradient(180deg, ${colors.primary}15 0%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            background: `radial-gradient(circle, ${colors.primary}20 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <div style={{ padding: 24, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                background: `linear-gradient(145deg, ${colors.primary}40 0%, ${colors.primary}80 100%)`,
                border: `3px solid ${colors.primary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 24px ${colors.glow}, inset 0 2px 4px rgba(255,255,255,0.1)`,
                position: 'relative',
              }}
            >
              <Shield size={40} color={colors.primary} strokeWidth={1.5} />
              <div
                style={{
                  position: 'absolute',
                  bottom: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: colors.primary,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {currentRank?.grade || 'E-1'}
              </div>
            </motion.div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ 
                  color: '#fff', 
                  fontSize: 22, 
                  fontWeight: 700,
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}>
                  {progression.name}
                </span>
              </div>
              <div style={{ 
                color: colors.primary, 
                fontSize: 14, 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 4,
              }}>
                {currentRank?.name || 'SDR I'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                {currentRank?.description || 'Sales Development Representative'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <motion.div
                key={progression.totalXp}
                initial={{ scale: 1.2, color: '#ffd700' }}
                animate={{ scale: 1, color: '#c9a648' }}
                style={{ 
                  fontSize: 28, 
                  fontWeight: 800,
                  textShadow: '0 0 20px rgba(201, 166, 72, 0.5)',
                }}
              >
                {progression.totalXp.toLocaleString()}
              </motion.div>
              <div style={{ 
                color: 'rgba(255,255,255,0.4)', 
                fontSize: 11, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4, 
                justifyContent: 'flex-end',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}>
                <TrendingUp size={12} />
                Total XP
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: 12, 
            padding: 16,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c9a648 0%, #9a7d35 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#0c2f4a',
                  boxShadow: '0 0 15px rgba(201, 166, 72, 0.5)',
                }}>
                  {level}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  Level {level}
                </span>
              </div>
              <span style={{ color: '#c9a648', fontSize: 13, fontWeight: 600 }}>
                {xpProgress.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
              </span>
            </div>

            <div
              style={{
                height: 12,
                background: 'rgba(0,0,0,0.4)',
                borderRadius: 6,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #c9a648 0%, #f0d78c 40%, #c9a648 80%, #f0d78c 100%)',
                  backgroundSize: '200% 100%',
                  borderRadius: 5,
                  boxShadow: '0 0 15px rgba(201, 166, 72, 0.6)',
                  position: 'relative',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
                  borderRadius: '5px 5px 0 0',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 12, 
            marginTop: 20,
          }}>
            <StatBox 
              icon={<Target size={16} />} 
              value={progression.closedDeals} 
              label="Deals" 
              color="#c9a648"
            />
            <StatBox 
              icon={<Flame size={16} />} 
              value={progression.streakDays} 
              label="Streak" 
              color="#d4a85a"
            />
            <StatBox 
              icon={<Award size={16} />} 
              value={progression.badges.length} 
              label="Badges" 
              color="#e0c96c"
            />
            <StatBox 
              icon={<Zap size={16} />} 
              value={specialization ? '1x' : '--'} 
              label="Spec" 
              color="#f0d78c"
            />
          </div>

          <div style={{ 
            marginTop: 20,
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 12,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} color="#00ffff" />
                <span style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  Framework Mastery
                </span>
              </div>
              <span style={{ 
                color: '#00ffff', 
                fontSize: 12, 
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
              }}>
                {moduleProgress.completed}/{moduleProgress.total}
              </span>
            </div>
            
            <div style={{ 
              height: 6,
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 3,
              overflow: 'hidden',
              marginBottom: 12,
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${moduleProgress.percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #00ffff, #00cccc)',
                  borderRadius: 3,
                }}
              />
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 8,
            }}>
              {FRAMEWORK_MODULES.map(module => {
                const isCompleted = completedModules.includes(module.id);
                return (
                  <div
                    key={module.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: isCompleted ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: isCompleted ? '1px solid rgba(0, 255, 255, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle size={12} color="#00ffff" />
                    ) : (
                      <div style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        border: '1px solid rgba(255,255,255,0.3)',
                      }} />
                    )}
                    <span style={{ 
                      fontSize: 10, 
                      color: isCompleted ? '#00ffff' : 'rgba(255,255,255,0.5)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {module.name}
                    </span>
                    <span style={{ 
                      fontSize: 8, 
                      color: 'rgba(255,255,255,0.3)',
                      marginLeft: 'auto',
                    }}>
                      +{module.xpReward}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {progression.badges.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ 
                color: 'rgba(255,255,255,0.5)', 
                fontSize: 11, 
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}>
                Recent Badges
              </div>
              <BadgeDisplay badges={progression.badges.slice(0, 6)} compact />
            </div>
          )}

          {nextRank && (
            <div style={{ 
              marginTop: 20, 
              padding: 12,
              background: 'rgba(201, 166, 72, 0.1)',
              borderRadius: 10,
              border: '1px solid rgba(201, 166, 72, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Next Rank
                  </div>
                  <div style={{ color: '#c9a648', fontSize: 14, fontWeight: 600 }}>
                    {nextRank.name}
                  </div>
                </div>
                {rankEligibility.eligible ? (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                      background: 'linear-gradient(135deg, #c9a648 0%, #9a7d35 100%)',
                      color: '#0c2f4a',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: 6,
                    }}
                  >
                    Ready to Promote
                  </motion.div>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    {rankEligibility.missing.length} requirements left
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function StatBox({ icon, value, label, color }: { icon: React.ReactNode; value: number | string; label: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)',
      borderRadius: 10,
      padding: '12px 8px',
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ color, marginBottom: 6, opacity: 0.8 }}>
        {icon}
      </div>
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>
        {value}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  );
}
