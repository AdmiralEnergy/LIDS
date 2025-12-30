/**
 * LiveWire Feedback Dashboard
 *
 * Shows lead outcome analytics and allows Nate to approve/reject weight recommendations.
 * This is how LiveWire learns what makes a good lead.
 */

import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Play,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  ArrowLeft,
  Zap,
  AlertCircle,
} from "lucide-react";

const API_BASE = '/api/livewire/feedback';

// Types
interface OutcomeStats {
  totalOutcomes: number;
  byOutcome: Record<string, number>;
  overallQualificationRate: number;
  overallConversionRate: number;
  uniqueLeads: number;
  uniqueSubreddits: number;
}

interface PerformanceMetric {
  key: string;
  totalOutcomes: number;
  contacted: number;
  qualified: number;
  converted: number;
  rejected: number;
  qualificationRate: number;
  conversionRate: number;
}

interface ScoringWeight {
  id: string;
  weightType: string;
  weightKey: string;
  weightValue: number;
  defaultValue: number;
  lastUpdated: string;
  updatedBy: string;
  reason?: string;
}

interface WeightRecommendation {
  id: string;
  weightType: string;
  weightKey: string;
  currentValue: number;
  recommendedValue: number;
  changePercent: number;
  reason: string;
  sampleCount: number;
  qualificationRate?: number;
  conversionRate?: number;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface FeedbackDashboard {
  outcomeStats: OutcomeStats;
  bucketPerformance: PerformanceMetric[];
  subredditPerformance: PerformanceMetric[];
  tierPerformance: PerformanceMetric[];
  currentWeights: ScoringWeight[];
  pendingRecommendations: WeightRecommendation[];
}

// Components
function StatCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Target;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${
            trend === 'up' ? 'bg-green-500/20' :
            trend === 'down' ? 'bg-red-500/20' :
            'bg-slate-700'
          }`}>
            <Icon className={`w-5 h-5 ${
              trend === 'up' ? 'text-green-400' :
              trend === 'down' ? 'text-red-400' :
              'text-slate-400'
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceBar({ label, rate, count, type }: {
  label: string;
  rate: number;
  count: number;
  type: 'qualification' | 'conversion';
}) {
  const percentage = Math.round(rate * 100);
  const color = type === 'conversion' ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{percentage}% ({count})</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function RecommendationCard({ rec, onApprove, onReject, loading }: {
  rec: WeightRecommendation;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const isPositive = rec.changePercent > 0;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {rec.weightType}
              </Badge>
              <span className="font-medium text-white">{rec.weightKey}</span>
            </div>
            <p className="text-sm text-slate-400 mb-2">{rec.reason}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">
                {rec.currentValue} → {rec.recommendedValue}
              </span>
              <span className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{rec.changePercent.toFixed(1)}%
              </span>
              <span className="text-slate-500">
                {rec.sampleCount} samples
              </span>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              className="border-green-500/50 text-green-400 hover:bg-green-500/20"
              onClick={onApprove}
              disabled={loading}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              onClick={onReject}
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LiveWireFeedbackPage() {
  const [dashboard, setDashboard] = useState<FeedbackDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/dashboard`);
      const data = await response.json();

      if (data.success) {
        setDashboard(data);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to fetch dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const runFeedbackLoop = async () => {
    try {
      setRunning(true);
      const response = await fetch(`${API_BASE}/run`, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        // Refresh dashboard to show new recommendations
        await fetchDashboard();
      } else {
        setError(data.error || 'Failed to run feedback analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run analysis');
    } finally {
      setRunning(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await fetch(`${API_BASE}/recommendations/${id}/approve`, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        await fetchDashboard();
      } else {
        setError(data.error || 'Failed to approve recommendation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await fetch(`${API_BASE}/recommendations/${id}/reject`, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        await fetchDashboard();
      } else {
        setError(data.error || 'Failed to reject recommendation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  const stats = dashboard?.outcomeStats;
  const pendingRecs = dashboard?.pendingRecommendations || [];

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/livewire">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              LiveWire Feedback Loop
            </h1>
            <p className="text-slate-400 text-sm">
              Learn from outcomes to improve lead scoring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            disabled={loading}
            className="border-slate-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={runFeedbackLoop}
            disabled={running}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Play className={`w-4 h-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Outcomes"
          value={stats?.totalOutcomes || 0}
          subtitle={`${stats?.uniqueLeads || 0} unique leads`}
          icon={BarChart3}
        />
        <StatCard
          title="Qualification Rate"
          value={`${Math.round((stats?.overallQualificationRate || 0) * 100)}%`}
          subtitle="Qualified + Converted"
          icon={Target}
          trend={stats?.overallQualificationRate && stats.overallQualificationRate > 0.2 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Conversion Rate"
          value={`${Math.round((stats?.overallConversionRate || 0) * 100)}%`}
          subtitle="Leads converted"
          icon={TrendingUp}
          trend={stats?.overallConversionRate && stats.overallConversionRate > 0.1 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingRecs.length}
          subtitle="Weight changes to review"
          icon={AlertCircle}
          trend={pendingRecs.length > 0 ? 'down' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pending Recommendations */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Pending Weight Changes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRecs.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No pending recommendations. Run analysis to generate suggestions.
              </p>
            ) : (
              pendingRecs.map(rec => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onApprove={() => handleApprove(rec.id)}
                  onReject={() => handleReject(rec.id)}
                  loading={actionLoading === rec.id}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Performance by Intent Bucket */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Performance by Intent Bucket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard?.bucketPerformance?.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No bucket data yet. Mark leads as qualified/converted to train.
              </p>
            ) : (
              dashboard?.bucketPerformance?.slice(0, 8).map(bucket => (
                <PerformanceBar
                  key={bucket.key}
                  label={bucket.key.replace(/_/g, ' ')}
                  rate={bucket.qualificationRate}
                  count={bucket.totalOutcomes}
                  type="qualification"
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Performance by Subreddit */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Performance by Subreddit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard?.subredditPerformance?.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No subreddit data yet. Mark leads as qualified/converted to train.
              </p>
            ) : (
              dashboard?.subredditPerformance?.slice(0, 8).map(sub => (
                <PerformanceBar
                  key={sub.key}
                  label={`r/${sub.key}`}
                  rate={sub.qualificationRate}
                  count={sub.totalOutcomes}
                  type="qualification"
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Current Weights */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Current Weight Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.currentWeights?.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No weight adjustments yet. All weights are at default values.
              </p>
            ) : (
              <div className="space-y-2">
                {dashboard?.currentWeights?.map(weight => {
                  const diff = weight.weightValue - weight.defaultValue;
                  const isPositive = diff > 0;
                  return (
                    <div key={weight.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                      <div>
                        <Badge variant="outline" className="text-xs mr-2">
                          {weight.weightType}
                        </Badge>
                        <span className="text-slate-300">{weight.weightKey}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{weight.defaultValue}</span>
                        <span className="text-slate-500">→</span>
                        <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {weight.weightValue}
                        </span>
                        <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          ({isPositive ? '+' : ''}{diff})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
