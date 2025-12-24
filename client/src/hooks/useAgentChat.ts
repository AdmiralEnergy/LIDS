import { useState, useCallback, useEffect } from 'react';
import type { AgentResponse, SuggestedAction, EnrichmentResult } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { isOfflineMode, isDemoMode } from '@/lib/settings';
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

  useEffect(() => {
    async function loadHistory() {
      try {
        let stored;
        if (leadId) {
          stored = await db.messages
            .where('[agentId+leadId]')
            .equals([agentId, leadId])
            .sortBy('timestamp');
        } else {
          stored = await db.messages
            .where('agentId')
            .equals(agentId)
            .filter(msg => !msg.leadId)
            .sortBy('timestamp');
        }
        
        const hydrated: LocalChatMessage[] = stored.map(msg => ({
          id: msg.id,
          role: msg.role === 'assistant' ? 'agent' : 'user',
          content: msg.content,
          suggestedActions: msg.suggestedActions,
          enrichmentData: msg.enrichmentData,
          timestamp: new Date(msg.timestamp).toISOString(),
        }));
        
        setMessages(hydrated);
      } catch (e) {
        console.warn('Failed to load chat history from local DB:', e);
      }
    }
    
    loadHistory();
  }, [agentId, leadId]);

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
        leadId,
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
          leadId,
          role: 'assistant',
          content: agentMessage.content,
          suggestedActions: agentMessage.suggestedActions,
          enrichmentData: agentMessage.enrichmentData,
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

  const clearMessages = useCallback(async () => {
    setMessages([]);
    setError(null);
    try {
      if (leadId) {
        await db.messages.where('[agentId+leadId]').equals([agentId, leadId]).delete();
      } else {
        await db.messages.where('agentId').equals(agentId).filter(msg => !msg.leadId).delete();
      }
    } catch (e) {
      console.warn('Failed to clear messages from local DB:', e);
    }
  }, [agentId, leadId]);

  const setEnrichmentData = useCallback(async (data: EnrichmentResult) => {
    const enrichmentMessage: LocalChatMessage = {
      id: generateId(),
      role: 'agent',
      content: `I've enriched the lead data. Here's what I found:`,
      enrichmentData: data,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, enrichmentMessage]);

    try {
      await db.messages.add({
        id: enrichmentMessage.id,
        agentId,
        leadId,
        role: 'assistant',
        content: enrichmentMessage.content,
        enrichmentData: data,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to save enrichment message to local DB:', e);
    }
  }, [agentId, leadId]);

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
