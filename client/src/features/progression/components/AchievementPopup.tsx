import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BADGES, BADGE_TIER_COLORS, BadgeTier } from '../config/badges';
import { X } from 'lucide-react';

interface AchievementData {
  type: 'badge' | 'level' | 'rank' | 'boss';
  id: string;
  tier?: string;
  details?: Record<string, unknown>;
}

export function AchievementPopup() {
  const [achievement, setAchievement] = useState<AchievementData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBadgeUnlock = (e: CustomEvent) => {
      const badgeId = e.detail.badgeId as string;
      const parts = badgeId.split('.');
      setAchievement({
        type: 'badge',
        id: parts[0],
        tier: parts[1] || 'bronze',
      });
      setIsVisible(true);
      triggerConfetti();
    };

    const handleLevelUp = (e: CustomEvent) => {
      setAchievement({
        type: 'level',
        id: `level_${e.detail.newLevel}`,
        details: e.detail,
      });
      setIsVisible(true);
      triggerConfetti();
    };

    const handleRankUp = (e: CustomEvent) => {
      setAchievement({
        type: 'rank',
        id: e.detail.newRank,
        details: e.detail,
      });
      setIsVisible(true);
      triggerConfetti('gold');
    };

    const handleBossDefeated = (e: CustomEvent) => {
      setAchievement({
        type: 'boss',
        id: e.detail.boss.id,
        details: e.detail,
      });
      setIsVisible(true);
      triggerConfetti('red');
    };

    window.addEventListener('badgeUnlock', handleBadgeUnlock as EventListener);
    window.addEventListener('levelUp', handleLevelUp as EventListener);
    window.addEventListener('rankUp', handleRankUp as EventListener);
    window.addEventListener('bossDefeated', handleBossDefeated as EventListener);

    return () => {
      window.removeEventListener('badgeUnlock', handleBadgeUnlock as EventListener);
      window.removeEventListener('levelUp', handleLevelUp as EventListener);
      window.removeEventListener('rankUp', handleRankUp as EventListener);
      window.removeEventListener('bossDefeated', handleBossDefeated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const triggerConfetti = (color?: string) => {
    const colors = color === 'gold'
      ? ['#ffd700', '#ffb300', '#c9a648']
      : color === 'red'
        ? ['#dc2626', '#f87171', '#fca5a5']
        : ['#3b82f6', '#22c55e', '#c9a648', '#a855f7'];

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });
  };

  const renderContent = () => {
    if (!achievement) return null;

    switch (achievement.type) {
      case 'badge': {
        const badge = BADGES[achievement.id];
        const tier = achievement.tier as BadgeTier;
        const tierColor = BADGE_TIER_COLORS[tier];

        return (
          <>
            <div className="text-5xl mb-4">{badge?.icon || '🏆'}</div>
            <h2 className="text-xl font-bold text-white">Badge Unlocked!</h2>
            <p className="text-2xl font-bold mt-2" style={{ color: tierColor }}>
              {tier?.toUpperCase()} {badge?.name}
            </p>
            <p className="text-sm text-gray-400 mt-2">{badge?.description}</p>
          </>
        );
      }

      case 'level': {
        const details = achievement.details as { newLevel?: number } | undefined;
        return (
          <>
            <div className="text-5xl mb-4">⬆️</div>
            <h2 className="text-xl font-bold text-white">Level Up!</h2>
            <p className="text-4xl font-bold mt-2 text-yellow-500">
              Level {details?.newLevel}
            </p>
            {details?.newLevel === 5 && (
              <p className="text-sm text-green-400 mt-2">
                🎯 Specializations Unlocked!
              </p>
            )}
          </>
        );
      }

      case 'rank': {
        const details = achievement.details as { rankName?: string; grade?: string } | undefined;
        return (
          <>
            <div className="text-5xl mb-4">🎖️</div>
            <h2 className="text-xl font-bold text-white">Promotion!</h2>
            <p className="text-2xl font-bold mt-2 text-green-400">
              {details?.rankName}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              You've been promoted to {details?.grade}
            </p>
          </>
        );
      }

      case 'boss': {
        const details = achievement.details as { 
          boss?: { name?: string }; 
          rewards?: { xp?: number; title?: string } 
        } | undefined;
        return (
          <>
            <div className="text-5xl mb-4">⚔️</div>
            <h2 className="text-xl font-bold text-red-400">VICTORY!</h2>
            <p className="text-2xl font-bold mt-2 text-white">
              {details?.boss?.name} Defeated!
            </p>
            <p className="text-sm text-yellow-400 mt-2">
              +{details?.rewards?.xp} XP • Title: "{details?.rewards?.title}"
            </p>
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsVisible(false)}
        >
          <motion.div
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 text-center shadow-2xl border border-white/10 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {renderContent()}

            <button
              onClick={() => setIsVisible(false)}
              className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
            >
              Awesome!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
