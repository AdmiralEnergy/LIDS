import { useState, useEffect, useRef, useCallback } from "react";
import { getSettings, getTwilioUrl } from "../lib/settings";

export type DialerStatus = "idle" | "connecting" | "connected" | "error";

interface TwilioDevice {
  connect: (params: { params: Record<string, string> }) => Promise<TwilioCall>;
  register: () => Promise<void>;
  destroy: () => void;
}

interface TwilioCall {
  on: (event: string, handler: () => void) => void;
  disconnect: () => void;
  mute: (muted: boolean) => void;
  status: () => string;
}

export function useDialer() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<DialerStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false); // NO MOCK - must be configured

  const deviceRef = useRef<TwilioDevice | null>(null);
  const callRef = useRef<TwilioCall | null>(null);
  const connectionTimeoutRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === "connected") {
      durationIntervalRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [status]);

  useEffect(() => {
    const settings = getSettings();

    // Check if Twilio service URL is configured (credentials are server-side)
    if (!settings.twilioPort || !settings.backendHost) {
      setConfigured(false);
      setError("Twilio service not configured. Check Settings.");
      return;
    }

    async function initTwilio() {
      try {
        const tokenUrl = `${getTwilioUrl()}/token`;
        // Token endpoint is POST, not GET
        const response = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identity: "helm-dialer" }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to get Twilio token: ${errorText}`);
        }

        const { token } = await response.json();

        // Dynamic import of Twilio Voice SDK
        const { Device } = await import("@twilio/voice-sdk");
        const device = new Device(token, {
          codecPreferences: ["opus", "pcmu"],
        } as any);

        await device.register();
        deviceRef.current = device as unknown as TwilioDevice;
        setConfigured(true);
        setError(null);
        console.log("Twilio Voice SDK initialized successfully");
      } catch (e) {
        console.error("Twilio init failed:", e);
        setConfigured(false);
        setError("Twilio connection failed. Check your credentials and try again.");
      }
    }

    initTwilio();

    return () => {
      deviceRef.current?.destroy();
      deviceRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    };
  }, []);

  const dial = useCallback(async () => {
    if (!phoneNumber) return;

    // NO MOCK - must be configured to dial
    if (!configured || !deviceRef.current) {
      setStatus("error");
      setError("Twilio not configured. Go to Settings to configure your dialer.");
      return;
    }

    setError(null);
    setStatus("connecting");

    try {
      const call = await deviceRef.current.connect({
        params: { To: phoneNumber },
      });
      callRef.current = call;

      call.on("accept", () => setStatus("connected"));
      call.on("disconnect", () => {
        setStatus("idle");
        setDuration(0);
        callRef.current = null;
      });
      call.on("error", () => {
        setStatus("error");
        setError("Call failed");
        callRef.current = null;
      });
    } catch (e) {
      setStatus("error");
      setError("Failed to connect call");
    }
  }, [phoneNumber, configured]);

  const hangup = useCallback(() => {
    if (callRef.current) {
      callRef.current.disconnect();
      callRef.current = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setStatus("idle");
    setDuration(0);
    setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);

    if (callRef.current) {
      callRef.current.mute(newMuted);
    }
  }, [muted]);

  const appendDigit = useCallback((digit: string) => setPhoneNumber((prev) => prev + digit), []);
  const backspaceDigit = useCallback(() => setPhoneNumber((prev) => prev.slice(0, -1)), []);
  const clearNumber = useCallback(() => setPhoneNumber(""), []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    phoneNumber,
    setPhoneNumber,
    status,
    duration,
    formattedDuration: formatDuration(duration),
    muted,
    error,
    configured, // NO MOCK - shows real configuration state
    dial,
    hangup,
    toggleMute,
    appendDigit,
    backspaceDigit,
    clearNumber,
  };
}
