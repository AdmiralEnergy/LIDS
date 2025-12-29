// Admiral Chat - Channel Header
// Header showing current channel info

import React from 'react';
import { Hash, Users, Phone, X } from 'lucide-react';
import type { LocalChannel } from '../types';

export interface ChannelHeaderProps {
  channel: LocalChannel | null;
  onClose?: () => void;
  className?: string;
}

export function ChannelHeader({ channel, onClose, className = '' }: ChannelHeaderProps) {
  if (!channel) {
    return (
      <div className={`border-b border-gray-700 bg-gray-900 p-4 ${className}`}>
        <p className="text-gray-500">Select a channel</p>
      </div>
    );
  }

  const getIcon = () => {
    switch (channel.type) {
      case 'dm':
        return <Users className="w-5 h-5 text-[#c9a648]" />;
      case 'public':
      default:
        return <Hash className="w-5 h-5 text-[#c9a648]" />;
    }
  };

  const getTitle = () => {
    if (channel.name) return channel.name;
    if (channel.slug) return channel.slug;
    if (channel.type === 'dm' && channel.participants) {
      return `DM with ${channel.participants.length} member(s)`;
    }
    return 'Chat';
  };

  return (
    <div
      className={`flex items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        {getIcon()}
        <div>
          <h3 className="font-semibold text-white">{getTitle()}</h3>
          {channel.description && (
            <p className="text-xs text-gray-400">{channel.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* SMS inbox indicator */}
        {channel.slug === 'sms-inbox' && (
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/50 rounded text-xs text-purple-300">
            <Phone className="w-3 h-3" />
            SMS Inbox
          </div>
        )}

        {/* Close button (for panels/modals) */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ChannelHeader;
