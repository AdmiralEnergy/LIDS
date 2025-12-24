import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../context/AuthContext';
import { type Certification as CertType } from '../types';
import { Award, CheckCircle, Lock, Clock, Target, FileCheck, AlertTriangle } from 'lucide-react';
import * as api from '../api/redhawk';

interface CertificationInfo {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  passScore: number;
  xpReward: number;
  prerequisiteModules: string[];
}

const CERTIFICATIONS: CertificationInfo[] = [
  {
    id: 'tcpa',
    name: 'TCPA Compliance Certification',
    description: 'Federal Telephone Consumer Protection Act requirements for telemarketing',
    questionCount: 25,
    timeLimit: 20,
    passScore: 1.00,
    xpReward: 400,
    prerequisiteModules: ['module_5'],
  },
  {
    id: 'operative',
    name: 'Sales Operative Certification',
    description: 'Advanced sales techniques and framework mastery validation',
    questionCount: 40,
    timeLimit: 30,
    passScore: 0.85,
    xpReward: 500,
    prerequisiteModules: ['module_0', 'module_1', 'module_2', 'module_3', 'module_4', 'module_5'],
  },
  {
    id: 'dnc',
    name: 'Do Not Call Registry Certification',
    description: 'DNC compliance and proper handling procedures',
    questionCount: 20,
    timeLimit: 15,
    passScore: 0.90,
    xpReward: 200,
    prerequisiteModules: ['module_5'],
  },
  {
    id: 'ctia',
    name: 'CTIA Messaging Certification',
    description: 'Text messaging compliance and best practices',
    questionCount: 20,
    timeLimit: 15,
    passScore: 0.85,
    xpReward: 200,
    prerequisiteModules: [],
  },
];

export default function Certification() {
  const { rep } = useAuth();
  const [, setLocation] = useLocation();
  const [certifications, setCertifications] = useState<CertType[]>([]);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!rep) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [certData, progressData] = await Promise.all([
          api.getCertifications(rep.id).catch(() => null),
          api.getProgress(rep.id).catch(() => null),
        ]);
        
        if (certData?.certifications) setCertifications(certData.certifications);
        if (progressData?.completedModules) setCompletedModules(progressData.completedModules);
      } catch (err) {
        console.error('Failed to load certification data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [rep]);

  const getCertStatus = (certId: string) => {
    return certifications.find(c => c.examType === certId);
  };

  const isCertLocked = (cert: CertificationInfo) => {
    if (cert.prerequisiteModules.length === 0) return false;
    return !cert.prerequisiteModules.every(m => completedModules.includes(m));
  };

  const handleStartCert = (certId: string) => {
    setLocation(`/modules/${certId}/quiz`);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const passedCount = certifications.filter(c => c.passed).length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Certifications
          </h1>
          <p className="text-muted-foreground">
            Complete compliance certifications to advance your rank
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono" data-testid="text-cert-progress">
            {passedCount}/{CERTIFICATIONS.length}
          </div>
          <div className="text-sm text-muted-foreground">Certifications Earned</div>
        </div>
      </div>

      <div className="grid gap-4">
        {CERTIFICATIONS.map(cert => {
          const status = getCertStatus(cert.id);
          const locked = isCertLocked(cert);
          const passed = status?.passed || false;

          return (
            <Card 
              key={cert.id}
              className={`transition-all ${locked ? 'opacity-60' : ''} ${passed ? 'border-green-500/30' : ''}`}
              data-testid={`card-cert-${cert.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {locked ? (
                      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ) : passed ? (
                      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-green-500/20">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                        <FileCheck className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{cert.name}</CardTitle>
                      <CardDescription className="mt-1">{cert.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">+{cert.xpReward} XP</Badge>
                    {cert.passScore === 1.0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        100% Required
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{cert.timeLimit} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileCheck className="w-4 h-4" />
                    <span>{cert.questionCount} questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>{cert.passScore * 100}% to pass</span>
                  </div>
                </div>

                {status && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Your Score</span>
                      <span className={`font-bold ${passed ? 'text-green-500' : 'text-destructive'}`}>
                        {Math.round(status.score * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={status.score * 100} 
                      className={`h-2 ${passed ? '[&>div]:bg-green-500' : '[&>div]:bg-destructive'}`}
                    />
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  disabled={locked}
                  onClick={() => handleStartCert(cert.id)}
                  variant={passed ? 'outline' : 'default'}
                  data-testid={`button-start-${cert.id}`}
                >
                  {locked ? 'Prerequisites Required' : passed ? 'Retake Exam' : 'Start Certification'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
