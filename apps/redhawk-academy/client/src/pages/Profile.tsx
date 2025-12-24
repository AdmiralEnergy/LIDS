import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RankBadge } from '../components/RankBadge';
import { XPProgress } from '../components/XPProgress';
import { useAuth } from '../context/AuthContext';
import { RANKS } from '../config/ranks';
import { FRAMEWORK_MODULES, type Progression, type BattleStats, type ModuleStatus, type Badge } from '../types';
import { User, Award, BookOpen, Swords, CheckCircle, XCircle, Lock, LogOut, Trophy, Target, Clock } from 'lucide-react';
import * as api from '../api/redhawk';
import { format } from 'date-fns';

export default function Profile() {
  const { rep, logout } = useAuth();
  const [progression, setProgression] = useState<Progression | null>(null);
  const [battleStats, setBattleStats] = useState<BattleStats | null>(null);
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!rep) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [progressData, statsData, certData] = await Promise.all([
          api.getProgress(rep.id).catch(() => null),
          api.getBattleStats(rep.id).catch(() => null),
          api.getCertifications(rep.id).catch(() => null),
        ]);
        
        if (progressData) setProgression(progressData);
        if (statsData) setBattleStats(statsData);
        if (certData?.modules) setModuleStatuses(certData.modules);
      } catch (err) {
        console.error('Failed to load profile data:', err);
        setProgression({
          xp: 0,
          level: 1,
          rank: 'sdr_1',
          badges: [],
          completedModules: [],
          certifications: [],
        });
        setBattleStats({
          wins: 0,
          losses: 0,
          abandoned: 0,
          avgScore: 0,
          highestLevel: 0,
          history: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [rep]);

  const getModuleStatus = (moduleId: string) => {
    return moduleStatuses.find(m => m.id === moduleId);
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const currentRank = RANKS.find(r => r.id === progression?.rank) || RANKS[0];
  const currentIndex = RANKS.findIndex(r => r.id === progression?.rank);
  const nextRank = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary/10 text-2xl">
                <User className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-profile-name">{rep?.name}</h1>
                <p className="text-muted-foreground">{rep?.email}</p>
              </div>
              
              {progression && (
                <div className="flex items-center gap-3">
                  <RankBadge rank={progression.rank} size="lg" />
                  <span className="text-sm text-muted-foreground">
                    Level {progression.level}
                  </span>
                </div>
              )}

              {progression && (
                <XPProgress currentXP={progression.xp} rank={progression.rank} />
              )}
            </div>

            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="badges">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="badges" data-testid="tab-badges">
            <Award className="w-4 h-4 mr-2" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="modules" data-testid="tab-modules">
            <BookOpen className="w-4 h-4 mr-2" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="battles" data-testid="tab-battles">
            <Swords className="w-4 h-4 mr-2" />
            Battles
          </TabsTrigger>
          <TabsTrigger value="ranks" data-testid="tab-ranks">
            <Trophy className="w-4 h-4 mr-2" />
            Ranks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Earned Badges ({progression?.badges.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progression?.badges && progression.badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {progression.badges.map(badge => (
                    <div 
                      key={badge.id}
                      className="flex flex-col items-center p-4 rounded-lg bg-amber-500/10 text-center"
                      data-testid={`badge-${badge.id}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        badge.tier === 'platinum' ? 'bg-slate-300' :
                        badge.tier === 'gold' ? 'bg-amber-400' :
                        badge.tier === 'silver' ? 'bg-gray-300' :
                        'bg-amber-700'
                      }`}>
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium">{badge.name}</span>
                      {badge.earnedAt && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {format(new Date(badge.earnedAt), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No badges earned yet. Complete modules and battles to earn badges!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Module Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {FRAMEWORK_MODULES.map((module, index) => {
                  const status = getModuleStatus(module.id);
                  const completed = progression?.completedModules.includes(module.id);
                  const passed = status?.passed || false;

                  return (
                    <div 
                      key={module.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                      data-testid={`module-status-${module.id}`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{module.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {module.questionCount} questions | {module.passScore * 100}% to pass
                        </div>
                      </div>
                      {completed && passed ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-green-500">
                            {status?.score ? Math.round(status.score * 100) : 0}%
                          </span>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      ) : completed && !passed ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-destructive">
                            {status?.score ? Math.round(status.score * 100) : 0}%
                          </span>
                          <XCircle className="w-5 h-5 text-destructive" />
                        </div>
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="battles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-primary" />
                Battle History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {battleStats?.history && battleStats.history.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {battleStats.history.map((battle, index) => (
                      <div 
                        key={battle.id || index}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                        data-testid={`battle-history-${index}`}
                      >
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          battle.outcome === 'won' ? 'bg-green-500/20' : 
                          battle.outcome === 'lost' ? 'bg-red-500/20' : 'bg-muted'
                        }`}>
                          {battle.outcome === 'won' ? (
                            <Trophy className="w-5 h-5 text-green-500" />
                          ) : battle.outcome === 'lost' ? (
                            <XCircle className="w-5 h-5 text-destructive" />
                          ) : (
                            <Target className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{battle.persona}</div>
                          <div className="text-xs text-muted-foreground">
                            Level {battle.level} | {format(new Date(battle.completedAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium">{Math.round(battle.score)}%</div>
                          {battle.xpAwarded > 0 && (
                            <div className="text-xs text-amber-500">+{battle.xpAwarded} XP</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No battles fought yet. Start a Boss Battle to practice your skills!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Rank Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RANKS.map((rank, index) => {
                  const isCurrentRank = rank.id === progression?.rank;
                  const isAchieved = progression ? 
                    progression.xp >= rank.xpRequired && 
                    rank.requiredModules.every(m => progression.completedModules.includes(m)) : false;

                  return (
                    <div 
                      key={rank.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        isCurrentRank ? 'border-primary bg-primary/5' : 
                        isAchieved ? 'border-green-500/30 bg-green-500/5' : 
                        'border-border'
                      }`}
                      data-testid={`rank-${rank.id}`}
                    >
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                        isCurrentRank ? 'bg-primary text-primary-foreground' :
                        isAchieved ? 'bg-green-500/20 text-green-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {rank.code}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {rank.name}
                          {isCurrentRank && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {rank.xpRequired.toLocaleString()} XP required
                        </div>
                        {rank.requiredModules.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Requires: {rank.requiredModules.length} modules completed
                          </div>
                        )}
                      </div>
                      {isAchieved && !isCurrentRank && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
