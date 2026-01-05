/**
 * SubredditManager - View and manage subreddit tier performance
 *
 * Shows:
 * - Active, Test, and Retired subreddit tiers
 * - Quality scores and lead counts per subreddit
 * - Promotion/Demotion controls
 * - Recommendations based on performance
 *
 * Adapted from COMPASS for Command Dashboard styling.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Star,
  TestTube,
  Archive,
  RefreshCw,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Users,
  Target,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const LIVEWIRE_API = '/api/livewire';

interface SubredditScore {
  name: string;
  tier: 'active' | 'test' | 'retired';
  qualityScore: number;
  leadsGenerated: number;
  goodLeads: number;
  badLeads: number;
  avgIntentScore: number;
  lastLeadDate: string;
  weight: number;
  recommendation?: string;
}

interface SubredditAnalytics {
  totalSubreddits: number;
  activeCount: number;
  testCount: number;
  retiredCount: number;
  avgQualityScore: number;
  topPerformers: string[];
  underperformers: string[];
}

export function SubredditManager() {
  const [subreddits, setSubreddits] = useState<SubredditScore[]>([]);
  const [analytics, setAnalytics] = useState<SubredditAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'test' | 'retired'>('active');

  const fetchSubreddits = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${LIVEWIRE_API}/v2/subreddits`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSubreddits(data.subreddits || []);
      setAnalytics(data.analytics || null);
      setError(null);
    } catch (err) {
      setError('Failed to load subreddits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubreddits();
  }, [fetchSubreddits]);

  const promoteTier = async (subreddit: string) => {
    setActionLoading(subreddit);
    try {
      const response = await fetch(`${LIVEWIRE_API}/v2/subreddits/${encodeURIComponent(subreddit)}/promote`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await fetchSubreddits();
    } catch (err) {
      console.error('Failed to promote subreddit:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const demoteTier = async (subreddit: string) => {
    setActionLoading(subreddit);
    try {
      const response = await fetch(`${LIVEWIRE_API}/v2/subreddits/${encodeURIComponent(subreddit)}/demote`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await fetchSubreddits();
    } catch (err) {
      console.error('Failed to demote subreddit:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const retireSubreddit = async (subreddit: string) => {
    setActionLoading(subreddit);
    try {
      const response = await fetch(`${LIVEWIRE_API}/v2/subreddits/${encodeURIComponent(subreddit)}/retire`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await fetchSubreddits();
    } catch (err) {
      console.error('Failed to retire subreddit:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Get tier icon
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'active':
        return <Star className="w-4 h-4 text-yellow-400" />;
      case 'test':
        return <TestTube className="w-4 h-4 text-blue-400" />;
      case 'retired':
        return <Archive className="w-4 h-4 text-zinc-400" />;
      default:
        return null;
    }
  };

  // Get quality color
  const getQualityColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get quality badge
  const getQualityBadge = (score: number) => {
    if (score >= 70) return { label: 'High Quality', className: 'border-green-500/30 text-green-400' };
    if (score >= 40) return { label: 'Average', className: 'border-yellow-500/30 text-yellow-400' };
    return { label: 'Low Quality', className: 'border-red-500/30 text-red-400' };
  };

  // Filter by tier
  const filteredSubreddits = subreddits.filter(s => s.tier === activeTab);

  // Sort by quality score descending
  const sortedSubreddits = [...filteredSubreddits].sort((a, b) => b.qualityScore - a.qualityScore);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Loading subreddit data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-red-500/30 rounded-xl p-6 text-center">
        <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchSubreddits}
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
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Subreddits</p>
            <p className="text-xl font-bold">{analytics.totalSubreddits}</p>
          </div>
          <div className="bg-card border border-yellow-500/30 rounded-xl p-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
            </div>
            <p className="text-xl font-bold text-yellow-400">{analytics.activeCount}</p>
          </div>
          <div className="bg-card border border-blue-500/30 rounded-xl p-3">
            <div className="flex items-center gap-1">
              <TestTube className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Testing</p>
            </div>
            <p className="text-xl font-bold text-blue-400">{analytics.testCount}</p>
          </div>
          <div className="bg-card border border-zinc-500/30 rounded-xl p-3">
            <div className="flex items-center gap-1">
              <Archive className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Retired</p>
            </div>
            <p className="text-xl font-bold text-zinc-400">{analytics.retiredCount}</p>
          </div>
          <div className="bg-card border border-green-500/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Quality</p>
            <p className={`text-xl font-bold ${getQualityColor(analytics.avgQualityScore)}`}>
              {Math.round(analytics.avgQualityScore)}%
            </p>
          </div>
        </div>
      )}

      {/* Tier Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'active'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Active ({subreddits.filter(s => s.tier === 'active').length})
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'test'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <TestTube className="w-3.5 h-3.5" />
          Testing ({subreddits.filter(s => s.tier === 'test').length})
        </button>
        <button
          onClick={() => setActiveTab('retired')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'retired'
              ? 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
              : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          Retired ({subreddits.filter(s => s.tier === 'retired').length})
        </button>
        <div className="flex-1" />
        <button
          onClick={fetchSubreddits}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Subreddit List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-bold flex items-center gap-2">
            {getTierIcon(activeTab)}
            {activeTab === 'active' && 'Active Subreddits'}
            {activeTab === 'test' && 'Testing Subreddits'}
            {activeTab === 'retired' && 'Retired Subreddits'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTab === 'active' && 'These subreddits are actively scanned and their leads are weighted normally.'}
            {activeTab === 'test' && 'New subreddits being evaluated. Leads are captured but weighted lower until promoted.'}
            {activeTab === 'retired' && 'Consistently low quality. Not scanned unless manually reactivated.'}
          </p>
        </div>

        {sortedSubreddits.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            No subreddits in this tier
          </p>
        ) : (
          <div className="p-3 space-y-2">
            {sortedSubreddits.map(sub => {
              const qualityBadge = getQualityBadge(sub.qualityScore);
              const isLoading = actionLoading === sub.name;
              const goodRate = sub.leadsGenerated > 0
                ? Math.round((sub.goodLeads / sub.leadsGenerated) * 100)
                : 0;

              return (
                <div
                  key={sub.name}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://reddit.com/r/${sub.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm hover:underline flex items-center gap-1"
                      >
                        r/{sub.name}
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${qualityBadge.className}`}>
                        {qualityBadge.label}
                      </span>
                      {sub.recommendation && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-orange-500/30 text-orange-400">
                          {sub.recommendation}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{sub.leadsGenerated} leads</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
                        <span>{sub.goodLeads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
                        <span>{sub.badLeads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" />
                        <span>{goodRate}% success</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Weight: {sub.weight >= 0 ? '+' : ''}{sub.weight}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Quality Score */}
                    <div className="text-right mr-2">
                      <div className={`text-xl font-bold ${getQualityColor(sub.qualityScore)}`}>
                        {Math.round(sub.qualityScore)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Quality</div>
                    </div>

                    {/* Tier Actions */}
                    {sub.tier === 'test' && (
                      <>
                        <button
                          onClick={() => promoteTier(sub.name)}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-green-500/30 text-green-400 rounded hover:bg-green-500/10 transition-colors"
                          title="Promote to Active"
                        >
                          <ChevronUp className={`w-3.5 h-3.5 ${isLoading ? 'animate-bounce' : ''}`} />
                          Promote
                        </button>
                        <button
                          onClick={() => retireSubreddit(sub.name)}
                          disabled={isLoading}
                          className="p-1.5 border border-red-500/30 text-red-400 rounded hover:bg-red-500/10 transition-colors"
                          title="Retire"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {sub.tier === 'active' && (
                      <button
                        onClick={() => demoteTier(sub.name)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-yellow-500/30 text-yellow-400 rounded hover:bg-yellow-500/10 transition-colors"
                        title="Demote to Testing"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 ${isLoading ? 'animate-bounce' : ''}`} />
                        Demote
                      </button>
                    )}
                    {sub.tier === 'retired' && (
                      <button
                        onClick={() => promoteTier(sub.name)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-blue-500/30 text-blue-400 rounded hover:bg-blue-500/10 transition-colors"
                        title="Move to Testing"
                      >
                        <ChevronUp className={`w-3.5 h-3.5 ${isLoading ? 'animate-bounce' : ''}`} />
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tier System Explanation */}
      <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-4">
        <p className="text-sm text-blue-400 font-medium mb-3">How Subreddit Tiers Work</p>
        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-medium text-yellow-400">Active</span>
            </div>
            <p>Full weight scoring. Leads from active subreddits get normal intent analysis.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TestTube className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-blue-400">Testing</span>
            </div>
            <p>New or uncertain. Leads captured but scored lower until quality proven.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Archive className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-medium text-zinc-400">Retired</span>
            </div>
            <p>Consistently low quality. Not scanned unless manually reactivated.</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 border-t border-blue-500/20 pt-3">
          <strong>Note:</strong> Subreddits are NOT punished for bad leads - intent detection is.
          A subreddit might have great leads but poor keyword matching. Check the Keyword Manager
          to improve detection before retiring a subreddit.
        </p>
      </div>
    </div>
  );
}
