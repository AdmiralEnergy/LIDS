import { motion } from 'framer-motion';
import { useProgression } from '../hooks/useProgression';
import { BOSSES, RANKS } from '../config/ranks';
import { Lock, Swords, Trophy, ExternalLink } from 'lucide-react';

interface BossGateProps {
  bossId: string;
  onChallenge?: () => void;
}

export function BossGate({ bossId, onChallenge }: BossGateProps) {
  const { level, isBossUnlocked, isBossDefeated } = useProgression();
  const boss = BOSSES[bossId];

  if (!boss) return null;

  const isUnlocked = isBossUnlocked(bossId);
  const isDefeated = isBossDefeated(bossId);
  const requiredRank = RANKS[boss.requiredForRank];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative overflow-hidden rounded-xl border-2
        ${isDefeated
          ? 'border-green-500/50 bg-green-950/20'
          : isUnlocked
            ? 'border-red-500/50 bg-red-950/20'
            : 'border-gray-700 bg-gray-900/50'
        }
      `}
    >
      <div
        className="p-6 text-center"
        style={{
          background: isDefeated
            ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(22,163,74,0.05))'
            : `linear-gradient(135deg, ${boss.color}20, ${boss.color}05)`,
        }}
      >
        <div className="text-6xl mb-4">{boss.icon}</div>

        <h2
          className="text-2xl font-bold tracking-wider"
          style={{ color: isDefeated ? '#22c55e' : boss.color }}
        >
          {boss.name}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{boss.title}</p>

        <div className="mt-4">
          {isDefeated ? (
            <div className="flex items-center justify-center gap-2 text-green-500">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">DEFEATED</span>
            </div>
          ) : isUnlocked ? (
            <div className="flex items-center justify-center gap-2 text-red-400">
              <Swords className="w-5 h-5" />
              <span className="font-semibold">READY TO CHALLENGE</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Lock className="w-5 h-5" />
              <span>Unlocks at Level {boss.unlockLevel}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <p className="text-sm text-muted-foreground text-center">
          {boss.description}
        </p>

        {requiredRank && (
          <div className="mt-4 p-3 rounded-lg bg-black/30 text-center">
            <p className="text-xs text-muted-foreground">Required for promotion to</p>
            <p className="font-bold" style={{ color: requiredRank.color }}>
              {requiredRank.name} ({requiredRank.requirements.minLevel ? `E-${requiredRank.requirements.minLevel}` : requiredRank.shortName})
            </p>
          </div>
        )}

        {!isDefeated && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-black/20">
              <div className="text-lg font-bold text-yellow-500">+{boss.rewards.xp}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
            <div className="p-2 rounded bg-black/20">
              <div className="text-lg">⚔️</div>
              <div className="text-xs text-muted-foreground">Badge</div>
            </div>
            <div className="p-2 rounded bg-black/20">
              <div className="text-lg">👑</div>
              <div className="text-xs text-muted-foreground">Title</div>
            </div>
          </div>
        )}

        {isUnlocked && !isDefeated && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onChallenge}
            className="
              w-full mt-4 py-3 px-4 rounded-lg font-bold
              bg-gradient-to-r from-red-600 to-red-700
              hover:from-red-500 hover:to-red-600
              text-white shadow-lg shadow-red-500/25
              flex items-center justify-center gap-2
            "
          >
            <Swords className="w-5 h-5" />
            CHALLENGE {boss.name}
            <ExternalLink className="w-4 h-4" />
          </motion.button>
        )}

        {isDefeated && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-green-400 font-semibold">
              🏆 You've proven your worth against {boss.name}!
            </p>
            <p className="text-xs text-green-500/70 mt-1">
              Title earned: "{boss.rewards.title}"
            </p>
          </div>
        )}

        {!isUnlocked && (
          <div className="mt-4 p-3 rounded-lg bg-gray-800/50 text-center">
            <p className="text-muted-foreground text-sm">
              Reach Level {boss.unlockLevel} to unlock this challenge
            </p>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-gray-500 to-gray-400"
                style={{ width: `${Math.min(100, (level / boss.unlockLevel) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Level {level} / {boss.unlockLevel}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
