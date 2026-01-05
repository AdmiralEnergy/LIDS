/**
 * LiveWire Intelligence Client
 *
 * TypeScript bridge to the Python intelligence core at port 5100.
 *
 * Provides:
 * - analyzePost(): Send post through AI pipeline
 * - sendFeedback(): Record approval/rejection for learning
 * - getStats(): Get feedback statistics
 */

// Types matching Python API responses

export interface ThinkingStep {
  agent: 'ProductSpecialist' | 'LeadScout' | 'TerritoryAnalyst' | 'DraftingAgent' | string;
  thought: string;
  status: 'complete' | 'processing' | 'rejected' | 'pending';
  data?: {
    // ProductSpecialist
    products?: string[];
    knowledgeBaseContext?: string;
    // LeadScout (IntentAnalyst)
    intentScore?: number;
    intentSignals?: string[];
    painPoints?: string[];
    urgency?: string;
    disqualifiers?: string[];
    // TerritoryAnalyst
    state?: string;
    stateName?: string;
    city?: string;
    eligible?: boolean;
    rebates?: string[];
    utilityPrograms?: string[];
    confidence?: number;
    // DraftingAgent
    draftMessage?: string;
    hooks?: string[];
    tone?: string;
    cta?: string;
    personalization?: string[];
    responseRate?: string;
  };
  timestamp?: string;
  analysis?: Record<string, unknown>;
}

export interface AnalysisResult {
  postId: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  intentScore: number;
  isLead: boolean;
  ncRelevant: boolean;
  thoughtTrace: ThinkingStep[];
  suggestedMessage: string | null;
  analysisTimeMs: number;
  createdAt: string;
  status: 'pending_review' | 'filtered' | 'approved' | 'rejected';
}

export interface FeedbackResult {
  status: 'recorded';
  feedbackId: string;
  action: 'approved' | 'rejected';
  reason?: string;
}

export interface FeedbackStats {
  total: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  topRejectionReasons: [string, number][];
}

export interface StatsResponse {
  status: string;
  stats: FeedbackStats;
  rejectionPatterns: Array<{
    reason: string;
    count: number;
    subreddits: string;
    avg_score: number;
  }>;
  successfulPatterns: Array<{
    post_subreddit: string;
    count: number;
    avg_score: number;
  }>;
}

export interface HealthResponse {
  status: string;
  service: string;
  port: number;
  pipeline: {
    ProductSpecialist: string;
    IntentAnalyst: string;
    TerritoryAnalyst: string;
    DraftingAgent: string;
  };
}

// Client configuration
interface LiveWireClientConfig {
  baseUrl?: string;
  timeout?: number;
}

/**
 * LiveWire Intelligence API Client
 */
