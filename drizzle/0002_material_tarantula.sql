CREATE TABLE `platformModules` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`version` varchar(32) DEFAULT '1.0.0',
	`isEnabled` boolean NOT NULL DEFAULT true,
	`icon` varchar(64),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformServices` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`providerConfig` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformServices_id` PRIMARY KEY(`id`)
);
