import { useRef, useEffect, useState } from "react";
import { Trash2, Wifi, WifiOff, Database, FileCode, Terminal } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { ThinkingBlock } from "./ThinkingBlock";
import { CodeEditProposal } from "./CodeEditProposal";
import { CommandProposal } from "./CommandProposal";
import { cn, formatTimestamp } from "@/lib/utils";
import { useDeepSeekChat } from "@/hooks/useDeepSeekChat";

interface DeepSeekChatProps {
  className?: string;
}

export function DeepSeekChat({ className }: DeepSeekChatProps) {
  // Real API hook
  const deepSeek = useDeepSeekChat();

  // Connection status for real API
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "offline">("checking");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use real API state
  const messages = deepSeek.messages;
  const isLoading = deepSeek.isLoading;

  // Check connection status on mount
  useEffect(() => {
    deepSeek.checkHealth().then(result => {
      setConnectionStatus(result.status === "healthy" ? "connected" : "offline");
    });
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string) => {
    try {
      await deepSeek.sendMessage(content);
      setConnectionStatus("connected");
    } catch {
      setConnectionStatus("offline");
    }
  };

  const clearChat = () => {
    deepSeek.clearChat();
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h2 className="text-sm font-medium">DeepSeek R1</h2>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded flex items-center gap-1",
            connectionStatus === "connected" && "bg-green-500/20 text-green-500",
            connectionStatus === "offline" && "bg-red-500/20 text-red-500",
            connectionStatus === "checking" && "bg-gray-500/20 text-gray-500"
          )}>
            {connectionStatus === "connected" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connectionStatus === "checking" ? "Checking..." : connectionStatus === "connected" ? "LIVE" : "OFFLINE"}
          </span>
          {deepSeek.hasSystemContext && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1">
              <Database className="w-3 h-3" />
              Context Aware
            </span>
          )}
          {deepSeek.proposals.filter(p => p.status === 'pending').length > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded flex items-center gap-1">
              <FileCode className="w-3 h-3" />
              {deepSeek.proposals.filter(p => p.status === 'pending').length} Edit
            </span>
          )}
          {deepSeek.commandProposals.filter(p => p.status === 'pending').length > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              {deepSeek.commandProposals.filter(p => p.status === 'pending').length} Cmd
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

        {/* Edit Proposals */}
        {deepSeek.proposals.length > 0 && (
          <div className="space-y-2">
            {deepSeek.proposals.map(proposal => (
              <CodeEditProposal
                key={proposal.id}
                proposal={proposal}
                onApprove={deepSeek.approveProposal}
                onReject={deepSeek.rejectProposal}
              />
            ))}
          </div>
        )}

        {/* Command Proposals */}
        {deepSeek.commandProposals.length > 0 && (
          <div className="space-y-2">
            {deepSeek.commandProposals.map(proposal => (
              <CommandProposal
                key={proposal.id}
                proposal={proposal}
                onApprove={deepSeek.approveCommand}
                onReject={deepSeek.rejectCommand}
              />
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
