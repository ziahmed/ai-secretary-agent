import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Meetings table - stores meeting information
 */
export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  meetingDate: timestamp("meetingDate").notNull(),
  duration: int("duration"), // in minutes
  location: varchar("location", { length: 255 }),
  participants: text("participants"), // JSON array of participant emails
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]).default("scheduled").notNull(),
  minutesUrl: text("minutesUrl"), // S3 URL to meeting minutes document
  summaryText: text("summaryText"), // AI-generated summary
  externalId: varchar("externalId", { length: 255 }), // ID from external source (Google Calendar, Gmail)
  externalSource: varchar("externalSource", { length: 50 }), // Source: google_calendar, gmail, etc
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

/**
 * Tasks table - stores task information
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId"), // assigned user
  ownerEmail: varchar("ownerEmail", { length: 320 }), // for external users
  deadline: timestamp("deadline"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "completed", "blocked", "overdue"]).default("open").notNull(),
  meetingId: int("meetingId"), // optional link to meeting
  createdBy: int("createdBy").notNull(),
  lastReminderSent: timestamp("lastReminderSent"),
  escalatedAt: timestamp("escalatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Action items table - specific action items extracted from meetings
 */
export const actionItems = mysqlTable("actionItems", {
  id: int("id").autoincrement().primaryKey(),
  meetingId: int("meetingId").notNull(),
  taskId: int("taskId"), // linked task if created
  description: text("description").notNull(),
  ownerId: int("ownerId"),
  ownerEmail: varchar("ownerEmail", { length: 320 }),
  deadline: timestamp("deadline"),
  status: mysqlEnum("status", ["pending", "assigned", "completed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = typeof actionItems.$inferInsert;

/**
 * Review queue table - human-in-the-loop approval workflow
 */
export const reviewQueue = mysqlTable("reviewQueue", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["meeting_summary", "action_items", "email_draft", "translation"]).notNull(),
  referenceId: int("referenceId"), // ID of related meeting/task/etc
  content: text("content").notNull(), // content to be reviewed
  originalContent: text("originalContent"), // original content before translation
  metadata: text("metadata"), // JSON with additional context
  status: mysqlEnum("status", ["pending", "approved", "rejected", "edited"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewNotes: text("reviewNotes"),
  reviewedAt: timestamp("reviewedAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReviewQueueItem = typeof reviewQueue.$inferSelect;
export type InsertReviewQueueItem = typeof reviewQueue.$inferInsert;

/**
 * Email logs table - track sent notifications
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  emailType: mysqlEnum("emailType", ["reminder", "escalation", "meeting_invite", "meeting_cancellation", "status_update"]).notNull(),
  relatedTaskId: int("relatedTaskId"),
  relatedMeetingId: int("relatedMeetingId"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "failed"]).default("sent").notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/**
 * Chat messages table - store chatbot conversations
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON with additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Gmail sync state table - track email synchronization
 */
export const gmailSyncState = mysqlTable("gmailSyncState", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  lastSyncToken: text("lastSyncToken"),
  lastSyncedAt: timestamp("lastSyncedAt"),
  syncStatus: mysqlEnum("syncStatus", ["active", "paused", "error"]).default("active").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GmailSyncState = typeof gmailSyncState.$inferSelect;
export type InsertGmailSyncState = typeof gmailSyncState.$inferInsert;
