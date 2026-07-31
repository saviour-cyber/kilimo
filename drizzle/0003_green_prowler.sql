CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`businessType` varchar(64) NOT NULL,
	`country` varchar(64) NOT NULL DEFAULT 'Kenya',
	`county` varchar(64),
	`currency` varchar(8) NOT NULL DEFAULT 'KES',
	`timezone` varchar(64) NOT NULL DEFAULT 'Africa/Nairobi',
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `farms` ADD `organizationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` ADD `county` varchar(64);--> statement-breakpoint
ALTER TABLE `farms` ADD `subCounty` varchar(64);--> statement-breakpoint
ALTER TABLE `farms` ADD `ward` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `password` text;--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(64) DEFAULT 'Kenya';--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);