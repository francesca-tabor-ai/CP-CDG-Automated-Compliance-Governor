CREATE TABLE `audit_trail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`governanceRuleId` int NOT NULL,
	`codeArtifactId` int,
	`testSuiteId` int,
	`pipelineRunId` int,
	`action` varchar(64) NOT NULL,
	`actor` int NOT NULL,
	`details` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_trail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `code_artifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`governanceRuleId` int NOT NULL,
	`language` varchar(32) NOT NULL DEFAULT 'csharp',
	`className` varchar(255) NOT NULL,
	`code` text NOT NULL,
	`generationPrompt` text,
	`contextUsed` json,
	`status` enum('generated','validated','deployed') NOT NULL DEFAULT 'generated',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`generatedBy` int NOT NULL,
	CONSTRAINT `code_artifacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `context_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('regulatory_doc','adr','utility_signature','best_practice') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`tags` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `context_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codeArtifactId` int,
	`testSuiteId` int,
	`governanceRuleId` int NOT NULL,
	`metricType` enum('prompt_effectiveness','rule_adherence','code_quality','test_coverage') NOT NULL,
	`score` int NOT NULL,
	`details` json,
	`evaluatedBy` varchar(64) NOT NULL,
	`evaluatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluation_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governance_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`statement` text NOT NULL,
	`sourceOfTruth` text NOT NULL,
	`category` varchar(64) NOT NULL,
	`status` enum('active','draft','archived') NOT NULL DEFAULT 'draft',
	`priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `governance_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `governance_rules_ruleId_unique` UNIQUE(`ruleId`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codeArtifactId` int NOT NULL,
	`testSuiteId` int NOT NULL,
	`governanceRuleId` int NOT NULL,
	`runNumber` int NOT NULL,
	`status` enum('pending','running','passed','failed','blocked') NOT NULL DEFAULT 'pending',
	`stages` json,
	`complianceGatePassed` boolean NOT NULL DEFAULT false,
	`testResults` json,
	`triggeredBy` int NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `pipeline_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_suites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codeArtifactId` int NOT NULL,
	`governanceRuleId` int NOT NULL,
	`framework` varchar(32) NOT NULL DEFAULT 'xunit',
	`testCode` text NOT NULL,
	`testCount` int NOT NULL DEFAULT 0,
	`generationPrompt` text,
	`status` enum('generated','passing','failing') NOT NULL DEFAULT 'generated',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`generatedBy` int NOT NULL,
	CONSTRAINT `test_suites_id` PRIMARY KEY(`id`)
);
