export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type BadgeCategory = 'efficiency' | 'performance' | 'streaks' | 'special' | 'communication';

export interface BadgeTierDefinition {
  requirement?: number | Record<string, unknown>;
  threshold?: number;
  duration?: number;
  minAppts?: number;
  maxDials?: number;
  metric?: string;
  xpReward?: number;
  xpBonus?: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  metric?: string;
  comparison?: 'less_than' | 'greater_than' | 'special';
  minAppointments?: boolean;
  tiers: {
    [key in BadgeTier]?: BadgeTierDefinition;
  };
}

export const EFFICIENCY_BADGES: Record<string, BadgeDefinition> = {
  opener_elite: {
    id: 'opener_elite',
    name: 'Opener Elite',
    icon: '🎯',
    category: 'efficiency',
    description: 'Master the first 30 seconds - low drop rate proves your opener works',
    metric: 'sub_30s_drop_rate',
    comparison: 'less_than',
    tiers: {
      bronze: { threshold: 0.50, duration: 7, xpReward: 100 },
      silver: { threshold: 0.40, duration: 14, xpReward: 250 },
      gold: { threshold: 0.35, duration: 21, xpReward: 500 },
      platinum: { threshold: 0.30, duration: 28, xpReward: 1000 },
    },
  },
  conversion_champion: {
    id: 'conversion_champion',
    name: 'Conversion Champion',
    icon: '📈',
    category: 'efficiency',
    description: 'Turn conversations into appointments - the PRIMARY metric',
    metric: 'call_to_appt_rate',
    comparison: 'greater_than',
    tiers: {
      bronze: { threshold: 0.03, duration: 7, xpReward: 150 },
      silver: { threshold: 0.05, duration: 14, xpReward: 350 },
      gold: { threshold: 0.07, duration: 21, xpReward: 700 },
      platinum: { threshold: 0.10, duration: 28, xpReward: 1500 },
    },
  },
  engagement_master: {
    id: 'engagement_master',
    name: 'Engagement Master',
    icon: '💬',
    category: 'efficiency',
    description: 'Keep prospects engaged - 2+ minute calls show real conversations',
    metric: 'two_plus_min_rate',
    comparison: 'greater_than',
    tiers: {
      bronze: { threshold: 0.20, duration: 7, xpReward: 100 },
      silver: { threshold: 0.25, duration: 14, xpReward: 250 },
      gold: { threshold: 0.30, duration: 21, xpReward: 500 },
      platinum: { threshold: 0.35, duration: 28, xpReward: 1000 },
    },
  },
  efficiency_elite: {
    id: 'efficiency_elite',
    name: 'Efficiency Elite',
    icon: '⚡',
    category: 'efficiency',
    description: 'Maximum results with minimum dials - quality over quantity',
    metric: 'appts_per_dial_ratio',
    comparison: 'special',
    tiers: {
      bronze: { minAppts: 2, maxDials: 40, duration: 1, xpReward: 100 },
      silver: { minAppts: 3, maxDials: 50, duration: 7, xpReward: 300 },
      gold: { minAppts: 5, maxDials: 75, duration: 7, xpReward: 600 },
      platinum: { minAppts: 10, maxDials: 100, duration: 14, xpReward: 1200 },
    },
  },
  show_rate_champion: {
    id: 'show_rate_champion',
    name: 'Show Rate Champion',
    icon: '✅',
    category: 'efficiency',
    description: 'Your appointments actually show up - proves qualification quality',
    metric: 'show_rate',
    comparison: 'greater_than',
    minAppointments: true,
    tiers: {
      bronze: { threshold: 0.70, minAppts: 5, xpReward: 100 },
      silver: { threshold: 0.75, minAppts: 10, xpReward: 250 },
      gold: { threshold: 0.80, minAppts: 20, xpReward: 500 },
      platinum: { threshold: 0.85, minAppts: 30, xpReward: 1000 },
    },
  },
};

