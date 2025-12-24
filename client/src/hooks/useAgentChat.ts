import { useState, useCallback } from 'react';
import type { AgentResponse, SuggestedAction, EnrichmentResult } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Local message type for the hook (strings for timestamps, simple id generation)
interface LocalChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  suggestedActions?: SuggestedAction[];
  timestamp: string;
  enrichmentData?: EnrichmentResult;
}

// UUID fallback for older browsers
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface UseAgentChatOptions {
  agentId: string;
  leadId?: string;
}

interface UseAgentChatReturn {
  messages: LocalChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<AgentResponse | null>;
  executeAction: (action: SuggestedAction) => Promise<void>;
  clearMessages: () => void;
  setEnrichmentData: (data: EnrichmentResult) => void;
}

export function useAgentChat({ agentId, leadId }: UseAgentChatOptions): UseAgentChatReturn {
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string): Promise<AgentResponse | null> => {
    if (!content.trim()) return null;

    setIsLoading(true);
    setError(null);

    const userMessage: LocalChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await apiRequest<AgentResponse>('POST', `/api/agent/${agentId}/chat`, {
        message: content,
        context: { leadId },
      });

      const agentMessage: LocalChatMessage = {
        id: generateId(),
        role: 'agent',
        content: response.message,
        suggestedActions: response.suggestedActions,
        enrichmentData: response.enrichmentData,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, agentMessage]);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to agent';
      setError(errorMessage);
      
      const errorAgentMessage: LocalChatMessage = {
        id: generateId(),
        role: 'agent',
        content: `I'm having trouble connecting right now. Please try again in a moment.`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorAgentMessage]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [agentId, leadId]);

  const executeAction = useCallback(async (action: SuggestedAction): Promise<void> => {
    try {
      await apiRequest('POST', '/api/actions/execute', {
        action: action.action,
        params: action.params,
        leadId,
      });

      const confirmMessage: LocalChatMessage = {
        id: generateId(),
        role: 'agent',
        content: `Done! I've completed the action: ${action.label}`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, confirmMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute action';
      setError(errorMessage);
    }
  }, [leadId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const setEnrichmentData = useCallback((data: EnrichmentResult) => {
    const enrichmentMessage: LocalChatMessage = {
      id: generateId(),
      role: 'agent',
      content: `I've enriched the lead data. Here's what I found:`,
      enrichmentData: data,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, enrichmentMessage]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    executeAction,
    clearMessages,
    setEnrichmentData,
  };
}
