import { useState, useEffect, useRef, useCallback } from "react";
import { getSettings, getTwilioUrl } from "../lib/settings";

export type DialerStatus = "idle" | "connecting" | "connected" | "error";

interface TwilioDevice {
  connect: (params: { params: Record<string, string> }) => Promise<TwilioCall>;
  register: () => Promise<void>;
  destroy: () => void;
  on: (event: string, handler: (call?: TwilioCall) => void) => void;
}

interface TwilioCall {
  on: (event: string, handler: () => void) => void;
  disconnect: () => void;
  mute: (muted: boolean) => void;
  status: () => string;
  accept: () => void;
  reject: () => void;
  parameters: {
    From?: string;
    To?: string;
    CallSid?: string;
    [key: string]: string | undefined;
  };
}

export function useDialer() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<DialerStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false); // NO MOCK - must be configured

  // Inbound call state
  const [incomingCall, setIncomingCall] = useState<TwilioCall | null>(null);
  const [incomingCallerId, setIncomingCallerId] = useState<string>("");
  const [isInbound, setIsInbound] = useState(false);

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

        // Handle incoming calls
        device.on("incoming", (call: any) => {
          console.log("[Twilio] Incoming call:", call?.parameters);
          const twilioCall = call as TwilioCall;
          setIncomingCall(twilioCall);
          setIncomingCallerId(twilioCall.parameters?.From || "Unknown");

          // Set up handlers for the incoming call
          twilioCall.on("cancel", () => {
            console.log("[Twilio] Incoming call cancelled");
            setIncomingCall(null);
            setIncomingCallerId("");
          });

          twilioCall.on("disconnect", () => {
            console.log("[Twilio] Inbound call disconnected");
            setStatus("idle");
            setDuration(0);
            setIsInbound(false);
            callRef.current = null;
          });
        });

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
    setIsInbound(false);
  }, []);

  // Accept an incoming call
  const acceptIncoming = useCallback(() => {
    if (!incomingCall) {
      console.warn("[Twilio] No incoming call to accept");
      return;
    }

    console.log("[Twilio] Accepting incoming call");
    try {
      incomingCall.accept();
      callRef.current = incomingCall;
      setStatus("connected");
      setIsInbound(true);
      setIncomingCall(null);

      // Set up call event handlers
      incomingCall.on("disconnect", () => {
        console.log("[Twilio] Accepted call disconnected");
        setStatus("idle");
        setDuration(0);
        setIsInbound(false);
        callRef.current = null;
      });

      incomingCall.on("error", () => {
        console.error("[Twilio] Inbound call error");
        setStatus("error");
        setError("Inbound call failed");
        setIsInbound(false);
        callRef.current = null;
      });
    } catch (e) {
      console.error("[Twilio] Failed to accept call:", e);
      setError("Failed to accept incoming call");
    }
  }, [incomingCall]);

  // Reject an incoming call
  const rejectIncoming = useCallback(() => {
    if (!incomingCall) {
      console.warn("[Twilio] No incoming call to reject");
      return;
    }

    console.log("[Twilio] Rejecting incoming call");
    try {
      incomingCall.reject();
      setIncomingCall(null);
      setIncomingCallerId("");
    } catch (e) {
      console.error("[Twilio] Failed to reject call:", e);
    }
  }, [incomingCall]);

  // Send incoming call to voicemail (same as reject, but could be extended for voicemail handling)
  const sendToVoicemail = useCallback(() => {
    if (!incomingCall) {
      console.warn("[Twilio] No incoming call to send to voicemail");
      return;
    }

    console.log("[Twilio] Sending incoming call to voicemail");
    // For now, rejecting sends to Twilio's configured voicemail/fallback
    // Could be extended to transfer to a voicemail TwiML endpoint
    try {
      incomingCall.reject();
      setIncomingCall(null);
      setIncomingCallerId("");
    } catch (e) {
      console.error("[Twilio] Failed to send to voicemail:", e);
    }
  }, [incomingCall]);

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
    // Inbound call handling
    incomingCall,
    incomingCallerId,
    isInbound,
    acceptIncoming,
    rejectIncoming,
    sendToVoicemail,
  };
}
