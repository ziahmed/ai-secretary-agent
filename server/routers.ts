import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import * as db from "./db";
import { sendMeetingInvite, sendMeetingCancellation } from "./emailService";

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
        // Check for conflicts before creating
        const conflicts = await db.checkMeetingConflicts(
          input.meetingDate,
          input.duration || 60
        );
        
        const meeting = await db.createMeeting({
          ...input,
          participants: input.participants ? JSON.stringify(input.participants) : null,
          createdBy: ctx.user.id,
        });
        
        // Send meeting invites to all participants
        if (input.participants && input.participants.length > 0) {
          try {
            await sendMeetingInvite({
              to: input.participants,
              meetingTitle: input.title,
              meetingDate: input.meetingDate,
              location: input.location,
              description: input.description,
              organizerEmail: ctx.user.email || 'noreply@ai-secretary.com',
              organizerName: ctx.user.name || 'AI Secretary',
            });
            
            // Log the email send
            await db.createEmailLog({
              recipientEmail: input.participants.join(', '),
              subject: `Meeting Invitation: ${input.title}`,
              body: `Meeting invite sent for ${input.title} on ${input.meetingDate.toLocaleString()}`,
              emailType: 'meeting_invite',
            });
          } catch (error) {
            console.error('Failed to send meeting invites:', error);
            // Don't fail the meeting creation if email sending fails
          }
        }
        
        return { 
          ...meeting, 
          conflicts: conflicts.length > 0 ? conflicts : undefined 
        };
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
        cancellationReason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, participants, cancellationReason, ...updates } = input;
        
        // Get the meeting before update to check status change
        const existingMeeting = await db.getMeetingById(id);
        
        // Check for conflicts if date or duration is being updated
        let conflicts: any[] = [];
        if (input.meetingDate || input.duration) {
          const checkDate = input.meetingDate || existingMeeting?.meetingDate || new Date();
          const checkDuration = input.duration || existingMeeting?.duration || 60;
          conflicts = await db.checkMeetingConflicts(checkDate, checkDuration, id);
        }
        
        const updateData: any = { ...updates };
        if (participants) {
          updateData.participants = JSON.stringify(participants);
        }
        
        const updatedMeeting = await db.updateMeeting(id, updateData);
        
        if (!updatedMeeting) {
          throw new Error('Failed to update meeting');
        }
        
        // Check if meeting details changed (date, time, location) and send update emails
        const participantsList = updatedMeeting.participants 
          ? JSON.parse(updatedMeeting.participants) 
          : [];
        
        const hasDateChanged = input.meetingDate && existingMeeting && 
          input.meetingDate.getTime() !== existingMeeting.meetingDate.getTime();
        const hasLocationChanged = input.location !== undefined && existingMeeting && 
          input.location !== existingMeeting.location;
        const hasDurationChanged = input.duration !== undefined && existingMeeting && 
          input.duration !== existingMeeting.duration;
        
        // Send updated invite if meeting details changed (but not cancelled)
        if ((hasDateChanged || hasLocationChanged || hasDurationChanged) && 
            input.status !== 'cancelled' && 
            participantsList.length > 0) {
          try {
            await sendMeetingInvite({
              to: participantsList,
              meetingTitle: updatedMeeting.title,
              meetingDate: updatedMeeting.meetingDate,
              location: updatedMeeting.location || undefined,
              description: updatedMeeting.description || undefined,
              organizerEmail: ctx.user.email || 'noreply@ai-secretary.com',
              organizerName: ctx.user.name || 'AI Secretary',
            });
            
            // Log the email send
            await db.createEmailLog({
              recipientEmail: participantsList.join(', '),
              subject: `Meeting Updated: ${updatedMeeting.title}`,
              body: `Meeting invite updated for ${updatedMeeting.title} on ${updatedMeeting.meetingDate.toLocaleString()}`,
              emailType: 'meeting_invite',
            });
          } catch (error) {
            console.error('Failed to send updated meeting invites:', error);
            // Don't fail the update if email sending fails
          }
        }
        
        // Send cancellation email if status changed to cancelled
        if (input.status === 'cancelled' && existingMeeting && existingMeeting.status !== 'cancelled') {
          const participantsList = existingMeeting.participants 
            ? JSON.parse(existingMeeting.participants) 
            : [];
          
          if (participantsList.length > 0) {
            try {
              await sendMeetingCancellation(
                {
                  to: participantsList,
                  meetingTitle: existingMeeting.title,
                  meetingDate: existingMeeting.meetingDate,
                  location: existingMeeting.location || undefined,
                  description: existingMeeting.description || undefined,
                  organizerEmail: ctx.user.email || 'noreply@ai-secretary.com',
                  organizerName: ctx.user.name || 'AI Secretary',
                },
                cancellationReason || 'Meeting cancelled'
              );
              
              // Log the email send
              await db.createEmailLog({
                recipientEmail: participantsList.join(', '),
                subject: `Meeting Cancelled: ${existingMeeting.title}`,
                body: `Cancellation notification sent for ${existingMeeting.title}. Reason: ${cancellationReason || 'Not specified'}`,
                emailType: 'meeting_cancellation',
              });
            } catch (error) {
              console.error('Failed to send cancellation emails:', error);
              // Don't fail the update if email sending fails
            }
          }
        }
        
        return { 
          ...updatedMeeting, 
          conflicts: conflicts.length > 0 ? conflicts : undefined 
        };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMeeting(input.id);
        return { success: true };
      }),

    resendInvites: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const meeting = await db.getMeetingById(input.id);
        if (!meeting) {
          throw new Error('Meeting not found');
        }
        
        if (!meeting.participants) {
          throw new Error('No participants to send invites to');
        }
        
        const participants = JSON.parse(meeting.participants);
        
        try {
          await sendMeetingInvite({
            to: participants,
            meetingTitle: meeting.title,
            meetingDate: meeting.meetingDate,
            location: meeting.location || undefined,
            description: meeting.description || undefined,
            organizerEmail: ctx.user.email || 'noreply@ai-secretary.com',
            organizerName: ctx.user.name || 'AI Secretary',
          });
          
          // Log the email send
          await db.createEmailLog({
            recipientEmail: participants.join(', '),
            subject: `Meeting Invitation (Resent): ${meeting.title}`,
            body: `Meeting invite resent for ${meeting.title} on ${meeting.meetingDate.toLocaleString()}`,
            emailType: 'meeting_invite',
          });
          
          return { success: true, message: 'Invites resent successfully' };
        } catch (error) {
          console.error('Failed to resend invites:', error);
          throw new Error('Failed to resend invites');
        }
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

    uploadTranscript: protectedProcedure
      .input(z.object({
        meetingId: z.number(),
        fileName: z.string(),
        fileContent: z.string(), // Base64 encoded file content
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const meeting = await db.getMeetingById(input.meetingId);
        if (!meeting) {
          throw new Error('Meeting not found');
        }

        // Upload to Google Drive
        const { uploadToGoogleDrive } = await import('./googleApi');
        const fileBuffer = Buffer.from(input.fileContent, 'base64');
        const folderPath = `Meeting Transcripts/${meeting.title}`;
        
        const { fileId, webViewLink } = await uploadToGoogleDrive(
          input.fileName,
          fileBuffer,
          input.mimeType,
          folderPath
        );

        // Update meeting with transcript URL
        await db.updateMeeting(input.meetingId, {
          transcriptUrl: webViewLink,
        });

        return {
          success: true,
          fileId,
          webViewLink,
          message: 'Transcript uploaded successfully to Google Drive',
        };
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

    generateReminders: protectedProcedure
      .mutation(async ({ ctx }) => {
        // Find tasks due within 48 hours that haven't had reminders sent recently
        const now = new Date();
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        
        const allTasks = await db.getAllTasks();
        const tasksNeedingReminders = allTasks.filter(task => {
          if (!task.deadline) return false;
          if (task.status === 'completed') return false;
          
          const deadline = new Date(task.deadline);
          const isApproachingDeadline = deadline >= now && deadline <= in48Hours;
          
          // Check if reminder was sent in last 24 hours
          if (task.lastReminderSent) {
            const lastSent = new Date(task.lastReminderSent);
            const hoursSinceLastReminder = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastReminder < 24) return false;
          }
          
          return isApproachingDeadline;
        });
        
        // Generate reminder emails for each task
        const remindersCreated = [];
        for (const task of tasksNeedingReminders) {
          try {
            const response = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: "You are an AI secretary. Draft a professional, concise reminder email for a task approaching its deadline."
                },
                {
                  role: "user",
                  content: `Draft a reminder email for this task:
Title: ${task.title}
Description: ${task.description || "No description"}
Deadline: ${new Date(task.deadline!).toLocaleString()}
Priority: ${task.priority}`
                }
              ]
            });
            
            const emailDraft = (typeof response.choices[0]?.message?.content === 'string'
              ? response.choices[0]?.message?.content
              : "");
            
            // Create review item with reminder type
            await db.createReviewItem({
              type: "email_draft",
              referenceId: task.id,
              content: emailDraft,
              metadata: JSON.stringify({ 
                taskId: task.id, 
                recipientEmail: task.ownerEmail || 'secretary.omega2@gmail.com',
                isReminder: true 
              }),
              createdBy: ctx.user.id,
            });
            
            // Update lastReminderSent
            await db.updateTask(task.id, { lastReminderSent: now });
            
            remindersCreated.push(task.id);
          } catch (error) {
            console.error(`Failed to generate reminder for task ${task.id}:`, error);
          }
        }
        
        return { 
          success: true, 
          remindersGenerated: remindersCreated.length,
          taskIds: remindersCreated 
        };
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

    getCompleted: protectedProcedure.query(async () => {
      return await db.getCompletedReviewItems();
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
      .mutation(async ({ input, ctx }) => {
        const reviewItem = await db.getReviewItemById(input.reviewId);
        if (!reviewItem || reviewItem.status !== "approved" && reviewItem.status !== "edited") {
          throw new Error("Review item not found or not approved");
        }

        const metadata = reviewItem.metadata ? JSON.parse(reviewItem.metadata) : {};
        const recipientEmail = metadata.recipientEmail;

        if (!recipientEmail) {
          throw new Error("No recipient email found");
        }

        // Get approver email (the user who approved/edited the review item)
        const approverEmail = ctx.user.email;
        
        // Send email via Gmail API with CC to approver
        const { sendEmailWithCC } = await import('./emailService');
        const subject = metadata.isEscalation ? "Task Escalation Notice" : "Task Reminder";
        
        try {
          await sendEmailWithCC({
            to: [recipientEmail],
            cc: approverEmail ? [approverEmail] : [],
            subject,
            htmlContent: reviewItem.content,
            fromEmail: process.env.GOOGLE_ACCOUNT_EMAIL || 'secretary.omega2@gmail.com',
            fromName: 'AI Personal Secretary'
          });

          // Log the email
          await db.createEmailLog({
            recipientEmail,
            subject,
            body: reviewItem.content,
            emailType: metadata.isEscalation ? "escalation" : "reminder",
            relatedTaskId: metadata.taskId,
          });

          return { success: true, message: "Email sent successfully with CC to approver" };
        } catch (error) {
          console.error('Failed to send approved email:', error);
          throw new Error("Failed to send email");
        }
      }),
  }),

  // ============= Google Integration =============
  google: router({
    getAuthUrl: protectedProcedure.query(async () => {
      const { getAuthUrl } = await import('./googleApi');
      return { url: getAuthUrl() };
    }),

    handleCallback: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input }) => {
        const { getTokensFromCode } = await import('./googleApi');
        const tokens = await getTokensFromCode(input.code);
        
        // In production, you'd save the refresh token securely
        // For now, we'll return it to be manually added to env
        return {
          success: true,
          refreshToken: tokens.refresh_token,
          message: "Please add this refresh token to your environment variables as GOOGLE_REFRESH_TOKEN",
        };
      }),

    syncCalendar: protectedProcedure
      .input(z.object({ maxResults: z.number().optional().default(50) }))
      .mutation(async ({ input, ctx }) => {
        const { listCalendarEvents } = await import('./googleApi');
        const events = await listCalendarEvents(input.maxResults);
        
        let syncedCount = 0;
        for (const event of events) {
          if (!event.summary || !event.start) continue;

          const meetingDate = event.start.dateTime 
            ? new Date(event.start.dateTime)
            : event.start.date
            ? new Date(event.start.date)
            : null;

          if (!meetingDate) continue;

          // Check if meeting already exists by external ID
          const existing = await db.getMeetingByExternalId(event.id || '');
          if (existing) continue;

          // Create new meeting from calendar event
          await db.createMeeting({
            title: event.summary,
            description: event.description || null,
            meetingDate,
            location: event.location || null,
            participants: event.attendees 
              ? JSON.stringify(event.attendees.map((a: any) => a.email))
              : null,
            externalId: event.id || null,
            externalSource: 'google_calendar',
            createdBy: ctx.user.id,
          });
          syncedCount++;
        }

        return {
          success: true,
          totalEvents: events.length,
          syncedCount,
          message: `Synced ${syncedCount} new events from Google Calendar`,
        };
      }),

    syncGmail: protectedProcedure
      .input(z.object({ 
        maxResults: z.number().optional().default(50),
        query: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { listGmailMessages, parseEmailForMeetingInfo } = await import('./googleApi');
        
        // Search for emails that might contain meeting invites or task updates
        const query = input.query || 'subject:(meeting OR invite OR calendar OR task OR action item)';
        const messages = await listGmailMessages(input.maxResults, query);
        
        let processedCount = 0;
        for (const message of messages) {
          if (!message.id) continue;

          try {
            const emailData = await parseEmailForMeetingInfo(message.id);
            
            // Use LLM to analyze email and extract structured information
            const analysis = await invokeLLM({
              messages: [
                {
                  role: 'system',
                  content: 'You are an AI assistant that analyzes emails to extract meeting information and action items. Extract any meeting details (title, date, time, location, participants) and action items from the email.',
                },
                {
                  role: 'user',
                  content: `Analyze this email and extract meeting information or action items:\n\nSubject: ${emailData.subject}\nFrom: ${emailData.from}\nDate: ${emailData.date}\n\nBody:\n${emailData.body || emailData.snippet}`,
                },
              ],
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'email_analysis',
                  strict: true,
                  schema: {
                    type: 'object',
                    properties: {
                      hasMeeting: { type: 'boolean' },
                      meetingTitle: { type: 'string' },
                      meetingDate: { type: 'string' },
                      meetingLocation: { type: 'string' },
                      hasActionItems: { type: 'boolean' },
                      actionItems: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            description: { type: 'string' },
                            owner: { type: 'string' },
                            deadline: { type: 'string' },
                          },
                          required: ['description'],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ['hasMeeting', 'hasActionItems'],
                    additionalProperties: false,
                  },
                },
              },
            });

            const messageContent = analysis.choices[0]?.message?.content;
            const contentString = typeof messageContent === 'string' ? messageContent : '{}';
            const result = JSON.parse(contentString);
            
            // Create meeting if found
            if (result.hasMeeting && result.meetingTitle) {
              const meetingDate = result.meetingDate ? new Date(result.meetingDate) : null;
              if (meetingDate && !isNaN(meetingDate.getTime())) {
                await db.createMeeting({
                  title: result.meetingTitle,
                  description: emailData.snippet,
                  meetingDate,
                  location: result.meetingLocation || null,
                  externalId: message.id,
                  externalSource: 'gmail',
                  createdBy: ctx.user.id,
                });
              }
            }

            // Create action items if found
            if (result.hasActionItems && result.actionItems?.length > 0) {
              for (const item of result.actionItems) {
                const deadline = item.deadline ? new Date(item.deadline) : null;
                await db.createTask({
                  title: item.description,
                  description: `From email: ${emailData.subject}`,
                  ownerEmail: item.owner || emailData.from,
                  deadline: deadline && !isNaN(deadline.getTime()) ? deadline : null,
                  priority: 'medium',
                  createdBy: ctx.user.id,
                });
              }
            }

            processedCount++;
          } catch (error) {
            console.error(`Error processing email ${message.id}:`, error);
          }
        }

        return {
          success: true,
          totalMessages: messages.length,
          processedCount,
          message: `Processed ${processedCount} emails from Gmail`,
        };
      }),

    getSyncStatus: protectedProcedure.query(async () => {
      const hasCredentials = !!(process.env.GOOGLE_CLIENT_ID && 
                                process.env.GOOGLE_CLIENT_SECRET);
      const hasRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN;
      
      return {
        configured: hasCredentials,
        authenticated: hasRefreshToken,
        accountEmail: process.env.GOOGLE_ACCOUNT_EMAIL || 'Not set',
      };
    }),
  }),

  // ============= Email Tracking =============
  emails: router({
    getAll: protectedProcedure.query(async () => {
      return await db.getAllEmailLogs();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmailLogById(input.id);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        trackingId: z.string(),
        status: z.enum(['delivered', 'opened']),
      }))
      .mutation(async ({ input }) => {
        const timestamp = new Date();
        if (input.status === 'delivered') {
          await db.updateEmailLogDeliveryStatus(input.trackingId, timestamp);
        } else if (input.status === 'opened') {
          await db.updateEmailLogOpenStatus(input.trackingId, timestamp);
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
