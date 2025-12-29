// Admiral Chat - Chat Provider
// Context provider for chat state

import React, { createContext, useContext, type ReactNode } from 'react';
import { useChat, type UseChatOptions } from '../hooks/useChat';

type ChatContextValue = ReturnType<typeof useChat>;

const ChatContext = createContext<ChatContextValue | null>(null);

export interface ChatProviderProps {
  children: ReactNode;
  options?: UseChatOptions;
}

export function ChatProvider({ children, options }: ChatProviderProps) {
  const chat = useChat(options);

  return (
    <ChatContext.Provider value={chat}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export default ChatProvider;
