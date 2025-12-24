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
  const [usingMock, setUsingMock] = useState(true);

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

    if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
      setUsingMock(true);
      return;
    }

    async function initTwilio() {
      try {
        const tokenUrl = `${getTwilioUrl()}/token`;
        const response = await fetch(tokenUrl);

        if (!response.ok) {
          throw new Error("Failed to get Twilio token");
        }

        const { token } = await response.json();

        // Note: Twilio Voice SDK would be dynamically imported here if installed
        // For now, we use mock mode until the SDK is added as a dependency
        console.log("Twilio token received, but SDK not installed - using mock mode");
        setUsingMock(true);
      } catch (e) {
        console.warn("Twilio init failed, using mock:", e);
        setUsingMock(true);
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
    setError(null);
    setStatus("connecting");

    if (!usingMock && deviceRef.current) {
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
    } else {
      connectionTimeoutRef.current = window.setTimeout(() => {
        setStatus("connected");
        connectionTimeoutRef.current = null;
      }, 1500);
    }
  }, [phoneNumber, usingMock]);

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
    usingMock,
    dial,
    hangup,
    toggleMute,
    appendDigit,
    clearNumber,
  };
}
