CREATE TABLE `animalHeatLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int NOT NULL,
	`observedDate` date NOT NULL,
	`observedTime` varchar(16),
	`heatSigns` text NOT NULL,
	`intensity` enum('weak','moderate','strong') NOT NULL DEFAULT 'moderate',
	`breedingWindowStart` timestamp,
	`breedingWindowEnd` timestamp,
	`status` enum('observed','inseminated','expired','missed') NOT NULL DEFAULT 'observed',
	`notes` text,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `animalHeatLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `animalHerds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`code` varchar(64),
	`purpose` enum('general','milking','dry','calves','heifers','fattening','quarantine','pasture_group') NOT NULL DEFAULT 'general',
	`location` varchar(255),
	`targetHeadCount` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `animalHerds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `animalMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int NOT NULL,
	`fromLocation` varchar(128),
	`toLocation` varchar(128) NOT NULL,
	`fromHerdId` int,
	`toHerdId` int,
	`movementDate` date NOT NULL,
	`reason` enum('pasture_rotation','quarantine','weaning','maternity','treatment','housing_change','sale','other') NOT NULL DEFAULT 'pasture_rotation',
	`notes` text,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `animalMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `animals` ADD `isDairy` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `animals` ADD `herdId` int;--> statement-breakpoint
ALTER TABLE `animals` ADD `bodyConditionScore` decimal(3,1);--> statement-breakpoint
ALTER TABLE `animals` ADD `currentLocation` varchar(128);--> statement-breakpoint
ALTER TABLE `animals` ADD `lactationStage` enum('non_lactating','early','mid','late','dry') DEFAULT 'non_lactating' NOT NULL;--> statement-breakpoint
ALTER TABLE `animals` ADD `isQuarantined` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `animals` ADD `quarantineReason` varchar(255);--> statement-breakpoint
ALTER TABLE `animals` ADD `quarantineUntil` date;--> statement-breakpoint
ALTER TABLE `animals` ADD `purchasePrice` decimal(10,2);--> statement-breakpoint
ALTER TABLE `animals` ADD `purchaseDate` date;--> statement-breakpoint
ALTER TABLE `animals` ADD `sellerInfo` varchar(255);--> statement-breakpoint
ALTER TABLE `animals` ADD `salePrice` decimal(10,2);--> statement-breakpoint
ALTER TABLE `animals` ADD `saleDate` date;--> statement-breakpoint
ALTER TABLE `animals` ADD `buyerInfo` varchar(255);--> statement-breakpoint
ALTER TABLE `animals` ADD `saleWeight` decimal(8,2);--> statement-breakpoint
ALTER TABLE `breedingRecords` ADD `breedingMethod` enum('natural','artificial_insemination','embryo_transfer') DEFAULT 'natural' NOT NULL;--> statement-breakpoint
ALTER TABLE `breedingRecords` ADD `gestationDays` int DEFAULT 283 NOT NULL;--> statement-breakpoint
ALTER TABLE `breedingRecords` ADD `pregnancyStatus` enum('pending','confirmed','open','delivered','failed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `breedingRecords` ADD `confirmedDate` date;--> statement-breakpoint
ALTER TABLE `breedingRecords` ADD `dryOffDate` date;--> statement-breakpoint
ALTER TABLE `healthLogs` ADD `bcsScore` decimal(3,1);--> statement-breakpoint
ALTER TABLE `healthLogs` ADD `meatWithdrawalDays` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `healthLogs` ADD `meatWithdrawalEndDate` date;--> statement-breakpoint
ALTER TABLE `healthLogs` ADD `milkWithdrawalDays` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `healthLogs` ADD `milkWithdrawalEndDate` date;--> statement-breakpoint
ALTER TABLE `healthLogs` ADD `isQuarantineRecommended` boolean DEFAULT false NOT NULL;