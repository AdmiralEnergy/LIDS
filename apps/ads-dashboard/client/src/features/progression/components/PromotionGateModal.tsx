import { motion, AnimatePresence } from 'framer-motion';
import { useProgression } from '../hooks/useProgression';
import { RANKS, BOSSES, checkRankEligibility } from '../config/ranks';
import { Check, Swords, BookOpen, Trophy } from 'lucide-react';
import { ReactNode } from 'react';

interface PromotionGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeBoss?: (bossId: string) => void;
}

export function PromotionGateModal({ isOpen, onClose, onChallengeBoss }: PromotionGateModalProps) {
  const {
    rank,
    level,
    closedDeals,
    badges,
    defeatedBosses,
    passedExams,
    promoteRank,
  } = useProgression();

  const currentRank = RANKS[rank];
  const rankIds = Object.keys(RANKS);
  const currentIndex = rankIds.indexOf(rank);
  const nextRankId = rankIds[currentIndex + 1];
  const nextRank = nextRankId ? RANKS[nextRankId] : null;

  if (!nextRank || !currentRank) return null;

  const { eligible, missing } = checkRankEligibility(
    rank,
    level,
    closedDeals,
    badges,
    defeatedBosses,
    passedExams
  );

  const handlePromotion = async () => {
    if (eligible) {
      await promoteRank(nextRankId);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎖️</div>
              <h2 className="text-xl font-bold text-white">Promotion Requirements</h2>
              <p className="text-sm text-gray-400 mt-1">
                {currentRank.name} → {nextRank.name}
              </p>
            </div>

            <div className="space-y-3">
              <RequirementRow
                met={level >= nextRank.requirements.minLevel}
                label={`Reach Level ${nextRank.requirements.minLevel}`}
                current={`Level ${level}`}
                icon={<Trophy className="w-4 h-4" />}
              />

              <RequirementRow
                met={closedDeals >= nextRank.requirements.minDeals}
                label={`Close ${nextRank.requirements.minDeals} deals`}
                current={`${closedDeals} deals`}
                icon={<Check className="w-4 h-4" />}
              />

              {nextRank.requirements.requiredBadges.map((badge) => (
                <RequirementRow
                  key={badge}
                  met={badges.includes(badge)}
                  label={formatBadgeName(badge)}
                  icon={<Trophy className="w-4 h-4" />}
                />
              ))}

              {nextRank.requirements.bossDefeated && (
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${defeatedBosses.includes(nextRank.requirements.bossDefeated)
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                      }
                    `}>
                      <Swords className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        Defeat {BOSSES[nextRank.requirements.bossDefeated]?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Boss Battle Required
                      </p>
                    </div>
                    {!defeatedBosses.includes(nextRank.requirements.bossDefeated) && (
                      <button
                        onClick={() => onChallengeBoss?.(nextRank.requirements.bossDefeated!)}
                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-500 rounded-lg font-medium text-white"
                      >
                        Challenge
                      </button>
                    )}
                    {defeatedBosses.includes(nextRank.requirements.bossDefeated) && (
                      <Check className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                </div>
              )}

              {nextRank.requirements.examPassed && (
                <RequirementRow
                  met={passedExams.includes(nextRank.requirements.examPassed)}
                  label={`Pass ${formatExamName(nextRank.requirements.examPassed)}`}
                  icon={<BookOpen className="w-4 h-4" />}
                />
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-white"
              >
                Close
              </button>
              <button
                onClick={handlePromotion}
                disabled={!eligible}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-bold transition-all
                  ${eligible
                    ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/25'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {eligible ? '🎉 Promote!' : `${missing.length} Requirements Left`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RequirementRow({
  met,
  label,
  current,
  icon,
}: {
  met: boolean;
  label: string;
  current?: string;
  icon: ReactNode;
}) {
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg
      ${met ? 'bg-green-950/30 border border-green-500/30' : 'bg-gray-800/50 border border-gray-700'}
    `}>
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center
        ${met ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}
      `}>
        {met ? <Check className="w-4 h-4" /> : icon}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${met ? 'text-green-400' : 'text-white'}`}>
          {label}
        </p>
        {current && (
          <p className="text-xs text-gray-400">{current}</p>
        )}
      </div>
      {met && <Check className="w-5 h-5 text-green-400" />}
    </div>
  );
}

function formatBadgeName(badge: string): string {
  const [id, tier] = badge.split('.');
  return `${tier.charAt(0).toUpperCase() + tier.slice(1)} ${id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
}

function formatExamName(exam: string): string {
  return exam.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
