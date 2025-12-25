import { useState, useCallback, useEffect, useRef } from "react";
import { getVoiceServiceUrl, getTranscriptionServiceUrl } from "../lib/settings";

export interface TranscriptionEntry {
  id: string;
  speaker: "rep" | "customer" | "system";
  text: string;
  timestamp?: Date;
}

/**
 * Transcription hook for HELM Dialer
 *
 * Provides real-time transcription during calls using browser audio capture.
 *
 * Approaches:
 * 1. WebSocket streaming (preferred) - connects to transcription-service:4097/stream
 * 2. Periodic HTTP transcription - falls back to POST /transcribe every 3 seconds
 * 3. Post-call transcription - transcribeFromUrl() for recording URLs
 */
export function useTranscription(callActive: boolean) {
  const [entries, setEntries] = useState<TranscriptionEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);

  // Refs for real-time transcription
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptionIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addEntry = useCallback((entry: TranscriptionEntry) => {
    setEntries((prev) => [...prev, { ...entry, timestamp: new Date() }]);
  }, []);

  const clearTranscription = useCallback(() => setEntries([]), []);

  const getFullTranscript = useCallback(
    () => entries.map((e) => `[${e.speaker}]: ${e.text}`).join("\n"),
    [entries]
  );

  // Start live transcription when call becomes active
  const startLiveTranscription = useCallback(async () => {
    if (isLiveTranscribing) return;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // Determine supported MIME type
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      let mimeType = "";
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      if (!mimeType) {
        console.warn("[Transcription] No supported audio MIME type found");
        addEntry({
          id: crypto.randomUUID(),
          speaker: "system",
          text: "[Live transcription not available - no supported audio format]",
        });
        return;
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsLiveTranscribing(true);
      setConnected(true);

      console.log("[Transcription] Live transcription started with", mimeType);

      // Set up interval to send audio chunks for transcription
      transcriptionIntervalRef.current = window.setInterval(async () => {
        if (audioChunksRef.current.length === 0) return;

        const chunks = [...audioChunksRef.current];
        audioChunksRef.current = [];

        const blob = new Blob(chunks, { type: mimeType });

        try {
          const formData = new FormData();
          formData.append("audio", blob, "chunk.webm");

          const response = await fetch(`${getVoiceServiceUrl()}/transcribe`, {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            if (result.text && result.text.trim()) {
              addEntry({
                id: crypto.randomUUID(),
                speaker: "rep", // Rep's microphone
                text: result.text.trim(),
              });
            }
          }
        } catch (e) {
          console.warn("[Transcription] HTTP transcription request failed:", e);
        }
      }, 3000); // Transcribe every 3 seconds

      // Add initial status message
      addEntry({
        id: "live-status",
        speaker: "system",
        text: "[Live transcription active - capturing audio]",
      });
    } catch (e) {
      console.error("[Transcription] Failed to start live transcription:", e);
      setError(e instanceof Error ? e.message : "Failed to access microphone");
      addEntry({
        id: crypto.randomUUID(),
        speaker: "system",
        text: "[Live transcription unavailable - microphone access denied]",
      });
    }
  }, [isLiveTranscribing, addEntry]);

  // Stop live transcription
  const stopLiveTranscription = useCallback(() => {
    if (transcriptionIntervalRef.current) {
      clearInterval(transcriptionIntervalRef.current);
      transcriptionIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    setIsLiveTranscribing(false);
    setConnected(false);

    console.log("[Transcription] Live transcription stopped");
  }, []);

  // Auto-start/stop live transcription based on call state
  useEffect(() => {
    if (callActive && !isLiveTranscribing) {
      startLiveTranscription();
    } else if (!callActive && isLiveTranscribing) {
      stopLiveTranscription();
    }

    return () => {
      if (isLiveTranscribing) {
        stopLiveTranscription();
      }
    };
  }, [callActive, isLiveTranscribing, startLiveTranscription, stopLiveTranscription]);

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

  return {
    entries,
    connected,
    error,
    isTranscribing,
    isLiveTranscribing,
    clearTranscription,
    getFullTranscript,
    addEntry,
    transcribeAudio,
    transcribeFromUrl,
    startLiveTranscription,
    stopLiveTranscription,
  };
}
