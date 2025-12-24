import { z } from "zod";

// Rep identity
export const repSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export type Rep = z.infer<typeof repSchema>;
export type InsertRep = Omit<Rep, 'id'>;

// Rank types
export const rankSchema = z.enum([
  'sdr_1',
  'sdr_2',
  'sdr_3',
  'operative',
  'senior',
  'team_lead',
  'manager',
]);

export type Rank = z.infer<typeof rankSchema>;

// Badge schema
export const badgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  earnedAt: z.string().optional(),
});

export type Badge = z.infer<typeof badgeSchema>;

// Certification schema
export const certificationSchema = z.object({
  examType: z.string(),
  score: z.number(),
  passed: z.boolean(),
  completedAt: z.string(),
  badge: z.string().optional(),
});

export type Certification = z.infer<typeof certificationSchema>;

// Progression schema
export const progressionSchema = z.object({
  xp: z.number(),
  level: z.number(),
  rank: rankSchema,
  badges: z.array(badgeSchema),
  completedModules: z.array(z.string()),
  certifications: z.array(certificationSchema),
});

export type Progression = z.infer<typeof progressionSchema>;

// Module status schema
export const moduleStatusSchema = z.object({
  id: z.string(),
  passed: z.boolean(),
  score: z.number(),
});

export type ModuleStatus = z.infer<typeof moduleStatusSchema>;

// Exam question schema
export const examQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  answers: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: z.string(),
  correctAnswer: z.number().optional(),
});

export type ExamQuestion = z.infer<typeof examQuestionSchema>;

// Exam session schema
export const examSessionSchema = z.object({
  examId: z.string(),
  examType: z.string(),
  repId: z.string(),
  questions: z.array(examQuestionSchema),
  timeLimit: z.number(),
  startedAt: z.string(),
});

export type ExamSession = z.infer<typeof examSessionSchema>;

// Insert exam session schema (for starting exams)
export const insertExamSessionSchema = z.object({
  repId: z.string(),
  examType: z.string(),
});

export type InsertExamSession = z.infer<typeof insertExamSessionSchema>;

// Exam answers schema
export const examAnswersSchema = z.object({
  examId: z.string(),
  answers: z.record(z.string(), z.number()),
});

export type ExamAnswers = z.infer<typeof examAnswersSchema>;

// Exam result schema
export const examResultSchema = z.object({
  score: z.number(),
  passed: z.boolean(),
  xpAwarded: z.number(),
  badge: z.string().optional(),
  explanations: z.array(z.object({
    questionId: z.string(),
    correct: z.number(),
    explanation: z.string(),
  })),
});

export type ExamResult = z.infer<typeof examResultSchema>;

// Battle scores schema
export const battleScoresSchema = z.object({
  opener: z.number(),
  rapport: z.number(),
  discovery: z.number(),
  pitch: z.number(),
  objectionHandling: z.number(),
  closing: z.number(),
  overall: z.number(),
});

export type BattleScores = z.infer<typeof battleScoresSchema>;

// Persona schema
export const personaSchema = z.object({
  name: z.string(),
  archetype: z.string(),
  level: z.number(),
  openingLine: z.string(),
  avatar: z.string().optional(),
});

export type Persona = z.infer<typeof personaSchema>;

// Turn schema
export const turnSchema = z.object({
  speaker: z.enum(['rep', 'ai']),
  text: z.string(),
  timestamp: z.string(),
  scores: battleScoresSchema.partial().optional(),
});

export type Turn = z.infer<typeof turnSchema>;

// Battle session schema
export const battleSessionSchema = z.object({
  id: z.string(),
  repId: z.string(),
  repName: z.string(),
  persona: personaSchema,
  level: z.number(),
  status: z.enum(['active', 'won', 'lost', 'abandoned']),
  turns: z.array(turnSchema),
  scores: battleScoresSchema,
  startedAt: z.string(),
});

export type BattleSession = z.infer<typeof battleSessionSchema>;

// Insert battle session schema
export const insertBattleSessionSchema = z.object({
  repId: z.string(),
  repName: z.string(),
  level: z.number().min(1).max(5),
});

export type InsertBattleSession = z.infer<typeof insertBattleSessionSchema>;

// Battle turn input schema
export const battleTurnInputSchema = z.object({
  sessionId: z.string(),
  repSpeech: z.string(),
});

export type BattleTurnInput = z.infer<typeof battleTurnInputSchema>;

// Battle end input schema
export const battleEndInputSchema = z.object({
  sessionId: z.string(),
  outcome: z.enum(['win', 'lose', 'abandon']),
});

export type BattleEndInput = z.infer<typeof battleEndInputSchema>;

// Battle history item schema
export const battleHistoryItemSchema = z.object({
  id: z.string(),
  persona: z.string(),
  level: z.number(),
  outcome: z.enum(['won', 'lost', 'abandoned']),
  score: z.number(),
  xpAwarded: z.number(),
  completedAt: z.string(),
});

export type BattleHistoryItem = z.infer<typeof battleHistoryItemSchema>;

// Battle stats schema
export const battleStatsSchema = z.object({
  wins: z.number(),
  losses: z.number(),
  abandoned: z.number(),
  avgScore: z.number(),
  highestLevel: z.number(),
  history: z.array(battleHistoryItemSchema),
});

export type BattleStats = z.infer<typeof battleStatsSchema>;

// Module info schema
export const moduleInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  section: z.string(),
  topics: z.array(z.string()),
  passScore: z.number(),
  xpReward: z.number(),
  questionCount: z.number(),
  timeLimit: z.number(),
  prerequisiteModules: z.array(z.string()).optional(),
});

export type ModuleInfo = z.infer<typeof moduleInfoSchema>;

// Legacy user types (for compatibility)
export interface User {
  id: string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}
