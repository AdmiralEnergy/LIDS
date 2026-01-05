import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Settings2,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Calendar,
} from "lucide-react";
import { SequentialThinking, type ThinkingStep } from "./SequentialThinking";
import { LeadReviewCard, type LeadContent } from "./LeadReviewCard";
import { useAuth } from "@/providers/AuthProvider";

/**
 * LiveWire Control Component
 *
 * Phase 5: Live Data Integration
 *
 * Main control panel for LiveWire lead discovery and review.
 * Fetches real leads from LiveWire v1 backend on admiral-server.
 */

// Age filter options
type AgeFilter = 'today' | '3d' | '7d' | 'all';

// LiveWire v1 API lead format
interface LiveWireLead {
  id: string;
  postId: string;
  author: string;
  postTitle: string;
  postContent: string;
  subreddit: string;
  url?: string;
  permalink?: string;
  intentScore: number;
  ncRelevant?: boolean;
  status: string;
  matchedKeywords?: string[];
  createdAt: string;
  // v1 date fields
  postCreatedAt?: string;
  discoveredAt?: string;
  ageInDays?: number;
  isStale?: boolean;
  // v2.0 fields
  keywordMatches?: Array<{ keyword: string; weight: number }>;
  contextAnalysis?: {
    buyingStage?: string;
    urgency?: string;
    objections?: string[];
  };
}

// UI format for display
interface RedditPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  url?: string;
  intentScore: number;
  ncRelevant: boolean;
  thoughtTrace: ThinkingStep[];
  suggestedMessage?: string;
  status: string;
  ageInDays: number;
  postCreatedAt?: string;
}

// Transform LiveWire lead to UI format
function transformLead(lead: LiveWireLead): RedditPost {
  // Build thinking steps based on available data
  const steps: ThinkingStep[] = [];

  // Step 1: Keyword matching
  if (lead.matchedKeywords && lead.matchedKeywords.length > 0) {
    steps.push({
      agent: "KeywordMatcher",
      thought: `Matched keywords: ${lead.matchedKeywords.slice(0, 5).join(', ')}`,
      status: 'complete',
      data: {
        keywords: lead.matchedKeywords,
        keywordWeights: lead.keywordMatches?.reduce((acc, k) => ({ ...acc, [k.keyword]: k.weight }), {})
      }
    });
  }

  // Step 2: Intent scoring
  const intentLevel = lead.intentScore >= 80 ? 'High' : lead.intentScore >= 50 ? 'Moderate' : 'Low';
  steps.push({
    agent: "LeadScout",
    thought: `${intentLevel} purchase intent detected (score: ${lead.intentScore}). ${
      lead.contextAnalysis?.buyingStage ? `Buying stage: ${lead.contextAnalysis.buyingStage}` : ''
    }`,
    status: lead.intentScore >= 50 ? 'complete' : 'rejected',
    data: {
      intentScore: lead.intentScore,
      buyingStage: lead.contextAnalysis?.buyingStage,
      urgency: lead.contextAnalysis?.urgency
    }
  });

  // Step 3: Territory check (if NC relevant)
  if (lead.ncRelevant !== false) {
    steps.push({
      agent: "TerritoryAnalyst",
      thought: lead.ncRelevant
        ? "North Carolina relevance confirmed. NC incentives may apply."
        : "Territory analysis pending.",
      status: lead.ncRelevant ? 'complete' : 'processing',
      data: {
        state: lead.ncRelevant ? 'NC' : 'Unknown',
        eligible: lead.ncRelevant
      }
    });
  }

  // Calculate age in days if not provided
  let ageInDays = lead.ageInDays ?? 0;
  if (!lead.ageInDays && lead.postCreatedAt) {
    const postDate = new Date(lead.postCreatedAt);
    const now = new Date();
    ageInDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    id: lead.id || lead.postId,
    title: lead.postTitle,
    content: lead.postContent,
    subreddit: lead.subreddit.startsWith('r/') ? lead.subreddit : `r/${lead.subreddit}`,
    author: lead.author,
    url: lead.url || lead.permalink,
    intentScore: lead.intentScore,
    ncRelevant: lead.ncRelevant ?? true,
    thoughtTrace: steps,
    status: lead.status,
    ageInDays,
    postCreatedAt: lead.postCreatedAt,
  };
}

