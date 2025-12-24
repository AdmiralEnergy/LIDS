import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';
import { RANKS } from '../config/ranks';
import type { Rank } from '../types';

interface XPProgressProps {
  currentXP: number;
  rank: Rank;
}

export function XPProgress({ currentXP, rank }: XPProgressProps) {
  const currentRankInfo = RANKS.find(r => r.id === rank) || RANKS[0];
  const currentIndex = RANKS.findIndex(r => r.id === rank);
  const nextRank = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
  
  const xpInCurrentRank = currentXP - currentRankInfo.xpRequired;
  const xpToNextRank = nextRank ? nextRank.xpRequired - currentRankInfo.xpRequired : 1;
  const progressPercent = nextRank ? Math.min((xpInCurrentRank / xpToNextRank) * 100, 100) : 100;

  return (
    <div className="space-y-2" data-testid="xp-progress">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono" data-testid="text-current-xp">
              {currentXP.toLocaleString()} XP
            </div>
          </div>
        </div>
        {nextRank && (
          <div className="text-right text-sm text-muted-foreground">
            <div>Next: {nextRank.name}</div>
            <div className="font-mono">{nextRank.xpRequired.toLocaleString()} XP</div>
          </div>
        )}
      </div>
      <Progress value={progressPercent} className="h-3" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{currentRankInfo.name}</span>
        {nextRank ? (
          <span>{Math.round(progressPercent)}% to {nextRank.code}</span>
        ) : (
          <span>Max Rank Achieved</span>
        )}
      </div>
    </div>
  );
}
