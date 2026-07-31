CREATE TABLE `farmInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`farmRole` enum('owner','manager','worker','viewer') NOT NULL DEFAULT 'worker',
	`invitedByUserId` int NOT NULL,
	`inviteToken` varchar(128) NOT NULL,
	`acceptedByUserId` int,
	`acceptedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `farmInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `farmInvites_inviteToken_unique` UNIQUE(`inviteToken`)
);
