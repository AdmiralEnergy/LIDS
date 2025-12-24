import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertExamSessionSchema, 
  examAnswersSchema, 
  insertBattleSessionSchema,
  battleTurnInputSchema,
  battleEndInputSchema
} from "@shared/schema";
import type { ExamSession, ExamQuestion, BattleSession, Turn, Persona } from "@shared/schema";

const MOCK_QUESTIONS: ExamQuestion[] = [
  {
    id: 'q1',
    text: 'What is the primary benefit of solar energy for homeowners in North Carolina?',
    answers: ['Lower electricity bills', 'Increased property value', 'Environmental benefits', 'All of the above'],
    difficulty: 'easy',
    category: 'basics',
    correctAnswer: 3,
  },
  {
    id: 'q2',
    text: 'Which federal program offers tax credits for solar installation?',
    answers: ['PACE', 'ITC (Investment Tax Credit)', 'SREC', 'RPS'],
    difficulty: 'medium',
    category: 'incentives',
    correctAnswer: 1,
  },
  {
    id: 'q3',
    text: 'What is the typical payback period for residential solar in NC?',
    answers: ['1-3 years', '5-8 years', '10-15 years', '15-20 years'],
    difficulty: 'medium',
    category: 'economics',
    correctAnswer: 1,
  },
  {
    id: 'q4',
    text: 'Under TCPA regulations, what time window is allowed for telemarketing calls?',
    answers: ['6 AM - 10 PM', '8 AM - 9 PM local time', '9 AM - 8 PM', '7 AM - 11 PM'],
    difficulty: 'hard',
    category: 'compliance',
    correctAnswer: 1,
  },
  {
    id: 'q5',
    text: 'What is the best opener type for cold calls?',
    answers: ['Direct pitch', 'Permission-based opener', 'Price-first approach', 'Technical specification dump'],
    difficulty: 'medium',
    category: 'sales',
    correctAnswer: 1,
  },
];

