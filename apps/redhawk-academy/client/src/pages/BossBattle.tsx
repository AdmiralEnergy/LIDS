import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BattleChat } from '../components/BattleChat';
import { ScorePanel } from '../components/ScorePanel';
import { useAuth } from '../context/AuthContext';
import { type BattleSession, type Persona, type Turn, type BattleScores } from '../types';
import { Swords, Send, Trophy, XCircle, Flag, Bot, Zap } from 'lucide-react';
import * as api from '../api/redhawk';
import { awardBattleXP } from '../lib/twentyProgressionApi';

const DEFAULT_SCORES: BattleScores = {
  opener: 0,
  rapport: 0,
  discovery: 0,
  pitch: 0,
  objectionHandling: 0,
  closing: 0,
  overall: 0,
};

const LEVEL_DESCRIPTIONS = [
  { level: 1, name: 'Friendly Prospect', description: 'Open to conversation, few objections' },
  { level: 2, name: 'Cautious Buyer', description: 'Some skepticism, basic objections' },
  { level: 3, name: 'Tough Customer', description: 'Price-focused, multiple objections' },
  { level: 4, name: 'Expert Negotiator', description: 'Savvy, complex objections' },
  { level: 5, name: 'The Gatekeeper', description: 'Maximum resistance, expert-level challenge' },
];

