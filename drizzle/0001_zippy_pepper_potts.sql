CREATE TABLE `routePlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submittedBy` int NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`totalCost` varchar(32) NOT NULL DEFAULT '0',
	`dailyRoutes` text NOT NULL,
	`status` enum('submitted','reviewed') NOT NULL DEFAULT 'submitted',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routePlans_id` PRIMARY KEY(`id`)
);
