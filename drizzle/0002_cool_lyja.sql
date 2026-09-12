CREATE TABLE `routePlanDays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routePlanId` int NOT NULL,
	`day` varchar(12) NOT NULL,
	`fromLocation` varchar(160) NOT NULL,
	`toLocation` varchar(160) NOT NULL,
	`plannedArrival` varchar(5) NOT NULL,
	`departure` varchar(5) NOT NULL,
	`transportMode` varchar(32) NOT NULL,
	`cost` varchar(32) NOT NULL DEFAULT '0',
	CONSTRAINT `routePlanDays_id` PRIMARY KEY(`id`)
);
