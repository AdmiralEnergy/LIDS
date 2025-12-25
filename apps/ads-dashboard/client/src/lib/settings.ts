export interface AppSettings {
  backendHost: string;
  twentyCrmPort: string;
  twentyApiKey: string;
  twilioPort: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  transcriptionPort: string;
  n8nPort: string;
  calendlyApiKey: string;
  calendlyEventTypeUri: string;
  smsEnabled: boolean;
  smsPhoneNumber: string;
  smsPort: string;
  useNativePhone: boolean;
  emailEnabled: boolean;
  emailFrom: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  resendApiKey: string;
  emailFromName: string;
  emailFromAddress: string;
}

// Auto-detect if we're on an external domain (*.ripemerchant.host)
function isExternalAccess(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('.ripemerchant.host');
}

// Check if we're on the HELM dashboard (use proxy for services without tunnels)
function isHelmDashboard(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'helm.ripemerchant.host';
}

// Check if we're in development (localhost or port 3100)
function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.port === '3100' || window.location.hostname === 'localhost';
}

// Production API key (safe to embed - API is authenticated per-workspace)
// Updated Dec 25, 2025 - New key for droplet Twenty instance
const TWENTY_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8';

const DEFAULT_SETTINGS: AppSettings = {
  backendHost: "192.168.1.23",
  twentyCrmPort: "3001",
  twentyApiKey: TWENTY_API_KEY,
  twilioPort: "4115",
  twilioAccountSid: "",
  twilioAuthToken: "",
  transcriptionPort: "4130",
  n8nPort: "5678",
  calendlyApiKey: "",
  calendlyEventTypeUri: "",
  smsEnabled: true,
  smsPhoneNumber: "",
  smsPort: "4115",
  useNativePhone: false,
  emailEnabled: true,
  emailFrom: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  resendApiKey: "",
  emailFromName: "Admiral Energy",
  emailFromAddress: "",
};

const STORAGE_KEY = "ads_settings";

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
  // External HELM access uses Cloudflare tunnel URL (Twenty has its own tunnel)
  if (isExternalAccess()) {
    return 'https://twenty.ripemerchant.host';
  }
  // Use Express proxy in development
  if (isDevelopment()) {
    return '/twenty-api';
  }
  // Direct access for LAN
  const s = getSettings();
  return `http://${s.backendHost}:${s.twentyCrmPort}`;
}

export function getTwilioUrl(): string {
  // HELM production uses Express proxy (no dedicated tunnel for Twilio)
  if (isHelmDashboard() || isDevelopment()) {
    return '/twilio-api';
  }
  // Direct access for LAN
  const s = getSettings();
  return `http://${s.backendHost}:${s.twilioPort}`;
}

export function getTranscriptionWsUrl(): string {
  const s = getSettings();
  return `ws://${s.backendHost}:${s.transcriptionPort}/ws`;
}

export function getVoiceServiceUrl(): string {
  // HELM production uses Express proxy (no dedicated tunnel for Voice)
  if (isHelmDashboard() || isDevelopment()) {
    return '/voice-api';
  }
  // Direct access for LAN
  const s = getSettings();
  return `http://${s.backendHost}:${s.transcriptionPort}`;
}

export function getN8nUrl(): string {
  const s = getSettings();
  return `http://${s.backendHost}:${s.n8nPort}`;
}

export function getCalendlyApiUrl(): string {
  return "https://api.calendly.com";
}

export function getSmsUrl(): string {
  const s = getSettings();
  return `http://${s.backendHost}:${s.smsPort}`;
}

export function getEmailApiUrl(): string {
  const s = getSettings();
  return `http://${s.backendHost}:${s.n8nPort}/webhook/send-email`;
}
