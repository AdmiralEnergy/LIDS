import { Card, Tag, Skeleton } from 'antd';
import { motion } from 'framer-motion';
import { useProgression } from '../hooks/useProgression';
import { LevelProgress } from './LevelProgress';
import { BadgeDisplay } from './BadgeDisplay';
import { Trophy, TrendingUp } from 'lucide-react';

export function PlayerCard() {
  const {
    isLoading,
    progression,
    level,
    xpProgress,
    xpToNextLevel,
    progressPercent,
    currentRank,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        data-testid="card-player-profile"
        style={{
          background: 'linear-gradient(135deg, #0f3654 0%, #0c2f4a 100%)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
        styles={{ body: { padding: 20 } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${currentRank?.color || '#718096'}33, ${currentRank?.color || '#718096'}66)`,
              border: `2px solid ${currentRank?.color || '#718096'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={28} color={currentRank?.color || '#718096'} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
                {progression.name}
              </span>
              <Tag
                style={{
                  background: currentRank?.color || '#718096',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 500,
                }}
              >
                {currentRank?.shortName || 'SDR-I'}
              </Tag>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              {currentRank?.description || 'Sales Development Representative'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#c9a648', fontSize: 24, fontWeight: 700 }}>
              {progression.totalXp.toLocaleString()}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              <TrendingUp size={12} />
              Total XP
            </div>
          </div>
        </div>

        <LevelProgress
          level={level}
          xpProgress={xpProgress}
          xpToNextLevel={xpToNextLevel}
          progressPercent={progressPercent}
        />

        <div style={{ marginTop: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 8 }}>
            BADGES ({progression.badges.length})
          </div>
          <BadgeDisplay badges={progression.badges} compact />
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>{progression.closedDeals}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Deals Closed</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>{progression.streakDays}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Day Streak</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>{currentRank?.grade || 'E-1'}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Grade</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