// Helper to format age for display
function formatAge(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

export function LiveWireControl() {
  const { canConfigure } = useAuth();
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [intentFilter, setIntentFilter] = useState<'all' | 'high'>('all');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('3d'); // Default to 3 days

  // Fetch leads from API
  const fetchLeads = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/livewire/leads');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setIsConnected(true);

      // Transform leads to UI format
      // Filter out: dismissed, removed by moderator
      const transformedLeads = (data.leads || [])
        .filter((lead: LiveWireLead) => {
          // Skip dismissed leads
          if (lead.status === 'dismissed') return false;
          // Skip removed/deleted posts
          if (lead.postTitle?.toLowerCase().includes('[removed')) return false;
          if (lead.postTitle?.toLowerCase().includes('[deleted')) return false;
          if (lead.postContent?.toLowerCase().includes('[removed by moderator]')) return false;
          if (lead.postContent?.toLowerCase().includes('[deleted]')) return false;
          return true;
        })
        .map(transformLead)
        // Sort by newest first (postCreatedAt), then by intent score
        .sort((a: RedditPost, b: RedditPost) => {
          // Primary sort: by date (newest first)
          if (a.postCreatedAt && b.postCreatedAt) {
            const dateA = new Date(a.postCreatedAt).getTime();
            const dateB = new Date(b.postCreatedAt).getTime();
            if (dateA !== dateB) return dateB - dateA;
          }
          // Secondary sort: by intent score
          return b.intentScore - a.intentScore;
        });

      setPosts(transformedLeads);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[LiveWire] Failed to fetch leads:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchLeads();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchLeads, 60000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  // Get max days for age filter
  const getMaxDays = (filter: AgeFilter): number => {
    switch (filter) {
      case 'today': return 0;
      case '3d': return 3;
      case '7d': return 7;
      case 'all': return Infinity;
    }
  };

  // Filter posts by age and intent
  const filteredPosts = posts.filter(p => {
    // Age filter
    const maxDays = getMaxDays(ageFilter);
    if (p.ageInDays > maxDays) return false;
    // Intent filter
    if (intentFilter === 'high' && p.intentScore < 70) return false;
    return true;
  });

  // Count posts by age for display
  const todayCount = posts.filter(p => p.ageInDays === 0).length;
  const threeDayCount = posts.filter(p => p.ageInDays <= 3).length;
  const sevenDayCount = posts.filter(p => p.ageInDays <= 7).length;
  const highIntentCount = filteredPosts.filter(p => p.intentScore >= 70).length;

  // Convert RedditPost to LeadContent for LeadReviewCard
  const getLeadContent = (post: RedditPost): LeadContent => ({
    id: post.id,
    title: post.title,
    content: post.content,
    subreddit: post.subreddit,
    author: post.author,
    url: post.url,
  });

  // Handle approve action
  const handleApprove = async (message: string) => {
    if (!selectedPost) return;

    setIsSubmitting(true);
    try {
      // Record feedback in LiveWire v1
      await fetch(`/api/livewire/leads/${selectedPost.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quality: 'good',
          action: 'approved',
          message,
        }),
      });

      // Update lead status
      await fetch(`/api/livewire/leads/${selectedPost.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'contacted' }),
      });

      console.log('[LiveWire] Lead approved:', selectedPost.id);

      // Remove from list and refresh
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setSelectedPost(null);
    } catch (err) {
      console.error('[LiveWire] Approve failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject action
  const handleReject = async (reason: string) => {
    if (!selectedPost) return;

    setIsSubmitting(true);
    try {
      // Record feedback in LiveWire v1
      await fetch(`/api/livewire/leads/${selectedPost.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quality: 'bad',
          action: 'rejected',
          reason,
        }),
      });

      // Update lead status
      await fetch(`/api/livewire/leads/${selectedPost.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed', notes: reason }),
      });

      console.log('[LiveWire] Lead rejected:', selectedPost.id);

      // Remove from list
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setSelectedPost(null);
    } catch (err) {
      console.error('[LiveWire] Reject failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left Sidebar: Discovery Queue */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        <div className="bg-card border border-border rounded-xl flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
              <Activity className="w-4 h-4 text-green-500" />
              Discovery Queue
            </h3>
            <div className="flex items-center gap-1">
              {/* Connection status */}
              {isConnected ? (
                <Wifi className="w-3.5 h-3.5 text-green-500" title="Connected to LiveWire" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-500" title="Disconnected" />
              )}
              <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-bold">
                {filteredPosts.length} NEW
              </span>
              <button
                onClick={fetchLeads}
                disabled={isLoading}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Refresh leads"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {canConfigure && (
                <button
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  title="Configure Lead Sources"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar - Age Filter */}
          <div className="p-2 border-b border-border bg-muted/10">
            <div className="flex items-center gap-1 mb-2">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Age</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAgeFilter('today')}
                className={`flex-1 py-1.5 px-1 text-[10px] font-bold rounded-lg transition-colors ${
                  ageFilter === 'today' ? 'bg-green-500/20 text-green-500' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Today ({todayCount})
              </button>
              <button
                onClick={() => setAgeFilter('3d')}
                className={`flex-1 py-1.5 px-1 text-[10px] font-bold rounded-lg transition-colors ${
                  ageFilter === '3d' ? 'bg-cyan-500/20 text-cyan-500' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                3d ({threeDayCount})
              </button>
              <button
                onClick={() => setAgeFilter('7d')}
                className={`flex-1 py-1.5 px-1 text-[10px] font-bold rounded-lg transition-colors ${
                  ageFilter === '7d' ? 'bg-yellow-500/20 text-yellow-500' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                7d ({sevenDayCount})
              </button>
              <button
                onClick={() => setAgeFilter('all')}
                className={`flex-1 py-1.5 px-1 text-[10px] font-bold rounded-lg transition-colors ${
                  ageFilter === 'all' ? 'bg-zinc-500/20 text-zinc-400' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                All ({posts.length})
              </button>
            </div>
          </div>

          {/* Filter Bar - Intent Filter */}
          <div className="p-2 border-b border-border bg-muted/10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIntentFilter('all')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-[10px] font-bold uppercase rounded-lg transition-colors ${
                  intentFilter === 'all' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                All Intent ({filteredPosts.length})
              </button>
              <button
                onClick={() => setIntentFilter('high')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-[10px] font-bold uppercase rounded-lg transition-colors ${
                  intentFilter === 'high' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                High Intent ({highIntentCount})
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-2 bg-red-500/10 border-b border-red-500/20">
              <p className="text-[10px] text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <p className="text-xs">Loading leads...</p>
              </div>
            </div>
          )}

          {/* Lead list */}
          {!isLoading && (
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {filteredPosts.map(post => {
                const isRejected = post.thoughtTrace.some(t => t.status === 'rejected');

                return (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedPost?.id === post.id
                        ? "bg-primary/5 border-primary shadow-sm"
                        : isRejected
                          ? "bg-muted/20 border-border hover:border-muted-foreground/30 opacity-60"
                          : "bg-background border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                          {post.subreddit}
                        </span>
                        {/* Age badge */}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          post.ageInDays === 0 ? "text-green-500 bg-green-500/10" :
                          post.ageInDays <= 3 ? "text-cyan-500 bg-cyan-500/10" :
                          post.ageInDays <= 7 ? "text-yellow-500 bg-yellow-500/10" :
                          "text-red-400 bg-red-500/10"
                        }`}>
                          <Clock className="w-2.5 h-2.5" />
                          {formatAge(post.ageInDays)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        post.intentScore >= 80 ? "text-green-500 bg-green-500/10" :
                        post.intentScore >= 50 ? "text-yellow-500 bg-yellow-500/10" :
                        "text-zinc-500 bg-zinc-500/10"
                      }`}>
                        {post.intentScore}%
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold line-clamp-2 mb-2">{post.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {post.thoughtTrace.map((step, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${
                            step.status === 'rejected' ? 'bg-red-500' :
                            step.status === 'complete' ? 'bg-green-500' :
                            step.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                            'bg-zinc-500'
                          }`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground italic">u/{post.author}</span>
                    </div>
                  </button>
                );
              })}

              {filteredPosts.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Activity className="w-8 h-8 mb-3 opacity-20" />
                  <p className="text-xs font-medium">No leads in queue</p>
                  <p className="text-[10px] mt-1">Waiting for discovery...</p>
                  {lastRefresh && (
                    <p className="text-[10px] mt-2 text-muted-foreground/50">
                      Last refresh: {lastRefresh.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Panel: Detail View */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {selectedPost ? (
          <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
            {/* Left: Sequential Thinking */}
            <SequentialThinking
              steps={selectedPost.thoughtTrace}
              isProcessing={selectedPost.thoughtTrace.some(t => t.status === 'processing')}
            />

            {/* Right: Lead Review Card */}
            <LeadReviewCard
              lead={getLeadContent(selectedPost)}
              draftMessage={selectedPost.suggestedMessage}
              intentScore={selectedPost.intentScore}
              onApprove={handleApprove}
              onReject={handleReject}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : (
          <div className="flex-1 bg-card border border-border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="w-14 h-14 mb-4 opacity-10" />
            <p className="text-sm font-medium tracking-tight">Select a lead from the queue</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Review the AI reasoning chain and approve or reject leads
            </p>
            {isConnected && posts.length > 0 && (
              <p className="text-xs mt-3 text-green-500">
                {posts.length} leads ready for review
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
