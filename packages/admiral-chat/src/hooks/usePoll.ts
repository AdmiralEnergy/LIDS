// Admiral Chat - usePoll Hook
// Polls for updates at regular intervals

import { useEffect, useRef, useCallback, useState } from 'react';
import { chatDb } from '../db';
import { chatApi } from '../services/chatApi';

const ACTIVE_POLL_INTERVAL = 5000; // 5 seconds when tab is active
const BACKGROUND_POLL_INTERVAL = 30000; // 30 seconds when in background

export function usePoll(enabled = true) {
  const [isPolling, setIsPolling] = useState(false);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const lastPollTimeRef = useRef<Date>(new Date());
  const isActiveRef = useRef(true);

  const poll = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsPolling(true);

      const response = await chatApi.pollForUpdates(lastPollTimeRef.current);

      if (response.hasNew) {
        setHasNewMessages(true);

        // Update channel unread counts
        for (const channel of response.channels) {
          const existing = await chatDb.channels.get(channel.id);
          if (existing) {
            await chatDb.channels.update(channel.id, {
              unreadCount: (existing.unreadCount || 0) + channel.newCount,
              lastMessageAt: new Date(channel.lastMessageAt),
            });
          }
        }
      }

      lastPollTimeRef.current = new Date();
      setLastPoll(lastPollTimeRef.current);
    } catch (error) {
      console.error('Poll failed:', error);
    } finally {
      setIsPolling(false);
    }
  }, [enabled]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Set up polling interval
  useEffect(() => {
    if (!enabled) return;

    // Initial poll
    poll();

    // Dynamic interval based on tab visibility
    const intervalId = setInterval(() => {
      const interval = isActiveRef.current
        ? ACTIVE_POLL_INTERVAL
        : BACKGROUND_POLL_INTERVAL;

      // Only poll if enough time has passed
      const elapsed = Date.now() - lastPollTimeRef.current.getTime();
      if (elapsed >= interval) {
        poll();
      }
    }, ACTIVE_POLL_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, poll]);

  // Clear new messages flag
  const clearNewFlag = useCallback(() => {
    setHasNewMessages(false);
  }, []);

  return {
    isPolling,
    lastPoll,
    hasNewMessages,
    clearNewFlag,
    pollNow: poll,
  };
}
