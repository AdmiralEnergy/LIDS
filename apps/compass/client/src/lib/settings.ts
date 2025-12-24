const STORAGE_KEY = 'compass_settings';

export interface CompassSettings {
  backendHost: string;
  agentPort: number;
  offlineMode: boolean;
  demoMode: boolean;
}

const DEFAULT_SETTINGS: CompassSettings = {
  backendHost: '192.168.1.23',
  agentPort: 4100,
  offlineMode: true,
  demoMode: true,
};

export function getSettings(): CompassSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (e) {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<CompassSettings>): void {
  const current = getSettings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
}

export function isOfflineMode(): boolean {
  return getSettings().offlineMode || !navigator.onLine;
}

export function isDemoMode(): boolean {
  return getSettings().demoMode;
}
