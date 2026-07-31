CREATE TABLE `iotCommands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`deviceId` int NOT NULL,
	`issuedBy` int NOT NULL,
	`commandType` enum('irrigation_on','irrigation_off','valve_open','valve_close','device_restart','sensor_calibrate','request_telemetry','firmware_update','set_reporting_interval') NOT NULL,
	`params` json,
	`status` enum('pending','sent','acknowledged','completed','failed') NOT NULL DEFAULT 'pending',
	`result` text,
	`sentAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iotCommands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iotDeviceGroupMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`deviceId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iotDeviceGroupMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iotDeviceGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`color` varchar(16),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iotDeviceGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iotDigitalTwins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`label` varchar(128) NOT NULL,
	`entityType` enum('field','paddock','greenhouse','livestock_shed','water_tank','irrigation_zone','equipment_yard','other') NOT NULL,
	`entityId` int,
	`location` json,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iotDigitalTwins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iotEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`deviceId` int,
	`sensorId` int,
	`gatewayId` int,
	`eventType` varchar(64) NOT NULL,
	`source` varchar(64) NOT NULL,
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iotEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iotGateways` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`protocol` enum('mqtt','lorawan','zigbee','ble','http','simulated') NOT NULL DEFAULT 'mqtt',
	`externalId` varchar(128),
	`status` enum('online','offline','error') NOT NULL DEFAULT 'offline',
	`config` json,
	`lastSeenAt` timestamp,
	`ipAddress` varchar(64),
	`firmwareVersion` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iotGateways_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iotSensorCalibrationLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sensorId` int NOT NULL,
	`farmId` int NOT NULL,
	`calibratedBy` int NOT NULL,
	`method` varchar(64) NOT NULL,
	`offsetBefore` float,
	`multiplierBefore` float,
	`offsetAfter` float NOT NULL,
	`multiplierAfter` float NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iotSensorCalibrationLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizationMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `organizationMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `farmMembers` MODIFY COLUMN `farmRole` enum('owner','administrator','farm_manager','worker','veterinary_officer','crop_officer','viewer') NOT NULL DEFAULT 'viewer';--> statement-breakpoint
ALTER TABLE `iotDevices` ADD `gatewayId` int;--> statement-breakpoint
ALTER TABLE `iotDevices` ADD `groupId` int;--> statement-breakpoint
ALTER TABLE `iotDevices` ADD `twinId` int;--> statement-breakpoint
ALTER TABLE `iotSensors` ADD `calibrationOffset` float DEFAULT 0;--> statement-breakpoint
ALTER TABLE `iotSensors` ADD `calibrationMultiplier` float DEFAULT 1;--> statement-breakpoint
ALTER TABLE `iotSensors` ADD `calibrationMethod` varchar(64);--> statement-breakpoint
ALTER TABLE `iotSensors` ADD `calibrationStatus` enum('ok','due','overdue','uncalibrated') DEFAULT 'uncalibrated';--> statement-breakpoint
ALTER TABLE `iotSensors` ADD `lastCalibratedAt` timestamp;--> statement-breakpoint
ALTER TABLE `iotSensors` ADD `nextCalibrationAt` timestamp;--> statement-breakpoint
ALTER TABLE `organizations` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `description` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `address` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `taxId` varchar(64);--> statement-breakpoint
ALTER TABLE `organizations` ADD `contactEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `organizations` ADD `contactPhone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` varchar(16) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `users` ADD `theme` enum('light','dark','system') DEFAULT 'system';--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(64) DEFAULT 'UTC';