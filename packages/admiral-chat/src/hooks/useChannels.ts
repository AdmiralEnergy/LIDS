// Admiral Chat - useChannels Hook
// Manages channel list with local caching

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { chatDb } from '../db';
import { chatApi } from '../services/chatApi';
import type { LocalChannel } from '../types';

export function useChannels() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live query from Dexie - updates automatically
  const channels = useLiveQuery(
    () => chatDb.channels.orderBy('lastMessageAt').reverse().toArray(),
    [],
    []
  );

  // Initial fetch from server
  const refreshChannels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const serverChannels = await chatApi.fetchChannels();

      // Merge with local data
      for (const channel of serverChannels) {
        await chatDb.channels.put({
          ...channel,
          cachedAt: new Date(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
      console.error('Failed to fetch channels:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    refreshChannels();
  }, [refreshChannels]);

  // Create a new DM
  const createDM = useCallback(async (memberId: string): Promise<string> => {
    const channel = await chatApi.findOrCreateDM(memberId);

    // Add to local DB
    await chatDb.channels.put({
      ...channel,
      unreadCount: 0,
      cachedAt: new Date(),
    });

    return channel.id;
  }, []);

  // Get total unread count
  const unreadTotal = channels?.reduce((sum, ch) => sum + (ch.unreadCount || 0), 0) || 0;

  // Get channel by ID
  const getChannel = useCallback(
    (channelId: string): LocalChannel | undefined => {
      return channels?.find(ch => ch.id === channelId);
    },
    [channels]
  );

  // Get channel by slug (e.g., 'general', 'sales')
  const getChannelBySlug = useCallback(
    (slug: string): LocalChannel | undefined => {
      return channels?.find(ch => ch.slug === slug);
    },
    [channels]
  );

  return {
    channels: channels || [],
    isLoading,
    error,
    unreadTotal,
    refreshChannels,
    createDM,
    getChannel,
    getChannelBySlug,
  };
}
