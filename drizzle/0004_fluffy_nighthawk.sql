CREATE TABLE `marketCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`description` text,
	`iconName` varchar(64),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketCategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketCategories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `marketListingImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`url` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketListingImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`farmId` int,
	`sellerUserId` int NOT NULL,
	`categoryId` int,
	`title` varchar(128) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'KES',
	`quantity` decimal(10,2),
	`unit` varchar(32),
	`county` varchar(64),
	`location` varchar(256),
	`status` enum('draft','active','paused','sold','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketListings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weatherCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`latitude` decimal(10,2) NOT NULL,
	`longitude` decimal(10,2) NOT NULL,
	`dataType` varchar(32) NOT NULL,
	`provider` varchar(64) NOT NULL DEFAULT 'open-meteo',
	`payload` json NOT NULL,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `weatherCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workerAttendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`workerId` int NOT NULL,
	`date` date NOT NULL,
	`status` enum('present','absent','half_day','on_leave') NOT NULL DEFAULT 'present',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workerAttendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workerTeams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workerTeams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`firstName` varchar(128) NOT NULL,
	`lastName` varchar(128) NOT NULL,
	`phone` varchar(32),
	`email` varchar(256),
	`photoUrl` text,
	`position` varchar(128),
	`employmentType` enum('full_time','part_time','seasonal','contractor','temporary') NOT NULL DEFAULT 'full_time',
	`status` enum('active','inactive','on_leave','terminated') NOT NULL DEFAULT 'active',
	`teamId` int,
	`startDate` date,
	`skills` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `farms` ADD `latitude` decimal(10,6);--> statement-breakpoint
ALTER TABLE `farms` ADD `longitude` decimal(10,6);--> statement-breakpoint
ALTER TABLE `subscriptionPlans` ADD `isRecommended` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptionPlans` ADD `isDefaultTrial` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `assignedToWorkerId` int;