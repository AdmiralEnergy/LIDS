import { resolveXPSource } from './xp';

export interface SpecializationDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockLevel: number;
  bonusLabel: string;
  bonuses: {
    xpType: string;
    multiplier: number;
  }[];
}

export const SPECIALIZATIONS: SpecializationDefinition[] = [
  {
    id: 'speed_dialer',
    name: 'Speed Dialer',
    description: 'Master of high-volume outreach. More dials, more opportunities.',
    icon: 'Zap',
    color: '#5a9fd4',
    unlockLevel: 5,
    bonusLabel: '+25% Dial XP',
    bonuses: [
      { xpType: 'dial', multiplier: 1.25 },
      { xpType: 'connect', multiplier: 1.1 },
    ],
  },
  {
    id: 'relationship_builder',
    name: 'Relationship Builder',
    description: 'Focus on quality connections and nurturing prospects.',
    icon: 'Heart',
    color: '#6b9a7d',
    unlockLevel: 5,
    bonusLabel: '+50% Appointment XP',
    bonuses: [
      { xpType: 'appointment', multiplier: 1.5 },
      { xpType: 'callback_scheduled', multiplier: 1.3 },
    ],
  },
  {
    id: 'closer',
    name: 'Closer Mindset',
    description: 'Driven by results. Every call is an opportunity to close.',
    icon: 'Target',
    color: '#c9a648',
    unlockLevel: 5,
    bonusLabel: '+75% Deal XP',
    bonuses: [
      { xpType: 'deal_closed', multiplier: 1.75 },
      { xpType: 'appointment', multiplier: 1.2 },
    ],
  },
  {
    id: 'referral_master',
    name: 'Referral Master',
    description: 'Build a network that keeps giving. Referrals are your specialty.',
    icon: 'Share2',
    color: '#d4a85a',
    unlockLevel: 5,
    bonusLabel: '+100% Referral XP',
    bonuses: [
      { xpType: 'referral', multiplier: 2.0 },
      { xpType: 'email_replied', multiplier: 1.3 },
    ],
  },
];

export function getSpecializationById(id: string): SpecializationDefinition | undefined {
  return SPECIALIZATIONS.find((s) => s.id === id);
}

export function getSpecializationMultiplier(
  specializationId: string | undefined,
  xpType: string
): number {
  if (!specializationId) return 1;
  
  const spec = getSpecializationById(specializationId);
  if (!spec) return 1;

  const resolvedType = resolveXPSource(xpType);
  const bonus = spec.bonuses.find((b) => resolveXPSource(b.xpType) === resolvedType);
  return bonus?.multiplier || 1;
}
