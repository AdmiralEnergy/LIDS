import { useRef, useEffect } from "react";
import { Trash2, Wifi, WifiOff } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { ThinkingBlock } from "./ThinkingBlock";
import { cn, formatTimestamp } from "@/lib/utils";
import { MOCK_CHAT_RESPONSE, createMockChatMessage } from "@/lib/mockData";
import { useDeepSeekChat } from "@/hooks/useDeepSeekChat";
import { useState } from "react";
import type { ChatMessage } from "@shared/schema";

interface DeepSeekChatProps {
  className?: string;
  useMockData?: boolean;
}

export function DeepSeekChat({ className, useMockData = true }: DeepSeekChatProps) {
  // Real API hook
  const deepSeek = useDeepSeekChat();

  // Mock data state (only used when useMockData=true)
  const [mockMessages, setMockMessages] = useState<ChatMessage[]>([]);
  const [mockLoading, setMockLoading] = useState(false);

  // Connection status for real API
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "offline">("checking");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use appropriate state based on mode
  const messages = useMockData ? mockMessages : deepSeek.messages;
  const isLoading = useMockData ? mockLoading : deepSeek.isLoading;

  // Check connection status on mount (only for real API mode)
  useEffect(() => {
    if (!useMockData) {
      deepSeek.checkHealth().then(result => {
        setConnectionStatus(result.status === "healthy" ? "connected" : "offline");
      });
    }
  }, [useMockData]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (useMockData) {
      // Mock mode - simulate response
      const userMessage = createMockChatMessage("user", content);
      setMockMessages((prev) => [...prev, userMessage]);
      setMockLoading(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const assistantMessage = createMockChatMessage(
          "assistant",
          MOCK_CHAT_RESPONSE.response,
          MOCK_CHAT_RESPONSE.thinking
        );
        setMockMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setMockLoading(false);
      }
    } else {
      // Real API mode
      try {
        await deepSeek.sendMessage(content);
        setConnectionStatus("connected");
      } catch {
        setConnectionStatus("offline");
      }
    }
  };

  const clearChat = () => {
    if (useMockData) {
      setMockMessages([]);
    } else {
      deepSeek.clearChat();
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h2 className="text-sm font-medium">DeepSeek R1</h2>
          {useMockData ? (
            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">MOCK</span>
          ) : (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded flex items-center gap-1",
              connectionStatus === "connected" && "bg-green-500/20 text-green-500",
              connectionStatus === "offline" && "bg-red-500/20 text-red-500",
              connectionStatus === "checking" && "bg-gray-500/20 text-gray-500"
            )}>
              {connectionStatus === "connected" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connectionStatus === "checking" ? "Checking..." : connectionStatus === "connected" ? "LIVE" : "OFFLINE"}
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground">
            <div>
              <p className="text-4xl mb-3">💭</p>
              <p className="text-sm">Start a conversation with DeepSeek R1</p>
              <p className="text-xs mt-1">Ask about system status, analyze data, or get recommendations</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-lg p-3",
                message.role === "user"
                  ? "chat-message-user ml-8"
                  : "chat-message-assistant mr-8"
              )}
            >
              {/* Thinking block for assistant messages */}
              {message.role === "assistant" && message.thinking && (
                <ThinkingBlock content={message.thinking} />
              )}

              {/* Message content */}
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground mt-2">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="chat-message-assistant mr-8 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
