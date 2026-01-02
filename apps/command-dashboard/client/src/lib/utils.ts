import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Format milliseconds as a human-readable duration
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Parse <think> blocks from DeepSeek R1 responses
 */
export function parseThinkingBlocks(text: string): { thinking: string; response: string } {
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    const thinking = thinkMatch[1].trim();
    const response = text.replace(/<think>[\s\S]*?<\/think>/, "").trim();
    return { thinking, response };
  }
  return { thinking: "", response: text };
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Status color helpers
 */
export function getStatusColor(status: "healthy" | "degraded" | "offline" | "unknown"): string {
  switch (status) {
    case "healthy":
      return "text-green-500";
    case "degraded":
      return "text-yellow-500";
    case "offline":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export function getStatusBgColor(status: "healthy" | "degraded" | "offline" | "unknown"): string {
  switch (status) {
    case "healthy":
      return "bg-green-500/20";
    case "degraded":
      return "bg-yellow-500/20";
    case "offline":
      return "bg-red-500/20";
    default:
      return "bg-gray-500/20";
  }
}

export function getStatusBorderColor(status: "healthy" | "degraded" | "offline" | "unknown"): string {
  switch (status) {
    case "healthy":
      return "border-green-500/50";
    case "degraded":
      return "border-yellow-500/50";
    case "offline":
      return "border-red-500/50";
    default:
      return "border-gray-500/50";
  }
}
