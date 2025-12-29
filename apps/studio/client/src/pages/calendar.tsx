import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Image,
  FileText,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';

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
  contentType: string;
  status: string;
  scheduledDate?: string;
  caption?: string;
  script?: string;
  museNotes?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  idea: { bg: 'rgba(156, 163, 175, 0.3)', text: '#9CA3AF' },
  planned: { bg: 'rgba(59, 130, 246, 0.3)', text: '#3B82F6' },
  scripted: { bg: 'rgba(139, 92, 246, 0.3)', text: '#8B5CF6' },
  assets: { bg: 'rgba(236, 72, 153, 0.3)', text: '#EC4899' },
  editing: { bg: 'rgba(245, 158, 11, 0.3)', text: '#F59E0B' },
  review: { bg: 'rgba(14, 165, 233, 0.3)', text: '#0EA5E9' },
  scheduled: { bg: 'rgba(34, 197, 94, 0.3)', text: '#22C55E' },
  posted: { bg: 'rgba(34, 197, 94, 0.5)', text: '#16A34A' },
};

const platformIcons: Record<string, { icon: any; color: string }> = {
  tiktok: { icon: Video, color: '#FF0050' },
  linkedin_personal: { icon: FileText, color: '#0077B5' },
  linkedin_business: { icon: FileText, color: '#0077B5' },
  google: { icon: Image, color: '#4285F4' },
};

function ContentCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  const platform = platformIcons[item.platform] || { icon: FileText, color: theme.gold };
  const status = statusColors[item.status] || statusColors.idea;
  const Icon = platform.icon;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderColor: `${platform.color}33`,
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${platform.color}30` }}
        >
          <Icon className="w-4 h-4" style={{ color: platform.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{item.name || 'Untitled'}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0"
              style={{ background: status.bg, color: status.text }}
            >
              {item.status}
            </Badge>
            {item.contentType && (
              <span className="text-xs text-gray-400 capitalize">{item.contentType}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function CreateContentDialog({ date, onCreated }: { date?: Date; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    platform: 'tiktok',
    contentType: 'video',
    status: 'idea',
    scheduledDate: date ? format(date, "yyyy-MM-dd'T'HH:mm") : '',
    caption: '',
    museNotes: '',
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setLoading(true);

    try {
      await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setOpen(false);
      setForm({
        name: '',
        platform: 'tiktok',
        contentType: 'video',
        status: 'idea',
        scheduledDate: '',
        caption: '',
        museNotes: '',
      });
      onCreated();
    } catch (error) {
      console.error('Failed to create content:', error);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5"
          style={{
            background: `linear-gradient(135deg, ${theme.gold} 0%, ${theme.goldDark} 100%)`,
            color: '#000',
            border: 'none',
          }}
        >
          <Plus className="w-4 h-4" />
          Add Content
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md border"
        style={{
          background: 'linear-gradient(135deg, #1a1512 0%, #2d2319 100%)',
          borderColor: `${theme.gold}33`,
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: theme.gold }}>
            <Plus className="w-5 h-5" />
            New Content
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Input
            placeholder="Content title..."
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-black/40 border-white/10 text-white placeholder:text-gray-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Platform</label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin_personal">LinkedIn Personal</SelectItem>
                  <SelectItem value="linkedin_business">LinkedIn Business</SelectItem>
                  <SelectItem value="google">Google Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type</label>
              <Select value={form.contentType} onValueChange={(v) => setForm({ ...form, contentType: v })}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Scheduled For</label>
            <Input
              type="datetime-local"
              value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              className="bg-black/40 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Caption / Notes</label>
            <Textarea
              placeholder="What's this content about?"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              className="bg-black/40 border-white/10 text-white placeholder:text-gray-500"
              rows={2}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !form.name.trim()}
            className="w-full"
            style={{
              background: `linear-gradient(135deg, ${theme.gold} 0%, ${theme.goldDark} 100%)`,
              color: '#000',
              opacity: loading || !form.name.trim() ? 0.5 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Create Content'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ContentCalendar() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getContentForDay = (date: Date) => {
    return content.filter((item) => {
      if (!item.scheduledDate) return false;
      const itemDate = new Date(item.scheduledDate);
      return isSameDay(itemDate, date);
    });
  };

  const unscheduledContent = content.filter((item) => !item.scheduledDate);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1510 0%, #0d0a07 100%)' }}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: theme.gold }}>
              Content Calendar
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {format(currentWeekStart, 'MMMM d')} - {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
            </p>
          </div>
          <CreateContentDialog onCreated={fetchContent} />
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            className="bg-black/40 border-white/10 hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="bg-black/40 border-white/10 hover:bg-white/10 text-white"
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            className="bg-black/40 border-white/10 hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </Button>
        </div>

        {/* Week Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" style={{ color: theme.gold }} />
            <p className="text-gray-400 mt-3">Loading content...</p>
          </div>
        ) : (
          <>
            {/* Desktop: Horizontal week view */}
            <div className="hidden md:grid md:grid-cols-7 gap-3 mb-8">
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const dayContent = getContentForDay(day);

                return (
                  <Card
                    key={day.toISOString()}
                    className="border min-h-[300px]"
                    style={{
                      background: isToday ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                      borderColor: isToday ? `${theme.gold}50` : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-400 uppercase">{format(day, 'EEE')}</p>
                          <p
                            className="text-lg font-semibold"
                            style={{ color: isToday ? theme.gold : '#fff' }}
                          >
                            {format(day, 'd')}
                          </p>
                        </div>
                        {isToday && (
                          <Badge
                            className="text-xs"
                            style={{ background: `${theme.gold}30`, color: theme.gold }}
                          >
                            Today
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        {dayContent.map((item) => (
                          <ContentCard
                            key={item.id}
                            item={item}
                            onClick={() => setSelectedItem(item)}
                          />
                        ))}
                        {dayContent.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-4">No content</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Mobile: Vertical list */}
            <div className="md:hidden space-y-4 mb-8">
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const dayContent = getContentForDay(day);

                return (
                  <div key={day.toISOString()}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${isToday ? '' : ''}`}
                        style={{
                          background: isToday ? theme.gold : 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <p className="text-xs" style={{ color: isToday ? '#000' : '#9CA3AF' }}>
                          {format(day, 'EEE')}
                        </p>
                        <p className="text-sm font-semibold" style={{ color: isToday ? '#000' : '#fff' }}>
                          {format(day, 'd')}
                        </p>
                      </div>
                      <span className="flex-1 h-px bg-white/10" />
                    </div>

                    <div className="pl-12 space-y-2">
                      {dayContent.map((item) => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          onClick={() => setSelectedItem(item)}
                        />
                      ))}
                      {dayContent.length === 0 && (
                        <p className="text-xs text-gray-500 py-2">No content scheduled</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unscheduled Content */}
            {unscheduledContent.length > 0 && (
              <Card
                className="border"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" style={{ color: theme.gold }} />
                    <h3 className="font-medium" style={{ color: theme.gold }}>
                      Ideas & Unscheduled ({unscheduledContent.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {unscheduledContent.map((item) => (
                      <ContentCard
                        key={item.id}
                        item={item}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Selected Item Detail Dialog */}
        {selectedItem && (
          <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
            <DialogContent
              className="sm:max-w-md border"
              style={{
                background: 'linear-gradient(135deg, #1a1512 0%, #2d2319 100%)',
                borderColor: `${theme.gold}33`,
              }}
            >
              <DialogHeader>
                <DialogTitle style={{ color: theme.gold }}>{selectedItem.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Badge style={{ background: statusColors[selectedItem.status]?.bg, color: statusColors[selectedItem.status]?.text }}>
                    {selectedItem.status}
                  </Badge>
                  <Badge variant="outline" className="text-white border-white/20">
                    {selectedItem.platform?.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-white border-white/20">
                    {selectedItem.contentType}
                  </Badge>
                </div>

                {selectedItem.scheduledDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CalendarIcon className="w-4 h-4" />
                    {format(new Date(selectedItem.scheduledDate), 'PPP p')}
                  </div>
                )}

                {selectedItem.caption && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Caption</p>
                    <p className="text-sm text-white">{selectedItem.caption}</p>
                  </div>
                )}

                {selectedItem.museNotes && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" style={{ color: theme.gold }} />
                      MUSE Notes
                    </p>
                    <p className="text-sm text-white">{selectedItem.museNotes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
