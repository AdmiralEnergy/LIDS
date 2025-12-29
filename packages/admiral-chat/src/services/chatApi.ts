// Admiral Chat - API Service
// HTTP client for chat server endpoints

import type {
  Channel,
  Message,
  LocalChannel,
  LocalMessage,
  WorkspaceMember,
  PollResponse,
} from '../types';

const API_BASE = '/api/chat';

// Get current user from localStorage (set by Twenty auth)
function getCurrentUser(): { id: string; name: string } | null {
  try {
    const userId = localStorage.getItem('workspaceMemberId');
    const userName = localStorage.getItem('workspaceMemberName');
    if (userId) {
      return { id: userId, name: userName || 'Unknown' };
    }
  } catch {
    // localStorage not available
  }
  return null;
}

async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: Record<string, unknown>
): Promise<T> {
  const user = getCurrentUser();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (user) {
    headers['x-workspace-member-id'] = user.id;
    headers['x-workspace-member-name'] = user.name;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API error: ${response.status}`);
  }

  return response.json();
}

// Channel operations

export async function fetchChannels(): Promise<LocalChannel[]> {
  return apiRequest<LocalChannel[]>('GET', '/channels');
}

export async function createChannel(data: {
  type: 'public' | 'private' | 'dm';
  name?: string;
  participantIds?: string[];
}): Promise<Channel> {
  return apiRequest<Channel>('POST', '/channels', data);
}

export async function findOrCreateDM(memberId: string): Promise<Channel> {
  return apiRequest<Channel>('POST', '/channels', {
    type: 'dm',
    participantIds: [memberId],
  });
}

// Message operations

export async function fetchMessages(
  channelId: string,
  options?: { before?: string; limit?: number }
): Promise<Message[]> {
  const params = new URLSearchParams();
  if (options?.before) params.set('before', options.before);
  if (options?.limit) params.set('limit', options.limit.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<Message[]>('GET', `/channels/${channelId}/messages${query}`);
}

export async function sendMessage(
  channelId: string,
  content: string,
  options?: {
    replyTo?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<Message> {
  return apiRequest<Message>('POST', `/channels/${channelId}/messages`, {
    content,
    ...options,
  });
}

// Read receipts

export async function markChannelAsRead(channelId: string): Promise<void> {
  await apiRequest<void>('POST', `/channels/${channelId}/read`, {});
}

// Polling

export async function pollForUpdates(since: Date): Promise<PollResponse> {
  return apiRequest<PollResponse>('GET', `/poll?since=${since.toISOString()}`);
}

// Members (proxy to Twenty CRM)

export async function fetchWorkspaceMembers(): Promise<WorkspaceMember[]> {
  return apiRequest<WorkspaceMember[]>('GET', '/members');
}

// SMS operations (for owner inbox)

export async function sendSmsReply(
  phoneNumber: string,
  content: string
): Promise<{ success: boolean; sid?: string }> {
  return apiRequest<{ success: boolean; sid?: string }>('POST', '/sms/send', {
    to: phoneNumber,
    body: content,
  });
}

// Cadence/sequence helpers

export async function getCadenceNotifications(
  channelId: string
): Promise<LocalMessage[]> {
  const messages = await fetchMessages(channelId);
  return messages
    .filter(m => m.messageType === 'sequence')
    .map(m => ({
      ...m,
      status: 'delivered' as const,
    }));
}

export const chatApi = {
  fetchChannels,
  createChannel,
  findOrCreateDM,
  fetchMessages,
  sendMessage,
  markChannelAsRead,
  pollForUpdates,
  fetchWorkspaceMembers,
  sendSmsReply,
  getCadenceNotifications,
};

export default chatApi;
