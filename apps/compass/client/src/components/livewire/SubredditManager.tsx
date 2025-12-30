/**
 * SubredditManager - View and manage subreddit tier performance
 *
 * Shows:
 * - Active, Test, and Retired subreddit tiers
 * - Quality scores and lead counts per subreddit
 * - Promotion/Demotion controls
 * - Recommendations based on performance
 *
 * Key insight from David: "Subreddits shouldn't be punished for bad leads.
 * The INTENT DETECTION is what's broken, not the subreddit."
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  qualityScore: number;       // 0-100
  leadsGenerated: number;
  goodLeads: number;
  badLeads: number;
  avgIntentScore: number;
  lastLeadDate: string;
  weight: number;             // Score modifier
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

  const fetchSubreddits = async () => {
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
  };

  useEffect(() => {
    fetchSubreddits();
  }, []);

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
        return <Archive className="w-4 h-4 text-gray-400" />;
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
    if (score >= 70) return { label: 'High Quality', variant: 'outline' as const, className: 'border-green-400 text-green-400' };
    if (score >= 40) return { label: 'Average', variant: 'outline' as const, className: 'border-yellow-400 text-yellow-400' };
    return { label: 'Low Quality', variant: 'outline' as const, className: 'border-red-400 text-red-400' };
  };

  // Filter by tier
  const filteredSubreddits = subreddits.filter(s => s.tier === activeTab);

  // Sort by quality score descending
  const sortedSubreddits = [...filteredSubreddits].sort((a, b) => b.qualityScore - a.qualityScore);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading subreddit data...</p>
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
          <Button onClick={fetchSubreddits} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Subreddits</p>
              <p className="text-2xl font-bold">{analytics.totalSubreddits}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{analytics.activeCount}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TestTube className="w-4 h-4 text-blue-400" />
                <p className="text-sm text-muted-foreground">Testing</p>
              </div>
              <p className="text-2xl font-bold text-blue-400">{analytics.testCount}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">Retired</p>
              </div>
              <p className="text-2xl font-bold text-gray-400">{analytics.retiredCount}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Quality</p>
              <p className={`text-2xl font-bold ${getQualityColor(analytics.avgQualityScore)}`}>
                {Math.round(analytics.avgQualityScore)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tier Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'active' ? 'default' : 'outline'}
          onClick={() => setActiveTab('active')}
          className="flex items-center gap-2"
        >
          <Star className="w-4 h-4" />
          Active ({subreddits.filter(s => s.tier === 'active').length})
        </Button>
        <Button
          variant={activeTab === 'test' ? 'default' : 'outline'}
          onClick={() => setActiveTab('test')}
          className="flex items-center gap-2"
        >
          <TestTube className="w-4 h-4" />
          Testing ({subreddits.filter(s => s.tier === 'test').length})
        </Button>
        <Button
          variant={activeTab === 'retired' ? 'default' : 'outline'}
          onClick={() => setActiveTab('retired')}
          className="flex items-center gap-2"
        >
          <Archive className="w-4 h-4" />
          Retired ({subreddits.filter(s => s.tier === 'retired').length})
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={fetchSubreddits}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Subreddit List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {getTierIcon(activeTab)}
            {activeTab === 'active' && 'Active Subreddits'}
            {activeTab === 'test' && 'Testing Subreddits'}
            {activeTab === 'retired' && 'Retired Subreddits'}
          </CardTitle>
          {activeTab === 'active' && (
            <p className="text-sm text-muted-foreground">
              These subreddits are actively scanned and their leads are weighted normally.
            </p>
          )}
          {activeTab === 'test' && (
            <p className="text-sm text-muted-foreground">
              New subreddits being evaluated. Leads are captured but weighted lower until promoted.
            </p>
          )}
          {activeTab === 'retired' && (
            <p className="text-sm text-muted-foreground">
              Subreddits that consistently produced low-quality leads. Not actively scanned.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {sortedSubreddits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No subreddits in this tier
            </p>
          ) : (
            <div className="space-y-3">
              {sortedSubreddits.map(sub => {
                const qualityBadge = getQualityBadge(sub.qualityScore);
                const isLoading = actionLoading === sub.name;
                const goodRate = sub.leadsGenerated > 0
                  ? Math.round((sub.goodLeads / sub.leadsGenerated) * 100)
                  : 0;

                return (
                  <div
                    key={sub.name}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <a
                          href={`https://reddit.com/r/${sub.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline flex items-center gap-1"
                        >
                          r/{sub.name}
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </a>
                        <Badge variant={qualityBadge.variant} className={qualityBadge.className}>
                          {qualityBadge.label}
                        </Badge>
                        {sub.recommendation && (
                          <Badge variant="outline" className="text-orange-400 border-orange-400">
                            {sub.recommendation}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{sub.leadsGenerated} leads</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4 text-green-400" />
                          <span>{sub.goodLeads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsDown className="w-4 h-4 text-red-400" />
                          <span>{sub.badLeads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{goodRate}% success</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Weight: {sub.weight >= 0 ? '+' : ''}{sub.weight}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quality Score */}
                      <div className="text-right mr-4">
                        <div className={`text-2xl font-bold ${getQualityColor(sub.qualityScore)}`}>
                          {Math.round(sub.qualityScore)}
                        </div>
                        <div className="text-xs text-muted-foreground">Quality</div>
                      </div>

                      {/* Tier Actions */}
                      {sub.tier === 'test' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => promoteTier(sub.name)}
                            disabled={isLoading}
                            className="text-green-400 border-green-400"
                            title="Promote to Active"
                          >
                            <ChevronUp className={`w-4 h-4 ${isLoading ? 'animate-bounce' : ''}`} />
                            Promote
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retireSubreddit(sub.name)}
                            disabled={isLoading}
                            className="text-red-400 border-red-400"
                            title="Retire"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {sub.tier === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => demoteTier(sub.name)}
                          disabled={isLoading}
                          className="text-yellow-400 border-yellow-400"
                          title="Demote to Testing"
                        >
                          <ChevronDown className={`w-4 h-4 ${isLoading ? 'animate-bounce' : ''}`} />
                          Demote
                        </Button>
                      )}
                      {sub.tier === 'retired' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => promoteTier(sub.name)}
                          disabled={isLoading}
                          className="text-blue-400 border-blue-400"
                          title="Move to Testing"
                        >
                          <ChevronUp className={`w-4 h-4 ${isLoading ? 'animate-bounce' : ''}`} />
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier System Explanation */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <p className="text-sm text-blue-400 font-medium mb-2">How Subreddit Tiers Work</p>
          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-yellow-400">Active</span>
              </div>
              <p>Full weight scoring. Leads from active subreddits get normal intent analysis.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TestTube className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-blue-400">Testing</span>
              </div>
              <p>New or uncertain. Leads captured but scored lower until quality proven.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Archive className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-400">Retired</span>
              </div>
              <p>Consistently low quality. Not scanned unless manually reactivated.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3 border-t border-blue-500/20 pt-3">
            <strong>Note:</strong> Subreddits are NOT punished for bad leads - intent detection is.
            A subreddit might have great leads but poor keyword matching. Check the Keyword Manager
            to improve detection before retiring a subreddit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
