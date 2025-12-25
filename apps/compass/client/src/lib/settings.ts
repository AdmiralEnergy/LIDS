const STORAGE_KEY = 'compass_settings';

export interface CompassSettings {
  backendHost: string;
  agentPort: number;
  offlineMode: boolean;
  demoMode: boolean;
}

const DEFAULT_SETTINGS: CompassSettings = {
  backendHost: import.meta.env.VITE_BACKEND_HOST || '',
  agentPort: 4098,  // COMPASS micro-agents server
  offlineMode: false,  // Connect to real agents by default
  demoMode: false,     // Use real COMPASS agents by default
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