export const PERFORMANCE_BADGES: Record<string, BadgeDefinition> = {
  appointment_setter: {
    id: 'appointment_setter',
    name: 'Appointment Setter',
    description: 'Schedule appointments with prospects',
    category: 'performance',
    icon: '📅',
    tiers: {
      bronze: { requirement: 10, metric: 'appointments', xpReward: 100 },
      silver: { requirement: 50, metric: 'appointments', xpReward: 300 },
      gold: { requirement: 200, metric: 'appointments', xpReward: 750 },
      platinum: { requirement: 1000, metric: 'appointments', xpReward: 2000 },
    },
  },
  closer: {
    id: 'closer',
    name: 'The Closer',
    description: 'Close deals to earn this badge',
    category: 'performance',
    icon: '🏆',
    tiers: {
      bronze: { requirement: 5, metric: 'deals', xpReward: 150 },
      silver: { requirement: 25, metric: 'deals', xpReward: 500 },
      gold: { requirement: 100, metric: 'deals', xpReward: 1500 },
      platinum: { requirement: 500, metric: 'deals', xpReward: 5000 },
    },
  },
};

export const STREAK_BADGES: Record<string, BadgeDefinition> = {
  streak_warrior: {
    id: 'streak_warrior',
    name: 'Streak Warrior',
    description: 'Maintain consecutive days of activity',
    category: 'streaks',
    icon: '🔥',
    tiers: {
      bronze: { requirement: 7, metric: 'streak_days', xpReward: 100 },
      silver: { requirement: 30, metric: 'streak_days', xpReward: 350 },
      gold: { requirement: 90, metric: 'streak_days', xpReward: 1000 },
      platinum: { requirement: 365, metric: 'streak_days', xpReward: 5000 },
    },
  },
};

export const SPECIAL_BADGES: Record<string, BadgeDefinition> = {
  first_blood: {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Close your first deal',
    category: 'special',
    icon: '⭐',
    tiers: {
      bronze: { requirement: 1, metric: 'deals', xpReward: 250 },
    },
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Make calls before 9 AM',
    category: 'special',
    icon: '🌅',
    tiers: {
      bronze: { requirement: 10, metric: 'early_calls', xpReward: 75 },
      silver: { requirement: 50, metric: 'early_calls', xpReward: 200 },
      gold: { requirement: 200, metric: 'early_calls', xpReward: 500 },
    },
  },
  redhawk_slayer: {
    id: 'redhawk_slayer',
    name: 'RedHawk Slayer',
    category: 'special',
    icon: '⚔️',
    description: 'Defeated the RedHawk AI in single combat',
    tiers: {
      gold: {
        requirement: { bossDefeated: 'redhawk' },
        xpBonus: 500,
      },
    },
  },
  objection_master: {
    id: 'objection_master',
    name: 'Objection Master',
    category: 'special',
    icon: '🛡️',
    description: 'Handle objections like a pro',
    tiers: {
      bronze: { requirement: 25, metric: 'objections_handled', xpBonus: 50 },
      silver: { requirement: 100, metric: 'objections_handled', xpBonus: 100 },
      gold: { requirement: 500, metric: 'objections_handled', xpBonus: 200 },
      platinum: { requirement: 1000, metric: 'objections_handled', xpBonus: 500 },
    },
  },
};

export const COMMUNICATION_BADGES: Record<string, BadgeDefinition> = {
  email_expert: {
    id: 'email_expert',
    name: 'Email Expert',
    description: 'Send outreach emails',
    category: 'communication',
    icon: '📧',
    tiers: {
      bronze: { requirement: 50, metric: 'emails_sent', xpReward: 50 },
      silver: { requirement: 250, metric: 'emails_sent', xpReward: 150 },
      gold: { requirement: 1000, metric: 'emails_sent', xpReward: 400 },
      platinum: { requirement: 5000, metric: 'emails_sent', xpReward: 1000 },
    },
  },
};

export const BADGES: Record<string, BadgeDefinition> = {
  ...EFFICIENCY_BADGES,
  ...PERFORMANCE_BADGES,
  ...STREAK_BADGES,
  ...SPECIAL_BADGES,
  ...COMMUNICATION_BADGES,
};

export const BADGE_TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
};

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES[id];
}

export function isEfficiencyBadge(badgeId: string): boolean {
  return badgeId in EFFICIENCY_BADGES;
}
