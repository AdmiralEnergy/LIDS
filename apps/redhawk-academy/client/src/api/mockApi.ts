import { FRAMEWORK_MODULES } from '../types';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function getStoredProgress() {
  const stored = localStorage.getItem('mock_progress');
  if (stored) return JSON.parse(stored);
  return { xp: 0, level: 1, rank: 'sdr_1', badges: [], completedModules: [], certifications: [] };
}

function saveProgress(progress: any) {
  localStorage.setItem('mock_progress', JSON.stringify(progress));
}

function getStoredBattleStats() {
  const stored = localStorage.getItem('mock_battle_stats');
  if (stored) return JSON.parse(stored);
  return { wins: 0, losses: 0, abandoned: 0, avgScore: 0, highestLevel: 0, history: [] };
}

function saveBattleStats(stats: any) {
  localStorage.setItem('mock_battle_stats', JSON.stringify(stats));
}

const MOCK_QUESTIONS: Record<string, any[]> = {
  module_0: [
    { id: 'q1', text: 'What does PV stand for in solar technology?', answers: ['Power Voltage', 'Photovoltaic', 'Power Variation', 'Photo Value'], difficulty: 'easy', category: 'basics', correctAnswer: 1 },
    { id: 'q2', text: 'What is the main benefit of solar for NC homeowners?', answers: ['Free installation', 'Lower electric bills', 'No maintenance required', 'Unlimited free electricity'], difficulty: 'easy', category: 'benefits', correctAnswer: 1 },
    { id: 'q3', text: 'What federal tax credit is available for solar installation?', answers: ['10% ITC', '26% ITC', '30% ITC', '50% ITC'], difficulty: 'medium', category: 'incentives', correctAnswer: 2 },
  ],
  module_1: [
    { id: 'q1', text: 'What is the attention window for cold calls?', answers: ['3 seconds', '7 seconds', '15 seconds', '30 seconds'], difficulty: 'medium', category: 'openers', correctAnswer: 1 },
    { id: 'q2', text: 'Which opener type asks for permission to continue?', answers: ['Direct pitch', 'Permission opener', 'Curiosity opener', 'Pattern interrupt'], difficulty: 'easy', category: 'openers', correctAnswer: 1 },
  ],
  default: [
    { id: 'q1', text: 'Sample question for this module?', answers: ['Option A', 'Option B', 'Option C', 'Option D'], difficulty: 'easy', category: 'general', correctAnswer: 1 },
    { id: 'q2', text: 'Another sample question?', answers: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'], difficulty: 'medium', category: 'general', correctAnswer: 2 },
  ],
};

const PERSONAS = [
  { name: 'Carol Smith', archetype: 'Friendly Prospect', level: 1, openingLine: "Hi there! I've been curious about solar but haven't really looked into it much." },
  { name: 'Mike Johnson', archetype: 'Cautious Buyer', level: 2, openingLine: "I'm interested but I've heard mixed things about solar companies. Convince me." },
  { name: 'Patricia Williams', archetype: 'Tough Customer', level: 3, openingLine: "Look, I've got 5 minutes. What makes you different from everyone else?" },
  { name: 'Robert Chen', archetype: 'Expert Negotiator', level: 4, openingLine: "I've done my research. Your competitor quoted me 20% less." },
  { name: 'The Gatekeeper', archetype: 'Maximum Resistance', level: 5, openingLine: "The decision maker is busy. You have 30 seconds to convince me this matters." },
];

let activeExams: Record<string, any> = {};
let activeBattles: Record<string, any> = {};

export async function mockApi<T>(path: string, options?: RequestInit): Promise<T> {
  await delay(300);
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.parse(options.body as string) : null;

  // Health check
  if (path === '/health') {
    return { status: 'ok', mode: 'mock', version: '1.0.0' } as T;
  }

  // Get modules
  if (path === '/modules') {
    return FRAMEWORK_MODULES as T;
  }

  // Get progress
  if (path.startsWith('/progress/')) {
    return getStoredProgress() as T;
  }

  // Get certifications
  if (path.match(/^\/cert\/[^/]+$/) && method === 'GET') {
    const progress = getStoredProgress();
    return {
      certifications: progress.certifications || [],
      modules: (progress.completedModules || []).map((id: string) => ({
        id,
        passed: true,
        score: 0.85 + Math.random() * 0.15,
      })),
    } as T;
  }

  // Start exam
  if (path === '/cert/start' && method === 'POST') {
    const { repId, examType } = body;
    const examId = `exam-${Date.now()}`;
    const questions = MOCK_QUESTIONS[examType] || MOCK_QUESTIONS.default;
    
    const session = {
      examId,
      examType,
      repId,
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        answers: q.answers,
        difficulty: q.difficulty,
        category: q.category,
      })),
      timeLimit: 10,
      startedAt: new Date().toISOString(),
    };
    
    activeExams[examId] = { ...session, fullQuestions: questions };
    return session as T;
  }

  // Submit exam
  if (path === '/cert/submit' && method === 'POST') {
    const { examId, answers } = body;
    const exam = activeExams[examId];
    
    let correctCount = 0;
    const explanations: any[] = [];
    
    if (exam) {
      exam.fullQuestions.forEach((q: any) => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correctAnswer;
        if (isCorrect) correctCount++;
        
        explanations.push({
          questionId: q.id,
          correct: q.correctAnswer,
          explanation: isCorrect 
            ? 'Correct! Great job.' 
            : `The correct answer was option ${q.correctAnswer + 1}.`,
        });
      });
      
      const score = correctCount / exam.fullQuestions.length;
      const passed = score >= 0.80;
      const xpAwarded = passed ? 50 : 0;
      
      if (passed) {
        const progress = getStoredProgress();
        progress.xp += xpAwarded;
        if (!progress.completedModules.includes(exam.examType)) {
          progress.completedModules.push(exam.examType);
        }
        saveProgress(progress);
      }
      
      delete activeExams[examId];
      
      return { score, passed, xpAwarded, explanations } as T;
    }
    
    return { score: 0.85, passed: true, xpAwarded: 50, explanations: [] } as T;
  }

  // Battle stats
  if (path.match(/^\/battle\/stats\//) && method === 'GET') {
    return getStoredBattleStats() as T;
  }

  // Start battle
  if (path === '/battle/start' && method === 'POST') {
    const { repId, repName, level } = body;
    const sessionId = `battle-${Date.now()}`;
    const persona = PERSONAS[Math.min(level - 1, PERSONAS.length - 1)];
    
    const session = {
      id: sessionId,
      repId,
      repName,
      persona: { ...persona, level },
      level,
      status: 'active',
      turns: [],
      scores: { opener: 0, rapport: 0, discovery: 0, pitch: 0, objectionHandling: 0, closing: 0, overall: 0 },
      startedAt: new Date().toISOString(),
    };
    
    activeBattles[sessionId] = session;
    
    return { session, persona: { ...persona, level } } as T;
  }

  // Battle turn
  if (path === '/battle/turn' && method === 'POST') {
    const { sessionId, repSpeech } = body;
    const session = activeBattles[sessionId];
    
    const aiResponses = [
      "That's interesting, but I'm still not sure it's worth the investment.",
      "Tell me more about the financing options you mentioned.",
      "My neighbor had issues with their solar company. How are you different?",
      "What kind of savings are we actually talking about here?",
      "I need to discuss this with my spouse first.",
    ];
    
    const aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    
    if (session) {
      const boost = Math.random() * 15;
      session.scores.rapport = Math.min(100, session.scores.rapport + boost);
      session.scores.discovery = Math.min(100, session.scores.discovery + boost * 0.8);
      session.scores.objectionHandling = Math.min(100, session.scores.objectionHandling + boost * 0.6);
      session.scores.overall = Object.values(session.scores).reduce((a: number, b: number) => a + b, 0) / 7;
    }
    
    return { 
      aiResponse, 
      scores: session?.scores || { overall: 75 }, 
      status: 'active' 
    } as T;
  }

  // End battle
  if (path === '/battle/end' && method === 'POST') {
    const { sessionId, outcome } = body;
    const session = activeBattles[sessionId];
    
    const xpAwarded = outcome === 'win' ? (session?.level || 1) * 100 : 0;
    
    const stats = getStoredBattleStats();
    if (outcome === 'win') stats.wins++;
    else if (outcome === 'lose') stats.losses++;
    else stats.abandoned++;
    
    if (session) {
      stats.history.unshift({
        id: sessionId,
        persona: session.persona.name,
        level: session.level,
        outcome: outcome === 'win' ? 'won' : outcome === 'lose' ? 'lost' : 'abandoned',
        score: session.scores.overall,
        xpAwarded,
        completedAt: new Date().toISOString(),
      });
    }
    
    saveBattleStats(stats);
    
    if (xpAwarded > 0) {
      const progress = getStoredProgress();
      progress.xp += xpAwarded;
      saveProgress(progress);
    }
    
    delete activeBattles[sessionId];
    
    return { 
      xpAwarded, 
      finalScores: session?.scores || { overall: 77 } 
    } as T;
  }

  console.warn(`[MOCK] Unhandled path: ${path}`);
  return {} as T;
}
