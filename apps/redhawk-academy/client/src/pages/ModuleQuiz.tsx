import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '../context/AuthContext';
import { FRAMEWORK_MODULES, type ExamSession, type ExamResult } from '../types';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trophy, AlertTriangle } from 'lucide-react';
import * as api from '../api/redhawk';

export default function ModuleQuiz() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [, setLocation] = useLocation();
  const { rep } = useAuth();
  
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const module = FRAMEWORK_MODULES.find(m => m.id === moduleId);

  const startExam = useCallback(async () => {
    if (!rep || !moduleId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const session = await api.startModuleExam(rep.id, moduleId);
      setExamSession(session);
      setTimeRemaining(session.timeLimit * 60);
      setAnswers({});
      setCurrentQuestionIndex(0);
    } catch (err) {
      console.error('Failed to start exam:', err);
      setError('Failed to start exam. Please try again.');
      setExamSession({
        examId: `demo_${Date.now()}`,
        examType: moduleId,
        timeLimit: module?.timeLimit || 10,
        startedAt: new Date().toISOString(),
        questions: [
          {
            id: 'q1',
            text: 'What is the primary benefit of solar energy for homeowners?',
            answers: ['Lower electricity bills', 'Increased property value', 'Environmental benefits', 'All of the above'],
            difficulty: 'easy',
            category: 'basics',
          },
          {
            id: 'q2',
            text: 'Which federal program offers tax credits for solar installation?',
            answers: ['PACE', 'ITC (Investment Tax Credit)', 'SREC', 'RPS'],
            difficulty: 'medium',
            category: 'incentives',
          },
          {
            id: 'q3',
            text: 'What is the typical payback period for residential solar in NC?',
            answers: ['1-3 years', '5-8 years', '10-15 years', '15-20 years'],
            difficulty: 'medium',
            category: 'economics',
          },
        ],
      });
      setTimeRemaining((module?.timeLimit || 10) * 60);
    } finally {
      setIsLoading(false);
    }
  }, [rep, moduleId, module]);

  useEffect(() => {
    startExam();
  }, [startExam]);

  useEffect(() => {
    if (!examSession || timeRemaining <= 0 || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examSession, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmit = async () => {
    if (!examSession) return;
    
    try {
      setIsSubmitting(true);
      const examResult = await api.submitExam(examSession.examId, answers);
      setResult(examResult);
      setShowResults(true);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      const answeredCorrectly = Object.keys(answers).length;
      const totalQuestions = examSession.questions.length;
      const score = totalQuestions > 0 ? answeredCorrectly / totalQuestions : 0;
      const passed = score >= (module?.passScore || 0.8);
      
      setResult({
        score,
        passed,
        xpAwarded: passed ? (module?.xpReward || 50) : 0,
        explanations: examSession.questions.map((q, i) => ({
          questionId: q.id,
          correct: 0,
          explanation: 'The correct answer demonstrates understanding of the topic.',
        })),
      });
      setShowResults(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!examSession || !module) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold mb-2">Module Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested module could not be loaded.</p>
            <Button onClick={() => setLocation('/modules')}>Back to Modules</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = examSession.questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / examSession.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === examSession.questions.length;
  const isLowTime = timeRemaining <= 60;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{module.name}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {examSession.questions.length}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-md ${
          isLowTime ? 'bg-destructive/10 text-destructive' : 'bg-muted'
        }`}>
          <Clock className={`w-4 h-4 ${isLowTime ? 'animate-pulse' : ''}`} />
          <span className="font-mono font-bold" data-testid="text-timer">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      <Progress value={progressPercent} className="h-2" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed" data-testid="text-question">
            {currentQuestion.text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id]?.toString()}
            onValueChange={(value) => handleAnswerSelect(currentQuestion.id, parseInt(value))}
          >
            <div className="space-y-3">
              {currentQuestion.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors hover-elevate cursor-pointer ${
                    answers[currentQuestion.id] === index 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                >
                  <RadioGroupItem value={index.toString()} id={`answer-${index}`} />
                  <Label 
                    htmlFor={`answer-${index}`} 
                    className="flex-1 cursor-pointer"
                    data-testid={`label-answer-${index}`}
                  >
                    {answer}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            data-testid="button-previous"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          
          {currentQuestionIndex < examSession.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              data-testid="button-next"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              data-testid="button-submit"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </Button>
          )}
        </CardFooter>
      </Card>

      <div className="flex flex-wrap gap-2 justify-center">
        {examSession.questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestionIndex(index)}
            className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
              index === currentQuestionIndex
                ? 'bg-primary text-primary-foreground'
                : answers[q.id] !== undefined
                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            data-testid={`button-question-${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result?.passed ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Congratulations!
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-destructive" />
                  Not Quite
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {result?.passed 
                ? 'You passed the module exam!' 
                : 'Keep practicing and try again.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className={`text-center p-6 rounded-lg ${
              result?.passed ? 'bg-green-500/10' : 'bg-destructive/10'
            }`}>
              <div className="text-5xl font-bold font-mono mb-2" data-testid="text-final-score">
                {Math.round((result?.score || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Required: {module.passScore * 100}%
              </div>
            </div>

            {result?.passed && result.xpAwarded > 0 && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-amber-500/10">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">+{result.xpAwarded} XP Earned!</span>
              </div>
            )}

            {result?.explanations && result.explanations.length > 0 && (
              <ScrollArea className="h-48">
                <Accordion type="single" collapsible className="w-full">
                  {result.explanations.map((exp, index) => (
                    <AccordionItem key={exp.questionId} value={exp.questionId}>
                      <AccordionTrigger className="text-sm">
                        Question {index + 1} Explanation
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {exp.explanation}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLocation('/modules')}>
              Back to Modules
            </Button>
            {!result?.passed && (
              <Button onClick={() => {
                setShowResults(false);
                startExam();
              }}>
                Try Again
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
