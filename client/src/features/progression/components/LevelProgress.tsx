import { Progress, Typography } from 'antd';
import { motion } from 'framer-motion';

const { Text } = Typography;

interface LevelProgressProps {
  level: number;
  xpProgress: number;
  xpToNextLevel: number;
  progressPercent: number;
}

export function LevelProgress({ level, xpProgress, xpToNextLevel, progressPercent }: LevelProgressProps) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong style={{ color: '#c9a648', fontSize: 16 }}>
          Level {level}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
          {xpProgress.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
        </Text>
      </div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ transformOrigin: 'left' }}
      >
        <Progress
          percent={progressPercent}
          showInfo={false}
          strokeColor={{
            '0%': '#c9a648',
            '100%': '#ffd700',
          }}
          trailColor="rgba(255,255,255,0.1)"
          size={['100%', 12]}
        />
      </motion.div>
    </div>
  );
}
