/**
 * LearningDashboard - LiveWire's Learning Progress & Recommendations
 *
 * Shows:
 * - Overall learning metrics (feedback count, accuracy trend)
 * - AI-generated recommendations for improving lead quality
 * - Sequential thinking logs from recent decisions
 * - Training progress visualization
 *
 * This is the "brain view" - showing how LiveWire thinks and learns.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  MessageSquare,
  Clock,
  BarChart3
} from 'lucide-react';

const LIVEWIRE_API = '/api/livewire';

interface LearningMetrics {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  accuracyRate: number;          // % of leads marked good vs bad
  accuracyTrend: 'improving' | 'declining' | 'stable';
  lastTrainingDate: string;
  modelVersion: string;
}

interface Recommendation {
  id: string;
  type: 'keyword' | 'subreddit' | 'pattern' | 'config';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
  data?: {
    keyword?: string;
    subreddit?: string;
    pattern?: string;
    currentValue?: number;
    suggestedValue?: number;
  };
}

interface ThinkingLog {
  id: string;
  leadId: string;
  timestamp: string;
  thoughts: Array<{
    step: number;
    thought: string;
    conclusion?: string;
  }>;
  finalDecision: string;
  confidence: number;
}

export function LearningDashboard() {
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [thinkingLogs, setThinkingLogs] = useState<ThinkingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingRec, setApplyingRec] = useState<string | null>(null);

  const fetchLearningData = async () => {
    setLoading(true);
    try {
      // Fetch learning metrics
      const [metricsRes, recsRes, logsRes] = await Promise.all([
        fetch(`${LIVEWIRE_API}/v2/learning/metrics`).catch(() => null),
        fetch(`${LIVEWIRE_API}/v2/learning/recommendations`).catch(() => null),
        fetch(`${LIVEWIRE_API}/v2/learning/thinking-logs?limit=10`).catch(() => null)
      ]);

      // Parse responses (gracefully handle missing endpoints)
      if (metricsRes?.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics || null);
      } else {
        // Mock data for now until backend is ready
        setMetrics({
          totalFeedback: 0,
          positiveFeedback: 0,
          negativeFeedback: 0,
          accuracyRate: 0,
          accuracyTrend: 'stable',
          lastTrainingDate: new Date().toISOString(),
          modelVersion: '2.0.0'
        });
      }

      if (recsRes?.ok) {
        const data = await recsRes.json();
        setRecommendations(data.recommendations || []);
      } else {
        // Mock recommendations
        setRecommendations([
          {
            id: 'rec-1',
            type: 'keyword',
            priority: 'high',
            title: 'Review underperforming keywords',
            description: 'Some keywords are matching "already bought" posts more often than shopping posts.',
            action: 'Go to Keyword Manager to review flagged keywords',
            impact: 'Could improve lead quality by 15-20%',
            data: { keyword: 'backup power' }
          },
          {
            id: 'rec-2',
            type: 'pattern',
            priority: 'medium',
            title: 'Add "already bought" detection',
            description: 'Posts containing "just installed" or "month 1 with my" are slipping through.',
            action: 'Enable enhanced context analysis',
            impact: 'Reduce false positives by ~10%'
          }
        ]);
      }

      if (logsRes?.ok) {
        const data = await logsRes.json();
        setThinkingLogs(data.logs || []);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load learning data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningData();
  }, []);

  const applyRecommendation = async (rec: Recommendation) => {
    setApplyingRec(rec.id);
    try {
      const response = await fetch(`${LIVEWIRE_API}/v2/learning/apply-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: rec.id })
      });
      if (response.ok) {
        // Remove applied recommendation
        setRecommendations(prev => prev.filter(r => r.id !== rec.id));
      }
    } catch (err) {
      console.error('Failed to apply recommendation:', err);
    } finally {
      setApplyingRec(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-blue-400 border-blue-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'keyword': return <Target className="w-4 h-4" />;
      case 'subreddit': return <MessageSquare className="w-4 h-4" />;
      case 'pattern': return <Zap className="w-4 h-4" />;
      case 'config': return <BarChart3 className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="w-8 h-8 animate-pulse mx-auto mb-2 text-purple-400" />
          <p className="text-muted-foreground">Loading learning data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/30">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-red-400">{error}</p>
          <Button onClick={fetchLearningData} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Learning Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-purple-400" />
                <p className="text-sm text-muted-foreground">Total Feedback</p>
              </div>
              <p className="text-2xl font-bold">{metrics.totalFeedback}</p>
              <p className="text-xs text-muted-foreground">
                {metrics.positiveFeedback} good / {metrics.negativeFeedback} bad
              </p>
            </CardContent>
          </Card>

          <Card className={`border-${metrics.accuracyTrend === 'improving' ? 'green' : metrics.accuracyTrend === 'declining' ? 'red' : 'blue'}-500/30`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4" />
                <p className="text-sm text-muted-foreground">Accuracy Rate</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{Math.round(metrics.accuracyRate)}%</p>
                {metrics.accuracyTrend === 'improving' && <TrendingUp className="w-4 h-4 text-green-400" />}
                {metrics.accuracyTrend === 'declining' && <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
              <p className="text-xs text-muted-foreground capitalize">{metrics.accuracyTrend}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" />
                <p className="text-sm text-muted-foreground">Last Updated</p>
              </div>
              <p className="text-lg font-medium">
                {new Date(metrics.lastTrainingDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">Model v{metrics.modelVersion}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <p className="text-sm text-muted-foreground">Status</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-lg font-medium">Learning</p>
              </div>
              <p className="text-xs text-muted-foreground">Active feedback loop</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      <Card className="border-orange-500/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-orange-400" />
              Recommendations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Actions to improve lead quality based on feedback patterns
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLearningData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-muted-foreground">No recommendations at this time</p>
              <p className="text-sm text-muted-foreground">Keep providing feedback to help LiveWire learn!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map(rec => (
                <div
                  key={rec.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(rec.type)}
                        <span className="font-medium">{rec.title}</span>
                        <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-400">{rec.impact}</span>
                        {rec.data?.keyword && (
                          <span className="text-muted-foreground">
                            Related: "{rec.data.keyword}"
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => applyRecommendation(rec)}
                      disabled={applyingRec === rec.id}
                      className="ml-4"
                    >
                      {applyingRec === rec.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sequential Thinking Logs */}
      <Card className="border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Recent AI Reasoning
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            How LiveWire analyzed recent leads (Sequential Thinking)
          </p>
        </CardHeader>
        <CardContent>
          {thinkingLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No thinking logs yet</p>
              <p className="text-sm">Reasoning logs will appear as leads are processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {thinkingLogs.map(log => (
                <div
                  key={log.id}
                  className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Lead: {log.leadId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2 ml-4 border-l-2 border-purple-500/30 pl-4">
                    {log.thoughts.map((thought, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-purple-400 font-medium">Step {thought.step}:</span>
                        <span className="text-muted-foreground ml-2">{thought.thought}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-purple-500/20 flex items-center justify-between">
                    <span className="text-sm font-medium">{log.finalDecision}</span>
                    <Badge variant="outline" className="text-purple-400 border-purple-400">
                      {log.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Loop Explanation */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-4">
          <p className="text-sm text-purple-400 font-medium mb-2">How LiveWire Learns</p>
          <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-400 font-bold">1</span>
              </div>
              <p>You give feedback</p>
              <p className="text-xs">(thumbs up/down)</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-400 font-bold">2</span>
              </div>
              <p>Keywords adjust</p>
              <p className="text-xs">(weights change)</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-400 font-bold">3</span>
              </div>
              <p>Patterns detected</p>
              <p className="text-xs">(recommendations)</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-400 font-bold">4</span>
              </div>
              <p>Better leads</p>
              <p className="text-xs">(accuracy improves)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
