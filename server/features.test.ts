import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Meeting Management", () => {
  it("should create a new meeting", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const meeting = await caller.meetings.create({
      title: "Test Meeting",
      description: "Test meeting description",
      meetingDate: new Date("2026-02-01T10:00:00Z"),
      location: "Conference Room A",
    });

    expect(meeting).toBeDefined();
    expect(meeting.title).toBe("Test Meeting");
    expect(meeting.status).toBe("scheduled");
    expect(meeting.createdBy).toBe(ctx.user.id);
  });

  it("should list all meetings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const meetings = await caller.meetings.list();

    expect(Array.isArray(meetings)).toBe(true);
  });

  it("should get meeting by id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a meeting first
    const created = await caller.meetings.create({
      title: "Test Meeting for Get",
      meetingDate: new Date("2026-02-01T10:00:00Z"),
    });

    const meeting = await caller.meetings.getById({ id: created.id });

    expect(meeting).toBeDefined();
    expect(meeting?.id).toBe(created.id);
    expect(meeting?.title).toBe("Test Meeting for Get");
  });
});

describe("Task Management", () => {
  it("should create a new task", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const task = await caller.tasks.create({
      title: "Test Task",
      description: "Test task description",
      ownerEmail: "owner@example.com",
      deadline: new Date("2026-02-15T17:00:00Z"),
      priority: "high",
    });

    expect(task).toBeDefined();
    expect(task.title).toBe("Test Task");
    expect(task.priority).toBe("high");
    expect(task.status).toBe("open");
    expect(task.createdBy).toBe(ctx.user.id);
  });

  it("should list all tasks", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tasks = await caller.tasks.list();

    expect(Array.isArray(tasks)).toBe(true);
  });

  it("should mark task as complete", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a task first
    const created = await caller.tasks.create({
      title: "Task to Complete",
      priority: "medium",
    });

    const completed = await caller.tasks.markComplete({ id: created.id });

    expect(completed).toBeDefined();
    expect(completed?.status).toBe("completed");
  });

  it("should get tasks by status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const openTasks = await caller.tasks.getByStatus({ status: "open" });

    expect(Array.isArray(openTasks)).toBe(true);
  });
});

describe("Review Queue", () => {
  it("should create review item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a meeting first to have a reference
    const meeting = await caller.meetings.create({
      title: "Meeting for Review",
      meetingDate: new Date("2026-02-01T10:00:00Z"),
    });

    const reviewItem = await db.createReviewItem({
      type: "meeting_summary",
      referenceId: meeting.id,
      content: "This is a test summary for review",
      createdBy: ctx.user.id,
    });

    expect(reviewItem).toBeDefined();
    expect(reviewItem.type).toBe("meeting_summary");
    expect(reviewItem.status).toBe("pending");
  });

  it("should list pending review items", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const pending = await caller.review.getPending();

    expect(Array.isArray(pending)).toBe(true);
  });

  it("should approve review item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a review item first
    const reviewItem = await db.createReviewItem({
      type: "email_draft",
      content: "Test email content",
      createdBy: ctx.user.id,
    });

    const approved = await caller.review.approve({
      id: reviewItem.id,
    });

    expect(approved).toBeDefined();
    expect(approved?.status).toBe("approved");
    expect(approved?.reviewedBy).toBe(ctx.user.id);
  });

  it("should reject review item with notes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a review item first
    const reviewItem = await db.createReviewItem({
      type: "translation",
      content: "Test translation",
      createdBy: ctx.user.id,
    });

    const rejected = await caller.review.reject({
      id: reviewItem.id,
      notes: "Content needs revision",
    });

    expect(rejected).toBeDefined();
    expect(rejected?.status).toBe("rejected");
    expect(rejected?.reviewNotes).toBe("Content needs revision");
  });
});

describe("Chat System", () => {
  it("should save and retrieve chat messages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Send a message
    const response = await caller.chat.sendMessage({
      message: "What tasks are open?",
    });

    expect(response).toBeDefined();
    expect(response.response).toBeDefined();
    expect(typeof response.response).toBe("string");

    // Get history
    const history = await caller.chat.getHistory({ limit: 10 });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });
});

describe("Translation Service", () => {
  it("should translate text and create review item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.translation.translate({
      text: "Hello, this is a test message",
      sourceLanguage: "en",
    });

    expect(result).toBeDefined();
    expect(result.translatedText).toBeDefined();
    expect(result.originalText).toBe("Hello, this is a test message");
  });
});

describe("Email Draft Service", () => {
  it("should draft reminder email for task", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a task first
    const task = await caller.tasks.create({
      title: "Task needing reminder",
      ownerEmail: "owner@example.com",
      priority: "high",
      deadline: new Date("2026-02-20T17:00:00Z"),
    });

    const draft = await caller.email.draftReminder({
      taskId: task.id,
    });

    expect(draft).toBeDefined();
    expect(draft.emailDraft).toBeDefined();
    expect(draft.reviewId).toBeDefined();
    expect(typeof draft.emailDraft).toBe("string");
  });

  it("should draft escalation email for overdue task", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an overdue task
    const task = await caller.tasks.create({
      title: "Overdue task",
      ownerEmail: "owner@example.com",
      priority: "urgent",
      deadline: new Date("2026-01-01T17:00:00Z"),
    });

    // Update to overdue status
    await caller.tasks.update({
      id: task.id,
      status: "overdue",
    });

    const draft = await caller.email.draftEscalation({
      taskId: task.id,
    });

    expect(draft).toBeDefined();
    expect(draft.emailDraft).toBeDefined();
    expect(draft.reviewId).toBeDefined();
  }, 10000); // Increase timeout for LLM call
});
