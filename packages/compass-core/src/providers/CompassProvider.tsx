import React, { createContext, useContext, useMemo } from 'react';
import type { CompassConfig, Agent, Command } from '../types';
import { useMessages } from '../hooks/useMessages';
import { useCommands } from '../hooks/useCommands';

interface CompassContextValue {
  config: CompassConfig;
  messages: ReturnType<typeof useMessages>['messages'];
  addMessage: ReturnType<typeof useMessages>['addMessage'];
  clearMessages: ReturnType<typeof useMessages>['clearMessages'];
  commands: Command[];
  executeCommand: ReturnType<typeof useCommands>['executeCommand'];
  isCommand: ReturnType<typeof useCommands>['isCommand'];
  currentAgent: Agent | undefined;
}

const CompassContext = createContext<CompassContextValue | null>(null);

interface CompassProviderProps {
  config: CompassConfig;
  children: React.ReactNode;
}

export function CompassProvider({ config, children }: CompassProviderProps) {
  const { messages, addMessage, clearMessages } = useMessages();
  const { executeCommand, isCommand, commands } = useCommands(config.commands);

  const currentAgent = useMemo(() => {
    return config.agents.find(a => a.id === config.defaultAgent) || config.agents[0];
  }, [config.agents, config.defaultAgent]);

  const value = useMemo(() => ({
    config,
    messages,
    addMessage,
    clearMessages,
    commands,
    executeCommand,
    isCommand,
    currentAgent,
  }), [config, messages, addMessage, clearMessages, commands, executeCommand, isCommand, currentAgent]);

  return (
    <CompassContext.Provider value={value}>
      {children}
    </CompassContext.Provider>
  );
}

export function useCompass() {
  const context = useContext(CompassContext);
  if (!context) {
    throw new Error('useCompass must be used within a CompassProvider');
  }
  return context;
}
