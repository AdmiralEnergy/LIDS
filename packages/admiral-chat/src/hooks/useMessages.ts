// Admiral Chat - useMessages Hook
// Manages messages for a specific channel with optimistic updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { chatDb, addMessage, updateMessageStatus, getChannelMessages } from '../db';
import { chatApi } from '../services/chatApi';
import type { LocalMessage, MessageStatus } from '../types';

export function useMessages(channelId: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSyncRef = useRef<Date>(new Date(0));

  // Live query from Dexie - updates automatically when messages change
  const messages = useLiveQuery(
    async () => {
      if (!channelId) return [];
      return getChannelMessages(channelId, 100);
    },
    [channelId],
    []
  );

  // Initial fetch from server
  const refreshMessages = useCallback(async () => {
    if (!channelId) return;

    try {
      setIsLoading(true);
      setError(null);

      const serverMessages = await chatApi.fetchMessages(channelId);

      // Merge with local data
      for (const message of serverMessages) {
        const localMessage: LocalMessage = {
          ...message,
          status: 'delivered',
          localOnly: false,
        };
        await chatDb.messages.put(localMessage);
      }

      lastSyncRef.current = new Date();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  // Fetch on channel change
  useEffect(() => {
    if (channelId) {
      refreshMessages();
    }
  }, [channelId, refreshMessages]);

  // Send a message with optimistic update
  const sendMessage = useCallback(
    async (content: string, options?: { replyTo?: string }) => {
      if (!channelId || !content.trim()) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Create optimistic message
      const optimisticMessage: LocalMessage = {
        id: tempId,
        channelId,
        senderId: 'current-user', // Will be replaced by actual user ID
        content: content.trim(),
        messageType: 'text',
        createdAt: new Date(),
        status: 'pending',
        localOnly: true,
        ...(options?.replyTo && { replyTo: options.replyTo }),
      };

      try {
        setIsSending(true);

        // Add to local DB immediately (optimistic)
        await addMessage(optimisticMessage);

        // Send to server
        const serverMessage = await chatApi.sendMessage(channelId, content, options);

        // Update local message with server response
        await chatDb.messages.delete(tempId);
        await addMessage({
          ...serverMessage,
          status: 'sent',
          localOnly: false,
        });
      } catch (err) {
        // Mark as failed
        await updateMessageStatus(tempId, 'failed');
        setError(err instanceof Error ? err.message : 'Failed to send message');
        console.error('Failed to send message:', err);
      } finally {
        setIsSending(false);
      }
    },
    [channelId]
  );

  // Retry a failed message
  const retryMessage = useCallback(
    async (messageId: string) => {
      const message = await chatDb.messages.get(messageId);
      if (!message || message.status !== 'failed') return;

      // Delete failed message and resend
      await chatDb.messages.delete(messageId);
      await sendMessage(message.content);
    },
    [sendMessage]
  );

  // Mark channel as read
  const markAsRead = useCallback(async () => {
    if (!channelId) return;

    try {
      await chatApi.markChannelAsRead(channelId);

      // Update local channel
      await chatDb.channels.update(channelId, {
        unreadCount: 0,
      });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [channelId]);

  return {
    messages: messages || [],
    isLoading,
    isSending,
    error,
    sendMessage,
    retryMessage,
    markAsRead,
    refreshMessages,
  };
}
