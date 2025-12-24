import { useState, useEffect, useRef, useCallback } from "react";
import { getSettings, getTranscriptionWsUrl } from "../lib/settings";

export interface TranscriptionEntry {
  id: string;
  speaker: "rep" | "customer";
  text: string;
  timestamp?: Date;
}

export function useTranscription(callActive: boolean) {
  const [entries, setEntries] = useState<TranscriptionEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mockIntervalRef = useRef<number | null>(null);

  const addEntry = useCallback((entry: TranscriptionEntry) => {
    setEntries((prev) => [...prev, { ...entry, timestamp: new Date() }]);
  }, []);

  const clearTranscription = useCallback(() => setEntries([]), []);

  const getFullTranscript = useCallback(
    () => entries.map((e) => `[${e.speaker}]: ${e.text}`).join("\n"),
    [entries]
  );

  useEffect(() => {
    if (!callActive) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      }
      setConnected(false);
      return;
    }

    const settings = getSettings();
    const wsUrl = getTranscriptionWsUrl();

    function startMockTranscription() {
      const mockEntries = [
        { speaker: "rep" as const, text: "Hi, this is calling from Admiral Energy..." },
        { speaker: "customer" as const, text: "Oh hi, what is this about?" },
        { speaker: "rep" as const, text: "We help homeowners reduce their electric bills with solar..." },
        { speaker: "customer" as const, text: "I've been thinking about solar actually." },
        { speaker: "rep" as const, text: "That's great! Would you like me to schedule a free consultation?" },
      ];

      let index = 0;
      mockIntervalRef.current = window.setInterval(() => {
        if (index < mockEntries.length) {
          addEntry({
            id: crypto.randomUUID(),
            ...mockEntries[index],
          });
          index++;
        }
      }, 3000);
    }

    if (settings.transcriptionPort && settings.backendHost) {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setError(null);
          console.log("Transcription WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "transcription" || data.text) {
              addEntry({
                id: crypto.randomUUID(),
                speaker: data.speaker || "customer",
                text: data.text,
              });
            }
          } catch (e) {
            console.warn("Failed to parse transcription message:", e);
          }
        };

        ws.onerror = () => {
          console.warn("Transcription WebSocket error, falling back to mock");
          setError("WebSocket connection failed - using simulation");
          ws.close();
        };

        ws.onclose = () => {
          setConnected(false);
          if (callActive && !mockIntervalRef.current) {
            startMockTranscription();
          }
        };

        return () => {
          ws.close();
          wsRef.current = null;
        };
      } catch (e) {
        console.warn("Failed to create WebSocket, using mock transcription");
        startMockTranscription();
      }
    } else {
      startMockTranscription();
    }

    return () => {
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      }
    };
  }, [callActive, addEntry]);

  return {
    entries,
    connected,
    error,
    clearTranscription,
    getFullTranscript,
    addEntry,
  };
}
