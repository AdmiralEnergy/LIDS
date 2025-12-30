/**
 * ProgressionBar.tsx - Personal XP and level progress display
 *
 * Shows current rank, level, XP progress, and today's gains.
 * Designed for embedding in dashboard or header.
 */

import { Progress, Space, Tag, Typography } from 'antd';
import { RiseOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { RANKS } from '../features/progression/config/ranks';

const { Text } = Typography;

interface ProgressionBarProps {
  currentXp: number;
  currentLevel: number;
  currentRank: string;
  xpToNextLevel: number;
  todayXp?: number;
  compact?: boolean;
}

const rankColors: Record<string, string> = {
  'E-1': '#64748b',
  'E-2': '#64748b',
  'E-3': '#64748b',
  'E-4': '#22c55e',
  'E-5': '#c9a648',
  'E-6': '#3b82f6',
  'E-7': '#8b5cf6',
};

const getRankInfo = (grade: string) => {
  const rank = Object.values(RANKS).find(r => r.grade === grade);
  return {
    name: rank?.name || grade,
    color: rankColors[grade] || '#64748b',
  };
};

export function ProgressionBar({
  currentXp,
  currentLevel,
  currentRank,
  xpToNextLevel,
  todayXp = 0,
  compact = false,
}: ProgressionBarProps) {
  const rankInfo = getRankInfo(currentRank);
  const xpProgress = xpToNextLevel > 0 ? (currentXp / xpToNextLevel) * 100 : 0;
  const xpRemaining = Math.max(0, xpToNextLevel - currentXp);

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 8,
      }}>
        <Tag color={rankInfo.color} style={{ margin: 0, fontWeight: 600 }}>
          {rankInfo.name}
        </Tag>
        <div style={{ flex: 1, minWidth: 100 }}>
          <Progress
            percent={xpProgress}
            size="small"
            showInfo={false}
            strokeColor={{
              '0%': '#c9a648',
              '100%': '#e6c35a',
            }}
            trailColor="rgba(255, 255, 255, 0.1)"
          />
        </div>
        <Text style={{ color: '#c9a648', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          LVL {currentLevel}
        </Text>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(12, 47, 74, 0.8) 0%, rgba(15, 54, 84, 0.9) 100%)',
        borderRadius: 12,
        padding: 20,
        border: '1px solid rgba(201, 166, 72, 0.2)',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space size={12}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${rankInfo.color} 0%, ${rankInfo.color}88 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${rankInfo.color}40`,
          }}>
            <TrophyOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <Text style={{
              color: rankInfo.color,
              fontSize: 18,
              fontWeight: 700,
              display: 'block',
              lineHeight: 1.2,
            }}>
              {rankInfo.name}
            </Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>
              Level {currentLevel}
            </Text>
          </div>
        </Space>

        {todayXp > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: 20,
            }}
          >
            <RiseOutlined style={{ color: '#00ff88' }} />
            <Text style={{ color: '#00ff88', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              +{todayXp.toLocaleString()} today
            </Text>
          </motion.div>
        )}
      </div>

      {/* XP Progress Bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <Space size={4}>
            <FireOutlined style={{ color: '#f59e0b', fontSize: 12 }} />
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>XP Progress</Text>
          </Space>
          <Text style={{ color: '#c9a648', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>
            {currentXp.toLocaleString()} / {xpToNextLevel.toLocaleString()}
          </Text>
        </div>
        <Progress
          percent={xpProgress}
          showInfo={false}
          strokeColor={{
            '0%': '#c9a648',
            '100%': '#e6c35a',
          }}
          trailColor="rgba(255, 255, 255, 0.08)"
          size={{ height: 10 }}
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div>
          <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 11, display: 'block' }}>
            To Next Level
          </Text>
          <Text style={{ color: '#fff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {xpRemaining.toLocaleString()} XP
          </Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 11, display: 'block' }}>
            Progress
          </Text>
          <Text style={{ color: '#c9a648', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {xpProgress.toFixed(1)}%
          </Text>
        </div>
      </div>
    </motion.div>
  );
}

export default ProgressionBar;
