import { useState, useEffect, useRef, useCallback } from "react";

export type DialerStatus = "idle" | "connecting" | "connected";

export function useDialer() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<DialerStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

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
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    };
  }, []);

  const dial = useCallback(() => {
    if (!phoneNumber) return;
    setStatus("connecting");
    connectionTimeoutRef.current = window.setTimeout(() => {
      setStatus("connected");
      connectionTimeoutRef.current = null;
    }, 1500);
  }, [phoneNumber]);

  const hangup = useCallback(() => {
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

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

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
    dial,
    hangup,
    toggleMute,
    appendDigit,
    clearNumber,
  };
}
