CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`category` enum('Groceries','Rent','Utilities','Fun','Gas','Pet','Health','Other') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_category_unique` UNIQUE(`workspaceId`,`category`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paidBy` enum('A','B') NOT NULL,
	`splitType` enum('50/50','income','custom') NOT NULL,
	`customSplitA` int,
	`category` enum('Groceries','Rent','Utilities','Fun','Gas','Pet','Health','Other') NOT NULL,
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int NOT NULL,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurring_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paidBy` enum('A','B') NOT NULL,
	`splitType` enum('50/50','income','custom') NOT NULL,
	`category` enum('Groceries','Rent','Utilities','Fun','Gas','Pet','Health','Other') NOT NULL,
	`frequency` enum('Monthly','Weekly') NOT NULL,
	`nextDueDate` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int NOT NULL,
	CONSTRAINT `recurring_expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspace_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`invitedBy` int NOT NULL,
	`inviteCode` varchar(32) NOT NULL,
	`inviteeEmail` varchar(320),
	`partnerSlot` enum('A','B') NOT NULL,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`acceptedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_invitations_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`partner` enum('A','B') NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`avatar` text NOT NULL,
	`income` decimal(10,2) NOT NULL DEFAULT '0',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_user_unique` UNIQUE(`workspaceId`,`userId`),
	CONSTRAINT `workspace_partner_unique` UNIQUE(`workspaceId`,`partner`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`ownerId` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT '$',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `workspace_idx` ON `expenses` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `expenses` (`date`);--> statement-breakpoint
CREATE INDEX `workspace_idx` ON `recurring_expenses` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `next_due_date_idx` ON `recurring_expenses` (`nextDueDate`);--> statement-breakpoint
CREATE INDEX `invite_code_idx` ON `workspace_invitations` (`inviteCode`);--> statement-breakpoint
CREATE INDEX `workspace_idx` ON `workspace_invitations` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `workspace_members` (`userId`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `workspaces` (`ownerId`);