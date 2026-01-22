CREATE TYPE "public"."actionItems_status" AS ENUM('pending', 'assigned', 'completed');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('sent', 'failed', 'delivered', 'opened');--> statement-breakpoint
CREATE TYPE "public"."emailType" AS ENUM('reminder', 'escalation', 'meeting_invite', 'meeting_cancellation', 'status_update');--> statement-breakpoint
CREATE TYPE "public"."meetings_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected', 'edited');--> statement-breakpoint
CREATE TYPE "public"."review_type" AS ENUM('meeting_summary', 'action_items', 'email_draft', 'translation');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."syncStatus" AS ENUM('active', 'paused', 'error');--> statement-breakpoint
CREATE TYPE "public"."tasks_status" AS ENUM('open', 'in_progress', 'completed', 'blocked', 'overdue');--> statement-breakpoint
CREATE TABLE "actionItems" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "actionItems_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"meetingId" integer NOT NULL,
	"taskId" integer,
	"description" text NOT NULL,
	"ownerId" integer,
	"ownerEmail" varchar(320),
	"deadline" timestamp,
	"status" "actionItems_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatMessages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chatMessages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emailLogs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "emailLogs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"recipientEmail" varchar(320) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"emailType" "emailType" NOT NULL,
	"relatedTaskId" integer,
	"relatedMeetingId" integer,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"status" "email_status" DEFAULT 'sent' NOT NULL,
	"deliveredAt" timestamp,
	"openedAt" timestamp,
	"trackingId" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "gmailSyncState" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "gmailSyncState_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"lastSyncToken" text,
	"lastSyncedAt" timestamp,
	"syncStatus" "syncStatus" DEFAULT 'active' NOT NULL,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "meetings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text,
	"meetingDate" timestamp NOT NULL,
	"duration" integer,
	"location" varchar(255),
	"meetLink" text,
	"participants" text,
	"status" "meetings_status" DEFAULT 'scheduled' NOT NULL,
	"minutesUrl" text,
	"summaryText" text,
	"transcriptUrl" text,
	"externalId" varchar(255),
	"externalSource" varchar(50),
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviewQueue" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reviewQueue_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" "review_type" NOT NULL,
	"referenceId" integer,
	"content" text NOT NULL,
	"originalContent" text,
	"metadata" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"reviewedBy" integer,
	"reviewNotes" text,
	"reviewedAt" timestamp,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tasks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text,
	"ownerId" integer,
	"ownerEmail" varchar(320),
	"deadline" timestamp,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"status" "tasks_status" DEFAULT 'open' NOT NULL,
	"meetingId" integer,
	"createdBy" integer NOT NULL,
	"lastReminderSent" timestamp,
	"escalatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
