
CREATE TABLE `subscriptionPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`organizationId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'KES',
	`status` enum('pending','successful','failed','refunded') NOT NULL DEFAULT 'pending',
	`billingInterval` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`paymentProvider` varchar(64),
	`providerTransactionId` varchar(128),
	`periodStart` timestamp,
	`periodEnd` timestamp,
	`paidAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPlanFeatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`featureKey` varchar(64) NOT NULL,
	`featureType` enum('module','service') NOT NULL DEFAULT 'module',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptionPlanFeatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`description` text,
	`monthlyPrice` decimal(10,2) NOT NULL DEFAULT '0',
	`yearlyPrice` decimal(10,2) NOT NULL DEFAULT '0',
	`currency` varchar(8) NOT NULL DEFAULT 'KES',
	`trialDays` int NOT NULL DEFAULT 14,
	`maxFarms` int,
	`maxUsers` int,
	`maxDevices` int,
	`maxStorageMb` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('trialing','active','past_due','cancelled','expired','suspended') NOT NULL DEFAULT 'trialing',
	`billingInterval` enum('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly',
	`trialEndsAt` timestamp,
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`cancelReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_organizationId_unique` UNIQUE(`organizationId`)
);
