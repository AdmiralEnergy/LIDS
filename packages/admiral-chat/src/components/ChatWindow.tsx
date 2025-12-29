// Admiral Chat - Chat Window
// Main chat UI container

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatProvider, useChatContext } from './ChatProvider';
import { ChannelList } from './ChannelList';
import { ChannelHeader } from './ChannelHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { NewDMModal } from './NewDMModal';
import type { UseChatOptions } from '../hooks/useChat';

export interface ChatWindowProps {
  className?: string;
  showChannelList?: boolean;
  defaultChannelSlug?: string;
  currentUserId: string;
  onClose?: () => void;
}

function ChatWindowInner({
  className = '',
  showChannelList = true,
  currentUserId,
  onClose,
}: Omit<ChatWindowProps, 'defaultChannelSlug'>) {
  const {
    channels,
    activeChannel,
    messages,
    isLoading,
    messagesLoading,
    isSending,
    members,
    setActiveChannel,
    sendMessage,
    startDM,
  } = useChatContext();

  const [showNewDM, setShowNewDM] = useState(false);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#c9a648] mx-auto mb-2" />
          <p className="text-gray-400">Loading Admiral Chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex bg-gray-900 ${className}`}>
      {/* Channel sidebar */}
      {showChannelList && (
        <ChannelList
          channels={channels}
          activeChannelId={activeChannel?.id || null}
          onSelectChannel={setActiveChannel}
          onNewDM={() => setShowNewDM(true)}
          className="w-64 flex-shrink-0 border-r border-gray-700"
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChannelHeader channel={activeChannel} onClose={onClose} />

        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={messagesLoading}
          className="flex-1"
        />

        <MessageInput
          onSend={sendMessage}
          isSending={isSending}
          disabled={!activeChannel}
          placeholder={
            activeChannel
              ? `Message #${activeChannel.name || activeChannel.slug || 'chat'}`
              : 'Select a channel'
          }
        />
      </div>

      {/* New DM Modal */}
      {showNewDM && (
        <NewDMModal
          members={members}
          onSelect={async memberId => {
            await startDM(memberId);
            setShowNewDM(false);
          }}
          onClose={() => setShowNewDM(false)}
        />
      )}
    </div>
  );
}

export function ChatWindow({
  defaultChannelSlug = 'general',
  ...props
}: ChatWindowProps) {
  const options: UseChatOptions = {
    defaultChannelSlug,
    enablePolling: true,
  };

  return (
    <ChatProvider options={options}>
      <ChatWindowInner {...props} />
    </ChatProvider>
  );
}

export default ChatWindow;
