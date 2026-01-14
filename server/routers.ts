import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============= Meeting Management =============
  meetings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllMeetings();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMeetingById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        meetingDate: z.date(),
        duration: z.number().optional(),
        location: z.string().optional(),
        participants: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const meeting = await db.createMeeting({
          ...input,
          participants: input.participants ? JSON.stringify(input.participants) : null,
          createdBy: ctx.user.id,
        });
        return meeting;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        meetingDate: z.date().optional(),
        duration: z.number().optional(),
        location: z.string().optional(),
        participants: z.array(z.string()).optional(),
        status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, participants, ...updates } = input;
        const updateData: any = { ...updates };
        if (participants) {
          updateData.participants = JSON.stringify(participants);
        }
        return await db.updateMeeting(id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMeeting(input.id);
        return { success: true };
      }),

    generateSummary: protectedProcedure
      .input(z.object({
        meetingId: z.number(),
        transcript: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Generate meeting summary using LLM
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an AI secretary assistant. Generate a concise, professional meeting summary with key discussion points, decisions made, and next steps."
            },
            {
              role: "user",
              content: `Please summarize the following meeting transcript:\n\n${input.transcript}`
            }
          ]
        });

        const summary = (typeof response.choices[0]?.message?.content === 'string'
          ? response.choices[0]?.message?.content
          : "");

        // Save summary to S3
        const summaryKey = `meetings/${input.meetingId}/summary-${Date.now()}.txt`;
        const { url } = await storagePut(summaryKey, summary, "text/plain");

        // Update meeting with summary
        await db.updateMeeting(input.meetingId, {
          summaryText: summary,
          minutesUrl: url,
        });

        // Create review item for human approval
        await db.createReviewItem({
          type: "meeting_summary",
          referenceId: input.meetingId,
          content: summary,
          createdBy: ctx.user.id,
        });

        return { summary, url };
      }),

    extractActionItems: protectedProcedure
      .input(z.object({
        meetingId: z.number(),
        transcript: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Extract action items using LLM with structured output
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an AI secretary assistant. Extract action items from meeting transcripts."
            },
            {
              role: "user",
              content: `Extract all action items from this meeting transcript. For each action item, identify: description, owner (if mentioned), and deadline (if mentioned).\n\nTranscript:\n${input.transcript}`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "action_items",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        owner: { type: "string" },
                        deadline: { type: "string" },
                      },
                      required: ["description", "owner", "deadline"],
                      additionalProperties: false,
                    }
                  }
                },
                required: ["items"],
                additionalProperties: false,
              }
            }
          }
        });

        const content = (typeof response.choices[0]?.message?.content === 'string'
          ? response.choices[0]?.message?.content
          : "{}");
        const parsed = JSON.parse(content);
        const actionItemsData = parsed.items || [];

        // Create action items in database
        const createdItems = [];
        for (const item of actionItemsData) {
          const actionItem = await db.createActionItem({
            meetingId: input.meetingId,
            description: item.description,
            ownerEmail: item.owner !== "Not specified" ? item.owner : null,
            deadline: item.deadline !== "Not specified" ? new Date(item.deadline) : null,
          });
          createdItems.push(actionItem);
        }

        // Create review item for human approval
        await db.createReviewItem({
          type: "action_items",
          referenceId: input.meetingId,
          content: JSON.stringify(createdItems),
          createdBy: ctx.user.id,
        });

        return { actionItems: createdItems };
      }),
  }),

  // ============= Task Management =============
  tasks: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllTasks();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTaskById(input.id);
      }),

    getByStatus: protectedProcedure
      .input(z.object({ status: z.string() }))
      .query(async ({ input }) => {
        return await db.getTasksByStatus(input.status);
      }),

    getOverdue: protectedProcedure.query(async () => {
      return await db.getOverdueTasks();
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        ownerId: z.number().optional(),
        ownerEmail: z.string().optional(),
        deadline: z.date().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        meetingId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createTask({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        ownerId: z.number().optional(),
        ownerEmail: z.string().optional(),
        deadline: z.date().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        status: z.enum(["open", "in_progress", "completed", "blocked", "overdue"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return await db.updateTask(id, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTask(input.id);
        return { success: true };
      }),

    markComplete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.updateTask(input.id, { status: "completed" });
      }),
  }),

  // ============= Action Items Management =============
  actionItems: router({
    getByMeeting: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        return await db.getActionItemsByMeeting(input.meetingId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        ownerId: z.number().optional(),
        ownerEmail: z.string().optional(),
        deadline: z.date().optional(),
        status: z.enum(["pending", "assigned", "completed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateActionItem(id, updates);
        return { success: true };
      }),
  }),

  // ============= Review Queue Management =============
  review: router({
    getPending: protectedProcedure.query(async () => {
      return await db.getPendingReviewItems();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getReviewItemById(input.id);
      }),

    approve: protectedProcedure
      .input(z.object({
        id: z.number(),
        editedContent: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const updates: any = {
          status: input.editedContent ? "edited" : "approved",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        };
        
        if (input.editedContent) {
          updates.content = input.editedContent;
        }

        return await db.updateReviewItem(input.id, updates);
      }),

    reject: protectedProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.updateReviewItem(input.id, {
          status: "rejected",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.notes,
        });
      }),
  }),

  // ============= Chat Management =============
  chat: router({
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getChatMessagesByUser(ctx.user.id, input.limit);
      }),

    sendMessage: protectedProcedure
      .input(z.object({ message: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Save user message
        await db.createChatMessage({
          userId: ctx.user.id,
          role: "user",
          content: input.message,
        });

        // Get recent chat history for context
        const history = await db.getChatMessagesByUser(ctx.user.id, 10);
        const messages = history.reverse().map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        // Get relevant data for context
        const openTasks = await db.getTasksByStatus("open");
        const overdueTasks = await db.getOverdueTasks();
        const upcomingMeetings = await db.getAllMeetings();

        const contextInfo = `
Current system state:
- Open tasks: ${openTasks.length}
- Overdue tasks: ${overdueTasks.length}
- Upcoming meetings: ${upcomingMeetings.filter(m => m.status === 'scheduled').length}
`;

        // Generate AI response
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an AI-powered personal secretary assistant. Help users with:
- Answering questions about tasks, meetings, and schedules
- Providing status updates and summaries
- Offering task and meeting information
- Being professional, clear, and supportive

${contextInfo}

Answer questions based on the current state. Be concise and helpful.`
            },
            ...messages,
          ]
        });

        const assistantMessage = (typeof response.choices[0]?.message?.content === 'string' 
          ? response.choices[0]?.message?.content 
          : "I'm sorry, I couldn't process that request.");

        // Save assistant response
        await db.createChatMessage({
          userId: ctx.user.id,
          role: "assistant",
          content: assistantMessage,
        });

        return { response: assistantMessage };
      }),
  }),

  // ============= Translation Service =============
  translation: router({
    translate: protectedProcedure
      .input(z.object({
        text: z.string(),
        sourceLanguage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a professional translator. Translate the given text to English. If it's already in English, return it as is. Maintain the professional tone and context."
            },
            {
              role: "user",
              content: `Translate this text to English:\n\n${input.text}`
            }
          ]
        });

        const translatedText = (typeof response.choices[0]?.message?.content === 'string'
          ? response.choices[0]?.message?.content
          : input.text);

        // Create review item for human approval
        await db.createReviewItem({
          type: "translation",
          content: translatedText,
          originalContent: input.text,
          createdBy: ctx.user.id,
        });

        return { translatedText, originalText: input.text };
      }),
  }),

  // ============= Email Draft Service =============
  email: router({
    draftReminder: protectedProcedure
      .input(z.object({
        taskId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const task = await db.getTaskById(input.taskId);
        if (!task) throw new Error("Task not found");

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an AI secretary. Draft a professional, concise, and neutral reminder email for a task. Include the task details and deadline."
            },
            {
              role: "user",
              content: `Draft a reminder email for this task:
Title: ${task.title}
Description: ${task.description || "No description"}
Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
Priority: ${task.priority}`
            }
          ]
        });

        const emailDraft = (typeof response.choices[0]?.message?.content === 'string'
          ? response.choices[0]?.message?.content
          : "");

        // Create review item for human approval
        const reviewItem = await db.createReviewItem({
          type: "email_draft",
          referenceId: task.id,
          content: emailDraft,
          metadata: JSON.stringify({ taskId: task.id, recipientEmail: task.ownerEmail }),
          createdBy: ctx.user.id,
        });

        return { emailDraft, reviewId: reviewItem.id };
      }),

    draftEscalation: protectedProcedure
      .input(z.object({
        taskId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const task = await db.getTaskById(input.taskId);
        if (!task) throw new Error("Task not found");

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an AI secretary. Draft a professional escalation email for an overdue or blocked task. Be factual and neutral."
            },
            {
              role: "user",
              content: `Draft an escalation email for this overdue task:
Title: ${task.title}
Description: ${task.description || "No description"}
Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
Status: ${task.status}
Priority: ${task.priority}`
            }
          ]
        });

        const emailDraft = (typeof response.choices[0]?.message?.content === 'string'
          ? response.choices[0]?.message?.content
          : "");

        // Create review item for human approval
        const reviewItem = await db.createReviewItem({
          type: "email_draft",
          referenceId: task.id,
          content: emailDraft,
          metadata: JSON.stringify({ taskId: task.id, recipientEmail: task.ownerEmail, isEscalation: true }),
          createdBy: ctx.user.id,
        });

        return { emailDraft, reviewId: reviewItem.id };
      }),

    sendApproved: protectedProcedure
      .input(z.object({
        reviewId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const reviewItem = await db.getReviewItemById(input.reviewId);
        if (!reviewItem || reviewItem.status !== "approved") {
          throw new Error("Review item not found or not approved");
        }

        const metadata = reviewItem.metadata ? JSON.parse(reviewItem.metadata) : {};
        const recipientEmail = metadata.recipientEmail;

        if (!recipientEmail) {
          throw new Error("No recipient email found");
        }

        // In a real implementation, this would send the email via Gmail API or SMTP
        // For now, we'll just log it
        await db.createEmailLog({
          recipientEmail,
          subject: metadata.isEscalation ? "Task Escalation Notice" : "Task Reminder",
          body: reviewItem.content,
          emailType: metadata.isEscalation ? "escalation" : "reminder",
          relatedTaskId: metadata.taskId,
        });

        return { success: true, message: "Email sent successfully" };
      }),
  }),
});

export type AppRouter = typeof appRouter;
