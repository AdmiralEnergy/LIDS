import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import type { BattleScores } from '../types';

interface ScorePanelProps {
  scores: BattleScores;
}

const SCORE_LABELS: Record<keyof Omit<BattleScores, 'overall'>, string> = {
  opener: 'Opener',
  rapport: 'Rapport',
  discovery: 'Discovery',
  pitch: 'Pitch',
  objectionHandling: 'Objection Handling',
  closing: 'Closing',
};

export function ScorePanel({ scores }: ScorePanelProps) {
  return (
    <Card data-testid="panel-battle-scores">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-primary" />
          Live Scores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 rounded-md bg-primary/10">
          <div className="text-4xl font-bold font-mono" data-testid="text-overall-score">
            {Math.round(scores.overall)}%
          </div>
          <div className="text-sm text-muted-foreground">Overall Score</div>
        </div>
        
        <div className="space-y-3">
          {(Object.keys(SCORE_LABELS) as Array<keyof typeof SCORE_LABELS>).map((key) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{SCORE_LABELS[key]}</span>
                <span className="font-mono font-medium">{Math.round(scores[key])}%</span>
              </div>
              <Progress value={scores[key]} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
