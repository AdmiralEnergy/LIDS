/**
 * LiveWire Settings Page
 *
 * Configurable settings for MCP Reddit Scanner.
 * Changes persist to LiveWire backend.
 */

import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  ArrowLeft,
  Save,
  RefreshCw,
  Zap,
  Mail,
  MessageSquare,
  Send,
  LayoutDashboard,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";

const LIVEWIRE_API = '/api/livewire';

interface DeliveryChannel {
  enabled: boolean;
  recipients?: string[];
  channel?: string;
  targets?: string[];
}

interface LiveWireSettings {
  subreddits: string[];
  scannerMode: 'auto' | 'manual' | 'scheduled';
  postsPerSubreddit: number;
  scanIntervalMinutes: number;
  minIntentScore: number;
  autoStartMonitor: boolean;
  deliveryChannels: {
    email: DeliveryChannel;
    slack: DeliveryChannel;
    telegram: DeliveryChannel;
    dashboard: DeliveryChannel;
  };
  notifyOnLeads: boolean;
  notifyOnEmpty: boolean;
  notifyHighPriorityOnly: boolean;
}

const defaultSettings: LiveWireSettings = {
  subreddits: ['solar', 'SolarDIY', 'electricvehicles'],
  scannerMode: 'auto',
  postsPerSubreddit: 50,
  scanIntervalMinutes: 30,
  minIntentScore: 11,
  autoStartMonitor: true,
  deliveryChannels: {
    email: { enabled: false, recipients: [] },
    slack: { enabled: false, channel: '' },
    telegram: { enabled: true, targets: ['david'] },
    dashboard: { enabled: true },
  },
  notifyOnLeads: true,
  notifyOnEmpty: false,
  notifyHighPriorityOnly: false,
};

