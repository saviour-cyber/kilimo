CREATE TABLE `generatedReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`moduleKeys` json NOT NULL,
	`filters` json,
	`format` enum('pdf','excel','csv','print') NOT NULL,
	`fileUrl` text,
	`generatedByUserId` int NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	CONSTRAINT `generatedReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduledReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`moduleKeys` json NOT NULL,
	`filters` json,
	`format` enum('pdf','excel','csv') NOT NULL,
	`frequency` enum('daily','weekly','monthly') NOT NULL,
	`nextRunAt` timestamp NOT NULL,
	`lastRunAt` timestamp,
	`createdByUserId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledReports_id` PRIMARY KEY(`id`)
);
