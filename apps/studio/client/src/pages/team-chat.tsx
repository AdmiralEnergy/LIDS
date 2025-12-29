// Studio - Team Chat Page
// Team communication via Admiral Chat

import { ChatWindow } from "@lids/admiral-chat/components";
import { useUser } from "@/lib/user-context";

export default function TeamChat() {
  const { currentUser } = useUser();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="text-gray-400">Please log in to access team chat.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-64px)]">
      <ChatWindow
        currentUserId={currentUser.id}
        showChannelList={true}
        defaultChannelSlug="marketing"
        className="h-full"
      />
    </div>
  );
}
