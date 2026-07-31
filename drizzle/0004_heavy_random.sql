CREATE TABLE `diseaseScans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`scanType` enum('crop','livestock','other') NOT NULL DEFAULT 'crop',
	`imageUrl` text NOT NULL,
	`detectedDisease` varchar(256),
	`confidenceScore` decimal(5,2),
	`severity` enum('low','medium','high','critical','unknown') NOT NULL DEFAULT 'unknown',
	`recommendation` text,
	`status` enum('pending_review','verified','false_positive','treated') NOT NULL DEFAULT 'pending_review',
	`relatedEntityId` int,
	`notes` text,
	`scannedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diseaseScans_id` PRIMARY KEY(`id`)
);
