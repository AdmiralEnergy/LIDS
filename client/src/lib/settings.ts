export interface AppSettings {
  backendHost: string;
  twentyCrmPort: string;
  twentyApiKey: string;
  twilioPort: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  transcriptionPort: string;
  n8nPort: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  backendHost: "192.168.1.23",
  twentyCrmPort: "3001",
  twentyApiKey: "",
  twilioPort: "4115",
  twilioAccountSid: "",
  twilioAuthToken: "",
  transcriptionPort: "4116",
  n8nPort: "5678",
};

const STORAGE_KEY = "lids_settings";

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getTwentyCrmUrl(): string {
  const s = getSettings();
  return `http://${s.backendHost}:${s.twentyCrmPort}`;
}

export function getTwilioUrl(): string {
  const s = getSettings();
  return `http://${s.backendHost}:${s.twilioPort}`;
}

export function getTranscriptionWsUrl(): string {
  const s = getSettings();
  return `ws://${s.backendHost}:${s.transcriptionPort}/ws`;
}

export function getN8nUrl(): string {
  const s = getSettings();
  return `http://${s.backendHost}:${s.n8nPort}`;
}
