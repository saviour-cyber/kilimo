CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `animals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`tagNumber` varchar(64),
	`name` varchar(128),
	`species` varchar(64) NOT NULL,
	`breed` varchar(128),
	`gender` enum('male','female','unknown') NOT NULL DEFAULT 'unknown',
	`dateOfBirth` date,
	`acquisitionDate` date,
	`acquisitionType` enum('born','purchased','donated','other') DEFAULT 'born',
	`status` enum('active','sold','deceased','transferred') NOT NULL DEFAULT 'active',
	`weight` decimal(8,2),
	`weightUnit` varchar(16) DEFAULT 'kg',
	`notes` text,
	`parentMaleId` int,
	`parentFemaleId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `animals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `breedingRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`damId` int NOT NULL,
	`sireId` int,
	`sireDescription` varchar(128),
	`breedingDate` date NOT NULL,
	`expectedDeliveryDate` date,
	`actualDeliveryDate` date,
	`offspringCount` int,
	`outcome` enum('pending','successful','failed','aborted') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `breedingRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` varchar(64) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`period` varchar(32) NOT NULL,
	`season` varchar(64),
	`notes` text,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cropIncidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`plantingId` int,
	`fieldId` int,
	`incidentType` enum('disease','pest','weather','other') NOT NULL DEFAULT 'disease',
	`name` varchar(128) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`detectedDate` date NOT NULL,
	`resolvedDate` date,
	`treatment` text,
	`notes` text,
	`status` enum('active','treated','resolved','monitoring') NOT NULL DEFAULT 'active',
	`reportedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cropIncidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cropPlantings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`fieldId` int,
	`cropName` varchar(128) NOT NULL,
	`variety` varchar(128),
	`plantingDate` date NOT NULL,
	`expectedHarvestDate` date,
	`actualHarvestDate` date,
	`quantityPlanted` decimal(10,2),
	`quantityUnit` varchar(32) DEFAULT 'kg',
	`growthStage` enum('seedling','vegetative','flowering','fruiting','harvest_ready','harvested','failed') NOT NULL DEFAULT 'seedling',
	`status` enum('active','completed','failed','archived') NOT NULL DEFAULT 'active',
	`notes` text,
	`season` varchar(64),
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cropPlantings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` varchar(64),
	`serialNumber` varchar(128),
	`purchaseDate` date,
	`purchaseCost` decimal(10,2),
	`status` enum('operational','maintenance','repair','retired') NOT NULL DEFAULT 'operational',
	`lastMaintenanceDate` date,
	`nextMaintenanceDate` date,
	`notes` text,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farmMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`userId` int NOT NULL,
	`farmRole` enum('owner','manager','worker','viewer') NOT NULL DEFAULT 'viewer',
	`invitedByUserId` int,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `farmMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farmModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`moduleKey` varchar(64) NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`enabledAt` timestamp NOT NULL DEFAULT (now()),
	`enabledByUserId` int,
	CONSTRAINT `farmModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`location` varchar(256),
	`farmType` enum('crop','livestock','mixed','aquaculture','poultry','other') NOT NULL DEFAULT 'mixed',
	`sizeHectares` decimal(10,2),
	`logoUrl` text,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`isArchived` boolean NOT NULL DEFAULT false,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int,
	`feedType` varchar(128) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(32) DEFAULT 'kg',
	`feedDate` date NOT NULL,
	`cost` decimal(10,2),
	`notes` text,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`sizeHectares` decimal(10,2),
	`soilType` varchar(64),
	`location` varchar(256),
	`notes` text,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financeTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`category` varchar(64) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`description` varchar(256),
	`transactionDate` date NOT NULL,
	`season` varchar(64),
	`referenceNumber` varchar(64),
	`paymentMethod` enum('cash','bank_transfer','mobile_money','cheque','other') DEFAULT 'cash',
	`notes` text,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financeTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `harvestLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`plantingId` int,
	`fieldId` int,
	`cropName` varchar(128) NOT NULL,
	`harvestDate` date NOT NULL,
	`yieldAmount` decimal(10,2) NOT NULL,
	`yieldUnit` varchar(32) DEFAULT 'kg',
	`quality` enum('excellent','good','fair','poor') DEFAULT 'good',
	`soldAmount` decimal(10,2),
	`pricePerUnit` decimal(10,2),
	`notes` text,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `harvestLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `healthLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int,
	`logType` enum('vaccination','treatment','checkup','surgery','weight','other') NOT NULL DEFAULT 'checkup',
	`title` varchar(128) NOT NULL,
	`description` text,
	`performedDate` date NOT NULL,
	`nextDueDate` date,
	`performedBy` varchar(128),
	`cost` decimal(10,2),
	`notes` text,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `healthLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` enum('seed','fertilizer','chemical','feed','equipment','fuel','packaging','other') NOT NULL DEFAULT 'other',
	`sku` varchar(64),
	`unit` varchar(32) DEFAULT 'kg',
	`currentStock` decimal(10,2) NOT NULL DEFAULT '0',
	`minimumStock` decimal(10,2) DEFAULT '0',
	`unitCost` decimal(10,2),
	`supplierId` int,
	`notes` text,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mortalityRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int NOT NULL,
	`deathDate` date NOT NULL,
	`cause` varchar(256),
	`causeCategory` enum('disease','injury','natural','predator','unknown','other') NOT NULL DEFAULT 'unknown',
	`notes` text,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mortalityRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text,
	`type` enum('info','warning','alert','success') NOT NULL DEFAULT 'info',
	`category` enum('task','crop','livestock','inventory','finance','system') NOT NULL DEFAULT 'system',
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedEntityType` varchar(64),
	`relatedEntityId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productionRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int,
	`productType` enum('milk','eggs','wool','honey','other') NOT NULL DEFAULT 'milk',
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(32) DEFAULT 'liters',
	`recordDate` date NOT NULL,
	`quality` enum('excellent','good','fair','poor') DEFAULT 'good',
	`notes` text,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productionRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`itemId` int NOT NULL,
	`transactionType` enum('stock_in','stock_out','adjustment') NOT NULL DEFAULT 'stock_in',
	`quantity` decimal(10,2) NOT NULL,
	`unitCost` decimal(10,2),
	`totalCost` decimal(10,2),
	`reason` varchar(256),
	`referenceNumber` varchar(64),
	`transactionDate` date NOT NULL,
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`contactName` varchar(128),
	`email` varchar(320),
	`phone` varchar(32),
	`address` text,
	`notes` text,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` enum('crop','livestock','inventory','finance','maintenance','general') NOT NULL DEFAULT 'general',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`dueDate` date,
	`completedAt` timestamp,
	`assignedToUserId` int,
	`createdByUserId` int,
	`relatedEntityType` varchar(64),
	`relatedEntityId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);