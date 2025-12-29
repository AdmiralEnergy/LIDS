import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useCompass } from '../providers/CompassProvider';
import { useAgent } from '../hooks/useAgent';
import { MessageList } from './MessageList';

interface ChatWindowProps {
  title?: string;
  className?: string;
}

export function ChatWindow({ title = 'COMPASS', className = '' }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, addMessage, currentAgent, executeCommand, isCommand } = useCompass();
  const { sendMessage, isLoading } = useAgent({
    agent: currentAgent!,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput('');

    // Add user message
    addMessage({ role: 'user', content: userInput });

    // Check if it's a command
    if (isCommand(userInput)) {
      const result = await executeCommand(userInput);
      if (result) {
        addMessage({ role: 'assistant', content: result, agent: 'system' });
      }
      return;
    }

    // Send to agent
    const response = await sendMessage(userInput);
    addMessage({
      role: 'assistant',
      content: response,
      agent: currentAgent?.name
    });
  };

  return (
    <div className={`flex flex-col h-full bg-[#f7f5f2] ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#0c2f4a] text-white">
        <div className="w-8 h-8 rounded-full bg-[#c9a648] flex items-center justify-center text-sm font-bold">
          {currentAgent?.name?.[0] || 'C'}
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-white/70">{currentAgent?.name || 'Assistant'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or /command..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c2f4a]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-[#0c2f4a] text-white rounded-lg hover:bg-[#0c2f4a]/90 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
