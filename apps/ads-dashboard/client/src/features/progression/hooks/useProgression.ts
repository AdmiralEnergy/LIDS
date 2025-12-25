import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { progressionDb, initProgression, UserProgression, incrementDailyMetric } from '@/lib/progressionDb';
import { XP_THRESHOLDS, calculateLevel, XP_SOURCES, resolveXPSource } from '../config/xp';
import { getRankById, getNextRank, checkRankEligibility, BOSSES } from '../config/ranks';
import { getSpecializationMultiplier, getSpecializationById } from '../config/specializations';
import { useEfficiencyMetrics } from './useEfficiencyMetrics';

interface AddXPParams {
  eventType: string;
  amount?: number;
  multipliers?: Record<string, number>;
  details?: string;
}

interface XPResult {
  xpEarned: number;
  newLevel: number;
  leveledUp: boolean;
  newBadges: string[];
}

function calculateStreak(lastActivityDate: Date | undefined, currentStreak: number): { streakDays: number; isNewDay: boolean } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!lastActivityDate) {
    return { streakDays: 1, isNewDay: true };
  }

  const lastDate = new Date(lastActivityDate);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  const diffTime = today.getTime() - lastDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { streakDays: currentStreak, isNewDay: false };
  }
  if (diffDays === 1) {
    return { streakDays: currentStreak + 1, isNewDay: true };
  }
  return { streakDays: 1, isNewDay: true };
}

