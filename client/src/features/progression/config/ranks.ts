export interface RankRequirements {
  minLevel: number;
  minDeals: number;
  requiredBadges: string[];
  bossDefeated?: string;
  examPassed?: string;
}

export interface RankDefinition {
  id: string;
  name: string;
  shortName: string;
  grade: string;
  color: string;
  description: string;
  requirements: RankRequirements;
}

export interface BossDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  unlockLevel: number;
  requiredForRank: string;
  rewards: {
    xp: number;
    badge: string;
    title: string;
  };
}

export const RANKS: Record<string, RankDefinition> = {
  sdr_1: {
    id: 'sdr_1',
    name: 'SDR I',
    shortName: 'SDR-I',
    grade: 'E-1',
    color: '#64748b',
    description: 'New recruit, learning the ropes',
    requirements: {
      minLevel: 1,
      minDeals: 0,
      requiredBadges: [],
    },
  },
  sdr_2: {
    id: 'sdr_2',
    name: 'SDR II',
    shortName: 'SDR-II',
    grade: 'E-2',
    color: '#64748b',
    description: 'Making calls, learning the script',
    requirements: {
      minLevel: 3,
      minDeals: 2,
      requiredBadges: ['cold_calling_master.bronze'],
    },
  },
  sdr_3: {
    id: 'sdr_3',
    name: 'SDR III',
    shortName: 'SDR-III',
    grade: 'E-3',
    color: '#64748b',
    description: 'Setting appointments consistently',
    requirements: {
      minLevel: 6,
      minDeals: 10,
      requiredBadges: ['cold_calling_master.silver', 'connector.bronze'],
    },
  },
  operative: {
    id: 'operative',
    name: 'Sales Operative',
    shortName: 'OPER',
    grade: 'E-4',
    color: '#22c55e',
    description: 'Fully qualified, independent seller',
    requirements: {
      minLevel: 10,
      minDeals: 25,
      requiredBadges: ['cold_calling_master.gold', 'connector.silver', 'appointment_setter.silver'],
      examPassed: 'operative_certification',
    },
  },
  senior_operative: {
    id: 'senior_operative',
    name: 'Senior Sales Operative',
    shortName: 'SR-OPER',
    grade: 'E-5',
    color: '#c9a648',
    description: 'Proven performer, mentor to others',
    requirements: {
      minLevel: 15,
      minDeals: 100,
      requiredBadges: ['cold_calling_master.platinum', 'closer.gold'],
      bossDefeated: 'redhawk',
      examPassed: 'senior_certification',
    },
  },
};

export const BOSSES: Record<string, BossDefinition> = {
  redhawk: {
    id: 'redhawk',
    name: 'REDHAWK',
    title: 'The Sales Training AI',
    description: 'Master of objection handling and sales psychology',
    color: '#dc2626',
    icon: '🦅',
    unlockLevel: 12,
    requiredForRank: 'senior_operative',
    rewards: {
      xp: 1000,
      badge: 'redhawk_slayer',
      title: 'RedHawk Conqueror',
    },
  },
};

export function getRankById(id: string): RankDefinition | undefined {
  return RANKS[id];
}

export function getNextRank(currentRankId: string): RankDefinition | undefined {
  const rankIds = Object.keys(RANKS);
  const currentIndex = rankIds.indexOf(currentRankId);
  if (currentIndex >= 0 && currentIndex < rankIds.length - 1) {
    return RANKS[rankIds[currentIndex + 1]];
  }
  return undefined;
}

export function checkRankEligibility(
  currentRankId: string,
  level: number,
  deals: number,
  badges: string[],
  defeatedBosses: string[] = [],
  passedExams: string[] = []
): { eligible: boolean; missing: string[] } {
  const nextRank = getNextRank(currentRankId);
  if (!nextRank) return { eligible: false, missing: ['Max rank reached'] };

  const missing: string[] = [];
  const req = nextRank.requirements;

  if (level < req.minLevel) {
    missing.push(`Reach Level ${req.minLevel} (currently ${level})`);
  }

  if (deals < req.minDeals) {
    missing.push(`Close ${req.minDeals} deals (currently ${deals})`);
  }

  for (const badge of req.requiredBadges) {
    if (!badges.includes(badge)) {
      const [badgeId, tier] = badge.split('.');
      missing.push(`Earn ${tier.charAt(0).toUpperCase() + tier.slice(1)} ${badgeId.replace(/_/g, ' ')}`);
    }
  }

  if (req.bossDefeated && !defeatedBosses.includes(req.bossDefeated)) {
    const boss = BOSSES[req.bossDefeated];
    missing.push(`⚔️ Defeat ${boss?.name || req.bossDefeated} in battle`);
  }

  if (req.examPassed && !passedExams.includes(req.examPassed)) {
    missing.push(`📝 Pass ${req.examPassed.replace(/_/g, ' ')} exam`);
  }

  return { eligible: missing.length === 0, missing };
}
