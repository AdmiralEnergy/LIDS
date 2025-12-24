import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RankBadge } from '../components/RankBadge';
import { XPProgress } from '../components/XPProgress';
import { ModuleCard } from '../components/ModuleCard';
import { BattleStatsCard } from '../components/BattleStatsCard';
import { useAuth } from '../context/AuthContext';
import { FRAMEWORK_MODULES, type Progression, type BattleStats, type ModuleStatus } from '../types';
import { BookOpen, Swords, Award, ChevronRight, Trophy } from 'lucide-react';
import * as api from '../api/redhawk';

export default function Dashboard() {
  const { rep } = useAuth();
  const [, setLocation] = useLocation();
  const [progression, setProgression] = useState<Progression | null>(null);
  const [battleStats, setBattleStats] = useState<BattleStats | null>(null);
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.error('Failed to load dashboard data:', err);
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

  const isModuleLocked = (module: typeof FRAMEWORK_MODULES[0]) => {
    if (!module.prerequisiteModules) return false;
    return !module.prerequisiteModules.every(prereq => 
      progression?.completedModules.includes(prereq)
    );
  };

  const handleStartModule = (moduleId: string) => {
    setLocation(`/modules/${moduleId}/quiz`);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-welcome">
            Welcome back, {rep?.name}
          </h1>
          <p className="text-muted-foreground">Continue your training journey</p>
        </div>
        {progression && (
          <RankBadge rank={progression.rank} size="lg" />
        )}
      </div>

      {progression && (
        <Card>
          <CardContent className="pt-6">
            <XPProgress currentXP={progression.xp} rank={progression.rank} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setLocation('/modules')} data-testid="button-view-modules">
          <BookOpen className="w-4 h-4 mr-2" />
          View All Modules
        </Button>
        <Button onClick={() => setLocation('/battle')} variant="outline" data-testid="button-start-battle">
          <Swords className="w-4 h-4 mr-2" />
          Boss Battle
        </Button>
        <Button onClick={() => setLocation('/certification')} variant="outline" data-testid="button-certifications">
          <Award className="w-4 h-4 mr-2" />
          Certifications
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Framework Mastery</h2>
          <Button variant="ghost" size="sm" onClick={() => setLocation('/modules')}>
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FRAMEWORK_MODULES.slice(0, 6).map(module => {
            const status = getModuleStatus(module.id);
            const locked = isModuleLocked(module);
            const completed = progression?.completedModules.includes(module.id) || false;
            
            return (
              <ModuleCard
                key={module.id}
                module={module}
                completed={completed}
                score={status?.score}
                locked={locked}
                onStart={() => handleStartModule(module.id)}
              />
            );
          })}
        </div>
      </div>

      {battleStats && <BattleStatsCard stats={battleStats} />}

      {progression && progression.badges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-amber-500" />
              Recent Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {progression.badges.slice(0, 5).map(badge => (
                <div 
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/10"
                  data-testid={`badge-${badge.id}`}
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
