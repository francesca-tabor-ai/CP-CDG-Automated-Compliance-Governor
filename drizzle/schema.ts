import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Governance rules table - stores regulatory compliance rules
 */
export const governanceRules = mysqlTable("governance_rules", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: varchar("ruleId", { length: 64 }).notNull().unique(), // e.g., CP-CDG-PII-001
  title: varchar("title", { length: 255 }).notNull(),
  statement: text("statement").notNull(), // The actual rule statement
  sourceOfTruth: text("sourceOfTruth").notNull(), // Regulatory documentation source
  category: varchar("category", { length: 64 }).notNull(), // e.g., PII, Security, Data Governance
  status: mysqlEnum("status", ["active", "draft", "archived"]).default("draft").notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GovernanceRule = typeof governanceRules.$inferSelect;
export type InsertGovernanceRule = typeof governanceRules.$inferInsert;

/**
 * Context store (RAG) - stores documentation, ADRs, and approved utilities
 */
export const contextDocuments = mysqlTable("context_documents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["regulatory_doc", "adr", "utility_signature", "best_practice"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(), // Additional metadata
  tags: json("tags").$type<string[]>(), // For categorization
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContextDocument = typeof contextDocuments.$inferSelect;
export type InsertContextDocument = typeof contextDocuments.$inferInsert;

/**
 * Generated code artifacts - stores AI-generated production code
 */
export const codeArtifacts = mysqlTable("code_artifacts", {
  id: int("id").autoincrement().primaryKey(),
  governanceRuleId: int("governanceRuleId").notNull(),
  language: varchar("language", { length: 32 }).notNull().default("csharp"),
  className: varchar("className", { length: 255 }).notNull(),
  code: text("code").notNull(),
  generationPrompt: text("generationPrompt"), // The prompt used to generate this code
  contextUsed: json("contextUsed").$type<number[]>(), // IDs of context documents used
  status: mysqlEnum("status", ["generated", "validated", "deployed"]).default("generated").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  generatedBy: int("generatedBy").notNull(),
});

export type CodeArtifact = typeof codeArtifacts.$inferSelect;
export type InsertCodeArtifact = typeof codeArtifacts.$inferInsert;

/**
 * Test suites - stores AI-generated compliance tests
 */
export const testSuites = mysqlTable("test_suites", {
  id: int("id").autoincrement().primaryKey(),
  codeArtifactId: int("codeArtifactId").notNull(),
  governanceRuleId: int("governanceRuleId").notNull(),
  framework: varchar("framework", { length: 32 }).notNull().default("xunit"), // xunit, nunit
  testCode: text("testCode").notNull(),
  testCount: int("testCount").notNull().default(0),
  generationPrompt: text("generationPrompt"),
  status: mysqlEnum("status", ["generated", "passing", "failing"]).default("generated").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  generatedBy: int("generatedBy").notNull(),
});

export type TestSuite = typeof testSuites.$inferSelect;
export type InsertTestSuite = typeof testSuites.$inferInsert;

/**
 * Pipeline runs - simulates CI/CD pipeline executions
 */
export const pipelineRuns = mysqlTable("pipeline_runs", {
  id: int("id").autoincrement().primaryKey(),
  codeArtifactId: int("codeArtifactId").notNull(),
  testSuiteId: int("testSuiteId").notNull(),
  governanceRuleId: int("governanceRuleId").notNull(),
  runNumber: int("runNumber").notNull(),
  status: mysqlEnum("status", ["pending", "running", "passed", "failed", "blocked"]).default("pending").notNull(),
  stages: json("stages").$type<{
    name: string;
    status: "pending" | "running" | "passed" | "failed";
    startedAt?: number;
    completedAt?: number;
    logs?: string;
  }[]>(),
  complianceGatePassed: boolean("complianceGatePassed").default(false).notNull(),
  testResults: json("testResults").$type<{
    total: number;
    passed: number;
    failed: number;
    details?: string;
  }>(),
  triggeredBy: int("triggeredBy").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type InsertPipelineRun = typeof pipelineRuns.$inferInsert;

/**
 * Evaluation metrics - tracks AI output quality and correctness
 */
export const evaluationMetrics = mysqlTable("evaluation_metrics", {
  id: int("id").autoincrement().primaryKey(),
  codeArtifactId: int("codeArtifactId"),
  testSuiteId: int("testSuiteId"),
  governanceRuleId: int("governanceRuleId").notNull(),
  metricType: mysqlEnum("metricType", ["prompt_effectiveness", "rule_adherence", "code_quality", "test_coverage"]).notNull(),
  score: int("score").notNull(), // 0-100
  details: json("details").$type<Record<string, any>>(),
  evaluatedBy: varchar("evaluatedBy", { length: 64 }).notNull(), // e.g., "langsmith", "honeyhive", "manual"
  evaluatedAt: timestamp("evaluatedAt").defaultNow().notNull(),
});

export type EvaluationMetric = typeof evaluationMetrics.$inferSelect;
export type InsertEvaluationMetric = typeof evaluationMetrics.$inferInsert;

/**
 * Audit trail - tracks the complete lineage from rule to code to tests
 */
export const auditTrail = mysqlTable("audit_trail", {
  id: int("id").autoincrement().primaryKey(),
  governanceRuleId: int("governanceRuleId").notNull(),
  codeArtifactId: int("codeArtifactId"),
  testSuiteId: int("testSuiteId"),
  pipelineRunId: int("pipelineRunId"),
  action: varchar("action", { length: 64 }).notNull(), // e.g., "rule_created", "code_generated", "test_executed"
  actor: int("actor").notNull(), // User ID
  details: json("details").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertAuditTrail = typeof auditTrail.$inferInsert;
