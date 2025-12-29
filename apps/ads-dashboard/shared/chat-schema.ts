// Admiral Chat - Database Schema
// Chat tables for team communication

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// CHANNEL TYPES
// ============================================

export const channelTypes = ["public", "private", "dm"] as const;
export type ChannelType = typeof channelTypes[number];

export const messageTypes = ["text", "sms_inbound", "sms_outbound", "system", "sequence"] as const;
export type MessageType = typeof messageTypes[number];

// ============================================
// CHANNELS TABLE
// ============================================

export const chatChannels = pgTable("chat_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull().default("public"), // 'public' | 'private' | 'dm'
  name: text("name"),
  description: text("description"),
  slug: text("slug").unique(), // 'general', 'sales', 'marketing', etc.
  createdBy: varchar("created_by"), // workspaceMemberId
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChannelSchema = createInsertSchema(chatChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof chatChannels.$inferSelect;

// ============================================
// CHANNEL PARTICIPANTS TABLE
// ============================================

export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => chatChannels.id),
  workspaceMemberId: varchar("workspace_member_id").notNull(),
  role: text("role").default("member"), // 'owner' | 'admin' | 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at"),
  muted: boolean("muted").default(false),
});

export const insertParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
});

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof chatParticipants.$inferSelect;

// ============================================
// MESSAGES TABLE
// ============================================

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => chatChannels.id),
  senderId: varchar("sender_id").notNull(), // workspaceMemberId or 'system'
  senderName: text("sender_name"), // Cached for display
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // 'text' | 'sms_inbound' | 'system' | 'sequence'
  metadata: jsonb("metadata"), // For SMS: { fromPhone, toPhone, twilioSid }, For sequences: { sequenceId, step, leadId }
  threadId: varchar("thread_id"), // For threaded replies
  replyTo: varchar("reply_to").references(() => chatMessages.id),
  createdAt: timestamp("created_at").defaultNow(),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
});

export const insertMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  editedAt: true,
  deletedAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof chatMessages.$inferSelect;

// ============================================
// LEAD LINKS TABLE (Optional - connects to Twenty CRM)
// ============================================

export const chatLeadLinks = pgTable("chat_lead_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => chatChannels.id),
  messageId: varchar("message_id").references(() => chatMessages.id),
  twentyPersonId: varchar("twenty_person_id").notNull(), // Lead ID in Twenty CRM
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadLinkSchema = createInsertSchema(chatLeadLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertLeadLink = z.infer<typeof insertLeadLinkSchema>;
export type LeadLink = typeof chatLeadLinks.$inferSelect;

// ============================================
// DEFAULT CHANNELS TO SEED
// ============================================

export const defaultChannels: Omit<InsertChannel, "createdBy">[] = [
  {
    type: "public",
    name: "General",
    slug: "general",
    description: "Team-wide announcements and discussion",
  },
  {
    type: "public",
    name: "Sales",
    slug: "sales",
    description: "Sales team coordination and wins",
  },
  {
    type: "public",
    name: "Marketing",
    slug: "marketing",
    description: "Marketing updates and content ideas",
  },
  {
    type: "private",
    name: "SMS Inbox",
    slug: "sms-inbox",
    description: "Inbound SMS messages from leads (Owners only)",
  },
];