export const recordCallMetrics = async (durationSeconds: number) => {
  if (durationSeconds < 30) {
    await incrementDailyMetric('callsUnder30s');
  } else if (durationSeconds >= 120) {
    await incrementDailyMetric('callsOver2Min');
  }
};

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

  const efficiencyData = useEfficiencyMetrics(7);

  const level = progression ? calculateLevel(progression.totalXp) : 1;
  const xpForCurrentLevel = XP_THRESHOLDS[Math.min(level - 1, XP_THRESHOLDS.length - 1)] || 0;
  const xpForNextLevel = XP_THRESHOLDS[Math.min(level, XP_THRESHOLDS.length - 1)] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
  const xpProgress = (progression?.totalXp || 0) - xpForCurrentLevel;
  const xpToNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = xpToNextLevel > 0 ? Math.min((xpProgress / xpToNextLevel) * 100, 100) : 100;

  const currentRank = progression ? getRankById(progression.rank) : getRankById('sdr_1');
  const nextRank = progression ? getNextRank(progression.rank) : undefined;
  
  const defeatedBosses = progression?.defeatedBosses || [];
  const passedExams = progression?.passedExams || [];
  const titles = progression?.titles || [];
  const activeTitle = progression?.activeTitle;

  const completedModules = progression?.completedModules || [];
  const menteeCount = progression?.menteeCount || 0;

  const efficiencyMetrics = efficiencyData ? {
    sub30sDropRate: efficiencyData.sub30sDropRate,
    callToApptRate: efficiencyData.callToApptRate,
    twoPlusMinRate: efficiencyData.twoPlusMinRate,
    showRate: efficiencyData.showRate,
    smsEnrollmentRate: efficiencyData.smsEnrollmentRate,
    sub_30s_drop_rate: efficiencyData.sub30sDropRate,
    call_to_appt_rate: efficiencyData.callToApptRate,
    two_plus_min_rate: efficiencyData.twoPlusMinRate,
    show_rate: efficiencyData.showRate,
    sms_enrollment_rate: efficiencyData.smsEnrollmentRate,
  } : undefined;

  const rankEligibility = progression
    ? checkRankEligibility(
        progression.rank, 
        level, 
        progression.closedDeals, 
        progression.badges,
        defeatedBosses,
        passedExams,
        completedModules,
        efficiencyMetrics,
        menteeCount
      )
    : { eligible: false, missing: [] };

  const specialization = progression?.specialization
    ? getSpecializationById(progression.specialization)
    : undefined;

  const addXP = useCallback(async ({ eventType, amount, multipliers = {}, details = '' }: AddXPParams): Promise<XPResult> => {
    const resolvedType = resolveXPSource(eventType);
    if (eventType && !amount) {
      if (!XP_SOURCES[resolvedType]) {
        console.warn(`Unknown XP event type: ${eventType}. No XP awarded.`);
        return { xpEarned: 0, newLevel: 1, leveledUp: false, newBadges: [] };
      }
    }

    const current = await progressionDb.progression.get('current');
    if (!current) {
      return { xpEarned: 0, newLevel: 1, leveledUp: false, newBadges: [] };
    }

    const baseAmount = amount ?? (XP_SOURCES[resolvedType]?.base || 0);
    let finalAmount = baseAmount;

    const specMultiplier = getSpecializationMultiplier(current.specialization, resolvedType);
    finalAmount = Math.round(finalAmount * specMultiplier);

    for (const [, mult] of Object.entries(multipliers)) {
      finalAmount = Math.round(finalAmount * mult);
    }

    const { streakDays, isNewDay } = calculateStreak(
      current.lastActivityDate,
      current.streakDays
    );

    let lastActivityDate = current.lastActivityDate;
    if (isNewDay) {
      lastActivityDate = new Date();
      if (streakDays > 1) {
        const streakBonus = XP_SOURCES.streak_day_bonus?.base || 10;
        finalAmount += streakBonus;
      }
    }

    const oldLevel = calculateLevel(current.totalXp);
    const newXp = current.totalXp + finalAmount;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > oldLevel;

    const updates: Partial<UserProgression> = {
      totalXp: newXp,
      currentLevel: newLevel,
    };

    if (isNewDay) {
      updates.streakDays = streakDays;
      updates.lastActivityDate = lastActivityDate;
    }

    await progressionDb.progression.update('current', updates);

    await progressionDb.xpEvents.add({
      eventType: resolvedType,
      xpAmount: finalAmount,
      multipliers: { ...multipliers, specialization: specMultiplier },
      createdAt: new Date(),
    });

    await progressionDb.progressionActivityLog.add({
      action: resolvedType,
      details: details || XP_SOURCES[resolvedType]?.name || resolvedType,
      xpEarned: finalAmount,
      timestamp: new Date(),
    });

    if (eventType) {
      const metricMap: Record<string, string> = {
        dial_made: 'dials',
        call_connected: 'connects',
        appointment_set: 'appointments',
        appointment_held: 'shows',
        deal_closed: 'deals',
        sms_campaign_enrollment: 'smsEnrollments',
        sms_enrollment: 'smsEnrollments',
      };

      const metric = metricMap[resolvedType];
      if (metric) {
        await incrementDailyMetric(metric as any);
      }
    }

    setRecentXpGain({ amount: finalAmount, id: Date.now() });
    setTimeout(() => setRecentXpGain(null), 2000);

    if (leveledUp) {
      window.dispatchEvent(new CustomEvent('levelUp', {
        detail: { newLevel, oldLevel }
      }));
    }

    if (typeof window !== 'undefined') {
      clearTimeout((window as any).__xpSyncTimeout);
      (window as any).__xpSyncTimeout = window.setTimeout(() => {
        import('@/lib/twentySync').then(({ syncToTwenty }) => {
          syncToTwenty().catch(console.error);
        });
      }, 2000);
    }

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

  const promoteRank = useCallback(async (nextRankId?: string) => {
    const current = await progressionDb.progression.get('current');
    if (!current) return false;

    const next = nextRankId ? getRankById(nextRankId) : getNextRank(current.rank);
    if (!next) return false;

    const eligibility = checkRankEligibility(
      current.rank, 
      level, 
      current.closedDeals, 
      current.badges,
      current.defeatedBosses || [],
      current.passedExams || [],
      current.completedModules || [],
      efficiencyMetrics,
      current.menteeCount || 0
    );
    if (!eligibility.eligible) return false;

    await progressionDb.progression.update('current', {
      rank: next.id,
      graduationDate: current.rank.startsWith('sdr') && next.id === 'operative' ? new Date() : current.graduationDate,
    });

    window.dispatchEvent(new CustomEvent('rankUp', {
      detail: { 
        newRank: next.id, 
        rankName: next.name,
        grade: next.grade 
      }
    }));

    return true;
  }, [efficiencyMetrics, level]);

  const addBadge = useCallback(async (badgeId: string) => {
    const current = await progressionDb.progression.get('current');
    if (!current || current.badges.includes(badgeId)) return;

    await progressionDb.progression.update('current', {
      badges: [...current.badges, badgeId],
    });

    window.dispatchEvent(new CustomEvent('badgeUnlock', {
      detail: { badgeId }
    }));
  }, []);

  const defeatBoss = useCallback(async (bossId: string) => {
    const boss = BOSSES[bossId];
    if (!boss) return;

    const current = await progressionDb.progression.get('current');
    if (!current) return;

    if (current.defeatedBosses?.includes(bossId)) {
      console.log(`Boss ${bossId} already defeated - no duplicate rewards`);
      return;
    }

    const newDefeatedBosses = [...(current.defeatedBosses || []), bossId];
    const newBadges = [...current.badges, boss.rewards.badge];
    const newTitles = [...(current.titles || []), boss.rewards.title];

    await progressionDb.progression.update('current', {
      defeatedBosses: newDefeatedBosses,
      badges: newBadges,
      titles: newTitles,
    });

    await addXP({
      eventType: 'boss_defeated',
      amount: boss.rewards.xp,
      details: `Defeated ${boss.name}`,
    });

    await progressionDb.bossHistory.add({
      bossId,
      result: 'victory',
      timestamp: new Date(),
    });

    window.dispatchEvent(new CustomEvent('bossDefeated', {
      detail: { boss, rewards: boss.rewards }
    }));
  }, [addXP]);

  const recordBossAttempt = useCallback(async (bossId: string) => {
    const current = await progressionDb.progression.get('current');
    if (!current) return;

    const attempts = { ...(current.bossAttempts || {}) };
    attempts[bossId] = (attempts[bossId] || 0) + 1;

    await progressionDb.progression.update('current', { bossAttempts: attempts });

    await progressionDb.bossHistory.add({
      bossId,
      result: 'defeat',
      timestamp: new Date(),
    });
  }, []);

  const isBossUnlocked = useCallback((bossId: string) => {
    const boss = BOSSES[bossId];
    if (!boss) return false;
    return level >= boss.unlockLevel;
  }, [level]);

  const isBossDefeated = useCallback((bossId: string) => {
    return defeatedBosses.includes(bossId);
  }, [defeatedBosses]);

  const setActiveTitle = useCallback(async (title: string) => {
    await progressionDb.progression.update('current', {
      activeTitle: title,
    });
  }, []);

  const passExam = useCallback(async (examId: string) => {
    const current = await progressionDb.progression.get('current');
    if (!current) return;

    if (current.passedExams?.includes(examId)) return;

    await progressionDb.progression.update('current', {
      passedExams: [...(current.passedExams || []), examId],
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
    defeatedBosses,
    passedExams,
    titles,
    activeTitle,
    closedDeals: progression?.closedDeals || 0,
    badges: progression?.badges || [],
    rank: progression?.rank || 'sdr_1',
    completedModules,
    menteeCount,
    addXP,
    recordCallMetrics,
    incrementDeals,
    setSpecialization,
    promoteRank,
    addBadge,
    defeatBoss,
    recordBossAttempt,
    isBossUnlocked,
    isBossDefeated,
    setActiveTitle,
    passExam,
  };
}
