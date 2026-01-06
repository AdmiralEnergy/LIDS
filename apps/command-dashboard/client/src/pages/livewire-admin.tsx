import { useState, useEffect } from "react";
import {
  BarChart3,
  RefreshCw,
  Ghost,
  CheckCircle2,
  XCircle,
  TrendingUp,
  MessageSquare,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { getSettings } from "@/lib/settings";

/**
 * LiveWire Admin Dashboard
 *
 * Phase 4: Learning Loop Administration
 *
 * Two-column layout:
 * - Left: Style Intelligence (A/B test results by category)
 * - Right: System Health & Feedback (recent overrides, rejection reasons)
 */

interface StyleStats {
  [category: string]: {
    style_count: number;
    total_sent: number;
    total_replied: number;
    total_converted: number;
    avg_reply_rate: number;
  };
}

interface FeedbackStats {
  total: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  topRejectionReasons: [string, number][];
}

interface FewShotExample {
  post_title: string;
  post_content: string;
  post_subreddit: string;
  original_score: number;
  reason: string | null;
  action: string;
}

export function LiveWireAdminPage() {
  const [styleStats, setStyleStats] = useState<StyleStats | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [recentOverrides, setRecentOverrides] = useState<FewShotExample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settings = getSettings();
  const intelUrl = settings.liveWireIntelUrl;

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch style stats
      const styleRes = await fetch(`${intelUrl}/styles/stats`);
      if (styleRes.ok) {
        const styleData = await styleRes.json();
        setStyleStats(styleData.stats || {});
      }

      // Fetch feedback stats
      const feedbackRes = await fetch(`${intelUrl}/stats`);
      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setFeedbackStats(feedbackData.stats || null);
      }

      // Fetch recent rejected examples (these are the "overrides")
      const rejectedRes = await fetch(`${intelUrl}/patterns/rejected`);
      if (rejectedRes.ok) {
        const rejectedData = await rejectedRes.json();
        setRecentOverrides(rejectedData.fewShotExamples || []);
      }
    } catch (err) {
      setError(`Failed to fetch data: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunCleanup = async () => {
    setIsRunningCleanup(true);
    setCleanupResult(null);

    try {
      const res = await fetch(`${intelUrl}/styles/mark_ghosted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days_threshold: 7 }),
      });

      if (res.ok) {
        const data = await res.json();
        setCleanupResult(data.message);
        // Refresh stats after cleanup
        await fetchData();
      } else {
        setCleanupResult("Cleanup failed - check server logs");
      }
    } catch (err) {
      setCleanupResult(`Error: ${err}`);
    } finally {
      setIsRunningCleanup(false);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00ffff]" />
          <p className="text-sm text-muted-foreground">Loading LiveWire Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#00ffff]" />
              LiveWire Admin
            </h1>
            <p className="text-sm text-muted-foreground">
              Learning Loop Intelligence & A/B Testing Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Style Intelligence */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00ffff]" />
            Style Intelligence (A/B Testing)
          </h2>

          {styleStats && Object.keys(styleStats).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Category</th>
                    <th className="text-right py-3 px-2 font-medium">Styles</th>
                    <th className="text-right py-3 px-2 font-medium">Sent</th>
                    <th className="text-right py-3 px-2 font-medium">Replied</th>
                    <th className="text-right py-3 px-2 font-medium">Rate %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(styleStats).map(([category, stats]) => (
                    <tr key={category} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2 font-medium capitalize">
                        {category.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {stats.style_count}
                      </td>
                      <td className="py-3 px-2 text-right">{stats.total_sent}</td>
                      <td className="py-3 px-2 text-right text-green-500">
                        {stats.total_replied}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            stats.avg_reply_rate >= 30
                              ? "bg-green-500/20 text-green-500"
                              : stats.avg_reply_rate >= 15
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {stats.avg_reply_rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No style data yet. Send some messages to start collecting stats.</p>
            </div>
          )}

          {/* Ghostbuster Button */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Ghost className="w-4 h-4" />
                  Ghostbuster Cleanup
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Mark messages older than 7 days as "No Reply"
                </p>
              </div>
              <button
                onClick={handleRunCleanup}
                disabled={isRunningCleanup}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRunningCleanup ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ghost className="w-4 h-4" />
                )}
                Run Cleanup
              </button>
            </div>
            {cleanupResult && (
              <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                {cleanupResult}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: System Health & Feedback */}
        <div className="space-y-6">
          {/* Feedback Overview */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#00ffff]" />
              Feedback Overview
            </h2>

            {feedbackStats ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold">{feedbackStats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Feedback</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-500">
                    {feedbackStats.approved}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Approved
                  </p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-500">
                    {feedbackStats.rejected}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3" /> Rejected
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No feedback data available
              </p>
            )}

            {feedbackStats && feedbackStats.approvalRate > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Approval Rate</span>
                  <span
                    className={`text-lg font-bold ${
                      feedbackStats.approvalRate >= 70
                        ? "text-green-500"
                        : feedbackStats.approvalRate >= 50
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {feedbackStats.approvalRate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      feedbackStats.approvalRate >= 70
                        ? "bg-green-500"
                        : feedbackStats.approvalRate >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${feedbackStats.approvalRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Top Rejection Reasons */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Top Rejection Reasons
            </h2>

            {feedbackStats?.topRejectionReasons?.length > 0 ? (
              <ul className="space-y-2">
                {feedbackStats.topRejectionReasons.map(([reason, count], idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <span className="text-sm">{reason}</span>
                    <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded font-medium">
                      {count}x
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No rejections recorded yet
              </p>
            )}
          </div>

          {/* Recent Overrides */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-500" />
              Recent Overrides (Few-Shot Examples)
            </h2>

            {recentOverrides.length > 0 ? (
              <ul className="space-y-3">
                {recentOverrides.slice(0, 5).map((override, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-muted/30 rounded-lg border-l-2 border-yellow-500"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {override.post_title || "Untitled"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          r/{override.post_subreddit} | Score: {override.original_score}
                        </p>
                      </div>
                      <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded whitespace-nowrap">
                        {override.reason || "Rejected"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No overrides yet. Reject some leads to train the AI.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
