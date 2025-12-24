export interface RankDefinition {
  id: string;
  name: string;
  shortName: string;
  grade: string;
  color: string;
  minLevel: number;
  minDeals: number;
  requiredBadges: string[];
  description: string;
}

export const RANKS: RankDefinition[] = [
  {
    id: 'sdr_1',
    name: 'SDR I',
    shortName: 'SDR-I',
    grade: 'E-1',
    color: '#718096',
    minLevel: 1,
    minDeals: 0,
    requiredBadges: [],
    description: 'Entry level sales development representative',
  },
  {
    id: 'sdr_2',
    name: 'SDR II',
    shortName: 'SDR-II',
    grade: 'E-2',
    color: '#48bb78',
    minLevel: 3,
    minDeals: 2,
    requiredBadges: ['cold_calling_master.bronze'],
    description: 'Experienced sales development representative',
  },
  {
    id: 'sdr_3',
    name: 'SDR III',
    shortName: 'SDR-III',
    grade: 'E-3',
    color: '#4299e1',
    minLevel: 6,
    minDeals: 10,
    requiredBadges: ['cold_calling_master.silver', 'connector.bronze'],
    description: 'Senior sales development representative',
  },
  {
    id: 'operative',
    name: 'Sales Operative',
    shortName: 'OPER',
    grade: 'E-4',
    color: '#c9a648',
    minLevel: 10,
    minDeals: 25,
    requiredBadges: ['cold_calling_master.gold', 'connector.silver', 'appointment_setter.silver'],
    description: 'Full sales operative with proven track record',
  },
  {
    id: 'senior_operative',
    name: 'Senior Operative',
    shortName: 'SR-OPER',
    grade: 'E-5',
    color: '#9f7aea',
    minLevel: 15,
    minDeals: 100,
    requiredBadges: ['cold_calling_master.platinum', 'closer.gold'],
    description: 'Elite sales operative',
  },
];

export function getRankById(id: string): RankDefinition | undefined {
  return RANKS.find((r) => r.id === id);
}

export function getNextRank(currentRankId: string): RankDefinition | undefined {
  const currentIndex = RANKS.findIndex((r) => r.id === currentRankId);
  if (currentIndex >= 0 && currentIndex < RANKS.length - 1) {
    return RANKS[currentIndex + 1];
  }
  return undefined;
}

export function checkRankEligibility(
  currentRankId: string,
  level: number,
  deals: number,
  badges: string[]
): { eligible: boolean; missingRequirements: string[] } {
  const nextRank = getNextRank(currentRankId);
  if (!nextRank) {
    return { eligible: false, missingRequirements: ['Already at max rank'] };
  }

  const missing: string[] = [];

  if (level < nextRank.minLevel) {
    missing.push(`Reach Level ${nextRank.minLevel} (current: ${level})`);
  }

  if (deals < nextRank.minDeals) {
    missing.push(`Close ${nextRank.minDeals} deals (current: ${deals})`);
  }

  for (const badge of nextRank.requiredBadges) {
    if (!badges.includes(badge)) {
      missing.push(`Earn badge: ${badge}`);
    }
  }

  return { eligible: missing.length === 0, missingRequirements: missing };
}
