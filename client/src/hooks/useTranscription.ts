import { useState, useEffect } from "react";

export interface TranscriptionEntry {
  id: string;
  speaker: "rep" | "customer";
  text: string;
}

export function useTranscription(callActive: boolean) {
  const [entries, setEntries] = useState<TranscriptionEntry[]>([]);

  useEffect(() => {
    if (!callActive) return;

    const mockEntries = [
      { speaker: "rep" as const, text: "Hi, this is calling from Admiral Energy..." },
      { speaker: "customer" as const, text: "Oh hi, what is this about?" },
      { speaker: "rep" as const, text: "We help homeowners reduce their electric bills with solar..." },
      { speaker: "customer" as const, text: "I've been thinking about solar actually." },
      { speaker: "rep" as const, text: "That's great! Would you like me to schedule a free consultation?" },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < mockEntries.length) {
        setEntries((prev) => [
          ...prev,
          { id: crypto.randomUUID(), ...mockEntries[index] },
        ]);
        index++;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [callActive]);

  const clearTranscription = () => setEntries([]);
  const getFullTranscript = () =>
    entries.map((e) => `[${e.speaker}]: ${e.text}`).join("\n");
  const addEntry = (entry: TranscriptionEntry) =>
    setEntries((prev) => [...prev, entry]);

  return { entries, clearTranscription, getFullTranscript, addEntry };
}
