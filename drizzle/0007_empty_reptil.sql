CREATE TABLE `aquaGrowthLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`unitId` int NOT NULL,
	`species` varchar(128),
	`logDate` date NOT NULL,
	`sampleSize` int,
	`averageWeightG` decimal(8,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aquaGrowthLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aquaHarvests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`unitId` int NOT NULL,
	`species` varchar(128),
	`harvestDate` date NOT NULL,
	`quantity` int,
	`totalWeightKg` decimal(8,2),
	`averageWeightG` decimal(8,2),
	`grade` varchar(64),
	`destination` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aquaHarvests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aquaMortality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`unitId` int NOT NULL,
	`species` varchar(128),
	`date` date NOT NULL,
	`quantity` int NOT NULL,
	`suspectedCause` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aquaMortality_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aquaProductionUnits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`identifier` varchar(64) NOT NULL,
	`unitType` enum('pond','tank','cage','raceway') NOT NULL,
	`capacityLiters` decimal(10,2),
	`location` varchar(255),
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aquaProductionUnits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aquaStocking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`unitId` int NOT NULL,
	`species` varchar(128) NOT NULL,
	`quantity` int NOT NULL,
	`stockingDate` date NOT NULL,
	`source` varchar(255),
	`initialWeightG` decimal(8,2),
	`costPerUnit` decimal(8,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aquaStocking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aquaWaterQuality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`unitId` int NOT NULL,
	`measurementDate` date NOT NULL,
	`temperature` decimal(5,2),
	`pH` decimal(4,2),
	`dissolvedOxygen` decimal(5,2),
	`ammonia` decimal(5,2),
	`nitrite` decimal(5,2),
	`salinity` decimal(5,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aquaWaterQuality_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beeApiaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`location` varchar(255),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beeApiaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beeHarvests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`apiaryId` int NOT NULL,
	`hiveId` int,
	`harvestDate` date NOT NULL,
	`quantityKg` decimal(8,2) DEFAULT '0.00',
	`qualityGrade` varchar(64),
	`storageDestination` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beeHarvests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beeHives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`apiaryId` int NOT NULL,
	`identifier` varchar(64) NOT NULL,
	`hiveType` varchar(64),
	`colonyStatus` enum('strong','moderate','weak','empty','dead') NOT NULL DEFAULT 'moderate',
	`installationDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beeHives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beeInspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`hiveId` int NOT NULL,
	`date` date NOT NULL,
	`colonyStrength` enum('strong','moderate','weak'),
	`queenObserved` boolean DEFAULT false,
	`honeyStores` varchar(128),
	`pestsDiseases` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beeInspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beeQueens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`hiveId` int NOT NULL,
	`introductionDate` date,
	`origin` varchar(255),
	`status` enum('present','missing','replaced','dead') NOT NULL DEFAULT 'present',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beeQueens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dairyAnimals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128),
	`tagNumber` varchar(64),
	`breed` varchar(128),
	`gender` enum('male','female') NOT NULL DEFAULT 'female',
	`birthDate` date,
	`acquisitionDate` date,
	`acquisitionType` enum('born','purchased','donated','other') DEFAULT 'born',
	`status` enum('active','sold','deceased','transferred') NOT NULL DEFAULT 'active',
	`parentMaleId` int,
	`parentFemaleId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dairyAnimals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dairyBreeding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int NOT NULL,
	`eventDate` date NOT NULL,
	`method` varchar(128),
	`sireInfo` varchar(255),
	`pregnancyStatus` enum('pending','confirmed','failed') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dairyBreeding_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dairyCalving` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int NOT NULL,
	`expectedDate` date,
	`actualDate` date,
	`calfCount` int DEFAULT 1,
	`complications` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dairyCalving_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dairyMilkProduction` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int NOT NULL,
	`date` date NOT NULL,
	`morningVolume` decimal(8,2) DEFAULT '0.00',
	`eveningVolume` decimal(8,2) DEFAULT '0.00',
	`totalVolume` decimal(8,2) DEFAULT '0.00',
	`qualityNotes` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dairyMilkProduction_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poultryEggProduction` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`flockId` int NOT NULL,
	`date` date NOT NULL,
	`eggsCollected` int NOT NULL DEFAULT 0,
	`damagedEggs` int NOT NULL DEFAULT 0,
	`saleableEggs` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poultryEggProduction_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poultryFlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`breed` varchar(128),
	`birdType` varchar(64) NOT NULL DEFAULT 'layer',
	`quantity` int NOT NULL DEFAULT 0,
	`housing` varchar(255),
	`acquisitionDate` date,
	`source` varchar(255),
	`status` enum('active','sold','culled','transferred') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poultryFlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poultryHealthLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`flockId` int NOT NULL,
	`date` date NOT NULL,
	`condition` varchar(255),
	`affectedQuantity` int,
	`treatment` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poultryHealthLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poultryMortality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`flockId` int NOT NULL,
	`date` date NOT NULL,
	`quantity` int NOT NULL,
	`suspectedCause` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poultryMortality_id` PRIMARY KEY(`id`)
);
