// Admiral Chat - useChat Hook
// Main hook that combines channels, messages, and polling

import { useState, useCallback, useEffect } from 'react';
import { useChannels } from './useChannels';
import { useMessages } from './useMessages';
import { usePoll } from './usePoll';
import type { LocalChannel, WorkspaceMember } from '../types';
import { chatApi } from '../services/chatApi';

export interface UseChatOptions {
  defaultChannelSlug?: string;
  enablePolling?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { defaultChannelSlug = 'general', enablePolling = true } = options;

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // Channel management
  const {
    channels,
    isLoading: channelsLoading,
    error: channelsError,
    unreadTotal,
    refreshChannels,
    createDM,
    getChannel,
    getChannelBySlug,
  } = useChannels();

  // Message management for active channel
  const {
    messages,
    isLoading: messagesLoading,
    isSending,
    error: messagesError,
    sendMessage,
    retryMessage,
    markAsRead,
    refreshMessages,
  } = useMessages(activeChannelId);

  // Polling for updates
  const { hasNewMessages, pollNow, clearNewFlag } = usePoll(enablePolling);

  // Set default channel when channels load
  useEffect(() => {
    if (!activeChannelId && channels.length > 0) {
      const defaultChannel = getChannelBySlug(defaultChannelSlug);
      if (defaultChannel) {
        setActiveChannelId(defaultChannel.id);
      } else {
        setActiveChannelId(channels[0].id);
      }
    }
  }, [channels, activeChannelId, defaultChannelSlug, getChannelBySlug]);

  // Fetch workspace members for DM creation
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setMembersLoading(true);
        const workspaceMembers = await chatApi.fetchWorkspaceMembers();
        setMembers(workspaceMembers);
      } catch (error) {
        console.error('Failed to fetch members:', error);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // Mark as read when channel changes
  useEffect(() => {
    if (activeChannelId) {
      markAsRead();
    }
  }, [activeChannelId, markAsRead]);

  // Refresh messages when new messages detected
  useEffect(() => {
    if (hasNewMessages && activeChannelId) {
      refreshMessages();
      clearNewFlag();
    }
  }, [hasNewMessages, activeChannelId, refreshMessages, clearNewFlag]);

  // Get active channel object
  const activeChannel: LocalChannel | null = activeChannelId
    ? getChannel(activeChannelId) || null
    : null;

  // Change active channel
  const setActiveChannel = useCallback((channelId: string) => {
    setActiveChannelId(channelId);
  }, []);

  // Start a new DM
  const startDM = useCallback(
    async (memberId: string): Promise<string> => {
      const channelId = await createDM(memberId);
      setActiveChannelId(channelId);
      return channelId;
    },
    [createDM]
  );

  // Combined loading state
  const isLoading = channelsLoading || membersLoading;

  // Combined error
  const error = channelsError || messagesError;

  return {
    // Channel state
    channels,
    activeChannel,
    activeChannelId,

    // Message state
    messages,
    isSending,

    // Member state
    members,

    // Loading states
    isLoading,
    messagesLoading,

    // Errors
    error,

    // Unread
    unreadTotal,

    // Actions
    setActiveChannel,
    sendMessage,
    retryMessage,
    startDM,
    markAsRead,
    refreshChannels,
    refreshMessages,
    pollNow,
  };
}

export default useChat;
