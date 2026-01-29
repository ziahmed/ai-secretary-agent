CREATE TABLE `actionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`taskId` int,
	`description` text NOT NULL,
	`ownerId` int,
	`ownerEmail` varchar(320),
	`deadline` timestamp,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `actionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(50) NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`emailType` varchar(50) NOT NULL,
	`relatedTaskId` int,
	`relatedMeetingId` int,
	`sentAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`status` varchar(50) NOT NULL DEFAULT 'sent',
	`deliveredAt` timestamp,
	`openedAt` timestamp,
	`trackingId` varchar(100),
	CONSTRAINT `emailLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gmailSyncState` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`lastSyncToken` text,
	`lastSyncedAt` timestamp,
	`syncStatus` varchar(50) NOT NULL DEFAULT 'active',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `gmailSyncState_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`meetingDate` timestamp NOT NULL,
	`duration` int,
	`location` varchar(255),
	`meetLink` text,
	`participants` text,
	`status` varchar(50) NOT NULL DEFAULT 'scheduled',
	`minutesUrl` text,
	`summaryText` text,
	`transcriptUrl` text,
	`externalId` varchar(255),
	`externalSource` varchar(50),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviewQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`referenceId` int,
	`content` text NOT NULL,
	`originalContent` text,
	`metadata` text,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNotes` text,
	`reviewedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `reviewQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`ownerId` int,
	`ownerEmail` varchar(320),
	`deadline` timestamp,
	`priority` varchar(50) NOT NULL DEFAULT 'medium',
	`status` varchar(50) NOT NULL DEFAULT 'open',
	`meetingId` int,
	`createdBy` int NOT NULL,
	`lastReminderSent` timestamp,
	`escalatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` varchar(50) NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
