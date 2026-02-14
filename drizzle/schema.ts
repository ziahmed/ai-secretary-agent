import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/pg-core";

// Enum types
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const meetingsStatusEnum = pgEnum("meetings_status", ["scheduled", "completed", "cancelled"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const tasksStatusEnum = pgEnum("tasks_status", ["open", "in_progress", "completed", "blocked", "overdue"]);
export const actionItemsStatusEnum = pgEnum("actionItems_status", ["pending", "assigned", "completed"]);
export const reviewTypeEnum = pgEnum("review_type", ["meeting_summary", "action_items", "email_draft", "translation"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected", "edited"]);
export const emailTypeEnum = pgEnum("emailType", ["reminder", "escalation", "meeting_invite", "meeting_cancellation", "status_update"]);
export const emailStatusEnum = pgEnum("email_status", ["sent", "failed", "delivered", "opened"]);
export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);
export const syncStatusEnum = pgEnum("syncStatus", ["active", "paused", "error"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Meetings table - stores meeting information
 */
export const meetings = pgTable("meetings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  meetingDate: timestamp("meetingDate").notNull(),
  duration: integer("duration"), // in minutes
  location: varchar("location", { length: 255 }),
  meetLink: text("meetLink"), // Google Meet or other video conference link
  participants: text("participants"), // JSON array of participant emails
  status: meetingsStatusEnum("status").default("scheduled").notNull(),
  minutesUrl: text("minutesUrl"), // S3 URL to meeting minutes document
  summaryText: text("summaryText"), // AI-generated summary
  transcriptUrl: text("transcriptUrl"), // Google Drive URL to meeting transcript
  externalId: varchar("externalId", { length: 255 }), // ID from external source (Google Calendar, Gmail)
  externalSource: varchar("externalSource", { length: 50 }), // Source: google_calendar, gmail, etc
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

/**
 * Tasks table - stores task information
 */
export const tasks = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: integer("ownerId"), // assigned user
  ownerEmail: varchar("ownerEmail", { length: 320 }), // for external users
  deadline: timestamp("deadline"),
  priority: priorityEnum("priority").default("medium").notNull(),
  status: tasksStatusEnum("status").default("open").notNull(),
  meetingId: integer("meetingId"), // optional link to meeting
  createdBy: integer("createdBy").notNull(),
  lastReminderSent: timestamp("lastReminderSent"),
  escalatedAt: timestamp("escalatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Action items table - specific action items extracted from meetings
 */
export const actionItems = pgTable("actionItems", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  meetingId: integer("meetingId").notNull(),
  taskId: integer("taskId"), // linked task if created
  description: text("description").notNull(),
  ownerId: integer("ownerId"),
  ownerEmail: varchar("ownerEmail", { length: 320 }),
  deadline: timestamp("deadline"),
  status: actionItemsStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = typeof actionItems.$inferInsert;

/**
 * Review queue table - human-in-the-loop approval workflow
 */
export const reviewQueue = pgTable("reviewQueue", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: reviewTypeEnum("type").notNull(),
  referenceId: integer("referenceId"), // ID of related meeting/task/etc
  content: text("content").notNull(), // content to be reviewed
  originalContent: text("originalContent"), // original content before translation
  metadata: text("metadata"), // JSON with additional context
  status: reviewStatusEnum("status").default("pending").notNull(),
  reviewedBy: integer("reviewedBy"),
  reviewNotes: text("reviewNotes"),
  reviewedAt: timestamp("reviewedAt"),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ReviewQueueItem = typeof reviewQueue.$inferSelect;
export type InsertReviewQueueItem = typeof reviewQueue.$inferInsert;

/**
 * Email logs table - track sent notifications
 */
export const emailLogs = pgTable("emailLogs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  emailType: emailTypeEnum("emailType").notNull(),
  relatedTaskId: integer("relatedTaskId"),
  relatedMeetingId: integer("relatedMeetingId"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: emailStatusEnum("status").default("sent").notNull(),
  deliveredAt: timestamp("deliveredAt"),
  openedAt: timestamp("openedAt"),
  trackingId: varchar("trackingId", { length: 100 }),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/**
 * Chat messages table - store chatbot conversations
 */
export const chatMessages = pgTable("chatMessages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON with additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Gmail sync state table - track email synchronization
 */
export const gmailSyncState = pgTable("gmailSyncState", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  lastSyncToken: text("lastSyncToken"),
  lastSyncedAt: timestamp("lastSyncedAt"),
  syncStatus: syncStatusEnum("syncStatus").default("active").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GmailSyncState = typeof gmailSyncState.$inferSelect;
export type InsertGmailSyncState = typeof gmailSyncState.$inferInsert;
