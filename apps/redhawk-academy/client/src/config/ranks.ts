import { RankInfo, Rank } from '../types';

export const RANKS: RankInfo[] = [
  {
    id: 'sdr_1',
    name: 'SDR I',
    code: 'E-1',
    xpRequired: 0,
    requiredModules: [],
  },
  {
    id: 'sdr_2',
    name: 'SDR II',
    code: 'E-2',
    xpRequired: 500,
    requiredModules: ['module_0', 'module_1'],
  },
  {
    id: 'sdr_3',
    name: 'SDR III',
    code: 'E-3',
    xpRequired: 1500,
    requiredModules: ['module_0', 'module_1', 'module_2', 'module_3'],
  },
  {
    id: 'operative',
    name: 'Sales Operative',
    code: 'E-4',
    xpRequired: 3000,
    requiredModules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5'],
    efficiencyGate: { metric: 'sub_30s_drop_rate', threshold: 0.50 },
  },
  {
    id: 'senior',
    name: 'Senior Operative',
    code: 'E-5',
    xpRequired: 8000,
    requiredModules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6'],
    efficiencyGate: { metric: 'call_to_appt_rate', threshold: 0.05 },
  },
  {
    id: 'team_lead',
    name: 'Team Lead',
    code: 'E-6',
    xpRequired: 15000,
    requiredModules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6'],
    efficiencyGate: { metric: 'cadence_completion', threshold: 0.70 },
  },
  {
    id: 'manager',
    name: 'Manager',
    code: 'E-7',
    xpRequired: 30000,
    requiredModules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5', 'module_6'],
  },
];

export const RANK_COLORS: Record<Rank, string> = {
  sdr_1: 'bg-muted text-muted-foreground',
  sdr_2: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  sdr_3: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
  operative: 'bg-green-500/20 text-green-600 dark:text-green-400',
  senior: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  team_lead: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  manager: 'bg-red-500/20 text-red-600 dark:text-red-400',
};

export function getRankByXP(xp: number, completedModules: string[]): RankInfo {
  const eligible = RANKS.filter(
    rank => xp >= rank.xpRequired &&
    rank.requiredModules.every(m => completedModules.includes(m))
  );
  return eligible[eligible.length - 1] || RANKS[0];
}

export function getNextRank(currentRank: RankInfo): RankInfo | null {
  const currentIndex = RANKS.findIndex(r => r.id === currentRank.id);
  return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
}

export function getRankById(rankId: Rank): RankInfo {
  return RANKS.find(r => r.id === rankId) || RANKS[0];
}
