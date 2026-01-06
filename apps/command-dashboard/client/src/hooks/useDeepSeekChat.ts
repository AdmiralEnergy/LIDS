import { useState, useCallback, useRef } from "react";
import { getSettings } from "@/lib/settings";
import type { ChatMessage } from "@shared/schema";
import { READ_TOOLS, formatToolsForPrompt, parseToolCalls, removeToolCalls } from "@/lib/deepseekTools";

interface DeepSeekResponse {
  response: string;
  thinking?: string;
}

interface SystemContext {
  services: Record<string, { status: string; host: string; port: number; description: string }>;
  codebase: { root: string; commandDashboard: string; keyFiles: { path: string; purpose: string }[] };
  infrastructure: Record<string, { ip: string; tailscale: string; services: string[] }>;
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
  const [hasSystemContext, setHasSystemContext] = useState(false);
  const systemContextRef = useRef<string | null>(null);

  /**
   * Fetch system context and format as a system prompt
   */
  const fetchSystemContext = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/deepseek/context');
      if (!response.ok) return null;

      const ctx: SystemContext = await response.json();

      const serviceLines = Object.entries(ctx.services)
        .map(([name, svc]) => `- ${name} (${svc.host}:${svc.port}): ${svc.status.toUpperCase()} - ${svc.description}`)
        .join('\n');

      const fileLines = ctx.codebase.keyFiles
        .map(f => `- ${f.path}: ${f.purpose}`)
        .join('\n');

      const infraLines = Object.entries(ctx.infrastructure)
        .map(([name, info]) => `- ${name}: ${info.ip} (Tailscale: ${info.tailscale})\n  Services: ${info.services.join(', ')}`)
        .join('\n');

      const systemPrompt = `You are DeepSeek R1, an AI assistant integrated with the Command Dashboard at Admiral Energy.

## Connected Services (Live Status)
${serviceLines}

## Infrastructure
${infraLines}

## Codebase: ${ctx.codebase.root}
Key files:
${fileLines}

## Your Capabilities
- You have full knowledge of the connected services and their status
- You can explain how services work and help debug issues
- You understand the NC power grid monitoring system (Duke Energy data)
- You can suggest code changes for the Command Dashboard

## Context
- This dashboard monitors NC power grid outages for solar/battery sales opportunities
- Counties with outages are hot leads - residents want backup power solutions
- The Grid Engine tracks 100 NC counties, state machine thresholds: BLACK = 2000+ customers OR 1%+ population`;

      systemContextRef.current = systemPrompt;
      setHasSystemContext(true);
      return systemPrompt;
    } catch {
      return null;
    }
  }, []);

  /**
   * Execute a tool via the backend API
   */
  const executeTool = useCallback(async (tool: string, params: Record<string, string>) => {
    const response = await fetch('/api/deepseek/execute-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, params }),
    });
    return response.json();
  }, []);

  /**
   * Send a message to DeepSeek R1 and get a response
   * Handles tool calling with automatic execution loop
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

      // On first message, inject system context with tools
      let finalPrompt = content;
      if (messages.length === 0) {
        let sysContext = systemContextRef.current;
        if (!sysContext) {
          sysContext = await fetchSystemContext();
        }
        if (sysContext) {
          // Include available tools in the system prompt
          const toolsPrompt = formatToolsForPrompt(READ_TOOLS);
          finalPrompt = `${sysContext}\n\n${toolsPrompt}\n\n---\n\nUser: ${content}`;
        }
      }

      const response = await fetch("/api/deepseek/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          host,
          port,
          context: context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      let data = await response.json();
      let currentContext = data.context;

      // Check for tool calls and execute them
      const toolCalls = parseToolCalls(data.response);

      if (toolCalls.length > 0) {
        // Execute tools (max 5 to prevent infinite loops)
        const toolResults = await Promise.all(
          toolCalls.slice(0, 5).map(async (tc) => {
            const result = await executeTool(tc.name, tc.params);
            return { tool: tc.name, params: tc.params, result };
          })
        );

        // Format tool results for the model
        const toolResultsText = toolResults.map(tr =>
          `Tool: ${tr.tool}\nParams: ${JSON.stringify(tr.params)}\nResult: ${JSON.stringify(tr.result.result || tr.result.error, null, 2)}`
        ).join('\n\n');

        // Send tool results back to DeepSeek for final response
        const followUpResponse = await fetch("/api/deepseek/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `Here are the results from the tools you requested:\n\n${toolResultsText}\n\nNow provide your final response to the user based on these results.`,
            host,
            port,
            context: currentContext,
          }),
        });

        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          data = followUpData;
          currentContext = followUpData.context;
        }
      }

      // Save context for next message
      if (currentContext) {
        setContext(currentContext);
      }

      // Parse response to extract thinking
      const parsed = parseResponse(data.response);

      // Remove any remaining tool_call tags from display
      const cleanContent = removeToolCalls(parsed.response);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: cleanContent,
        thinking: parsed.thinking,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      return { response: cleanContent, thinking: parsed.thinking };
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
  }, [context, messages.length, fetchSystemContext, executeTool]);

  /**
   * Clear chat history and reset context
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setContext(null);
    setError(null);
    setHasSystemContext(false);
    systemContextRef.current = null;
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
    hasSystemContext,
  };
}
