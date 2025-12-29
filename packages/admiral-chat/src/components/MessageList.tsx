// Admiral Chat - Message List
// Scrolling container for messages

import React, { useRef, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { LocalMessage } from '../types';

export interface MessageListProps {
  messages: LocalMessage[];
  currentUserId: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export function MessageList({
  messages,
  currentUserId,
  isLoading = false,
  onLoadMore,
  className = '',
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string | null>(null);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: LocalMessage[] }[] = [];
    let currentDate = '';

    for (const message of messages) {
      const messageDate = formatDate(new Date(message.createdAt));
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [] });
      }
      groups[groups.length - 1].messages.push(message);
    }

    return groups;
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id !== lastMessageRef.current) {
      lastMessageRef.current = lastMessage.id;
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Handle scroll for load more (infinite scroll)
  const handleScroll = () => {
    if (!scrollRef.current || !onLoadMore) return;

    const { scrollTop } = scrollRef.current;
    if (scrollTop < 100) {
      onLoadMore();
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-gray-500 ${className}`}>
        <p className="text-lg">No messages yet</p>
        <p className="text-sm">Start the conversation!</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={`flex-1 overflow-y-auto p-4 ${className}`}
    >
      {isLoading && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      )}

      {groupedMessages.map(group => (
        <div key={group.date}>
          {/* Date separator */}
          <div className="flex items-center justify-center py-4">
            <div className="border-t border-gray-700 flex-1" />
            <span className="px-3 text-xs text-gray-500">{group.date}</span>
            <div className="border-t border-gray-700 flex-1" />
          </div>

          {/* Messages for this date */}
          {group.messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const prevMessage = group.messages[index - 1];
            const showSender =
              !isOwn &&
              (!prevMessage || prevMessage.senderId !== message.senderId);

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showSender={showSender}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default MessageList;
