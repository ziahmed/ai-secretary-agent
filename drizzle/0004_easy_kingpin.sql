ALTER TABLE `emailLogs` MODIFY COLUMN `status` enum('sent','failed','delivered','opened') NOT NULL DEFAULT 'sent';--> statement-breakpoint
ALTER TABLE `emailLogs` ADD `deliveredAt` timestamp;--> statement-breakpoint
ALTER TABLE `emailLogs` ADD `openedAt` timestamp;--> statement-breakpoint
ALTER TABLE `emailLogs` ADD `trackingId` varchar(100);