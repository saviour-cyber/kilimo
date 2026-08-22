-- Migration: 0003_kilisense_updates
-- Adds missing columns and tables that were added to schema.ts but never migrated.

-- 1. Add isRecommended and isDefaultTrial to subscriptionPlans (added post-0002)
ALTER TABLE `subscriptionPlans`
  ADD COLUMN IF NOT EXISTS `isRecommended` boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `isDefaultTrial` boolean NOT NULL DEFAULT false;
--> statement-breakpoint

-- 2. Create platformEmailLogs table (was orphaned as 0002_platform_email_logs.sql but never journaled)
CREATE TABLE IF NOT EXISTS `platformEmailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int,
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(256) NOT NULL,
	`templateKey` varchar(64) NOT NULL,
	`status` enum('queued','sent','delivered','failed') NOT NULL DEFAULT 'queued',
	`providerMessageId` varchar(128),
	`errorMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`failedAt` timestamp,
	CONSTRAINT `platformEmailLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- 3. Add latitude and longitude columns to farms table (added for weather engine)
ALTER TABLE `farms`
  ADD COLUMN IF NOT EXISTS `latitude` decimal(10,6),
  ADD COLUMN IF NOT EXISTS `longitude` decimal(10,6);
--> statement-breakpoint

-- 4. Create weatherCache table (added for weather engine)
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