export default function LiveWireSettingsPage() {
  const [settings, setSettings] = useState<LiveWireSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSubreddit, setNewSubreddit] = useState('');
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${LIVEWIRE_API}/settings`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      // API returns { success: true, settings: {...} }
      const settingsData = data.settings || data;
      setSettings({ ...defaultSettings, ...settingsData });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      toast({
        title: "Failed to load settings",
        description: "Using default values",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${LIVEWIRE_API}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      toast({
        title: "Settings saved",
        description: "LiveWire configuration updated successfully",
      });
    } catch (err) {
      toast({
        title: "Failed to save settings",
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const addSubreddit = () => {
    if (newSubreddit && !settings.subreddits.includes(newSubreddit)) {
      setSettings({
        ...settings,
        subreddits: [...settings.subreddits, newSubreddit.replace(/^r\//, '')],
      });
      setNewSubreddit('');
    }
  };

  const removeSubreddit = (sub: string) => {
    setSettings({
      ...settings,
      subreddits: settings.subreddits.filter(s => s !== sub),
    });
  };

  const updateChannel = (channel: keyof typeof settings.deliveryChannels, updates: Partial<DeliveryChannel>) => {
    setSettings({
      ...settings,
      deliveryChannels: {
        ...settings.deliveryChannels,
        [channel]: { ...settings.deliveryChannels[channel], ...updates },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/livewire">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 text-amber-400" />
              LiveWire Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure Reddit scanning and notifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchSettings} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-pulse' : ''}`} />
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subreddits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Subreddits to Monitor
            </CardTitle>
            <CardDescription>
              Reddit communities to scan for solar leads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter subreddit name..."
                value={newSubreddit}
                onChange={(e) => setNewSubreddit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubreddit()}
              />
              <Button onClick={addSubreddit} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.subreddits.map((sub) => (
                <Badge
                  key={sub}
                  variant="secondary"
                  className="pl-3 pr-1 py-1 flex items-center gap-1"
                >
                  r/{sub}
                  <button
                    onClick={() => removeSubreddit(sub)}
                    className="ml-1 hover:bg-muted rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scanner Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Scanner Configuration
            </CardTitle>
            <CardDescription>
              Control how LiveWire scans Reddit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Scanner Mode</Label>
              <div className="flex gap-2">
                {(['auto', 'manual', 'scheduled'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={settings.scannerMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings({ ...settings, scannerMode: mode })}
                    className="capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Posts per Subreddit</Label>
                <span className="text-sm text-muted-foreground">{settings.postsPerSubreddit}</span>
              </div>
              <Slider
                value={[settings.postsPerSubreddit]}
                onValueChange={([v]) => setSettings({ ...settings, postsPerSubreddit: v })}
                min={10}
                max={100}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Scan Interval (minutes)</Label>
                <span className="text-sm text-muted-foreground">{settings.scanIntervalMinutes} min</span>
              </div>
              <Slider
                value={[settings.scanIntervalMinutes]}
                onValueChange={([v]) => setSettings({ ...settings, scanIntervalMinutes: v })}
                min={5}
                max={120}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Minimum Intent Score</Label>
                <span className="text-sm text-muted-foreground">{settings.minIntentScore}</span>
              </div>
              <Slider
                value={[settings.minIntentScore]}
                onValueChange={([v]) => setSettings({ ...settings, minIntentScore: v })}
                min={0}
                max={50}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Leads below this score will be ignored
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-start Monitor</Label>
                <p className="text-xs text-muted-foreground">
                  Start scanning on service startup
                </p>
              </div>
              <Switch
                checked={settings.autoStartMonitor}
                onCheckedChange={(v) => setSettings({ ...settings, autoStartMonitor: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-400" />
              Delivery Channels
            </CardTitle>
            <CardDescription>
              How LiveWire contacts you about new leads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Email</Label>
                  <p className="text-xs text-muted-foreground">Send lead summaries via email</p>
                </div>
              </div>
              <Switch
                checked={settings.deliveryChannels.email.enabled}
                onCheckedChange={(v) => updateChannel('email', { enabled: v })}
              />
            </div>

            {/* Slack */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Slack</Label>
                  <p className="text-xs text-muted-foreground">Post to Slack channel</p>
                </div>
              </div>
              <Switch
                checked={settings.deliveryChannels.slack.enabled}
                onCheckedChange={(v) => updateChannel('slack', { enabled: v })}
              />
            </div>

            {/* Telegram */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Telegram</Label>
                  <p className="text-xs text-muted-foreground">Push notifications via Telegram</p>
                </div>
              </div>
              <Switch
                checked={settings.deliveryChannels.telegram.enabled}
                onCheckedChange={(v) => updateChannel('telegram', { enabled: v })}
              />
            </div>

            {/* Dashboard */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Dashboard</Label>
                  <p className="text-xs text-muted-foreground">Show in LiveWire dashboard</p>
                </div>
              </div>
              <Switch
                checked={settings.deliveryChannels.dashboard.enabled}
                onCheckedChange={(v) => updateChannel('dashboard', { enabled: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-400" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              When to send notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Notify on New Leads</Label>
                <p className="text-xs text-muted-foreground">Get notified when new leads are found</p>
              </div>
              <Switch
                checked={settings.notifyOnLeads}
                onCheckedChange={(v) => setSettings({ ...settings, notifyOnLeads: v })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Notify on Empty Scans</Label>
                <p className="text-xs text-muted-foreground">Get notified even when no leads found</p>
              </div>
              <Switch
                checked={settings.notifyOnEmpty}
                onCheckedChange={(v) => setSettings({ ...settings, notifyOnEmpty: v })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>High Priority Only</Label>
                <p className="text-xs text-muted-foreground">Only notify for HOT leads</p>
              </div>
              <Switch
                checked={settings.notifyHighPriorityOnly}
                onCheckedChange={(v) => setSettings({ ...settings, notifyHighPriorityOnly: v })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          <Save className={`w-5 h-5 mr-2 ${saving ? 'animate-pulse' : ''}`} />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
