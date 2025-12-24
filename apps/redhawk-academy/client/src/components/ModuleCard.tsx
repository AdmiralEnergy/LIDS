import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, CheckCircle, BookOpen, Clock, Target, Zap } from 'lucide-react';
import type { Module } from '../types';

interface ModuleCardProps {
  module: Module;
  completed: boolean;
  score?: number;
  locked: boolean;
  onStart: () => void;
}

export function ModuleCard({ module, completed, score, locked, onStart }: ModuleCardProps) {
  const passPercentage = module.passScore * 100;
  const scorePercentage = score !== undefined ? score * 100 : 0;
  const passed = score !== undefined && score >= module.passScore;

  return (
    <Card 
      className={`relative transition-all duration-200 ${
        locked ? 'opacity-60' : 'hover-elevate'
      } ${completed && passed ? 'border-green-500/30' : ''}`}
      data-testid={`card-module-${module.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {locked ? (
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
            ) : completed && passed ? (
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-green-500/20">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
            )}
            <CardTitle className="text-base leading-tight">{module.name}</CardTitle>
          </div>
          <Badge variant="secondary" className="shrink-0">
            <Zap className="w-3 h-3 mr-1" />
            {module.xpReward} XP
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{module.description}</p>
        
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{module.timeLimit} min</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{module.questionCount} questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>{passPercentage}% to pass</span>
          </div>
        </div>

        {completed && score !== undefined && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Score</span>
              <span className={`font-bold ${passed ? 'text-green-500' : 'text-destructive'}`}>
                {Math.round(scorePercentage)}%
              </span>
            </div>
            <Progress 
              value={scorePercentage} 
              className={`h-2 ${passed ? '[&>div]:bg-green-500' : '[&>div]:bg-destructive'}`}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button 
          className="w-full" 
          disabled={locked}
          onClick={onStart}
          variant={completed && passed ? 'outline' : 'default'}
          data-testid={`button-start-${module.id}`}
        >
          {locked ? 'Locked' : completed ? 'Retake Quiz' : 'Start Quiz'}
        </Button>
      </CardFooter>
    </Card>
  );
}