export class LiveWireClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: LiveWireClientConfig = {}) {
    // Default to localhost:5100 for Python intelligence core
    // In production, this would be proxied through the command-dashboard server
    this.baseUrl = config.baseUrl || '/api/livewire';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Make a fetch request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  /**
   * Check if the intelligence service is healthy
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Analyze a Reddit post through the AI pipeline
   *
   * @param post - The post to analyze
   * @returns Full analysis with thinking trace and suggested message
   */
  async analyzePost(post: {
    title: string;
    content: string;
    subreddit: string;
    author?: string;
    postId?: string;
  }): Promise<AnalysisResult> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        subreddit: post.subreddit,
        author: post.author || 'unknown',
        post_id: post.postId || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `Analysis failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Send feedback on a lead analysis
   *
   * @param feedback - Approval or rejection with details
   * @returns Confirmation of recorded feedback
   */
  async sendFeedback(feedback: {
    postId: string;
    action: 'approved' | 'rejected';
    reason?: string;
    originalScore?: number;
    postTitle?: string;
    postContent?: string;
    postSubreddit?: string;
    draftMessage?: string;
    userEmail?: string;
  }): Promise<FeedbackResult> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: feedback.postId,
        action: feedback.action,
        reason: feedback.reason,
        original_score: feedback.originalScore || 0,
        post_title: feedback.postTitle || '',
        post_content: feedback.postContent || '',
        post_subreddit: feedback.postSubreddit || '',
        draft_message: feedback.draftMessage,
        user_email: feedback.userEmail || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `Feedback failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get feedback statistics
   */
  async getStats(): Promise<StatsResponse> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/stats`);
    if (!response.ok) {
      throw new Error(`Stats request failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get rejection patterns for learning insights
   */
  async getRejectionPatterns(): Promise<{
    patterns: Array<{ reason: string; count: number }>;
    fewShotExamples: Array<{
      post_title: string;
      post_content: string;
      post_subreddit: string;
      original_score: number;
      reason: string;
    }>;
  }> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/patterns/rejected`);
    if (!response.ok) {
      throw new Error(`Patterns request failed: ${response.status}`);
    }
    return response.json();
  }
}

// Singleton instance
let clientInstance: LiveWireClient | null = null;

/**
 * Get the LiveWire client singleton
 */
export function getLiveWireClient(config?: LiveWireClientConfig): LiveWireClient {
  if (!clientInstance) {
    clientInstance = new LiveWireClient(config);
  }
  return clientInstance;
}

// Convenience functions for direct use
export async function analyzePost(post: {
  title: string;
  content: string;
  subreddit: string;
  author?: string;
  postId?: string;
}): Promise<AnalysisResult> {
  return getLiveWireClient().analyzePost(post);
}

export async function sendFeedback(feedback: {
  postId: string;
  action: 'approved' | 'rejected';
  reason?: string;
  originalScore?: number;
  postTitle?: string;
  postContent?: string;
  postSubreddit?: string;
  draftMessage?: string;
  userEmail?: string;
}): Promise<FeedbackResult> {
  return getLiveWireClient().sendFeedback(feedback);
}

// ============================================
// Phase 3: Style Memory Types & Functions
// ============================================

export interface MessageStyle {
  id: string;
  category: string;
  opener: string;
  full_template: string;
  times_used: number;
  times_replied: number;
  times_converted: number;
  reply_rate?: number;
  conversion_rate?: number;
  last_used?: string;
}

export interface StyleInsights {
  best_performer: {
    category: string | null;
    opener: string | null;
    reply_rate: number;
  };
  best_by_category: Record<string, number>;
  avg_reply_time_hours: number | null;
  recommendation: string;
}

export interface StyleStats {
  [category: string]: {
    style_count: number;
    total_sent: number;
    total_replied: number;
    total_converted: number;
    avg_reply_rate: number;
  };
}

export interface ParsedLeadData {
  name: {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    confidence: string;
  } | null;
  phones: Array<{
    raw: string;
    formatted: string;
    digits_only: string;
    is_mobile: boolean;
    confidence: string;
  }>;
  emails: Array<{
    email: string;
    confidence: string;
  }>;
  address: {
    full_address: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    confidence: string;
  } | null;
  appointment: {
    preference_text: string;
    day_of_week: string | null;
    time_of_day: string | null;
    specific_time: string | null;
    confidence: string;
  } | null;
  extraction_method: string;
  has_contact_info: boolean;
}

/**
 * Get recommended message opener for a category
 */
export async function getRecommendedStyle(category: string): Promise<MessageStyle | null> {
  const client = getLiveWireClient();
  const response = await fetch(`${client['baseUrl']}/styles/recommend/${category}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.style || null;
}

/**
 * Get style learning insights
 */
export async function getStyleInsights(): Promise<StyleInsights> {
  const client = getLiveWireClient();
  const response = await fetch(`${client['baseUrl']}/styles/insights`);
  if (!response.ok) throw new Error('Failed to get style insights');
  const data = await response.json();
  return data.insights;
}

/**
 * Get style statistics by category
 */
export async function getStyleStats(): Promise<StyleStats> {
  const client = getLiveWireClient();
  const response = await fetch(`${client['baseUrl']}/styles/stats`);
  if (!response.ok) throw new Error('Failed to get style stats');
  const data = await response.json();
  return data.stats;
}

/**
 * Record that a message was sent
 */
export async function recordMessageSent(styleId: string, leadId: string): Promise<string> {
  const client = getLiveWireClient();
  const response = await fetch(`${client['baseUrl']}/styles/sent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ style_id: styleId, lead_id: leadId }),
  });
  if (!response.ok) throw new Error('Failed to record message sent');
  const data = await response.json();
  return data.message_id;
}

/**
 * Record that a reply was received
 */
export async function recordReplyReceived(
  messageId: string,
  replyContent?: string,
  converted: boolean = false
): Promise<void> {
  const client = getLiveWireClient();
  await fetch(`${client['baseUrl']}/styles/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message_id: messageId,
      reply_content: replyContent,
      converted,
    }),
  });
}

/**
 * Parse a reply to extract lead contact data
 */
export async function parseReply(text: string, useLlm: boolean = false): Promise<ParsedLeadData> {
  const client = getLiveWireClient();
  const response = await fetch(`${client['baseUrl']}/parse/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, use_llm: useLlm }),
  });
  if (!response.ok) throw new Error('Failed to parse reply');
  const data = await response.json();
  return data.data;
}
