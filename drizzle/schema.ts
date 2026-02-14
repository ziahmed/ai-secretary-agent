import { int, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

const integer = int;

// Enum types - MySQL doesn't support enums like PostgreSQL, using varchar with check constraints
// We'll use string literals instead
type Role = "user" | "admin";
type MeetingsStatus = "scheduled" | "completed" | "cancelled";
type Priority = "low" | "medium" | "high" | "urgent";
type TasksStatus = "open" | "in_progress" | "completed" | "blocked" | "overdue";
type ActionItemsStatus = "pending" | "assigned" | "completed";
type ReviewType = "meeting_summary" | "action_items" | "email_draft" | "translation";
type ReviewStatus = "pending" | "approved" | "rejected" | "edited";
type EmailType = "reminder" | "escalation" | "meeting_invite" | "meeting_cancellation" | "status_update";
type EmailStatus = "sent" | "failed" | "delivered" | "opened";
type ChatRole = "user" | "assistant";
type SyncStatus = "active" | "paused" | "error";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: integer("id").primaryKey().autoincrement(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Meetings table - stores meeting information
 */
export const meetings = mysqlTable("meetings", {
  id: integer("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  meetingDate: timestamp("meetingDate").notNull(),
  duration: integer("duration"), // in minutes
  location: varchar("location", { length: 255 }),
  meetLink: text("meetLink"), // Google Meet or other video conference link
  participants: text("participants"), // JSON array of participant emails
  status: varchar("status", { length: 20 }).default("scheduled").notNull(),
  minutesUrl: text("minutesUrl"), // S3 URL to meeting minutes document
  summaryText: text("summaryText"), // AI-generated summary
  transcript: text("transcript"), // Actual transcript text from Whisper
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
export const tasks = mysqlTable("tasks", {
  id: integer("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: integer("ownerId"), // assigned user
  ownerEmail: varchar("ownerEmail", { length: 320 }), // for external users
  deadline: timestamp("deadline"),
  priority: varchar("priority", { length: 20 }).default("medium").notNull(),
  status: varchar("status", { length: 20 }).default("open").notNull(),
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
export const actionItems = mysqlTable("actionItems", {
  id: integer("id").primaryKey().autoincrement(),
  meetingId: integer("meetingId").notNull(),
  taskId: integer("taskId"), // linked task if created
  description: text("description").notNull(),
  ownerId: integer("ownerId"),
  ownerEmail: varchar("ownerEmail", { length: 320 }),
  deadline: timestamp("deadline"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = typeof actionItems.$inferInsert;

/**
 * Review queue table - human-in-the-loop approval workflow
 */
export const reviewQueue = mysqlTable("reviewQueue", {
  id: integer("id").primaryKey().autoincrement(),
  type: varchar("type", { length: 50 }).notNull(),
  referenceId: integer("referenceId"), // ID of related meeting/task/etc
  content: text("content").notNull(), // content to be reviewed
  originalContent: text("originalContent"), // original content before translation
  metadata: text("metadata"), // JSON with additional context
  status: varchar("status", { length: 20 }).default("pending").notNull(),
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
export const emailLogs = mysqlTable("emailLogs", {
  id: integer("id").primaryKey().autoincrement(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  emailType: varchar("emailType", { length: 50 }).notNull(),
  relatedTaskId: integer("relatedTaskId"),
  relatedMeetingId: integer("relatedMeetingId"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).default("sent").notNull(),
  deliveredAt: timestamp("deliveredAt"),
  openedAt: timestamp("openedAt"),
  trackingId: varchar("trackingId", { length: 100 }),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/**
 * Chat messages table - store chatbot conversations
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: integer("id").primaryKey().autoincrement(),
  userId: integer("userId").notNull(),
  role: varchar("role", { length: 20 }).notNull(),
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
  id: integer("id").primaryKey().autoincrement(),
  userId: integer("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  lastSyncToken: text("lastSyncToken"),
  lastSyncedAt: timestamp("lastSyncedAt"),
  syncStatus: varchar("syncStatus", { length: 20 }).default("active").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GmailSyncState = typeof gmailSyncState.$inferSelect;
export type InsertGmailSyncState = typeof gmailSyncState.$inferInsert;
