export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeTierDefinition {
  requirement: number | Record<string, unknown>;
  metric?: string;
  xpReward?: number;
  xpBonus?: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'performance' | 'streaks' | 'special';
  icon: string;
  tiers: {
    [key in BadgeTier]?: BadgeTierDefinition;
  };
}

export const BADGES: Record<string, BadgeDefinition> = {
  cold_calling_master: {
    id: 'cold_calling_master',
    name: 'Cold Calling Master',
    description: 'Complete dials to earn this badge',
    category: 'communication',
    icon: '📞',
    tiers: {
      bronze: { requirement: 100, metric: 'dials', xpReward: 50 },
      silver: { requirement: 500, metric: 'dials', xpReward: 150 },
      gold: { requirement: 2000, metric: 'dials', xpReward: 400 },
      platinum: { requirement: 10000, metric: 'dials', xpReward: 1000 },
    },
  },
  connector: {
    id: 'connector',
    name: 'The Connector',
    description: 'Successfully connect with prospects',
    category: 'communication',
    icon: '🤝',
    tiers: {
      bronze: { requirement: 25, metric: 'connects', xpReward: 75 },
      silver: { requirement: 100, metric: 'connects', xpReward: 200 },
      gold: { requirement: 500, metric: 'connects', xpReward: 500 },
      platinum: { requirement: 2000, metric: 'connects', xpReward: 1200 },
    },
  },
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

export const BADGE_TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
};

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES[id];
}
