/**
 * LiveWire Page - Reddit Lead Intelligence
 *
 * Displays Reddit leads from LiveWire backend with intent scoring.
 * Clean implementation using Tailwind CSS (Compass native styling).
 */

import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Flame, Zap, Snowflake, AlertCircle, Settings } from "lucide-react";

// LiveWire backend URL
const LIVEWIRE_API = '/api/livewire';

interface RedditLead {
  id: string;
  author: string;
  postTitle: string;
  postContent: string;
  subreddit: string;
  intentScore: number;
  intentTier: 'HOT' | 'WARM' | 'COLD';
  keywordsMatched: string[];
  url: string;
  state?: string;
  status: string;
  recommendedNextAction: string;
  notesForCloser?: string;
  isActionable: boolean;
  discoveredAt: string;
  empowerTerritory: boolean;
}

interface LiveWireStats {
  total: number;
  byTier: { HOT: number; WARM: number; COLD: number };
  byStatus: Record<string, number>;
  byState: Record<string, number>;
  actionableCount: number;
  empowerTerritory: number;
}

// Intent tier badge component
function IntentBadge({ tier }: { tier: string }) {
  const configs: Record<string, { bg: string; text: string; border: string; icon: typeof Flame }> = {
    HOT: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50', icon: Flame },
    WARM: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50', icon: Zap },
    COLD: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50', icon: Snowflake },
  };

  const config = configs[tier] || { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50', icon: AlertCircle };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3 h-3" />
      {tier}
    </span>
  );
}

export default function LiveWirePage() {
  const [leads, setLeads] = useState<RedditLead[]>([]);
  const [stats, setStats] = useState<LiveWireStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${LIVEWIRE_API}/leads`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setLeads(data.leads || []);
      setStats(data.stats || null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
      setLeads([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchLeads, 60000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const formatTime = (date: Date | null) => {
    if (!date) return 'Loading...';
    return date.toLocaleTimeString();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">LiveWire Unavailable</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchLeads} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            LiveWire Control Room
          </h1>
          <p className="text-sm text-muted-foreground">
            Reddit lead intelligence • Updated {formatTime(lastUpdated)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/livewire/settings">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Button onClick={fetchLeads} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">HOT Leads</p>
            <p className="text-3xl font-bold text-red-400">{stats?.byTier?.HOT || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">High intent</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">WARM Leads</p>
            <p className="text-3xl font-bold text-amber-400">{stats?.byTier?.WARM || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Moderate intent</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">COLD Leads</p>
            <p className="text-3xl font-bold text-blue-400">{stats?.byTier?.COLD || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Low intent</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Actionable</p>
            <p className="text-3xl font-bold text-green-400">{stats?.actionableCount || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Ready to engage</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && leads.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading leads...</span>
        </div>
      )}

      {/* Leads Table */}
      {!loading && leads.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Reddit Leads ({leads.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Author</th>
                    <th className="text-left p-3 font-medium">Post</th>
                    <th className="text-left p-3 font-medium">Subreddit</th>
                    <th className="text-left p-3 font-medium">State</th>
                    <th className="text-left p-3 font-medium">Intent</th>
                    <th className="text-left p-3 font-medium">Score</th>
                    <th className="text-left p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.slice(0, 50).map((lead) => (
                    <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <span className="font-medium">u/{lead.author}</span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="truncate" title={lead.postTitle}>
                          {lead.postTitle}
                        </p>
                        {lead.keywordsMatched?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Keywords: {lead.keywordsMatched.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">r/{lead.subreddit}</Badge>
                      </td>
                      <td className="p-3">
                        {lead.state || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        <IntentBadge tier={lead.intentTier} />
                      </td>
                      <td className="p-3">
                        <span className={`font-mono ${
                          lead.intentScore >= 50 ? 'text-red-400' :
                          lead.intentScore >= 30 ? 'text-amber-400' : 'text-blue-400'
                        }`}>
                          {lead.intentScore}
                        </span>
                      </td>
                      <td className="p-3">
                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && leads.length === 0 && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No leads found</h3>
            <p className="text-muted-foreground">LiveWire is scanning Reddit for solar leads.</p>
          </CardContent>
        </Card>
      )}

      {/* Leads by State */}
      {stats && Object.keys(stats.byState || {}).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Leads by State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byState)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([state, count]) => (
                  <Badge key={state} variant="secondary">
                    {state}: {count}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
