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
import { RefreshCw, ExternalLink, Flame, Zap, Snowflake, AlertCircle, Settings, Search, Filter, Clock, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, X } from "lucide-react";

// LiveWire backend URL
const LIVEWIRE_API = '/api/livewire';

// Lead statuses
type LeadStatus = 'new' | 'dm_sent' | 'replied' | 'qualified' | 'converted' | 'rejected' | 'investigating';

const STATUS_OPTIONS: { value: LeadStatus | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '📋' },
  { value: 'new', label: 'New', emoji: '🆕' },
  { value: 'investigating', label: 'Investigating', emoji: '🔍' },
  { value: 'dm_sent', label: 'DM Sent', emoji: '📩' },
  { value: 'replied', label: 'Replied', emoji: '💬' },
  { value: 'qualified', label: 'Qualified', emoji: '✅' },
  { value: 'converted', label: 'Converted', emoji: '💰' },
  { value: 'rejected', label: 'Rejected', emoji: '❌' },
];

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'HOT', label: '🔥 HOT' },
  { value: 'WARM', label: '⚡ WARM' },
  { value: 'COLD', label: '❄️ COLD' },
];

const AGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '1', label: 'Last 24h' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
];

// Pagination
const LEADS_PER_PAGE = 50;

// Feedback reasons for thumbs down
const THUMBS_DOWN_REASONS = [
  { value: 'already_bought', label: 'Already bought solar' },
  { value: 'not_in_territory', label: 'Not in territory' },
  { value: 'commercial', label: 'Commercial/B2B' },
  { value: 'spam', label: 'Spam/irrelevant' },
  { value: 'wrong_intent', label: 'Wrong intent detected' },
  { value: 'other', label: 'Other' },
];

