// Admiral Chat - Unified Routes
// Shared chat backend for all LIDS apps
// MVP: In-memory storage

import { Router, type Request, type Response } from "express";

const router = Router();

// ============================================
// IN-MEMORY STORAGE (MVP - will migrate to DB)
// ============================================

interface Channel {
  id: string;
  type: "public" | "private" | "dm";
  name: string | null;
  slug: string | null;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string | null;
  content: string;
  messageType: "text" | "sms_inbound" | "sms_outbound" | "system" | "sequence";
  replyTo: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

interface Participant {
  id: string;
  channelId: string;
  workspaceMemberId: string;
  role: "owner" | "member";
  lastReadAt: Date | null;
}

// Storage
const channels: Map<string, Channel> = new Map();
const messages: Map<string, Message> = new Map();
const participants: Map<string, Participant> = new Map();

// Default channels to seed
const defaultChannels = [
  { id: "ch-general", type: "public" as const, name: "general", slug: "general", description: "General team discussion" },
  { id: "ch-sales", type: "public" as const, name: "sales", slug: "sales", description: "Sales team updates and wins" },
  { id: "ch-marketing", type: "public" as const, name: "marketing", slug: "marketing", description: "Marketing campaigns and content" },
  { id: "ch-sms-inbox", type: "private" as const, name: "SMS Inbox", slug: "sms-inbox", description: "Inbound SMS messages (owners only)" },
];

// Auto-seed default channels on startup
function seedDefaultChannels() {
  if (channels.size === 0) {
    const now = new Date();
    for (const ch of defaultChannels) {
      channels.set(ch.id, {
        ...ch,
        createdBy: "system",
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log("[Admiral Chat] Seeded default channels");
  }
}
seedDefaultChannels();

// Helper: Generate UUID
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Twenty CRM config
const TWENTY_CRM_URL = process.env.TWENTY_CRM_URL || "http://localhost:3001";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY;

// ============================================
// CHANNEL ENDPOINTS
// ============================================

router.get("/channels", async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-workspace-member-id"] as string;

    const publicChannels = Array.from(channels.values())
      .filter((c) => c.type === "public")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const userParticipations = Array.from(participants.values()).filter(
      (p) => p.workspaceMemberId === userId
    );

    const userChannelIds = new Set(userParticipations.map((p) => p.channelId));
    const privateChannels = Array.from(channels.values())
      .filter((c) => c.type !== "public" && userChannelIds.has(c.id))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const allChannels = [...publicChannels, ...privateChannels];

    const channelsWithMeta = allChannels.map((channel) => {
      const participation = userParticipations.find((p) => p.channelId === channel.id);
      const lastReadAt = participation?.lastReadAt;

      const channelMessages = Array.from(messages.values())
        .filter((m) => m.channelId === channel.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      let unreadCount = 0;
      if (lastReadAt) {
        unreadCount = channelMessages.filter((m) => m.createdAt > lastReadAt).length;
      } else {
        unreadCount = channelMessages.length;
      }

      const lastMessage = channelMessages[0];

      return {
        ...channel,
        unreadCount,
        lastMessagePreview: lastMessage?.content?.slice(0, 50),
        lastMessageAt: lastMessage?.createdAt,
        cachedAt: new Date(),
      };
    });

    res.json(channelsWithMeta);
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});

router.post("/channels", async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-workspace-member-id"] as string;
    const { type, name, participantIds } = req.body as {
      type: "public" | "private" | "dm";
      name?: string;
      participantIds?: string[];
    };

    if (type === "dm" && participantIds?.length) {
      const existingDM = Array.from(channels.values()).find((ch) => {
        if (ch.type !== "dm") return false;
        const chParticipants = Array.from(participants.values()).filter(
          (p) => p.channelId === ch.id
        );
        const participantSet = new Set(chParticipants.map((p) => p.workspaceMemberId));
        return participantSet.has(userId) && participantSet.has(participantIds[0]);
      });

      if (existingDM) {
        return res.json(existingDM);
      }
    }

    const now = new Date();
    const channel: Channel = {
      id: `ch-${uuid()}`,
      type,
      name: name || null,
      slug: name?.toLowerCase().replace(/\s+/g, "-") || null,
      description: null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    channels.set(channel.id, channel);

    const allParticipantIds = [userId, ...(participantIds || [])];
    for (const memberId of allParticipantIds) {
      const participant: Participant = {
        id: `part-${uuid()}`,
        channelId: channel.id,
        workspaceMemberId: memberId,
        role: memberId === userId ? "owner" : "member",
        lastReadAt: null,
      };
      participants.set(participant.id, participant);
    }

    res.json(channel);
  } catch (error) {
    console.error("Failed to create channel:", error);
    res.status(500).json({ error: "Failed to create channel" });
  }
});

// ============================================
// MESSAGE ENDPOINTS
// ============================================

router.get("/channels/:channelId/messages", async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const { before, limit = "50" } = req.query;
    const limitNum = parseInt(limit as string);

    let channelMessages = Array.from(messages.values())
      .filter((m) => m.channelId === channelId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (before) {
      const beforeDate = new Date(before as string);
      channelMessages = channelMessages.filter((m) => m.createdAt < beforeDate);
    }

    const limited = channelMessages.slice(0, limitNum);
    res.json(limited.reverse());
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/channels/:channelId/messages", async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-workspace-member-id"] as string;
    const userName = req.headers["x-workspace-member-name"] as string;
    const { channelId } = req.params;
    const { content, replyTo, metadata, messageType } = req.body;

    const now = new Date();
    const message: Message = {
      id: `msg-${uuid()}`,
      channelId,
      senderId: userId || "system",
      senderName: userName || null,
      content,
      messageType: messageType || "text",
      replyTo: replyTo || null,
      metadata: metadata || null,
      createdAt: now,
    };

    messages.set(message.id, message);

    const channel = channels.get(channelId);
    if (channel) {
      channel.updatedAt = now;
    }

    res.json(message);
  } catch (error) {
    console.error("Failed to send message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/channels/:channelId/read", async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-workspace-member-id"] as string;
    const { channelId } = req.params;

    let participation = Array.from(participants.values()).find(
      (p) => p.channelId === channelId && p.workspaceMemberId === userId
    );

    if (participation) {
      participation.lastReadAt = new Date();
    } else {
      participation = {
        id: `part-${uuid()}`,
        channelId,
        workspaceMemberId: userId,
        role: "member",
        lastReadAt: new Date(),
      };
      participants.set(participation.id, participation);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark as read:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// ============================================
// POLLING ENDPOINT
// ============================================

router.get("/poll", async (req: Request, res: Response) => {
  try {
    const { since } = req.query;
    const sinceDate = since ? new Date(since as string) : new Date(0);

    const newMessages = Array.from(messages.values()).filter(
      (m) => m.createdAt > sinceDate
    );

    const channelUpdates = new Map<string, { count: number; lastAt: Date }>();
    for (const msg of newMessages) {
      const existing = channelUpdates.get(msg.channelId);
      if (existing) {
        existing.count++;
        if (msg.createdAt > existing.lastAt) {
          existing.lastAt = msg.createdAt;
        }
      } else {
        channelUpdates.set(msg.channelId, {
          count: 1,
          lastAt: msg.createdAt,
        });
      }
    }

    res.json({
      hasNew: channelUpdates.size > 0,
      channels: Array.from(channelUpdates.entries()).map(([id, data]) => ({
        id,
        newCount: data.count,
        lastMessageAt: data.lastAt,
      })),
    });
  } catch (error) {
    console.error("Poll failed:", error);
    res.status(500).json({ error: "Poll failed" });
  }
});

// ============================================
// MEMBERS ENDPOINT
// ============================================

router.get("/members", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${TWENTY_CRM_URL}/rest/workspaceMembers`, {
      headers: {
        Authorization: `Bearer ${TWENTY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from Twenty CRM");
    }

    const data = await response.json();
    const members = data.data?.workspaceMembers || [];

    const transformed = members.map((m: any) => ({
      id: m.id,
      name: m.name?.firstName
        ? `${m.name.firstName} ${m.name.lastName || ""}`.trim()
        : m.userEmail,
      email: m.userEmail,
      avatarUrl: m.avatarUrl,
    }));

    res.json(transformed);
  } catch (error) {
    console.error("Failed to fetch members:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// ============================================
// SMS / SEQUENCE INTEGRATION
// ============================================

router.post("/sms/inbound", async (req: Request, res: Response) => {
  try {
    const { from, body, twilioSid, leadId, leadName } = req.body;

    const now = new Date();
    const message: Message = {
      id: `msg-${uuid()}`,
      channelId: "ch-sms-inbox",
      senderId: "sms",
      senderName: leadName || from,
      content: body,
      messageType: "sms_inbound",
      replyTo: null,
      metadata: { fromPhone: from, twilioSid, leadId },
      createdAt: now,
    };

    messages.set(message.id, message);

    const channel = channels.get("ch-sms-inbox");
    if (channel) {
      channel.updatedAt = now;
    }

    res.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error("Failed to add SMS to chat:", error);
    res.status(500).json({ error: "Failed to add SMS to chat" });
  }
});

router.post("/sequence/notification", async (req: Request, res: Response) => {
  try {
    const { channelId, type, leadId, leadName, sequenceDay, dueAction, metadata } = req.body;

    const now = new Date();
    const content = `📋 ${dueAction} due for **${leadName}** (Day ${sequenceDay})`;

    const message: Message = {
      id: `msg-${uuid()}`,
      channelId: channelId || "ch-sales",
      senderId: "system",
      senderName: "Admiral Cadence",
      content,
      messageType: "sequence",
      replyTo: null,
      metadata: { notificationType: type, leadId, leadName, sequenceDay, dueAction, ...metadata },
      createdAt: now,
    };

    messages.set(message.id, message);

    const channel = channels.get(message.channelId);
    if (channel) {
      channel.updatedAt = now;
    }

    res.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error("Failed to add sequence notification:", error);
    res.status(500).json({ error: "Failed to add sequence notification" });
  }
});

// ============================================
// DEBUG
// ============================================

router.get("/debug/stats", async (req: Request, res: Response) => {
  res.json({
    channels: channels.size,
    messages: messages.size,
    participants: participants.size,
    channelList: Array.from(channels.values()).map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    })),
  });
});

export { router as chatRoutes };
