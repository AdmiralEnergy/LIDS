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
  const externalDomain = import.meta.env.VITE_EXTERNAL_DOMAIN || 'ripemerchant.host';
  return window.location.hostname.endsWith(`.${externalDomain}`);
}

// Check if we're on the HELM dashboard (use proxy for services without tunnels)
function isHelmDashboard(): boolean {
  if (typeof window === 'undefined') return false;
  const externalDomain = import.meta.env.VITE_EXTERNAL_DOMAIN || 'ripemerchant.host';
  return window.location.hostname === `helm.${externalDomain}`;
}

// Check if we're in development (localhost or port 3100)
function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.port === '3100' || window.location.hostname === 'localhost';
}

// API key fetched from server - never embedded in client
function getTwentyApiKey(): string {
  const envKey = import.meta.env.VITE_TWENTY_API_KEY;
  if (!envKey) {
    console.warn('VITE_TWENTY_API_KEY not set - Twenty CRM features disabled');
    return '';
  }
  return envKey;
}

const DEFAULT_SETTINGS: AppSettings = {
  backendHost: import.meta.env.VITE_BACKEND_HOST || "",
  twentyCrmPort: "3001",
  twentyApiKey: getTwentyApiKey(),
  twilioPort: "4115",
  twilioAccountSid: "",
  twilioAuthToken: "",
  transcriptionPort: "4130",
  n8nPort: "5678",
  calendlyApiKey: "",
  calendlyEventTypeUri: "",
  smsEnabled: true,
  smsPhoneNumber: "+18333856399", // Toll-free number - ready for SMS (no A2P required)
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

function getStoredSettings(): Partial<AppSettings> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return {};
}

export function getSettings(): AppSettings {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...getStoredSettings(),
  };

  if (!settings.backendHost && !isExternalAccess()) {
    console.error('VITE_BACKEND_HOST not configured. Set in .env file.');
  }

  return settings;
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

export function getTranscriptionServiceUrl(): string {
  // Transcription service runs on port 4097
  const s = getSettings();
  return `http://${s.backendHost}:4097`;
}

export function getN8nUrl(): string {
  const s = getSettings();
  return `http://${s.backendHost}:${s.n8nPort}`;
}

export function getCalendlyApiUrl(): string {
  return "https://api.calendly.com";
}

export function getSmsUrl(): string {
  // SMS uses the same Twilio service (port 4115)
  // Production and development use the Express proxy
  if (isExternalAccess() || isDevelopment()) {
    return '/twilio-api';
  }
  // Direct access for LAN
  const s = getSettings();
  return `http://${s.backendHost}:${s.smsPort}`;
}

export function getEmailApiUrl(): string {
  const s = getSettings();
  return `http://${s.backendHost}:${s.n8nPort}/webhook/send-email`;
}
