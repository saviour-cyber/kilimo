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
CREATE TABLE `activitylogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL DEFAULT 0,
	`userId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activitylogs_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `emailVerificationTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailVerificationTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailVerificationTokens_tokenHash_unique` UNIQUE(`tokenHash`)
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
--> statement-breakpoint
CREATE TABLE `farmMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`userId` int NOT NULL,
	`farmRole` enum('owner','administrator','farm_manager','worker','veterinary_officer','crop_officer','viewer') NOT NULL DEFAULT 'viewer',
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
	`organizationId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`county` varchar(64),
	`subCounty` varchar(64),
	`ward` varchar(64),
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
CREATE TABLE `generatedReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`moduleKeys` json NOT NULL,
	`filters` json,
	`format` enum('pdf','excel','csv','print') NOT NULL,
	`fileUrl` text,
	`generatedByUserId` int NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	CONSTRAINT `generatedReports_id` PRIMARY KEY(`id`)
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
CREATE TABLE `iotAlertRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`sensorId` int,
	`sensorType` varchar(64),
	`condition` enum('>','<','>=','<=','==','!=') NOT NULL,
	`threshold` float NOT NULL,
	`comparisonValue` varchar(64),
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`priority` int NOT NULL DEFAULT 0,
	`enabled` boolean NOT NULL DEFAULT true,
	`evaluationWindow` int,
	`cooldownPeriod` int NOT NULL DEFAULT 60,
	`messageTemplate` text NOT NULL,
	`notificationChannels` json,
	`actionType` enum('notify','task','webhook','recommendation') NOT NULL DEFAULT 'notify',
	`webhookUrl` varchar(512),
	`targetModule` varchar(64),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iotAlertRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iotAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`ruleId` int,
	`sensorId` int NOT NULL,
	`deviceId` int NOT NULL,
	`alertType` enum('threshold_high','threshold_low','device_offline','battery_low') NOT NULL,
	`message` text NOT NULL,
	`value` float,
	`isRead` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iotAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `iotDevices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`deviceType` enum('weather_station','soil_probe','water_sensor','livestock_collar','equipment_sensor','gateway','other') NOT NULL,
	`protocol` enum('simulated','mqtt','http','lorawan','zigbee','ble') NOT NULL DEFAULT 'simulated',
	`manufacturer` varchar(128),
	`model` varchar(128),
	`firmwareVersion` varchar(64),
	`status` enum('online','offline','error','maintenance') NOT NULL DEFAULT 'offline',
	`batteryLevel` int,
	`location` json,
	`lastCommunicationAt` timestamp,
	`isSimulated` boolean NOT NULL DEFAULT true,
	`gatewayId` int,
	`groupId` int,
	`twinId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iotDevices_id` PRIMARY KEY(`id`)
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
CREATE TABLE `iotSensorState` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sensorId` int NOT NULL,
	`deviceId` int NOT NULL,
	`farmId` int NOT NULL,
	`latestValue` float,
	`latestRecordedAt` timestamp,
	`signalStrength` int,
	`batteryLevel` int,
	`healthScore` int,
	`lastAlertId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iotSensorState_id` PRIMARY KEY(`id`),
	CONSTRAINT `iotSensorState_sensorId_unique` UNIQUE(`sensorId`)
);
--> statement-breakpoint
CREATE TABLE `iotSensors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`farmId` int NOT NULL,
	`sensorType` enum('soil_moisture','soil_temperature','soil_ph','soil_ec','air_temperature','humidity','rainfall','wind_speed','solar_radiation','tank_level','water_flow','irrigation_pressure','water_level','livestock_temperature','activity','gps_location','feed_intake','fuel_level','engine_hours','battery_voltage','maintenance_status','other') NOT NULL,
	`category` enum('soil','environmental','water','livestock','equipment') NOT NULL,
	`label` varchar(128),
	`unit` varchar(32),
	`minVal` float,
	`maxVal` float,
	`alertMin` float,
	`alertMax` float,
	`isActive` boolean NOT NULL DEFAULT true,
	`calibrationOffset` float DEFAULT 0,
	`calibrationMultiplier` float DEFAULT 1,
	`calibrationMethod` varchar(64),
	`calibrationStatus` enum('ok','due','overdue','uncalibrated') DEFAULT 'uncalibrated',
	`lastCalibratedAt` timestamp,
	`nextCalibrationAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iotSensors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iotTelemetry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sensorId` int NOT NULL,
	`deviceId` int NOT NULL,
	`farmId` int NOT NULL,
	`value` float NOT NULL,
	`metadata` json,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iotTelemetry_id` PRIMARY KEY(`id`)
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
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`businessType` varchar(64) NOT NULL,
	`country` varchar(64) NOT NULL DEFAULT 'Kenya',
	`county` varchar(64),
	`currency` varchar(8) NOT NULL DEFAULT 'KES',
	`timezone` varchar(64) NOT NULL DEFAULT 'Africa/Nairobi',
	`logoUrl` text,
	`description` text,
	`address` text,
	`taxId` varchar(64),
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passwordResetTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResetTokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `platformannouncements` (
	`id` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`type` varchar(32) NOT NULL DEFAULT 'info',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformannouncements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformModules` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`version` varchar(32) DEFAULT '1.0.0',
	`isEnabled` boolean NOT NULL DEFAULT true,
	`icon` varchar(64),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformServices` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`providerConfig` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformServices_id` PRIMARY KEY(`id`)
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
CREATE TABLE `scheduledReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`moduleKeys` json NOT NULL,
	`filters` json,
	`format` enum('pdf','excel','csv') NOT NULL,
	`frequency` enum('daily','weekly','monthly') NOT NULL,
	`nextRunAt` timestamp NOT NULL,
	`lastRunAt` timestamp,
	`createdByUserId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledReports_id` PRIMARY KEY(`id`)
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
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64),
	`password` text,
	`name` text,
	`email` varchar(320),
	`phone` varchar(32),
	`country` varchar(64) DEFAULT 'Kenya',
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`avatarUrl` text,
	`preferredLanguage` varchar(16) DEFAULT 'en',
	`theme` enum('light','dark','system') DEFAULT 'system',
	`timezone` varchar(64) DEFAULT 'UTC',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
