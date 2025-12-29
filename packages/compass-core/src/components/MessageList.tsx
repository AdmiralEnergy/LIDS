import React from 'react';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Start a conversation...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] px-4 py-2 rounded-lg ${
              message.role === 'user'
                ? 'bg-[#0c2f4a] text-white'
                : 'bg-white border shadow-sm'
            }`}
          >
            {message.agent && message.role === 'assistant' && (
              <p className="text-xs text-[#c9a648] font-medium mb-1">{message.agent}</p>
            )}
            <p className="whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs opacity-50 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
