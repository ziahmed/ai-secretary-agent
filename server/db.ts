import { eq, desc, and, or, lt, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  meetings, InsertMeeting, Meeting,
  tasks, InsertTask, Task,
  actionItems, InsertActionItem, ActionItem,
  reviewQueue, InsertReviewQueueItem, ReviewQueueItem,
  emailLogs, InsertEmailLog, EmailLog,
  chatMessages, InsertChatMessage, ChatMessage,
  gmailSyncState, InsertGmailSyncState, GmailSyncState
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= User Management =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= Meeting Management =============

export async function createMeeting(meeting: InsertMeeting): Promise<Meeting> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(meetings).values(meeting);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(meetings).where(eq(meetings.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getMeetingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllMeetings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(meetings).orderBy(desc(meetings.meetingDate));
}

export async function getMeetingsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(meetings).where(eq(meetings.createdBy, userId)).orderBy(desc(meetings.meetingDate));
}

export async function updateMeeting(id: number, updates: Partial<InsertMeeting>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(meetings).set(updates).where(eq(meetings.id, id));
  return await getMeetingById(id);
}

export async function deleteMeeting(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(meetings).where(eq(meetings.id, id));
}

// ============= Task Management =============

export async function createTask(task: InsertTask): Promise<Task> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tasks).values(task);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(tasks).where(eq(tasks.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getTasksByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).where(eq(tasks.status, status as any)).orderBy(desc(tasks.deadline));
}

export async function getTasksByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).where(eq(tasks.ownerId, ownerId)).orderBy(desc(tasks.deadline));
}

export async function getOverdueTasks() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return await db.select().from(tasks)
    .where(and(
      lt(tasks.deadline, now),
      or(eq(tasks.status, 'open'), eq(tasks.status, 'in_progress'))
    ))
    .orderBy(tasks.deadline);
}

export async function updateTask(id: number, updates: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(updates).where(eq(tasks.id, id));
  return await getTaskById(id);
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ============= Action Items Management =============

export async function createActionItem(item: InsertActionItem): Promise<ActionItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(actionItems).values(item);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(actionItems).where(eq(actionItems.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getActionItemsByMeeting(meetingId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(actionItems).where(eq(actionItems.meetingId, meetingId));
}

export async function updateActionItem(id: number, updates: Partial<InsertActionItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(actionItems).set(updates).where(eq(actionItems.id, id));
}

// ============= Review Queue Management =============

export async function createReviewItem(item: InsertReviewQueueItem): Promise<ReviewQueueItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reviewQueue).values(item);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(reviewQueue).where(eq(reviewQueue.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getPendingReviewItems() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reviewQueue)
    .where(eq(reviewQueue.status, 'pending'))
    .orderBy(desc(reviewQueue.createdAt));
}

export async function getReviewItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviewQueue).where(eq(reviewQueue.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateReviewItem(id: number, updates: Partial<InsertReviewQueueItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviewQueue).set(updates).where(eq(reviewQueue.id, id));
  return await getReviewItemById(id);
}

// ============= Email Logs Management =============

export async function createEmailLog(log: InsertEmailLog): Promise<EmailLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailLogs).values(log);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(emailLogs).where(eq(emailLogs.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getEmailLogsByTask(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emailLogs)
    .where(eq(emailLogs.relatedTaskId, taskId))
    .orderBy(desc(emailLogs.sentAt));
}

// ============= Chat Messages Management =============

export async function createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(chatMessages).values(message);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(chatMessages).where(eq(chatMessages.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getChatMessagesByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

// ============= Gmail Sync State Management =============

export async function upsertGmailSyncState(state: InsertGmailSyncState) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(gmailSyncState).values(state).onDuplicateKeyUpdate({
    set: {
      lastSyncToken: state.lastSyncToken,
      lastSyncedAt: state.lastSyncedAt,
      syncStatus: state.syncStatus,
      errorMessage: state.errorMessage,
    }
  });
}

export async function getGmailSyncStateByUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gmailSyncState).where(eq(gmailSyncState.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