// Intent assessment options
const INTENT_OPTIONS = [
  { value: 'high', label: 'High Intent (looking to buy)', color: 'text-green-400' },
  { value: 'low', label: 'Low Intent (already bought)', color: 'text-yellow-400' },
  { value: 'none', label: 'No Intent (not relevant)', color: 'text-red-400' },
];

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
  status: LeadStatus;
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

  // Filters
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [actionableOnly, setActionableOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Status update loading state
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Feedback state
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);
  const [showThumbsDownReason, setShowThumbsDownReason] = useState<string | null>(null);

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

  // Submit feedback for a lead
  const submitFeedback = useCallback(async (
    leadId: string,
    quality: 'good' | 'bad' | 'neutral',
    options?: {
      reason?: string;
      correctedIntent?: 'high' | 'low' | 'none';
      keywordsToRemove?: string[];
      notes?: string;
    }
  ) => {
    setFeedbackLoading(leadId);
    try {
      const response = await fetch(`${LIVEWIRE_API}/leads/${leadId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quality,
          ...options,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();

      // Update local lead with new score if provided
      if (result.newScore !== undefined) {
        setLeads(prev => prev.map(lead =>
          lead.id === leadId ? { ...lead, intentScore: result.newScore } : lead
        ));
      }

      // Close expanded view and reason picker
      setExpandedLead(null);
      setShowThumbsDownReason(null);

      // Show brief success indicator (could add toast later)
      console.log(`Feedback recorded for ${leadId}:`, result.message);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setFeedbackLoading(null);
    }
  }, []);

  // Update lead status
  const updateLeadStatus = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingStatus(leadId);
    try {
      const response = await fetch(`${LIVEWIRE_API}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      // Update local state
      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchLeads, 60000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  // Filter and sort leads (newest first)
  const filteredLeads = leads
    .filter(lead => {
      // Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;

      // Tier filter
      if (tierFilter !== 'all' && lead.intentTier !== tierFilter) return false;

      // Score filter
      if (lead.intentScore < minScore) return false;

      // Actionable filter
      if (actionableOnly && !lead.isActionable) return false;

      // Age filter
      if (ageFilter !== 'all') {
        const days = parseInt(ageFilter);
        const leadDate = new Date(lead.discoveredAt);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        if (leadDate < cutoff) return false;
      }

      return true;
    })
    .sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + LEADS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, tierFilter, ageFilter, minScore, actionableOnly]);

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
        <div className="flex items-center gap-4">
          <img
            src="/livewire-avatar.png"
            alt="LiveWire"
            className="w-16 h-16 rounded-full object-cover object-top border-2 border-green-500 shadow-lg shadow-green-500/30"
          />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-400" />
              LiveWire Control Room
            </h1>
            <p className="text-sm text-muted-foreground">
              Reddit lead intelligence • Updated {formatTime(lastUpdated)} • Showing {filteredLeads.length} of {leads.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
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

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Tier Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Intent Tier</label>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm"
                >
                  {TIER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Age Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Age</label>
                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm"
                >
                  {AGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Min Score Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Min Score: {minScore}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                variant={actionableOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setActionableOnly(!actionableOnly)}
                className={actionableOnly ? "bg-green-600 hover:bg-green-700" : ""}
              >
                ⚡ Actionable Only ({stats?.actionableCount || 0})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStatusFilter('new'); setTierFilter('HOT'); setMinScore(30); }}
              >
                🔥 HOT & New
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStatusFilter('investigating'); setTierFilter('all'); }}
              >
                🔍 Investigating
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setAgeFilter('1'); setMinScore(0); }}
              >
                <Clock className="w-3 h-3 mr-1" /> Last 24h
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStatusFilter('all'); setTierFilter('all'); setAgeFilter('all'); setMinScore(0); setActionableOnly(false); }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Investigating</p>
            <p className="text-3xl font-bold text-purple-400">{stats?.byStatus?.investigating || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Being reviewed</p>
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
      {!loading && filteredLeads.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Reddit Leads ({filteredLeads.length})
                {filteredLeads.length > LEADS_PER_PAGE && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </CardTitle>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Prev
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {startIndex + 1}-{Math.min(startIndex + LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </div>
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
                    <th className="text-left p-3 font-medium">Date Added</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Feedback</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedLeads.map((lead) => {
                    const statusInfo = STATUS_OPTIONS.find(s => s.value === lead.status) || STATUS_OPTIONS[1];
                    const isUpdating = updatingStatus === lead.id;
                    const isFeedbackLoading = feedbackLoading === lead.id;
                    const isExpanded = expandedLead === lead.id;
                    const showingReason = showThumbsDownReason === lead.id;

                    return (
                      <>
                        <tr key={lead.id} className={`hover:bg-muted/30 transition-colors ${lead.isActionable ? 'border-l-4 border-l-green-500' : ''} ${lead.status === 'investigating' ? 'bg-purple-500/10' : ''} ${isExpanded ? 'bg-amber-500/10' : ''}`}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">u/{lead.author}</span>
                              {lead.isActionable && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/50">
                                  ⚡ ACTIONABLE
                                </span>
                              )}
                            </div>
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
                            <span className="text-xs text-muted-foreground" title={lead.discoveredAt}>
                              {lead.discoveredAt ? new Date(lead.discoveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                              disabled={isUpdating}
                              className={`px-2 py-1 text-xs rounded border bg-background ${isUpdating ? 'opacity-50' : ''}`}
                            >
                              {STATUS_OPTIONS.filter(s => s.value !== 'all').map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                              ))}
                            </select>
                          </td>
                          {/* Feedback Buttons */}
                          <td className="p-3">
                            <div className="flex items-center gap-1 relative">
                              {/* Thumbs Up */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => submitFeedback(lead.id, 'good')}
                                disabled={isFeedbackLoading}
                                className="h-7 w-7 p-0 hover:bg-green-500/20 hover:text-green-400"
                                title="Good lead"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </Button>
                              {/* Thumbs Down with reason dropdown */}
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowThumbsDownReason(showingReason ? null : lead.id)}
                                  disabled={isFeedbackLoading}
                                  className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400"
                                  title="Bad lead"
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                </Button>
                                {/* Reason dropdown */}
                                {showingReason && (
                                  <div className="absolute z-50 top-full left-0 mt-1 bg-background border rounded-md shadow-lg p-2 min-w-[180px]">
                                    <p className="text-xs text-muted-foreground mb-2">Why is this bad?</p>
                                    {THUMBS_DOWN_REASONS.map(reason => (
                                      <button
                                        key={reason.value}
                                        onClick={() => submitFeedback(lead.id, 'bad', { reason: reason.value })}
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-muted rounded"
                                      >
                                        {reason.label}
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => submitFeedback(lead.id, 'bad')}
                                      className="block w-full text-left px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded mt-1"
                                    >
                                      Skip reason
                                    </button>
                                  </div>
                                )}
                              </div>
                              {/* Expand/Settings */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                                disabled={isFeedbackLoading}
                                className="h-7 w-7 p-0 hover:bg-amber-500/20 hover:text-amber-400"
                                title="Adjust scoring"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {lead.status === 'new' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateLeadStatus(lead.id, 'investigating')}
                                  disabled={isUpdating}
                                  title="Mark as Investigating"
                                >
                                  <Search className="w-3 h-3" />
                                </Button>
                              )}
                              {lead.status === 'investigating' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateLeadStatus(lead.id, 'dm_sent')}
                                  disabled={isUpdating}
                                  title="Mark DM Sent"
                                >
                                  📩
                                </Button>
                              )}
                              <a
                                href={lead.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Feedback Editor */}
                        {isExpanded && (
                          <tr key={`${lead.id}-expanded`} className="bg-amber-500/5">
                            <td colSpan={10} className="p-4">
                              <div className="flex items-start gap-6">
                                {/* Keywords Section */}
                                <div className="flex-1">
                                  <p className="text-sm font-medium mb-2">Keywords Detected</p>
                                  <div className="flex flex-wrap gap-2">
                                    {lead.keywordsMatched?.map((kw, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs group"
                                      >
                                        {kw}
                                        <button
                                          onClick={() => submitFeedback(lead.id, 'neutral', { keywordsToRemove: [kw] })}
                                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                                          title="Remove this keyword signal"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                    {(!lead.keywordsMatched || lead.keywordsMatched.length === 0) && (
                                      <span className="text-xs text-muted-foreground">No keywords matched</span>
                                    )}
                                  </div>
                                </div>
                                {/* Intent Assessment */}
                                <div className="flex-1">
                                  <p className="text-sm font-medium mb-2">Your Assessment</p>
                                  <div className="space-y-2">
                                    {INTENT_OPTIONS.map(opt => (
                                      <button
                                        key={opt.value}
                                        onClick={() => submitFeedback(lead.id, opt.value === 'high' ? 'good' : 'bad', { correctedIntent: opt.value as 'high' | 'low' | 'none' })}
                                        className={`block w-full text-left px-3 py-2 rounded border hover:bg-muted transition-colors text-sm ${opt.color}`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {/* Score Breakdown */}
                                <div className="flex-1">
                                  <p className="text-sm font-medium mb-2">Score Breakdown</p>
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Keywords ({lead.keywordsMatched?.length || 0})</span>
                                      <span>+{Math.min((lead.keywordsMatched?.length || 0) * 5, 35)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Subreddit</span>
                                      <span>+{lead.subreddit === 'solar' ? 10 : 5}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Territory ({lead.state || 'Unknown'})</span>
                                      <span>+{lead.empowerTerritory ? 15 : 0}</span>
                                    </div>
                                    <div className="flex justify-between font-medium border-t pt-1 mt-1">
                                      <span>Total</span>
                                      <span>{lead.intentScore}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(startIndex + LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} leads
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Prev
                  </Button>
                  <span className="text-sm px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State - No leads at all */}
      {!loading && leads.length === 0 && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No leads found</h3>
            <p className="text-muted-foreground">LiveWire is scanning Reddit for solar leads.</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State - Filters returned no results */}
      {!loading && leads.length > 0 && filteredLeads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No leads match your filters</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filter criteria.</p>
            <Button
              variant="outline"
              onClick={() => { setStatusFilter('all'); setTierFilter('all'); setAgeFilter('all'); setMinScore(0); setActionableOnly(false); }}
            >
              Clear Filters
            </Button>
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
