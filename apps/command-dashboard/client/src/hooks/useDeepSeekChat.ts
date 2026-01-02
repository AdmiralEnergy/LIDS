import { useState, useCallback } from "react";
import { getSettings } from "@/lib/settings";
import type { ChatMessage } from "@shared/schema";

interface DeepSeekResponse {
  response: string;
  thinking?: string;
}

/**
 * Parse DeepSeek R1 response to extract <think> blocks
 */
function parseResponse(text: string): DeepSeekResponse {
  // DeepSeek R1 wraps thinking in <think>...</think> tags
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);

  if (thinkMatch) {
    const thinking = thinkMatch[1].trim();
    const response = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    return { response, thinking };
  }

  return { response: text };
}

/**
 * Hook for DeepSeek R1 chat functionality
 * Handles real API calls to Ollama via the Express proxy
 */
export function useDeepSeekChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<number[] | null>(null);

  /**
   * Send a message to DeepSeek R1 and get a response
   */
  const sendMessage = useCallback(async (content: string): Promise<DeepSeekResponse> => {
    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const settings = getSettings();

      // Parse the DeepSeek URL to get host and port
      let host = "193.122.153.249";
      let port = "11434";

      try {
        const url = new URL(settings.deepSeekUrl);
        host = url.hostname;
        port = url.port || "11434";
      } catch {
        // Use defaults if URL parsing fails
      }

      const response = await fetch("/api/deepseek/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: content,
          host,
          port,
          context: context, // Pass context for conversation continuity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Save context for next message (Ollama's conversation memory)
      if (data.context) {
        setContext(data.context);
      }

      // Parse response to extract thinking
      const parsed = parseResponse(data.response);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: parsed.response,
        thinking: parsed.thinking,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      return parsed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);

      // Add error as assistant message
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  /**
   * Clear chat history and reset context
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setContext(null);
    setError(null);
  }, []);

  /**
   * Check DeepSeek R1 health status
   */
  const checkHealth = useCallback(async () => {
    try {
      const settings = getSettings();
      let host = "193.122.153.249";
      let port = "11434";

      try {
        const url = new URL(settings.deepSeekUrl);
        host = url.hostname;
        port = url.port || "11434";
      } catch {
        // Use defaults
      }

      const response = await fetch(`/api/deepseek/health?host=${host}&port=${port}`);
      const data = await response.json();
      return data;
    } catch (err) {
      return {
        status: "offline",
        error: err instanceof Error ? err.message : "Connection failed",
      };
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    checkHealth,
  };
}
