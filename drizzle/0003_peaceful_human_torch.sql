CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64),
	`entityId` varchar(128),
	`details` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformAnnouncements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`type` varchar(32) NOT NULL DEFAULT 'info',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformAnnouncements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;