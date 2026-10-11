CREATE TABLE IF NOT EXISTS `emailAutomationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`userId` int,
	`recipientEmail` varchar(320) NOT NULL,
	`automationType` varchar(64) NOT NULL,
	`status` enum('sent','failed','skipped') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	`metadata` json,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailAutomationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `userEmailPreferences` (
	`userId` int NOT NULL,
	`billingEmails` boolean NOT NULL DEFAULT true,
	`agriInsightEmails` boolean NOT NULL DEFAULT true,
	`farmDigestEmails` boolean NOT NULL DEFAULT true,
	`securityEmails` boolean NOT NULL DEFAULT true,
	`unsubscribeToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userEmailPreferences_userId` PRIMARY KEY(`userId`),
	CONSTRAINT `userEmailPreferences_unsubscribeToken_unique` UNIQUE(`unsubscribeToken`)
);
