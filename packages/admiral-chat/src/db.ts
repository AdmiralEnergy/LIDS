// Admiral Chat - Dexie IndexedDB Schema
// Local-first storage for offline support

import Dexie, { type Table } from 'dexie';
import type { LocalChannel, LocalMessage, MessageStatus } from './types';

export interface SyncQueueItem {
  id?: number;
  operation: 'sendMessage' | 'markRead' | 'createChannel';
  payload: Record<string, unknown>;
  createdAt: Date;
  attempts: number;
}

class AdmiralChatDatabase extends Dexie {
  channels!: Table<LocalChannel>;
  messages!: Table<LocalMessage>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('AdmiralChat');

    this.version(1).stores({
      // Channels indexed by id, type, slug, and lastMessageAt for sorting
      channels: 'id, type, slug, lastMessageAt',

      // Messages indexed by id, channelId, senderId, createdAt
      // Compound index [channelId+createdAt] for efficient channel message queries
      messages: 'id, channelId, senderId, createdAt, [channelId+createdAt]',

      // Sync queue for offline operations
      syncQueue: '++id, operation, createdAt',
    });
  }
}

export const chatDb = new AdmiralChatDatabase();

// Helper functions for common operations

export async function getChannelMessages(
  channelId: string,
  limit = 50,
  before?: Date
): Promise<LocalMessage[]> {
  let query = chatDb.messages
    .where('[channelId+createdAt]')
    .between([channelId, Dexie.minKey], [channelId, before || Dexie.maxKey]);

  return query
    .reverse()
    .limit(limit)
    .toArray()
    .then(messages => messages.reverse()); // Chronological order
}

export async function addMessage(message: LocalMessage): Promise<void> {
  await chatDb.messages.put(message);

  // Update channel's last message info
  await chatDb.channels.update(message.channelId, {
    lastMessagePreview: message.content.slice(0, 50),
    lastMessageAt: message.createdAt,
    cachedAt: new Date(),
  });
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus
): Promise<void> {
  await chatDb.messages.update(messageId, { status, localOnly: status !== 'sent' && status !== 'delivered' });
}

export async function getUnreadCount(channelId: string, lastReadAt?: Date): Promise<number> {
  if (!lastReadAt) return 0;

  return chatDb.messages
    .where('[channelId+createdAt]')
    .between([channelId, lastReadAt], [channelId, Dexie.maxKey], false, true)
    .count();
}

export async function clearChannelMessages(channelId: string): Promise<void> {
  await chatDb.messages.where('channelId').equals(channelId).delete();
}

export async function queueOperation(
  operation: SyncQueueItem['operation'],
  payload: Record<string, unknown>
): Promise<void> {
  await chatDb.syncQueue.add({
    operation,
    payload,
    createdAt: new Date(),
    attempts: 0,
  });
}

export async function processQueue(): Promise<void> {
  const items = await chatDb.syncQueue.orderBy('createdAt').limit(10).toArray();

  for (const item of items) {
    try {
      // Process based on operation type
      // This will be called by the sync service
      await chatDb.syncQueue.delete(item.id!);
    } catch (error) {
      // Increment attempts, delete if too many failures
      if (item.attempts >= 3) {
        await chatDb.syncQueue.delete(item.id!);
      } else {
        await chatDb.syncQueue.update(item.id!, { attempts: item.attempts + 1 });
      }
    }
  }
}

export default chatDb;
