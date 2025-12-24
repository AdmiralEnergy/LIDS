import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleCard } from '../components/ModuleCard';
import { useAuth } from '../context/AuthContext';
import { FRAMEWORK_MODULES, type Progression, type ModuleStatus } from '../types';
import { BookOpen } from 'lucide-react';
import * as api from '../api/redhawk';

export default function Modules() {
  const { rep } = useAuth();
  const [, setLocation] = useLocation();
  const [progression, setProgression] = useState<Progression | null>(null);
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!rep) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [progressData, certData] = await Promise.all([
          api.getProgress(rep.id).catch(() => null),
          api.getCertifications(rep.id).catch(() => null),
        ]);
        
        if (progressData) setProgression(progressData);
        if (certData?.modules) setModuleStatuses(certData.modules);
      } catch (err) {
        console.error('Failed to load modules data:', err);
        setProgression({
          xp: 0,
          level: 1,
          rank: 'sdr_1',
          badges: [],
          completedModules: [],
          certifications: [],
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const completedCount = FRAMEWORK_MODULES.filter(m => 
    progression?.completedModules.includes(m.id)
  ).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Framework Mastery
          </h1>
          <p className="text-muted-foreground">
            Complete all 7 modules to master the sales framework
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono" data-testid="text-modules-progress">
            {completedCount}/{FRAMEWORK_MODULES.length}
          </div>
          <div className="text-sm text-muted-foreground">Modules Completed</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FRAMEWORK_MODULES.map((module, index) => {
          const status = getModuleStatus(module.id);
          const locked = isModuleLocked(module);
          const completed = progression?.completedModules.includes(module.id) || false;
          
          return (
            <div key={module.id} className="relative">
              <div className="absolute -left-3 top-4 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {index + 1}
              </div>
              <ModuleCard
                module={module}
                completed={completed}
                score={status?.score}
                locked={locked}
                onStart={() => handleStartModule(module.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
