-- Migration: 0005_workers_payroll_documents

CREATE TABLE IF NOT EXISTS `workerPayroll` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`workerId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'KES',
	`periodStart` date NOT NULL,
	`periodEnd` date NOT NULL,
	`status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paymentDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workerPayroll_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workerDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`workerId` int NOT NULL,
	`title` varchar(128) NOT NULL,
	`documentType` enum('contract','id','certificate','other') NOT NULL DEFAULT 'other',
	`fileUrl` text NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workerDocuments_id` PRIMARY KEY(`id`)
);
