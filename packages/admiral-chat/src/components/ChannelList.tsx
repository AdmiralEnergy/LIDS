// Admiral Chat - Channel List
// Sidebar showing channels and DMs

import React from 'react';
import { Hash, MessageCircle, Users, Plus } from 'lucide-react';
import type { LocalChannel } from '../types';

export interface ChannelListProps {
  channels: LocalChannel[];
  activeChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onNewDM?: () => void;
  className?: string;
}

export function ChannelList({
  channels,
  activeChannelId,
  onSelectChannel,
  onNewDM,
  className = '',
}: ChannelListProps) {
  // Separate public channels from DMs
  const publicChannels = channels.filter(ch => ch.type === 'public');
  const dmChannels = channels.filter(ch => ch.type === 'dm');

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#c9a648]" />
          Admiral Chat
        </h2>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Public Channels */}
        <div className="mb-4">
          <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Channels
          </div>
          {publicChannels.map(channel => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              onClick={() => onSelectChannel(channel.id)}
              icon={<Hash className="w-4 h-4" />}
            />
          ))}
        </div>

        {/* Direct Messages */}
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Direct Messages
            </span>
            {onNewDM && (
              <button
                onClick={onNewDM}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                title="New Message"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          {dmChannels.map(channel => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              onClick={() => onSelectChannel(channel.id)}
              icon={<Users className="w-4 h-4" />}
            />
          ))}
          {dmChannels.length === 0 && (
            <p className="px-2 py-2 text-sm text-gray-500">
              No conversations yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChannelItemProps {
  channel: LocalChannel;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

function ChannelItem({ channel, isActive, onClick, icon }: ChannelItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
        isActive
          ? 'bg-[#c9a648]/20 text-[#c9a648]'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <span className={isActive ? 'text-[#c9a648]' : 'text-gray-400'}>
        {icon}
      </span>
      <span className="flex-1 truncate">
        {channel.name || channel.slug || 'Unnamed'}
      </span>
      {channel.unreadCount > 0 && (
        <span className="bg-[#c9a648] text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {channel.unreadCount}
        </span>
      )}
    </button>
  );
}

export default ChannelList;
