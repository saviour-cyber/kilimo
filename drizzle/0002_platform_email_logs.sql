CREATE TABLE `platformEmailLogs` (
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
