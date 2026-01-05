/**
 * KeywordManager - View and manage LiveWire keyword performance
 *
 * Shows:
 * - All keywords with current scores and trends
 * - Visual performance indicators (working vs not working)
 * - Recommendations for underperforming keywords
 * - Actions: Remove, Reset, Keep
 *
 * Adapted from COMPASS for Command Dashboard styling.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  RotateCcw,
  Eye
} from 'lucide-react';

const LIVEWIRE_API = '/api/livewire';

interface KeywordScore {
  keyword: string;
  baseWeight: number;
  currentWeight: number;
  feedbackCount: number;
  positiveCount: number;
  negativeCount: number;
  positiveContexts: string[];
  negativeContexts: string[];
  lastUpdated: string;
  status: 'active' | 'flagged' | 'removed';
}

interface KeywordAnalytics {
  total: number;
  active: number;
  flagged: number;
  removed: number;
  topPerformers: KeywordScore[];
  underperformers: KeywordScore[];
  avgPositiveRate: number;
}

export function KeywordManager() {
  const [keywords, setKeywords] = useState<KeywordScore[]>([]);
  const [analytics, setAnalytics] = useState<KeywordAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${LIVEWIRE_API}/v2/keywords`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setKeywords(data.keywords || []);
      setAnalytics(data.analytics || null);
      setError(null);
    } catch (err) {
      setError('Failed to load keywords');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const resetKeyword = async (keyword: string) => {
    setActionLoading(keyword);
    try {
      const response = await fetch(`${LIVEWIRE_API}/v2/keywords/${encodeURIComponent(keyword)}/reset`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await fetchKeywords();
    } catch (err) {
      console.error('Failed to reset keyword:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate performance metrics
  const getPerformanceIndicator = (kw: KeywordScore) => {
    const total = kw.positiveCount + kw.negativeCount;
    if (total === 0) return { status: 'new', label: 'No data', color: 'text-zinc-400' };

    const positiveRate = kw.positiveCount / total;
    const weightChange = kw.currentWeight - kw.baseWeight;

    if (kw.currentWeight < 0 || positiveRate < 0.2) {
      return { status: 'bad', label: 'Underperforming', color: 'text-red-400' };
    }
    if (positiveRate < 0.4 || weightChange < -2) {
      return { status: 'warning', label: 'Needs attention', color: 'text-yellow-400' };
    }
    if (positiveRate > 0.7) {
      return { status: 'good', label: 'Strong performer', color: 'text-green-400' };
    }
    return { status: 'neutral', label: 'Average', color: 'text-blue-400' };
  };

  const getTrendIcon = (kw: KeywordScore) => {
    const change = kw.currentWeight - kw.baseWeight;
    if (change > 2) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (change < -2) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-zinc-400" />;
  };

  // Sort keywords: flagged first, then by feedback count
  const sortedKeywords = [...keywords].sort((a, b) => {
    if (a.status === 'flagged' && b.status !== 'flagged') return -1;
    if (b.status === 'flagged' && a.status !== 'flagged') return 1;
    return b.feedbackCount - a.feedbackCount;
  });

  const displayKeywords = showAll ? sortedKeywords : sortedKeywords.slice(0, 15);
  const flaggedKeywords = keywords.filter(k => k.status === 'flagged' || k.currentWeight < 0);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Loading keyword data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-red-500/30 rounded-xl p-6 text-center">
        <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchKeywords}
          className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Keywords</p>
            <p className="text-xl font-bold">{analytics.total}</p>
          </div>
          <div className="bg-card border border-green-500/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
            <p className="text-xl font-bold text-green-400">{analytics.active}</p>
          </div>
          <div className="bg-card border border-yellow-500/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Flagged</p>
            <p className="text-xl font-bold text-yellow-400">{analytics.flagged}</p>
          </div>
          <div className="bg-card border border-red-500/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Removed</p>
            <p className="text-xl font-bold text-red-400">{analytics.removed}</p>
          </div>
          <div className="bg-card border border-blue-500/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Success</p>
            <p className="text-xl font-bold text-blue-400">{Math.round(analytics.avgPositiveRate)}%</p>
          </div>
        </div>
      )}

      {/* Flagged Keywords Alert */}
      {flaggedKeywords.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-yellow-500/20 bg-yellow-500/5">
            <h3 className="text-sm font-bold flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              Underperforming Keywords ({flaggedKeywords.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              These keywords are generating more bad leads than good. Consider removing them.
            </p>
          </div>
          <div className="p-3 space-y-2">
            {flaggedKeywords.map(kw => {
              const total = kw.positiveCount + kw.negativeCount;
              const badRate = total > 0 ? Math.round((kw.negativeCount / total) * 100) : 0;

              return (
                <div key={kw.keyword} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-yellow-500/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">"{kw.keyword}"</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${kw.currentWeight >= 0 ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>
                        {kw.currentWeight >= 0 ? '+' : ''}{kw.currentWeight}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {badRate}% of leads were bad ({kw.negativeCount} bad / {total} total)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => resetKeyword(kw.keyword)}
                      disabled={actionLoading === kw.keyword}
                      className="px-2 py-1 text-xs font-medium border border-blue-500/30 text-blue-400 rounded hover:bg-blue-500/10 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className={`w-3 h-3 ${actionLoading === kw.keyword ? 'animate-spin' : ''}`} />
                      Reset
                    </button>
                    <button className="px-2 py-1 text-xs font-medium border border-green-500/30 text-green-400 rounded hover:bg-green-500/10 transition-colors flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Keep
                    </button>
                    <button className="px-2 py-1 text-xs font-medium border border-red-500/30 text-red-400 rounded hover:bg-red-500/10 transition-colors flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Keywords Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
          <h3 className="text-sm font-bold">Keyword Performance</h3>
          <button
            onClick={fetchKeywords}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Keyword</th>
                <th className="text-center p-3 font-medium">Base</th>
                <th className="text-center p-3 font-medium">Current</th>
                <th className="text-center p-3 font-medium">
                  <ThumbsUp className="w-3.5 h-3.5 inline text-green-400" />
                </th>
                <th className="text-center p-3 font-medium">
                  <ThumbsDown className="w-3.5 h-3.5 inline text-red-400" />
                </th>
                <th className="text-center p-3 font-medium">Trend</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayKeywords.map(kw => {
                const perf = getPerformanceIndicator(kw);
                const isLoading = actionLoading === kw.keyword;

                return (
                  <tr key={kw.keyword} className={`hover:bg-muted/30 ${kw.status === 'flagged' ? 'bg-yellow-500/5' : ''}`}>
                    <td className="p-3">
                      <span className="font-medium">"{kw.keyword}"</span>
                    </td>
                    <td className="p-3 text-center text-muted-foreground">
                      {kw.baseWeight >= 0 ? '+' : ''}{kw.baseWeight}
                    </td>
                    <td className="p-3 text-center">
                      <span className={kw.currentWeight >= kw.baseWeight ? 'text-green-400' : 'text-red-400'}>
                        {kw.currentWeight >= 0 ? '+' : ''}{kw.currentWeight}
                      </span>
                    </td>
                    <td className="p-3 text-center text-green-400">
                      {kw.positiveCount}
                    </td>
                    <td className="p-3 text-center text-red-400">
                      {kw.negativeCount}
                    </td>
                    <td className="p-3 text-center">
                      {getTrendIcon(kw)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {perf.status === 'good' && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                        {perf.status === 'bad' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        {perf.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                        {perf.status === 'new' && <Eye className="w-3.5 h-3.5 text-zinc-400" />}
                        {perf.status === 'neutral' && <Minus className="w-3.5 h-3.5 text-blue-400" />}
                        <span className={perf.color}>{perf.label}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => resetKeyword(kw.keyword)}
                        disabled={isLoading}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        title="Reset to base weight"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {keywords.length > 15 && (
          <div className="p-3 text-center border-t border-border">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              {showAll ? 'Show Less' : `Show All ${keywords.length} Keywords`}
            </button>
          </div>
        )}
      </div>

      {/* Learning Insight */}
      <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-4">
        <p className="text-sm text-blue-400 font-medium mb-2">How Keywords Learn</p>
        <p className="text-xs text-muted-foreground">
          When you give feedback on a lead (thumbs up/down), LiveWire adjusts the weight of every keyword that matched that lead.
          Good feedback increases weights, bad feedback decreases them.
          Keywords that consistently appear in bad leads get flagged for removal.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>Current learning:</strong> {keywords.filter(k => k.feedbackCount > 0).length} keywords have received feedback.
        </p>
      </div>
    </div>
  );
}
