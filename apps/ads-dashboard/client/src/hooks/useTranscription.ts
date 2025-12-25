import { useState, useCallback } from "react";
import { getVoiceServiceUrl } from "../lib/settings";

export interface TranscriptionEntry {
  id: string;
  speaker: "rep" | "customer" | "system";
  text: string;
  timestamp?: Date;
}

/**
 * Transcription hook for HELM Dialer
 *
 * The voice-service (port 4130) provides HTTP-based transcription via POST /transcribe.
 * Live real-time transcription requires either:
 * - Twilio Media Streams (server-side WebSocket handler)
 * - WebSocket bridge service (not yet deployed)
 *
 * Current approach:
 * - During call: Show "Recording in progress"
 * - After call: Can transcribe recording via transcribeAudio()
 */
export function useTranscription(callActive: boolean) {
  const [entries, setEntries] = useState<TranscriptionEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const addEntry = useCallback((entry: TranscriptionEntry) => {
    setEntries((prev) => [...prev, { ...entry, timestamp: new Date() }]);
  }, []);

  const clearTranscription = useCallback(() => setEntries([]), []);

  const getFullTranscript = useCallback(
    () => entries.map((e) => `[${e.speaker}]: ${e.text}`).join("\n"),
    [entries]
  );

  /**
   * Transcribe an audio file via voice-service HTTP endpoint
   * @param audioBlob - Audio data (webm, wav, mp3, mp4)
   * @param filename - Filename with extension
   */
  const transcribeAudio = useCallback(async (audioBlob: Blob, filename: string = "recording.webm") => {
    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, filename);

      const response = await fetch(`${getVoiceServiceUrl()}/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.text) {
        addEntry({
          id: crypto.randomUUID(),
          speaker: "customer", // Default - real implementation would detect speaker
          text: result.text,
        });
        setConnected(true);
      }

      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Transcription failed";
      setError(message);
      addEntry({
        id: crypto.randomUUID(),
        speaker: "system",
        text: `[Transcription error: ${message}]`,
      });
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, [addEntry]);

  /**
   * Transcribe from a URL (e.g., Twilio recording URL)
   */
  const transcribeFromUrl = useCallback(async (audioUrl: string) => {
    setIsTranscribing(true);
    setError(null);

    try {
      // Fetch the audio file
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error("Failed to fetch audio file");
      }

      const audioBlob = await audioResponse.blob();
      return await transcribeAudio(audioBlob, "recording.mp3");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to transcribe";
      setError(message);
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, [transcribeAudio]);

  // Show status during active call
  if (callActive && entries.length === 0) {
    // Add initial status message when call starts
    const hasStatus = entries.some(e => e.speaker === "system");
    if (!hasStatus) {
      setTimeout(() => {
        addEntry({
          id: "call-status",
          speaker: "system",
          text: "[Call in progress - transcription available after call ends]",
        });
      }, 500);
    }
  }

  return {
    entries,
    connected,
    error,
    isTranscribing,
    clearTranscription,
    getFullTranscript,
    addEntry,
    transcribeAudio,
    transcribeFromUrl,
  };
}
