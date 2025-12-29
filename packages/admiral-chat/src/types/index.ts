// Admiral Chat Types

export type ChannelType = 'public' | 'private' | 'dm';
export type MessageType = 'text' | 'sms_inbound' | 'sms_outbound' | 'system' | 'sequence';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface Channel {
  id: string;
  type: ChannelType;
  name?: string;
  slug?: string;
  description?: string;
  participants?: string[]; // workspaceMemberIds for DMs
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface LocalChannel extends Channel {
  unreadCount: number;
  lastMessagePreview?: string;
  lastMessageAt?: Date;
  cachedAt: Date;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType: MessageType;
  metadata?: MessageMetadata;
  threadId?: string;
  replyTo?: string;
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

export interface LocalMessage extends Message {
  status: MessageStatus;
  localOnly?: boolean; // True until synced to server
}

export interface MessageMetadata {
  // SMS metadata
  fromPhone?: string;
  toPhone?: string;
  twilioSid?: string;

  // Sequence/cadence metadata
  sequenceId?: string;
  sequenceStep?: number;
  sequenceDay?: number;
  leadId?: string;
  leadName?: string;

  // System message metadata
  actionType?: string;
  actionData?: Record<string, unknown>;
}

export interface Participant {
  id: string;
  channelId: string;
  workspaceMemberId: string;
  name?: string;
  email?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
  muted: boolean;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface PollResponse {
  hasNew: boolean;
  channels: {
    id: string;
    newCount: number;
    lastMessageAt: Date;
  }[];
}

export interface ChatContextValue {
  // State
  channels: LocalChannel[];
  activeChannel: LocalChannel | null;
  messages: LocalMessage[];
  members: WorkspaceMember[];
  isLoading: boolean;
  isOnline: boolean;
  unreadTotal: number;

  // Actions
  setActiveChannel: (channelId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  createDM: (memberId: string) => Promise<string>;
  markAsRead: (channelId: string) => Promise<void>;
  refreshChannels: () => Promise<void>;
}

// Cadence-specific types (for n8n integration)
export interface CadenceNotification {
  type: 'call_due' | 'email_due' | 'sms_due' | 'status_update';
  leadId: string;
  leadName: string;
  leadPhone?: string;
  sequenceDay: number;
  sequenceName: string;
  dueAt: Date;
  message: string;
}
