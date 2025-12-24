export interface EfficiencyRequirement {
  metric: string;
  threshold: number;
  comparison?: 'less_than' | 'greater_than';
}

export interface RankRequirements {
  minLevel: number;
  minDeals: number;
  requiredBadges: string[];
  moduleRequirements?: string[];
  efficiencyRequirement?: EfficiencyRequirement;
  bossDefeated?: string;
  examPassed?: string;
  mentoringRequired?: number;
  leadershipCertification?: boolean;
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
      requiredBadges: ['opener_elite.bronze'],
      moduleRequirements: ['module_0', 'module_1'],
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
      requiredBadges: ['opener_elite.silver', 'conversion_champion.bronze'],
      moduleRequirements: ['module_0', 'module_1', 'module_2', 'module_3'],
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
      requiredBadges: ['opener_elite.gold', 'conversion_champion.silver', 'appointment_setter.silver'],
      moduleRequirements: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5'],
      efficiencyRequirement: { metric: 'sub_30s_drop_rate', threshold: 0.50, comparison: 'less_than' },
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
      requiredBadges: ['conversion_champion.gold', 'closer.gold'],
      moduleRequirements: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6'],
      efficiencyRequirement: { metric: 'call_to_appt_rate', threshold: 0.05, comparison: 'greater_than' },
      bossDefeated: 'redhawk',
      examPassed: 'senior_certification',
    },
  },
  team_lead: {
    id: 'team_lead',
    name: 'Team Lead',
    shortName: 'TL',
    grade: 'E-6',
    color: '#3b82f6',
    description: 'Leading and developing a sales team',
    requirements: {
      minLevel: 18,
      minDeals: 25,
      requiredBadges: ['conversion_champion.gold', 'show_rate_champion.silver'],
      moduleRequirements: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6'],
      efficiencyRequirement: { metric: 'cadence_completion', threshold: 0.70, comparison: 'greater_than' },
      mentoringRequired: 2,
    },
  },
  manager: {
    id: 'manager',
    name: 'Manager',
    shortName: 'MGR',
    grade: 'E-7',
    color: '#8b5cf6',
    description: 'Managing multiple teams and driving results',
    requirements: {
      minLevel: 25,
      minDeals: 50,
      requiredBadges: ['conversion_champion.platinum'],
      moduleRequirements: ['module_6'],
      efficiencyRequirement: { metric: 'team_conversion', threshold: 0.05, comparison: 'greater_than' },
      leadershipCertification: true,
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
  passedExams: string[] = [],
  completedModules: string[] = [],
  efficiencyMetrics?: Record<string, number>,
  menteeCount: number = 0
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

  if (req.moduleRequirements) {
    for (const moduleId of req.moduleRequirements) {
      if (!completedModules.includes(moduleId)) {
        missing.push(`Complete ${moduleId.replace(/_/g, ' ')}`);
      }
    }
  }

  if (req.efficiencyRequirement && efficiencyMetrics) {
    const { metric, threshold, comparison } = req.efficiencyRequirement;
    const currentValue = efficiencyMetrics[metric] || 0;
    const meetsRequirement = comparison === 'less_than' 
      ? currentValue <= threshold 
      : currentValue >= threshold;
    
    if (!meetsRequirement) {
      const direction = comparison === 'less_than' ? 'below' : 'above';
      missing.push(`Get ${metric.replace(/_/g, ' ')} ${direction} ${(threshold * 100).toFixed(0)}%`);
    }
  }

  if (req.bossDefeated && !defeatedBosses.includes(req.bossDefeated)) {
    const boss = BOSSES[req.bossDefeated];
    missing.push(`Defeat ${boss?.name || req.bossDefeated} in battle`);
  }

  if (req.examPassed && !passedExams.includes(req.examPassed)) {
    missing.push(`Pass ${req.examPassed.replace(/_/g, ' ')} exam`);
  }

  if (req.mentoringRequired && menteeCount < req.mentoringRequired) {
    missing.push(`Mentor ${req.mentoringRequired} reps (currently ${menteeCount})`);
  }

  if (req.leadershipCertification) {
    missing.push(`Complete Leadership Certification`);
  }

  return { eligible: missing.length === 0, missing };
}
