export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'performance' | 'streaks' | 'special';
  icon: string;
  tiers: {
    [key in BadgeTier]?: {
      requirement: number;
      metric: string;
      xpReward: number;
    };
  };
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'cold_calling_master',
    name: 'Cold Calling Master',
    description: 'Complete dials to earn this badge',
    category: 'communication',
    icon: 'Phone',
    tiers: {
      bronze: { requirement: 100, metric: 'dials', xpReward: 50 },
      silver: { requirement: 500, metric: 'dials', xpReward: 150 },
      gold: { requirement: 2000, metric: 'dials', xpReward: 400 },
      platinum: { requirement: 10000, metric: 'dials', xpReward: 1000 },
    },
  },
  {
    id: 'connector',
    name: 'The Connector',
    description: 'Successfully connect with prospects',
    category: 'communication',
    icon: 'Users',
    tiers: {
      bronze: { requirement: 25, metric: 'connects', xpReward: 75 },
      silver: { requirement: 100, metric: 'connects', xpReward: 200 },
      gold: { requirement: 500, metric: 'connects', xpReward: 500 },
      platinum: { requirement: 2000, metric: 'connects', xpReward: 1200 },
    },
  },
  {
    id: 'appointment_setter',
    name: 'Appointment Setter',
    description: 'Schedule appointments with prospects',
    category: 'performance',
    icon: 'Calendar',
    tiers: {
      bronze: { requirement: 10, metric: 'appointments', xpReward: 100 },
      silver: { requirement: 50, metric: 'appointments', xpReward: 300 },
      gold: { requirement: 200, metric: 'appointments', xpReward: 750 },
      platinum: { requirement: 1000, metric: 'appointments', xpReward: 2000 },
    },
  },
  {
    id: 'closer',
    name: 'The Closer',
    description: 'Close deals to earn this badge',
    category: 'performance',
    icon: 'Trophy',
    tiers: {
      bronze: { requirement: 5, metric: 'deals', xpReward: 150 },
      silver: { requirement: 25, metric: 'deals', xpReward: 500 },
      gold: { requirement: 100, metric: 'deals', xpReward: 1500 },
      platinum: { requirement: 500, metric: 'deals', xpReward: 5000 },
    },
  },
  {
    id: 'streak_warrior',
    name: 'Streak Warrior',
    description: 'Maintain consecutive days of activity',
    category: 'streaks',
    icon: 'Flame',
    tiers: {
      bronze: { requirement: 7, metric: 'streak_days', xpReward: 100 },
      silver: { requirement: 30, metric: 'streak_days', xpReward: 350 },
      gold: { requirement: 90, metric: 'streak_days', xpReward: 1000 },
      platinum: { requirement: 365, metric: 'streak_days', xpReward: 5000 },
    },
  },
  {
    id: 'email_expert',
    name: 'Email Expert',
    description: 'Send outreach emails',
    category: 'communication',
    icon: 'Mail',
    tiers: {
      bronze: { requirement: 50, metric: 'emails_sent', xpReward: 50 },
      silver: { requirement: 250, metric: 'emails_sent', xpReward: 150 },
      gold: { requirement: 1000, metric: 'emails_sent', xpReward: 400 },
      platinum: { requirement: 5000, metric: 'emails_sent', xpReward: 1000 },
    },
  },
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Close your first deal',
    category: 'special',
    icon: 'Star',
    tiers: {
      bronze: { requirement: 1, metric: 'deals', xpReward: 250 },
    },
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Make calls before 9 AM',
    category: 'special',
    icon: 'Sunrise',
    tiers: {
      bronze: { requirement: 10, metric: 'early_calls', xpReward: 75 },
      silver: { requirement: 50, metric: 'early_calls', xpReward: 200 },
      gold: { requirement: 200, metric: 'early_calls', xpReward: 500 },
    },
  },
];

export const BADGE_TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
};

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id);
}
