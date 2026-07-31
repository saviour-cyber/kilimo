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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iotDevices_id` PRIMARY KEY(`id`)
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
