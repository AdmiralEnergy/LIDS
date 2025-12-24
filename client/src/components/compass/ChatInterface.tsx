import { useState, useRef, useEffect } from 'react';
import { useAgentChat } from '@/hooks/useAgentChat';
import { AgentAvatar } from './AgentAvatar';
import { SuggestedActions } from './SuggestedActions';
import { EnrichmentSummary } from './EnrichmentSummary';
import { getAgent } from '@/lib/compass/agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Lead, SuggestedAction, EnrichmentResult } from '@shared/schema';
import { Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { EnrichButton } from './EnrichButton';

// Local message type matching useAgentChat
interface LocalChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  suggestedActions?: SuggestedAction[];
  timestamp: string;
  enrichmentData?: EnrichmentResult;
}

interface ChatInterfaceProps {
  agentId: string;
  lead?: Lead;
  onActionExecute?: (action: SuggestedAction) => Promise<void>;
  className?: string;
}

function MessageBubble({ 
  message, 
  agentId, 
  onActionExecute 
}: { 
  message: LocalChatMessage; 
  agentId: string;
  onActionExecute?: (action: SuggestedAction) => Promise<void>;
}) {
  const isUser = message.role === 'user';
  const agent = getAgent(agentId);

  return (
    <div 
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
      data-testid={`message-${message.id}`}
    >
      {!isUser && (
        <AgentAvatar agentId={agentId} size="sm" className="flex-shrink-0 mt-1" />
      )}
      
      <div className={cn(
        "max-w-[80%] space-y-3",
        isUser && "order-first"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-3",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-card border border-card-border"
        )}>
          {!isUser && (
            <p className="text-xs font-medium mb-1" style={{ color: agent?.color }}>
              {agent?.name || 'Agent'}
            </p>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {message.enrichmentData && (
          <EnrichmentSummary result={message.enrichmentData} />
        )}

        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <SuggestedActions 
            actions={message.suggestedActions} 
            onExecute={onActionExecute}
          />
        )}

        <p className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator({ agentId }: { agentId: string }) {
  const agent = getAgent(agentId);
  
  return (
    <div className="flex gap-3 items-start">
      <AgentAvatar agentId={agentId} size="sm" className="flex-shrink-0 mt-1" />
      <div className="bg-card border border-card-border rounded-lg px-4 py-3">
        <p className="text-xs font-medium mb-2" style={{ color: agent?.color }}>
          {agent?.name || 'Agent'}
        </p>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function WelcomeMessage({ agentId, lead }: { agentId: string; lead?: Lead }) {
  const agent = getAgent(agentId);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center">
      <AgentAvatar agentId={agentId} size="xl" className="mb-6" />
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {agent?.name || 'Agent'} Ready
      </h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {agent?.description || 'Your AI partner is ready to assist you.'}
      </p>
      
      {lead && (
        <div className="bg-card border border-card-border rounded-lg p-4 w-full max-w-sm mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Current Lead
          </p>
          <p className="font-semibold text-foreground">
            {lead.firstName} {lead.lastName}
          </p>
          <p className="text-sm text-muted-foreground">
            {lead.address}, {lead.city}, {lead.state} {lead.zip}
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" className="text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          What can you do?
        </Button>
        <Button variant="outline" size="sm" className="text-xs">
          Show me leads
        </Button>
        <Button variant="outline" size="sm" className="text-xs">
          Pipeline status
        </Button>
      </div>
    </div>
  );
}

export function ChatInterface({ 
  agentId, 
  lead,
  onActionExecute,
  className 
}: ChatInterfaceProps) {
  const { 
    messages, 
    sendMessage, 
    executeAction,
    isLoading, 
    error,
    setEnrichmentData
  } = useAgentChat({ agentId, leadId: lead?.id });
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [agentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleActionExecute = async (action: SuggestedAction) => {
    if (onActionExecute) {
      await onActionExecute(action);
    } else {
      await executeAction(action);
    }
  };

  const handleEnrichComplete = (result: EnrichmentResult) => {
    setEnrichmentData(result);
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {messages.length === 0 ? (
        <WelcomeMessage agentId={agentId} lead={lead} />
      ) : (
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                agentId={agentId}
                onActionExecute={handleActionExecute}
              />
            ))}
            {isLoading && <TypingIndicator agentId={agentId} />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      {error && (
        <div className="mx-6 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            {lead && (
              <EnrichButton 
                lead={lead} 
                variant="compact"
                onComplete={handleEnrichComplete}
              />
            )}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message or command..."
                disabled={isLoading}
                className="pr-12 h-11"
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="absolute right-1 top-1 h-9 w-9"
                data-testid="button-send-message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
