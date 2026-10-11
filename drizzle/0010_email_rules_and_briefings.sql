CREATE TABLE IF NOT EXISTS `emailAutomationRules` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`category` enum('billing','agricultural','system') NOT NULL DEFAULT 'billing',
	`isEnabled` boolean NOT NULL DEFAULT true,
	`isSystemEnforced` boolean NOT NULL DEFAULT false,
	`triggerType` varchar(64) NOT NULL,
	`cronExpression` varchar(64),
	`timeZone` varchar(64) NOT NULL DEFAULT 'UTC',
	`templateKey` varchar(64) NOT NULL,
	`recipientRule` text NOT NULL,
	`lastExecutedAt` timestamp,
	`lastExecutionStatus` varchar(32),
	`lastExecutionMessage` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailAutomationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `regionalBriefingConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`regionName` varchar(128) NOT NULL,
	`county` varchar(64) NOT NULL,
	`frequency` enum('daily','weekly','biweekly') NOT NULL DEFAULT 'weekly',
	`minScanThreshold` int NOT NULL DEFAULT 3,
	`requireWeatherData` boolean NOT NULL DEFAULT true,
	`requireMarketData` boolean NOT NULL DEFAULT false,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`lastDispatchedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `regionalBriefingConfigs_id` PRIMARY KEY(`id`)
);
