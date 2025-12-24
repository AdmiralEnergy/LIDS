import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, XCircle, TrendingUp, Swords } from 'lucide-react';
import type { BattleStats } from '../types';

interface BattleStatsCardProps {
  stats: BattleStats;
}

export function BattleStatsCard({ stats }: BattleStatsCardProps) {
  const winRate = stats.wins + stats.losses > 0 
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) 
    : 0;

  return (
    <Card data-testid="card-battle-stats">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Swords className="w-5 h-5 text-primary" />
          Battle Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-md bg-green-500/10">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-400" data-testid="text-battle-wins">
              {stats.wins}
            </div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          
          <div className="text-center p-3 rounded-md bg-red-500/10">
            <XCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400" data-testid="text-battle-losses">
              {stats.losses}
            </div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
          
          <div className="text-center p-3 rounded-md bg-primary/10">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold font-mono" data-testid="text-battle-avg-score">
              {Math.round(stats.avgScore)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </div>
          
          <div className="text-center p-3 rounded-md bg-amber-500/10">
            <Swords className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400" data-testid="text-battle-winrate">
              {winRate}%
            </div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