export default function BossBattle() {
  const { rep, helmUser } = useAuth();
  const [, setLocation] = useLocation();
  
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [session, setSession] = useState<BattleSession | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [scores, setScores] = useState<BattleScores>(DEFAULT_SCORES);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcome, setOutcome] = useState<'win' | 'lose' | 'abandon' | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [finalScores, setFinalScores] = useState<BattleScores>(DEFAULT_SCORES);

  const startBattle = async () => {
    if (!rep) return;
    
    try {
      setIsLoading(true);
      const result = await api.startBattle(rep.id, rep.name, selectedLevel);
      setSession(result.session);
      setPersona(result.persona);
      setTurns([{
        speaker: 'ai',
        text: result.persona.openingLine,
        timestamp: new Date().toISOString(),
      }]);
      setScores(DEFAULT_SCORES);
    } catch (err) {
      console.error('Failed to start battle:', err);
      const demoPersona: Persona = {
        name: 'Sarah Johnson',
        archetype: LEVEL_DESCRIPTIONS[selectedLevel - 1].name,
        level: selectedLevel,
        openingLine: "Hi, I'm not really interested in solar panels. We just had someone else come by last week.",
      };
      setPersona(demoPersona);
      setSession({
        id: `demo_${Date.now()}`,
        repId: rep.id,
        persona: demoPersona,
        level: selectedLevel,
        status: 'active',
        turns: [],
        scores: DEFAULT_SCORES,
        startedAt: new Date().toISOString(),
      });
      setTurns([{
        speaker: 'ai',
        text: demoPersona.openingLine,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!session || !message.trim() || isSending) return;

    const repTurn: Turn = {
      speaker: 'rep',
      text: message.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setTurns(prev => [...prev, repTurn]);
    setMessage('');
    setIsSending(true);

    try {
      const result = await api.battleTurn(session.id, repTurn.text);
      
      setTurns(prev => [...prev, {
        speaker: 'ai',
        text: result.aiResponse,
        timestamp: new Date().toISOString(),
      }]);
      setScores(result.scores);

      if (result.status === 'won' || result.status === 'lost') {
        await handleEndBattle(result.status as 'win' | 'lose');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const demoResponses = [
        "I appreciate you taking the time, but I'm really not sure this is the right time for us.",
        "That's interesting. Can you tell me more about the financing options?",
        "My neighbor mentioned they had issues with their installation. How do you handle that?",
        "What kind of savings are we actually talking about here?",
      ];
      const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      
      setTurns(prev => [...prev, {
        speaker: 'ai',
        text: randomResponse,
        timestamp: new Date().toISOString(),
      }]);
      
      const newScores = {
        ...scores,
        rapport: Math.min(100, scores.rapport + Math.random() * 20),
        discovery: Math.min(100, scores.discovery + Math.random() * 15),
        objectionHandling: Math.min(100, scores.objectionHandling + Math.random() * 10),
        overall: Math.min(100, scores.overall + Math.random() * 10),
      };
      setScores(newScores);
    } finally {
      setIsSending(false);
    }
  };

  const handleEndBattle = async (result: 'win' | 'lose' | 'abandon') => {
    if (!session) return;

    let earnedXp = 0;

    try {
      const endResult = await api.endBattle(session.id, result);
      setOutcome(result);
      earnedXp = endResult.xpAwarded;
      setXpAwarded(earnedXp);
      setFinalScores(endResult.finalScores);
      setShowOutcome(true);
    } catch (err) {
      console.error('Failed to end battle:', err);
      setOutcome(result);
      earnedXp = result === 'win' ? selectedLevel * 100 : result === 'lose' ? selectedLevel * 30 : 10;
      setXpAwarded(earnedXp);
      setFinalScores(scores);
      setShowOutcome(true);
    }

    // Sync XP to Twenty CRM if user is a HELM user
    if (helmUser && earnedXp > 0) {
      try {
        const syncResult = await awardBattleXP(
          helmUser.id,
          helmUser.name,
          result === 'abandon' ? 'abandon' : result,
          selectedLevel,
          false // allObjectionsCleared - would need to be tracked in battle
        );
        if (syncResult.success) {
          console.log(`Synced battle XP to Twenty: ${syncResult.xpAwarded} earned, ${syncResult.newXp} total, rank ${syncResult.newRank}`);
        }
      } catch (syncErr) {
        console.warn('Failed to sync battle XP to Twenty:', syncErr);
      }
    }
  };

  const resetBattle = () => {
    setSession(null);
    setPersona(null);
    setTurns([]);
    setScores(DEFAULT_SCORES);
    setOutcome(null);
    setShowOutcome(false);
  };

  if (!session) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Swords className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Boss Battle</h1>
          <p className="text-muted-foreground">
            Practice your sales skills against AI prospects of increasing difficulty
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Difficulty Level</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select 
              value={selectedLevel.toString()} 
              onValueChange={(v) => setSelectedLevel(parseInt(v))}
            >
              <SelectTrigger data-testid="select-level">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_DESCRIPTIONS.map(level => (
                  <SelectItem key={level.level} value={level.level.toString()}>
                    Level {level.level}: {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="p-4 rounded-lg bg-muted">
              <div className="font-semibold mb-1">
                Level {selectedLevel}: {LEVEL_DESCRIPTIONS[selectedLevel - 1].name}
              </div>
              <div className="text-sm text-muted-foreground">
                {LEVEL_DESCRIPTIONS[selectedLevel - 1].description}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Win reward: {selectedLevel * 100} XP</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={startBattle} 
              disabled={isLoading}
              data-testid="button-start-battle"
            >
              {isLoading ? 'Starting...' : 'Start Battle'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/10">
              <Bot className="w-5 h-5 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{persona?.name}</div>
            <div className="text-sm text-muted-foreground">
              Level {selectedLevel} - {persona?.archetype}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEndBattle('win')}
            data-testid="button-win"
          >
            <Trophy className="w-4 h-4 mr-1 text-green-500" />
            Win
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEndBattle('lose')}
            data-testid="button-lose"
          >
            <XCircle className="w-4 h-4 mr-1 text-destructive" />
            Lose
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEndBattle('abandon')}
            data-testid="button-abandon"
          >
            <Flag className="w-4 h-4 mr-1" />
            Abandon
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <BattleChat turns={turns} personaName={persona?.name || 'Prospect'} />
          </CardContent>
          <CardFooter className="pt-4 gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your response..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              data-testid="input-message"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!message.trim() || isSending}
              size="icon"
              className="shrink-0"
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <ScorePanel scores={scores} />
        </div>
      </div>

      <Dialog open={showOutcome} onOpenChange={setShowOutcome}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {outcome === 'win' ? (
                <>
                  <Trophy className="w-6 h-6 text-green-500" />
                  Victory!
                </>
              ) : outcome === 'lose' ? (
                <>
                  <XCircle className="w-6 h-6 text-destructive" />
                  Defeat
                </>
              ) : (
                <>
                  <Flag className="w-6 h-6 text-muted-foreground" />
                  Battle Abandoned
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {outcome === 'win' 
                ? 'Great job! You successfully closed the prospect.' 
                : outcome === 'lose'
                ? 'The prospect got away. Review your approach and try again.'
                : 'Battle abandoned. No XP awarded.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className={`text-center p-6 rounded-lg ${
              outcome === 'win' ? 'bg-green-500/10' : 'bg-muted'
            }`}>
              <div className="text-4xl font-bold font-mono mb-2" data-testid="text-battle-final-score">
                {Math.round(finalScores.overall)}%
              </div>
              <div className="text-sm text-muted-foreground">Final Score</div>
            </div>

            {xpAwarded > 0 && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-amber-500/10">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">+{xpAwarded} XP Earned!</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLocation('/')}>
              Back to Dashboard
            </Button>
            <Button onClick={resetBattle}>
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
