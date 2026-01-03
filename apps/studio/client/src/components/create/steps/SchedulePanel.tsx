import { useState, useEffect } from 'react';
import { WizardState } from '@/pages/create';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Send, Clock, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

interface PostizIntegration {
  id: string;
  name: string;
  type: string;
  picture?: string;
  identifier?: string;
}

// Default platforms shown when Postiz is unavailable
const fallbackPlatforms = [
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: '#00f2ea' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', color: '#ff0000' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0077b5' },
];

// Map Postiz integration types to icons
const platformIcons: Record<string, string> = {
  tiktok: '🎵',
  youtube: '▶️',
  linkedin: '💼',
  x: '𝕏',
  twitter: '𝕏',
  instagram: '📸',
  facebook: '📘',
  threads: '🧵',
  pinterest: '📌',
  reddit: '🤖',
  bluesky: '🦋',
};

export function SchedulePanel({ state, updateState, onNext }: Props) {
  const [scheduling, setScheduling] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [integrations, setIntegrations] = useState<PostizIntegration[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [postizConnected, setPostizConnected] = useState(false);
  const [postizError, setPostizError] = useState<string | null>(null);

  // Fetch Postiz integrations on mount
  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoadingIntegrations(true);
    setPostizError(null);
    try {
      const response = await fetch('/api/postiz/integrations');
      if (response.ok) {
        const data = await response.json();
        const integrationList = data.integrations || data || [];
        setIntegrations(integrationList);
        setPostizConnected(true);
      } else {
        throw new Error('Failed to fetch integrations');
      }
    } catch (error) {
      console.warn('[Postiz] Using fallback platforms:', error);
      setPostizError('Postiz not connected - using demo mode');
      setPostizConnected(false);
    }
    setLoadingIntegrations(false);
  };

  // Build platform list from Postiz integrations or fallback
  const platforms = postizConnected && integrations.length > 0
    ? integrations.map(i => ({
        id: i.id,
        label: i.name || i.type,
        icon: platformIcons[i.type?.toLowerCase()] || '📱',
        color: '#D4AF37',
      }))
    : fallbackPlatforms;

  const togglePlatform = (platformId: string) => {
    updateState({
      platforms: state.platforms.includes(platformId)
        ? state.platforms.filter(p => p !== platformId)
        : [...state.platforms, platformId],
    });
  };

  const generateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const response = await fetch('/api/sarai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Write a social media caption for this ${state.contentType} video about solar energy.
          Script: "${state.script.slice(0, 200)}..."
          Include relevant hashtags.
          Keep it engaging and under 200 characters for the main text.`,
        }),
      });
      const data = await response.json();
      const caption = data.response || data.message || '';
      updateState({ caption });
    } catch {
      // Fallback caption
      updateState({
        caption: "☀️ Ready to cut your energy bills? Watch how solar can save you thousands!\n\n#SolarEnergy #AdmiralEnergy #SaveMoney #GreenEnergy #SolarPower",
      });
    }
    setGeneratingCaption(false);
  };

  const handleSchedule = async () => {
    setScheduling(true);
    try {
      // Try Postiz API
      const uploadRes = await fetch('/api/postiz/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: state.videoUrl }),
      });

      if (uploadRes.ok) {
        const { id: mediaId } = await uploadRes.json();

        for (const platform of state.platforms) {
          await fetch('/api/postiz/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform,
              mediaId,
              caption: state.caption,
              scheduledDate: scheduleType === 'later' ? state.scheduledDate?.toISOString() : undefined,
            }),
          });
        }
      }

      // Award XP
      await fetch('/api/progression/add-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'video_scheduled',
          xpAmount: 15,
          details: `Scheduled to ${state.platforms.join(', ')}`,
        }),
      }).catch(() => {}); // Ignore XP errors

      onNext();
    } catch (e) {
      console.error('Schedule error:', e);
      // Still proceed to success for demo
      onNext();
    }
    setScheduling(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl text-white font-medium">Schedule your post</h2>
        <p className="text-gray-400 text-sm mt-1">Choose where and when to publish</p>
      </div>

      {/* Platform Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-gray-400 text-sm">Platforms</label>
          <div className="flex items-center gap-2">
            {loadingIntegrations ? (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </span>
            ) : postizConnected ? (
              <span className="text-xs text-green-400 flex items-center gap-1">
                ● Postiz Connected
              </span>
            ) : (
              <button
                onClick={fetchIntegrations}
                className="text-xs text-yellow-400 flex items-center gap-1 hover:text-yellow-300"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        </div>
        {postizError && (
          <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-xs text-yellow-400">
            <AlertCircle className="w-3 h-3" />
            {postizError}
          </div>
        )}
        <div className="flex gap-3 flex-wrap">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                state.platforms.includes(p.id)
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                  : 'border-gray-700 bg-black/30 hover:border-gray-600'
              }`}
            >
              <span className="text-xl">{p.icon}</span>
              <span className="text-white">{p.label}</span>
              {state.platforms.includes(p.id) && (
                <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Caption */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-gray-400 text-sm">Caption</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateCaption}
            disabled={generatingCaption}
            className="text-[#E8B4BC] hover:bg-[#E8B4BC]/10 h-8"
          >
            {generatingCaption ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            Generate
          </Button>
        </div>
        <Textarea
          value={state.caption}
          onChange={(e) => updateState({ caption: e.target.value })}
          placeholder="Write your caption or click Generate..."
          className="min-h-[100px] bg-black/50 border-gray-700 text-white placeholder:text-gray-500"
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {state.caption.length} characters
        </div>
      </div>

      {/* Schedule Time */}
      <div>
        <label className="text-gray-400 text-sm mb-3 block">When to post</label>
        <div className="flex gap-3">
          <button
            onClick={() => setScheduleType('now')}
            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
              scheduleType === 'now'
                ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                : 'border-gray-700 bg-black/30 hover:border-gray-600'
            }`}
          >
            <Send className={`w-5 h-5 ${scheduleType === 'now' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
            <span className="text-white">Post Now</span>
          </button>
          <button
            onClick={() => setScheduleType('later')}
            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
              scheduleType === 'later'
                ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                : 'border-gray-700 bg-black/30 hover:border-gray-600'
            }`}
          >
            <Clock className={`w-5 h-5 ${scheduleType === 'later' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
            <span className="text-white">Schedule</span>
          </button>
        </div>

        {scheduleType === 'later' && (
          <div className="mt-3">
            <input
              type="datetime-local"
              className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-3"
              onChange={(e) => updateState({ scheduledDate: new Date(e.target.value) })}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Summary</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Platforms</span>
            <span className="text-white">
              {state.platforms.length > 0 ? state.platforms.map(p => {
                const platform = platforms.find(pl => pl.id === p);
                return platform?.icon;
              }).join(' ') : 'None selected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Timing</span>
            <span className="text-white">
              {scheduleType === 'now' ? 'Immediately' : state.scheduledDate?.toLocaleString() || 'Not set'}
            </span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSchedule}
        disabled={state.platforms.length === 0 || scheduling || (scheduleType === 'later' && !state.scheduledDate)}
        className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black font-medium h-12 text-base disabled:opacity-50"
      >
        {scheduling ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {scheduleType === 'now' ? 'Publishing...' : 'Scheduling...'}
          </>
        ) : (
          <>
            {scheduleType === 'now' ? <Send className="w-5 h-5 mr-2" /> : <Calendar className="w-5 h-5 mr-2" />}
            {scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'}
          </>
        )}
      </Button>
    </div>
  );
}
