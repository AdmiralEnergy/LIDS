import Dexie, { Table } from 'dexie';

/**
 * Studio Content Database
 *
 * ARCHITECTURE:
 * - Twenty CRM is the SINGLE SOURCE OF TRUTH (persistent)
 * - Dexie (IndexedDB) is a LOCAL CACHE for offline support
 * - All writes go to Twenty CRM first, then update local cache
 * - On app load, sync from Twenty to local
 *
 * Twenty Custom Objects needed:
 * - studioContentItems: Content pieces to create/post
 * - studioWeeklyPlans: MUSE's weekly suggestions
 * - marketingProgressions: Leigh's XP/ranks (separate from rep progressions)
 */

// Content item represents a piece of content to be created and posted
export interface ContentItem {
  id: string;
  title: string;
  platform: 'tiktok' | 'linkedin_personal' | 'linkedin_business' | 'google';
  contentType: 'video' | 'image' | 'text' | 'carousel';
  status: 'idea' | 'planned' | 'scripted' | 'assets' | 'editing' | 'review' | 'scheduled' | 'posted';

  // Scheduling
  scheduledDate?: Date;
  postedDate?: Date;
  bufferPostId?: string;

  // Content
  script?: string;
  caption?: string;
  hashtags?: string[];
  assets?: ContentAsset[];

  // MUSE context
  museNotes?: string;          // Why this content fits the strategy
  marketingPlanRef?: string;   // Reference to section of marketing plan

  // Workflow tracking
  workflowStep?: number;       // Current step in TikTok workflow (1-8)
  assignedTo?: string;         // 'leigh' | 'sarai' | 'muse'

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;           // user email
}

export interface ContentAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  url?: string;
  localPath?: string;
  source: 'comfyui' | 'openart' | 'canva' | 'upload' | 'stock';
  status: 'pending' | 'generating' | 'ready' | 'failed';
  prompt?: string;             // AI generation prompt
  createdAt: Date;
}

// Weekly content plan from MUSE
export interface WeeklyPlan {
  id: string;
  weekStart: Date;             // Monday of the week
  weekEnd: Date;               // Sunday of the week

  // MUSE suggestions
  suggestions: ContentSuggestion[];

  // Metrics
  plannedCount: number;
  completedCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface ContentSuggestion {
  id: string;
  platform: 'tiktok' | 'linkedin_personal' | 'linkedin_business' | 'google';
  topic: string;
  description: string;
  museReasoning: string;       // Why MUSE suggests this
  priority: 'high' | 'medium' | 'low';
  suggestedDate?: Date;
  accepted: boolean;           // Has Leigh accepted this suggestion?
  contentItemId?: string;      // If accepted, links to created ContentItem
}

// Marketing progression for Leigh
export interface MarketingProgression {
  id: string;
  email: string;
  name: string;

  // XP & Level
  totalXp: number;
  currentLevel: number;

  // Rank
  rank: string;                // content-creator-1 through marketing-lead

  // Badges
  badges: string[];

  // Streaks
  streakDays: number;
  lastActivityDate: Date;
  longestStreak: number;

  // Stats
  postsPublished: number;
  videosCreated: number;
  totalEngagement: number;     // likes + comments + shares
  coursesCompleted: string[];  // Canva course IDs

  // Titles
  titles: string[];
  activeTitle?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingXPEvent {
  id?: number;
  eventType: string;
  xpAmount: number;
  details?: string;
  contentItemId?: string;      // Link to content if applicable
  createdAt: Date;
}

export interface DailyMarketingMetrics {
  id?: number;
  date: string;                // YYYY-MM-DD
  postsCreated: number;
  postsScheduled: number;
  postsPublished: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  tiktokViews: number;
  tiktokShopSales: number;
}

class ContentDatabase extends Dexie {
  contentItems!: Table<ContentItem>;
  weeklyPlans!: Table<WeeklyPlan>;
  progression!: Table<MarketingProgression>;
  xpEvents!: Table<MarketingXPEvent>;
  dailyMetrics!: Table<DailyMarketingMetrics>;

  constructor() {
    super('StudioContentDB');

    this.version(1).stores({
      contentItems: 'id, platform, status, scheduledDate, createdAt, createdBy',
      weeklyPlans: 'id, weekStart',
      progression: 'id, email',
      xpEvents: '++id, eventType, createdAt',
      dailyMetrics: '++id, date',
    });
  }
}

export const contentDb = new ContentDatabase();

// Helper functions
export async function getContentByStatus(status: ContentItem['status']): Promise<ContentItem[]> {
  return contentDb.contentItems.where('status').equals(status).toArray();
}

export async function getContentForWeek(weekStart: Date): Promise<ContentItem[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return contentDb.contentItems
    .where('scheduledDate')
    .between(weekStart, weekEnd)
    .toArray();
}

export async function getContentByPlatform(platform: ContentItem['platform']): Promise<ContentItem[]> {
  return contentDb.contentItems.where('platform').equals(platform).toArray();
}

export async function createContentItem(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();

  await contentDb.contentItems.add({
    ...item,
    id,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function updateContentItem(id: string, updates: Partial<ContentItem>): Promise<void> {
  await contentDb.contentItems.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function updateContentStatus(id: string, status: ContentItem['status']): Promise<void> {
  await updateContentItem(id, { status });
}

// Progression helpers
export async function getProgression(email: string): Promise<MarketingProgression | undefined> {
  return contentDb.progression.where('email').equals(email).first();
}

export async function initializeProgression(email: string, name: string): Promise<MarketingProgression> {
  const existing = await getProgression(email);
  if (existing) return existing;

  const progression: MarketingProgression = {
    id: crypto.randomUUID(),
    email,
    name,
    totalXp: 0,
    currentLevel: 1,
    rank: 'content-creator-1',
    badges: [],
    streakDays: 0,
    lastActivityDate: new Date(),
    longestStreak: 0,
    postsPublished: 0,
    videosCreated: 0,
    totalEngagement: 0,
    coursesCompleted: [],
    titles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await contentDb.progression.add(progression);
  return progression;
}

export async function addMarketingXP(
  email: string,
  eventType: string,
  xpAmount: number,
  details?: string,
  contentItemId?: string
): Promise<void> {
  // Record XP event
  await contentDb.xpEvents.add({
    eventType,
    xpAmount,
    details,
    contentItemId,
    createdAt: new Date(),
  });

  // Update progression
  const progression = await getProgression(email);
  if (progression) {
    const newXp = progression.totalXp + xpAmount;
    const newLevel = calculateLevel(newXp);

    await contentDb.progression.update(progression.id, {
      totalXp: newXp,
      currentLevel: newLevel,
      updatedAt: new Date(),
    });
  }
}

// Level calculation (same curve as ADS)
export function calculateLevel(totalXp: number): number {
  const thresholds = [
    0, 100, 250, 500, 850, 1300, 1900, 2700, 3800, 5200,
    7000, 9200, 12000, 15500, 20000, 25000, 30000, 36000, 43000, 51000,
    60000, 70000, 82000, 96000, 112000
  ];

  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalXp >= thresholds[i]) {
      return i + 1;
    }
  }
  return 1;
}
