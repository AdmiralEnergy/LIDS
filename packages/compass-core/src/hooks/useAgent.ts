import { useState, useCallback } from 'react';
import type { Agent, Message } from '../types';

interface UseAgentOptions {
  agent: Agent;
  onMessage?: (message: Message) => void;
}

export function useAgent({ agent, onMessage }: UseAgentOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await fetch(agent.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error(`Agent error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || data.message || 'No response';
    } catch (error) {
      console.error('[COMPASS] Agent error:', error);
      return 'I apologize, but I encountered an error. Please try again.';
    } finally {
      setIsLoading(false);
    }
  }, [agent.endpoint]);

  return { sendMessage, isConnected, isLoading };
}
