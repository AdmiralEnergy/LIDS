import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  MessageSquare,
  TrendingUp,
  Video,
  FileText,
  Star,
  Flame,
  ChevronRight,
  Sparkles,
  Linkedin,
  Store,
} from 'lucide-react';
import { useUser } from '@/lib/user-context';

const theme = {
  gold: '#D4AF37',
  goldLight: '#F5E6A3',
  goldDark: '#B8962F',
  rosePink: '#E8B4BC',
  roseDark: '#C4959D',
};

interface ContentItem {
  id: string;
  name: string;
  platform: string;
  status: string;
  scheduledDate?: string;
}

interface Progression {
  totalXp: number;
  currentLevel: number;
  rank: string;
  streakDays: number;
  postsPublished: number;
  videosCreated: number;
}

const rankNames: Record<string, string> = {
  'content-creator-1': 'Content Creator I',
  'content-creator-2': 'Content Creator II',
  'content-creator-3': 'Content Creator III',
  'growth-specialist': 'Growth Specialist',
  'campaign-manager': 'Campaign Manager',
  'marketing-lead': 'Marketing Lead',
};

const levelThresholds = [
  0, 100, 250, 500, 850, 1300, 1900, 2700, 3800, 5200,
  7000, 9200, 12000, 15500, 20000, 25000, 30000, 36000, 43000, 51000,
  60000, 70000, 82000, 96000, 112000
];

function QuickStatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card
      className="border"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderColor: `${color}33`,
      }}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressionCard({ progression }: { progression: Progression }) {
  const currentThreshold = levelThresholds[progression.currentLevel - 1] || 0;
  const nextThreshold = levelThresholds[progression.currentLevel] || levelThresholds[24];
  const progressInLevel = progression.totalXp - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, (progressInLevel / levelRange) * 100);

  return (
    <Card
      className="border"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderColor: `${theme.gold}33`,
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${theme.gold} 0%, ${theme.goldDark} 100%)`,
                boxShadow: `0 0 20px ${theme.gold}40`,
              }}
            >
              <Star className="w-6 h-6 text-black" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Level {progression.currentLevel}</p>
              <p className="font-semibold text-white">
                {rankNames[progression.rank] || progression.rank}
              </p>
            </div>
          </div>

          {progression.streakDays > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">{progression.streakDays} day streak</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">{progression.totalXp.toLocaleString()} XP</span>
            <span style={{ color: theme.gold }}>{nextThreshold.toLocaleString()} XP</span>
          </div>
          <Progress
            value={progressPercent}
            className="h-2"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: theme.gold }}>{progression.postsPublished}</p>
            <p className="text-xs text-gray-400">Posts Published</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: theme.rosePink }}>{progression.videosCreated}</p>
            <p className="text-xs text-gray-400">Videos Created</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingContent({ items }: { items: ContentItem[] }) {
  const platformIcons: Record<string, any> = {
    tiktok: Video,
    linkedin_personal: FileText,
    linkedin_business: FileText,
    google: Store,
  };

  const platformColors: Record<string, string> = {
    tiktok: '#FF0050',
    linkedin_personal: '#0077B5',
    linkedin_business: '#0077B5',
    google: '#4285F4',
  };

  return (
    <Card
      className="border"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: theme.gold }} />
            Upcoming Content
          </h3>
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <p className="text-sm text-gray-400">No upcoming content scheduled</p>
            <Link href="/calendar">
              <Button
                size="sm"
                className="mt-3"
                style={{
                  background: `linear-gradient(135deg, ${theme.gold} 0%, ${theme.goldDark} 100%)`,
                  color: '#000',
                }}
              >
                Add Content
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => {
              const Icon = platformIcons[item.platform] || FileText;
              const color = platformColors[item.platform] || theme.gold;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: `${color}30` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.name || 'Untitled'}</p>
                    {item.scheduledDate && (
                      <p className="text-xs text-gray-400">
                        {new Date(item.scheduledDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#9CA3AF' }}
                  >
                    {item.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { currentUser } = useUser();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [progression, setProgression] = useState<Progression>({
    totalXp: 0,
    currentLevel: 1,
    rank: 'content-creator-1',
    streakDays: 0,
    postsPublished: 0,
    videosCreated: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch content
        const contentRes = await fetch('/api/content');
        if (contentRes.ok) {
          const data = await contentRes.json();
          setContent(data);
        }

        // Fetch progression
        if (currentUser?.email) {
          const progRes = await fetch(`/api/progression?email=${encodeURIComponent(currentUser.email)}`);
          if (progRes.ok) {
            const data = await progRes.json();
            setProgression(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [currentUser?.email]);

  // Filter scheduled content for the next 7 days
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingContent = content
    .filter((item) => {
      if (!item.scheduledDate) return false;
      const date = new Date(item.scheduledDate);
      return date >= now && date <= weekFromNow;
    })
    .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());

  const totalIdeas = content.filter((c) => c.status === 'idea').length;
  const inProgress = content.filter((c) => ['planned', 'scripted', 'assets', 'editing', 'review'].includes(c.status)).length;
  const scheduled = content.filter((c) => c.status === 'scheduled').length;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a1510 0%, #0d0a07 100%)' }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" style={{ color: theme.gold }} />
          <p className="text-gray-400 mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1510 0%, #0d0a07 100%)' }}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-400">
              Welcome back, {currentUser?.name?.split(' ')[0] || 'there'}
            </p>
            <h1 className="text-2xl font-semibold text-white">
              Marketing Dashboard
            </h1>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <QuickStatCard icon={Sparkles} label="Ideas" value={totalIdeas} color={theme.gold} />
          <QuickStatCard icon={TrendingUp} label="In Progress" value={inProgress} color={theme.rosePink} />
          <QuickStatCard icon={Calendar} label="Scheduled" value={scheduled} color="#22C55E" />
          <QuickStatCard icon={Video} label="This Week" value={upcomingContent.length} color="#3B82F6" />
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Progression */}
          <ProgressionCard progression={progression} />

          {/* Upcoming Content */}
          <UpcomingContent items={upcomingContent} />
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/calendar">
            <Button
              className="w-full gap-2 h-auto py-4 flex-col"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${theme.gold}33`,
              }}
            >
              <Calendar className="w-6 h-6" style={{ color: theme.gold }} />
              <span className="text-sm text-white">Calendar</span>
            </Button>
          </Link>

          <Link href="/chat">
            <Button
              className="w-full gap-2 h-auto py-4 flex-col"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${theme.rosePink}33`,
              }}
            >
              <MessageSquare className="w-6 h-6" style={{ color: theme.rosePink }} />
              <span className="text-sm text-white">AI Agents</span>
            </Button>
          </Link>

          <a href="https://www.tiktok.com/@admiralenergyco" target="_blank" rel="noopener noreferrer" className="block">
            <Button
              className="w-full gap-2 h-auto py-4 flex-col"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 0, 80, 0.3)',
              }}
            >
              <Video className="w-6 h-6" style={{ color: '#FF0050' }} />
              <span className="text-sm text-white">TikTok</span>
            </Button>
          </a>

          <a href="https://www.linkedin.com/company/admiral-energy-llc/admin/page-posts/published/" target="_blank" rel="noopener noreferrer" className="block">
            <Button
              className="w-full gap-2 h-auto py-4 flex-col"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(0, 119, 181, 0.3)',
              }}
            >
              <Linkedin className="w-6 h-6" style={{ color: '#0077B5' }} />
              <span className="text-sm text-white">LinkedIn</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
