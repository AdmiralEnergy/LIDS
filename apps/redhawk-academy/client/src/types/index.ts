// Rep identity
export interface Rep {
  id: string;
  name: string;
  email: string;
}

// Progression state
export interface Progression {
  xp: number;
  level: number;
  rank: Rank;
  badges: Badge[];
  completedModules: string[];
  certifications: Certification[];
}

export type Rank =
  | 'sdr_1'
  | 'sdr_2'
  | 'sdr_3'
  | 'operative'
  | 'senior'
  | 'team_lead'
  | 'manager';

export interface RankInfo {
  id: Rank;
  name: string;
  code: string;
  xpRequired: number;
  requiredModules: string[];
  efficiencyGate?: { metric: string; threshold: number };
}

// Framework Mastery Modules
export interface Module {
  id: string;
  name: string;
  description: string;
  section: string;
  topics: string[];
  passScore: number;
  xpReward: number;
  questionCount: number;
  timeLimit: number;
  prerequisiteModules?: string[];
}

export const FRAMEWORK_MODULES: Module[] = [
  {
    id: 'module_0',
    name: 'Product Foundations',
    description: 'Solar terminology, roof assessment, Duke Energy programs, NC utilities',
    section: 'SolarSales101',
    topics: ['Solar terminology', 'Roof assessment', 'Duke Energy programs', 'NC utilities'],
    passScore: 0.80,
    xpReward: 50,
    questionCount: 15,
    timeLimit: 10,
  },
  {
    id: 'module_1',
    name: 'Opener Mastery',
    description: 'Psychology of attention, 3 opener types, NC-specific hooks',
    section: 'Section 2',
    topics: ['Attention window', 'Permission opener', 'Curiosity opener', 'Pattern interrupt'],
    passScore: 0.80,
    xpReward: 50,
    questionCount: 15,
    timeLimit: 10,
  },
  {
    id: 'module_2',
    name: 'Timing Optimization',
    description: 'Legal calling windows, Power Hour strategy, calling blocks',
    section: 'Section 3',
    topics: ['TCPA time restrictions', 'Power Hour', 'Admiral calling blocks'],
    passScore: 0.80,
    xpReward: 50,
    questionCount: 15,
    timeLimit: 10,
  },
  {
    id: 'module_3',
    name: 'Cadence Excellence',
    description: 'Trust-Builder 14-day sequence, email and voicemail templates',
    section: 'Section 4',
    topics: ['14-day cadence', 'Email templates', 'Voicemail templates', 'Multi-channel touch'],
    passScore: 0.80,
    xpReward: 50,
    questionCount: 15,
    timeLimit: 10,
  },
  {
    id: 'module_4',
    name: 'Objection Exploration',
    description: 'Dialogue vs battle approach, common objections, smokescreen detection',
    section: 'Section 5',
    topics: ['Dialogue approach', 'Price objections', 'Timing objections', 'Smokescreen detection'],
    passScore: 0.85,
    xpReward: 75,
    questionCount: 20,
    timeLimit: 15,
  },
  {
    id: 'module_5',
    name: 'TCPA Compliance',
    description: 'Federal requirements, NC rules, DNC handling, consent documentation',
    section: 'Section 6',
    topics: ['TCPA rules', 'NC regulations', 'DNC compliance', 'Consent requirements'],
    passScore: 1.00,
    xpReward: 100,
    questionCount: 20,
    timeLimit: 15,
    prerequisiteModules: ['module_0', 'module_1'],
  },
  {
    id: 'module_6',
    name: 'Full Framework Certification',
    description: 'Comprehensive 50-question exam covering all framework sections',
    section: 'All Sections',
    topics: ['Comprehensive assessment'],
    passScore: 0.80,
    xpReward: 300,
    questionCount: 50,
    timeLimit: 30,
    prerequisiteModules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5'],
  },
];

// Boss Battle
export interface BattleSession {
  id: string;
  repId: string;
  persona: Persona;
  level: number;
  status: 'active' | 'won' | 'lost' | 'abandoned';
  turns: Turn[];
  scores: BattleScores;
  startedAt: string;
}

export interface Persona {
  name: string;
  archetype: string;
  level: number;
  openingLine: string;
  avatar?: string;
}

export interface Turn {
  speaker: 'rep' | 'ai';
  text: string;
  timestamp: string;
  scores?: Partial<BattleScores>;
}

export interface BattleScores {
  opener: number;
  rapport: number;
  discovery: number;
  pitch: number;
  objectionHandling: number;
  closing: number;
  overall: number;
}

export interface BattleStats {
  wins: number;
  losses: number;
  abandoned: number;
  avgScore: number;
  highestLevel: number;
  history: BattleHistoryItem[];
}

export interface BattleHistoryItem {
  id: string;
  persona: string;
  level: number;
  outcome: 'won' | 'lost' | 'abandoned';
  score: number;
  xpAwarded: number;
  completedAt: string;
}

// Certifications
export interface Certification {
  examType: string;
  score: number;
  passed: boolean;
  completedAt: string;
  badge?: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  answers: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface ExamSession {
  examId: string;
  examType: string;
  questions: ExamQuestion[];
  timeLimit: number;
  startedAt: string;
}

export interface ExamResult {
  score: number;
  passed: boolean;
  xpAwarded: number;
  badge?: string;
  explanations: { questionId: string; correct: number; explanation: string }[];
}

// Badges
export interface Badge {
  id: string;
  name: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt?: string;
}

// Module completion status
export interface ModuleStatus {
  id: string;
  passed: boolean;
  score: number;
}
