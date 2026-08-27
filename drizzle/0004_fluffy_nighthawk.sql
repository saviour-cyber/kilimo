-- Migration: 0004_fluffy_nighthawk
-- Adds marketplace tables, workers tables, and worker task assignment column.
-- All statements are idempotent (IF NOT EXISTS) to be safe against partial prior applies.

-- 1. Marketplace: Categories
CREATE TABLE IF NOT EXISTS `marketCategories` (
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

-- 2. Marketplace: Listing Images
CREATE TABLE IF NOT EXISTS `marketListingImages` (
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

-- 3. Marketplace: Listings
CREATE TABLE IF NOT EXISTS `marketListings` (
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

-- 4. Weather Cache (may already exist from 0003, IF NOT EXISTS handles it)
CREATE TABLE IF NOT EXISTS `weatherCache` (
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

-- 5. Workers: Attendance
CREATE TABLE IF NOT EXISTS `workerAttendance` (
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

-- 6. Workers: Teams
CREATE TABLE IF NOT EXISTS `workerTeams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workerTeams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- 7. Workers: Main table
CREATE TABLE IF NOT EXISTS `workers` (
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

-- 8. Farms: geo columns (may already exist from 0003, IF NOT EXISTS handles it)
ALTER TABLE `farms`
  ADD COLUMN IF NOT EXISTS `latitude` decimal(10,6),
  ADD COLUMN IF NOT EXISTS `longitude` decimal(10,6);
--> statement-breakpoint

-- 9. Subscription Plans: flags (may already exist from 0003, IF NOT EXISTS handles it)
ALTER TABLE `subscriptionPlans`
  ADD COLUMN IF NOT EXISTS `isRecommended` boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS `isDefaultTrial` boolean DEFAULT false NOT NULL;
--> statement-breakpoint

-- 10. Tasks: worker assignment foreign key
ALTER TABLE `tasks`
  ADD COLUMN IF NOT EXISTS `assignedToWorkerId` int;