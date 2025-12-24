export interface FrameworkModule {
  id: string;
  name: string;
  section: string;
  topics: string[];
  passScore: number;
  xpReward: number;
  prerequisiteModules?: string[];
}

export const FRAMEWORK_MODULES: FrameworkModule[] = [
  {
    id: 'module_0',
    name: 'Product Foundations',
    section: 'SolarSales101',
    topics: ['Solar terminology', 'Roof assessment', 'Duke Energy programs', 'NC installation timeline'],
    passScore: 0.80,
    xpReward: 50,
  },
  {
    id: 'module_1',
    name: 'Opener Mastery',
    section: 'Section 2',
    topics: ['Psychology of attention', '3 opener types', 'NC-specific hooks'],
    passScore: 0.80,
    xpReward: 50,
  },
  {
    id: 'module_2',
    name: 'Timing Optimization',
    section: 'Section 3',
    topics: ['Legal calling windows', 'Power Hour strategy', 'Calling blocks'],
    passScore: 0.80,
    xpReward: 50,
  },
  {
    id: 'module_3',
    name: 'Cadence Excellence',
    section: 'Section 4',
    topics: ['Trust-Builder sequence', 'Email templates', 'Voicemail templates'],
    passScore: 0.80,
    xpReward: 50,
  },
  {
    id: 'module_4',
    name: 'Objection Exploration',
    section: 'Section 5',
    topics: ['Dialogue vs. battle', 'Common objections', 'Smokescreen detection'],
    passScore: 0.85,
    xpReward: 75,
  },
  {
    id: 'module_5',
    name: 'TCPA Compliance',
    section: 'Section 6',
    topics: ['Federal requirements', 'NC-specific rules', 'DNC handling'],
    passScore: 1.00,
    xpReward: 100,
  },
  {
    id: 'module_6',
    name: 'Full Framework Certification',
    section: 'All Sections',
    topics: ['Comprehensive assessment covering all modules'],
    passScore: 0.80,
    xpReward: 300,
    prerequisiteModules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5'],
  },
];

export function getModuleById(id: string): FrameworkModule | undefined {
  return FRAMEWORK_MODULES.find(m => m.id === id);
}

export function canAttemptModule(moduleId: string, completedModules: string[]): boolean {
  const module = getModuleById(moduleId);
  if (!module) return false;
  
  if (!module.prerequisiteModules || module.prerequisiteModules.length === 0) {
    return true;
  }
  
  return module.prerequisiteModules.every(prereq => completedModules.includes(prereq));
}

export function getModuleProgress(completedModules: string[]): {
  completed: number;
  total: number;
  percentage: number;
  nextModule: FrameworkModule | undefined;
} {
  const total = FRAMEWORK_MODULES.length;
  const completed = completedModules.length;
  const percentage = (completed / total) * 100;
  
  const nextModule = FRAMEWORK_MODULES.find(m => 
    !completedModules.includes(m.id) && canAttemptModule(m.id, completedModules)
  );
  
  return { completed, total, percentage, nextModule };
}