const PERSONAS: Persona[] = [
  { name: 'Sarah Johnson', archetype: 'Friendly Prospect', level: 1, openingLine: "Hi, I'm not really interested in solar panels. We just had someone else come by last week." },
  { name: 'Michael Chen', archetype: 'Cautious Buyer', level: 2, openingLine: "I've heard about solar but I'm worried about the upfront costs. Is it really worth it?" },
  { name: 'Patricia Williams', archetype: 'Tough Customer', level: 3, openingLine: "Look, I've got 5 minutes. What makes your company different from the dozen others who've called me?" },
  { name: 'Robert Davis', archetype: 'Expert Negotiator', level: 4, openingLine: "I've done my research. Your competitor offered me 20% less. What can you do for me?" },
  { name: 'The Gatekeeper', archetype: 'Maximum Resistance', level: 5, openingLine: "I'm the decision maker's assistant. They're extremely busy. You have 30 seconds to convince me this is worth their time." },
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Health check
  app.get('/api/redhawk/health', (req, res) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      uptime: process.uptime(),
    });
  });

  // Get modules list
  app.get('/api/redhawk/modules', (req, res) => {
    res.json([
      { id: 'module_0', name: 'Product Foundations', passScore: 0.80, xpReward: 50, questionCount: 15, timeLimit: 10 },
      { id: 'module_1', name: 'Opener Mastery', passScore: 0.80, xpReward: 50, questionCount: 15, timeLimit: 10 },
      { id: 'module_2', name: 'Timing Optimization', passScore: 0.80, xpReward: 50, questionCount: 15, timeLimit: 10 },
      { id: 'module_3', name: 'Cadence Excellence', passScore: 0.80, xpReward: 50, questionCount: 15, timeLimit: 10 },
      { id: 'module_4', name: 'Objection Exploration', passScore: 0.85, xpReward: 75, questionCount: 20, timeLimit: 15 },
      { id: 'module_5', name: 'TCPA Compliance', passScore: 1.00, xpReward: 100, questionCount: 20, timeLimit: 15 },
      { id: 'module_6', name: 'Full Framework Certification', passScore: 0.80, xpReward: 300, questionCount: 50, timeLimit: 30 },
    ]);
  });

  // Get progression - uses storage layer
  app.get('/api/redhawk/progress/:repId', async (req, res) => {
    try {
      const { repId } = req.params;
      const progression = await storage.getProgression(repId);
      res.json(progression);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get progression' });
    }
  });

  // Get certifications - uses storage layer
  app.get('/api/redhawk/cert/:repId', async (req, res) => {
    try {
      const { repId } = req.params;
      const progression = await storage.getProgression(repId);
      res.json({
        certifications: progression.certifications,
        modules: progression.completedModules.map(id => ({
          id,
          passed: true,
          score: 0.85 + Math.random() * 0.15,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get certifications' });
    }
  });

  // Start exam - uses storage layer with Zod validation
  app.post('/api/redhawk/cert/start', async (req, res) => {
    try {
      const parseResult = insertExamSessionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }
      
      const { repId, examType } = parseResult.data;
      const examId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const shuffledQuestions = [...MOCK_QUESTIONS]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(q => ({
          id: q.id,
          text: q.text,
          answers: q.answers,
          difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
          category: q.category,
        }));

      const session: ExamSession = {
        examId,
        examType,
        repId,
        questions: shuffledQuestions,
        timeLimit: 10,
        startedAt: new Date().toISOString(),
      };

      await storage.createExamSession(session);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start exam' });
    }
  });

  // Submit exam - uses storage layer with Zod validation
  app.post('/api/redhawk/cert/submit', async (req, res) => {
    try {
      const parseResult = examAnswersSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }
      
      const { examId, answers } = parseResult.data;
      const session = await storage.getExamSession(examId);
      
      if (!session) {
        return res.status(404).json({ error: 'Exam session not found' });
      }

      let correctCount = 0;
      const explanations: any[] = [];

      session.questions.forEach((q) => {
        const originalQ = MOCK_QUESTIONS.find(mq => mq.id === q.id);
        const userAnswer = answers[q.id];
        const isCorrect = originalQ && userAnswer === originalQ.correctAnswer;
        
        if (isCorrect) correctCount++;
        
        explanations.push({
          questionId: q.id,
          correct: originalQ?.correctAnswer || 0,
          explanation: isCorrect 
            ? 'Correct! Great job.' 
            : `The correct answer was option ${(originalQ?.correctAnswer || 0) + 1}. Review this topic for better understanding.`,
        });
      });

      const score = correctCount / session.questions.length;
      const passed = score >= 0.80;
      const xpAwarded = passed ? 50 : 0;

      // Update progression if passed
      if (passed) {
        const progression = await storage.getProgression(session.repId);
        const completedModules = progression.completedModules.includes(session.examType)
          ? progression.completedModules
          : [...progression.completedModules, session.examType];
        
        await storage.updateProgression(session.repId, {
          xp: progression.xp + xpAwarded,
          completedModules,
        });
      }

      await storage.deleteExamSession(examId);

      res.json({
        score,
        passed,
        xpAwarded,
        explanations,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit exam' });
    }
  });

  // Get battle stats - uses storage layer
  app.get('/api/redhawk/battle/stats/:repId', async (req, res) => {
    try {
      const { repId } = req.params;
      const stats = await storage.getBattleStats(repId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get battle stats' });
    }
  });

  // Start battle - uses storage layer with Zod validation
  app.post('/api/redhawk/battle/start', async (req, res) => {
    try {
      const parseResult = insertBattleSessionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }
      
      const { repId, repName, level } = parseResult.data;
      const sessionId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const persona = PERSONAS[Math.min(level - 1, PERSONAS.length - 1)];

      const session: BattleSession = {
        id: sessionId,
        repId,
        repName,
        level,
        persona: { ...persona, level },
        status: 'active',
        turns: [],
        scores: {
          opener: 0,
          rapport: 0,
          discovery: 0,
          pitch: 0,
          objectionHandling: 0,
          closing: 0,
          overall: 0,
        },
        startedAt: new Date().toISOString(),
      };

      await storage.createBattleSession(session);

      res.json({
        session,
        persona: { ...persona, level },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start battle' });
    }
  });

  // Battle turn - uses storage layer with Zod validation
  app.post('/api/redhawk/battle/turn', async (req, res) => {
    try {
      const parseResult = battleTurnInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }
      
      const { sessionId, repSpeech } = parseResult.data;
      const session = await storage.getBattleSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Battle session not found' });
      }

      const aiResponses = [
        "I appreciate you taking the time, but I'm really not sure this is the right time for us.",
        "That's interesting. Can you tell me more about the financing options?",
        "My neighbor mentioned they had issues with their installation. How do you handle that?",
        "What kind of savings are we actually talking about here?",
        "I need to think about it. Can you send me some information?",
        "How long does the installation process take?",
        "What happens if I move? Is the system transferable?",
      ];

      const aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const scoreBoost = Math.random() * 15;
      const newScores = {
        ...session.scores,
        rapport: Math.min(100, session.scores.rapport + scoreBoost),
        discovery: Math.min(100, session.scores.discovery + scoreBoost * 0.8),
        objectionHandling: Math.min(100, session.scores.objectionHandling + scoreBoost * 0.6),
        overall: 0,
      };
      newScores.overall = (newScores.rapport + newScores.discovery + newScores.objectionHandling + newScores.opener + newScores.pitch + newScores.closing) / 6;

      const newTurn: Turn = {
        speaker: 'rep',
        text: repSpeech,
        timestamp: new Date().toISOString(),
      };

      await storage.updateBattleSession(sessionId, {
        scores: newScores,
        turns: [...session.turns, newTurn],
      });

      res.json({
        aiResponse,
        scores: newScores,
        status: 'active',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process turn' });
    }
  });

  // End battle - uses storage layer with Zod validation
  app.post('/api/redhawk/battle/end', async (req, res) => {
    try {
      const parseResult = battleEndInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }
      
      const { sessionId, outcome } = parseResult.data;
      const session = await storage.getBattleSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Battle session not found' });
      }

      const xpAwarded = outcome === 'win' ? session.level * 100 : 0;
      
      // Update battle stats
      const stats = await storage.getBattleStats(session.repId);
      const updates: any = {};
      if (outcome === 'win') updates.wins = stats.wins + 1;
      else if (outcome === 'lose') updates.losses = stats.losses + 1;
      else updates.abandoned = stats.abandoned + 1;
      
      await storage.updateBattleStats(session.repId, updates);

      // Add to history
      await storage.addBattleToHistory(session.repId, {
        id: sessionId,
        persona: session.persona.name,
        level: session.level,
        outcome: outcome === 'win' ? 'won' : outcome === 'lose' ? 'lost' : 'abandoned',
        score: session.scores.overall,
        xpAwarded,
        completedAt: new Date().toISOString(),
      });

      // Update XP if won
      if (xpAwarded > 0) {
        await storage.addXP(session.repId, xpAwarded);
      }

      await storage.deleteBattleSession(sessionId);

      res.json({
        outcome,
        xpAwarded,
        finalScores: session.scores,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to end battle' });
    }
  });

  return httpServer;
}
