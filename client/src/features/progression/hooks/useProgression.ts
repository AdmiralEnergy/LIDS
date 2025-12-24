import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { progressionDb, initProgression, UserProgression } from '@/lib/progressionDb';
import { XP_THRESHOLDS, calculateLevel, XP_SOURCES } from '../config/xp';
import { getRankById, getNextRank, checkRankEligibility } from '../config/ranks';
import { getSpecializationMultiplier, getSpecializationById } from '../config/specializations';

interface AddXPParams {
  eventType: string;
  multipliers?: Record<string, number>;
  details?: string;
}

interface XPResult {
  xpEarned: number;
  newLevel: number;
  leveledUp: boolean;
  newBadges: string[];
}

export function useProgression() {
  const [isLoading, setIsLoading] = useState(true);
  const [recentXpGain, setRecentXpGain] = useState<{ amount: number; id: number } | null>(null);

  const progression = useLiveQuery(() => progressionDb.progression.get('current'));
  
  const recentEvents = useLiveQuery(() =>
    progressionDb.xpEvents.orderBy('createdAt').reverse().limit(10).toArray()
  );

  useEffect(() => {
    initProgression().then(() => setIsLoading(false));
  }, []);

  const level = progression ? calculateLevel(progression.totalXp) : 1;
  const xpForCurrentLevel = XP_THRESHOLDS[Math.min(level - 1, XP_THRESHOLDS.length - 1)] || 0;
  const xpForNextLevel = XP_THRESHOLDS[Math.min(level, XP_THRESHOLDS.length - 1)] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
  const xpProgress = (progression?.totalXp || 0) - xpForCurrentLevel;
  const xpToNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = xpToNextLevel > 0 ? Math.min((xpProgress / xpToNextLevel) * 100, 100) : 100;

  const currentRank = progression ? getRankById(progression.rank) : getRankById('sdr_1');
  const nextRank = progression ? getNextRank(progression.rank) : undefined;
  const rankEligibility = progression
    ? checkRankEligibility(progression.rank, level, progression.closedDeals, progression.badges)
    : { eligible: false, missingRequirements: [] };

  const specialization = progression?.specialization
    ? getSpecializationById(progression.specialization)
    : undefined;

  const addXP = useCallback(async ({ eventType, multipliers = {}, details = '' }: AddXPParams): Promise<XPResult> => {
    const current = await progressionDb.progression.get('current');
    if (!current) {
      return { xpEarned: 0, newLevel: 1, leveledUp: false, newBadges: [] };
    }

    const baseAmount = XP_SOURCES[eventType]?.base || 0;
    let finalAmount = baseAmount;

    const specMultiplier = getSpecializationMultiplier(current.specialization, eventType);
    finalAmount = Math.round(finalAmount * specMultiplier);

    for (const [, mult] of Object.entries(multipliers)) {
      finalAmount = Math.round(finalAmount * mult);
    }

    const oldLevel = calculateLevel(current.totalXp);
    const newXp = current.totalXp + finalAmount;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > oldLevel;

    await progressionDb.progression.update('current', {
      totalXp: newXp,
      currentLevel: newLevel,
      lastActivityDate: new Date(),
    });

    await progressionDb.xpEvents.add({
      eventType,
      xpAmount: finalAmount,
      multipliers: { ...multipliers, specialization: specMultiplier },
      createdAt: new Date(),
    });

    await progressionDb.progressionActivityLog.add({
      action: eventType,
      details: details || XP_SOURCES[eventType]?.name || eventType,
      xpEarned: finalAmount,
      timestamp: new Date(),
    });

    setRecentXpGain({ amount: finalAmount, id: Date.now() });
    setTimeout(() => setRecentXpGain(null), 2000);

    return { xpEarned: finalAmount, newLevel, leveledUp, newBadges: [] };
  }, []);

  const incrementDeals = useCallback(async () => {
    const current = await progressionDb.progression.get('current');
    if (!current) return;

    await progressionDb.progression.update('current', {
      closedDeals: current.closedDeals + 1,
    });
  }, []);

  const setSpecialization = useCallback(async (specId: string) => {
    await progressionDb.progression.update('current', {
      specialization: specId,
    });
  }, []);

  const promoteRank = useCallback(async () => {
    const current = await progressionDb.progression.get('current');
    if (!current) return false;

    const next = getNextRank(current.rank);
    if (!next) return false;

    const eligibility = checkRankEligibility(current.rank, level, current.closedDeals, current.badges);
    if (!eligibility.eligible) return false;

    await progressionDb.progression.update('current', {
      rank: next.id,
      graduationDate: current.rank.startsWith('sdr') && next.id === 'operative' ? new Date() : current.graduationDate,
    });

    return true;
  }, [level]);

  const addBadge = useCallback(async (badgeId: string) => {
    const current = await progressionDb.progression.get('current');
    if (!current || current.badges.includes(badgeId)) return;

    await progressionDb.progression.update('current', {
      badges: [...current.badges, badgeId],
    });
  }, []);

  return {
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
    recentEvents,
    recentXpGain,
    addXP,
    incrementDeals,
    setSpecialization,
    promoteRank,
    addBadge,
  };
}
