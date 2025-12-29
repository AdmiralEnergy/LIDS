// Admiral Chat - Message Bubble
// Individual message display

import React from 'react';
import {
  User,
  Phone,
  AlertCircle,
  Clock,
  Check,
  CheckCheck,
  Bell,
} from 'lucide-react';
import type { LocalMessage } from '../types';

export interface MessageBubbleProps {
  message: LocalMessage;
  isOwn: boolean;
  showSender?: boolean;
}

export function MessageBubble({ message, isOwn, showSender = true }: MessageBubbleProps) {
  const isSystem = message.messageType === 'system';
  const isSms = message.messageType === 'sms_inbound' || message.messageType === 'sms_outbound';
  const isSequence = message.messageType === 'sequence';

  // System messages render differently
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  // Sequence/cadence notifications
  if (isSequence) {
    return (
      <div className="flex justify-center py-2">
        <div className="bg-[#c9a648]/10 border border-[#c9a648]/30 rounded-lg px-4 py-2 max-w-md">
          <div className="flex items-center gap-2 text-[#c9a648] mb-1">
            <Bell className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">
              Cadence Reminder
            </span>
          </div>
          <p className="text-sm text-white">{message.content}</p>
          {message.metadata?.leadName && (
            <p className="text-xs text-gray-400 mt-1">
              Lead: {message.metadata.leadName}
            </p>
          )}
        </div>
      </div>
    );
  }

  // SMS messages
  if (isSms) {
    const isInbound = message.messageType === 'sms_inbound';
    return (
      <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} mb-3`}>
        <div
          className={`max-w-[70%] rounded-lg px-3 py-2 ${
            isInbound
              ? 'bg-purple-900/50 border border-purple-700'
              : 'bg-blue-900/50 border border-blue-700'
          }`}
        >
          <div className="flex items-center gap-1 mb-1">
            <Phone className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-400">
              {isInbound ? 'SMS from' : 'SMS to'} {message.metadata?.fromPhone || message.metadata?.toPhone}
            </span>
          </div>
          <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Regular chat messages
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[70%] rounded-lg px-3 py-2 ${
          isOwn
            ? 'bg-[#0c2f4a] text-white'
            : 'bg-gray-800 text-white'
        }`}
      >
        {/* Sender name (for others' messages) */}
        {showSender && !isOwn && message.senderName && (
          <div className="flex items-center gap-1 mb-1">
            <User className="w-3 h-3 text-[#c9a648]" />
            <span className="text-xs text-[#c9a648] font-medium">
              {message.senderName}
            </span>
          </div>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Timestamp and status */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs text-gray-500">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function MessageStatus({ status }: { status: LocalMessage['status'] }) {
  switch (status) {
    case 'pending':
      return <Clock className="w-3 h-3 text-gray-500" />;
    case 'sent':
      return <Check className="w-3 h-3 text-gray-400" />;
    case 'delivered':
      return <CheckCheck className="w-3 h-3 text-[#c9a648]" />;
    case 'failed':
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    default:
      return null;
  }
}

function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default MessageBubble;
