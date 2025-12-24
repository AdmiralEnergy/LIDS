import { useState, useCallback } from 'react';
import type { AgentResponse, SuggestedAction, EnrichmentResult } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { isOfflineMode, isDemoMode, getSettings } from '@/lib/settings';
import { getMockResponse, getMockDelay } from '@/lib/mockAgents';
import { db } from '@/lib/db';

interface LocalChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  suggestedActions?: SuggestedAction[];
  timestamp: string;
  enrichmentData?: EnrichmentResult;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
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
      await db.messages.add({
        id: userMessage.id,
        agentId,
        role: 'user',
        content: userMessage.content,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to save message to local DB:', e);
    }

    try {
      let response: AgentResponse;

      if (isOfflineMode() || isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, getMockDelay()));
        const mockContent = getMockResponse(agentId, content);
        response = {
          message: mockContent,
        };
      } else {
        try {
          response = await apiRequest<AgentResponse>('POST', `/api/agent/${agentId}/chat`, {
            message: content,
            context: { leadId },
          });
        } catch (apiErr) {
          await new Promise(resolve => setTimeout(resolve, getMockDelay()));
          const fallbackContent = getMockResponse(agentId, content);
          response = {
            message: fallbackContent,
          };
        }
      }

      const agentMessage: LocalChatMessage = {
        id: generateId(),
        role: 'agent',
        content: response.message,
        suggestedActions: response.suggestedActions,
        enrichmentData: response.enrichmentData,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, agentMessage]);

      try {
        await db.messages.add({
          id: agentMessage.id,
          agentId,
          role: 'assistant',
          content: agentMessage.content,
          timestamp: Date.now(),
        });
      } catch (e) {
        console.warn('Failed to save agent message to local DB:', e);
      }

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
    if (isOfflineMode() || isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const confirmMessage: LocalChatMessage = {
        id: generateId(),
        role: 'agent',
        content: `Done! I've completed the action: ${action.label}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, confirmMessage]);
      return;
    }

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
