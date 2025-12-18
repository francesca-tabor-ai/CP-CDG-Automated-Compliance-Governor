import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  governanceRules,
  InsertGovernanceRule,
  contextDocuments,
  InsertContextDocument,
  codeArtifacts,
  InsertCodeArtifact,
  testSuites,
  InsertTestSuite,
  pipelineRuns,
  InsertPipelineRun,
  evaluationMetrics,
  InsertEvaluationMetric,
  auditTrail,
  InsertAuditTrail,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Management ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Governance Rules ============

export async function createGovernanceRule(rule: InsertGovernanceRule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(governanceRules).values(rule);
  return result;
}

export async function getGovernanceRules() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(governanceRules).orderBy(desc(governanceRules.createdAt));
}

export async function getGovernanceRuleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(governanceRules).where(eq(governanceRules.id, id)).limit(1);
  return result[0];
}

export async function updateGovernanceRule(id: number, updates: Partial<InsertGovernanceRule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(governanceRules).set(updates).where(eq(governanceRules.id, id));
}

export async function deleteGovernanceRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(governanceRules).where(eq(governanceRules.id, id));
}

// ============ Context Documents ============

export async function createContextDocument(doc: InsertContextDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contextDocuments).values(doc);
  return result;
}

export async function getContextDocuments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(contextDocuments).orderBy(desc(contextDocuments.createdAt));
}

export async function getContextDocumentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(contextDocuments).where(eq(contextDocuments.id, id)).limit(1);
  return result[0];
}

export async function updateContextDocument(id: number, updates: Partial<InsertContextDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contextDocuments).set(updates).where(eq(contextDocuments.id, id));
}

export async function deleteContextDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(contextDocuments).where(eq(contextDocuments.id, id));
}

// ============ Code Artifacts ============

export async function createCodeArtifact(artifact: InsertCodeArtifact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(codeArtifacts).values(artifact);
  return result;
}

export async function getCodeArtifacts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(codeArtifacts).orderBy(desc(codeArtifacts.generatedAt));
}

export async function getCodeArtifactById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(codeArtifacts).where(eq(codeArtifacts.id, id)).limit(1);
  return result[0];
}

export async function getCodeArtifactsByRuleId(ruleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(codeArtifacts).where(eq(codeArtifacts.governanceRuleId, ruleId)).orderBy(desc(codeArtifacts.generatedAt));
}

// ============ Test Suites ============

export async function createTestSuite(suite: InsertTestSuite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(testSuites).values(suite);
  return result;
}

export async function getTestSuites() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(testSuites).orderBy(desc(testSuites.generatedAt));
}

export async function getTestSuiteById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(testSuites).where(eq(testSuites.id, id)).limit(1);
  return result[0];
}

export async function getTestSuitesByCodeArtifactId(artifactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(testSuites).where(eq(testSuites.codeArtifactId, artifactId)).orderBy(desc(testSuites.generatedAt));
}

// ============ Pipeline Runs ============

export async function createPipelineRun(run: InsertPipelineRun) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pipelineRuns).values(run);
  return result;
}

export async function getPipelineRuns() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.startedAt));
}

export async function getPipelineRunById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(pipelineRuns).where(eq(pipelineRuns.id, id)).limit(1);
  return result[0];
}

export async function updatePipelineRun(id: number, updates: Partial<InsertPipelineRun>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pipelineRuns).set(updates).where(eq(pipelineRuns.id, id));
}

// ============ Evaluation Metrics ============

export async function createEvaluationMetric(metric: InsertEvaluationMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(evaluationMetrics).values(metric);
  return result;
}

export async function getEvaluationMetrics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(evaluationMetrics).orderBy(desc(evaluationMetrics.evaluatedAt));
}

export async function getEvaluationMetricsByRuleId(ruleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(evaluationMetrics).where(eq(evaluationMetrics.governanceRuleId, ruleId)).orderBy(desc(evaluationMetrics.evaluatedAt));
}

// ============ Audit Trail ============

export async function createAuditEntry(entry: InsertAuditTrail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(auditTrail).values(entry);
  return result;
}

export async function getAuditTrail() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(auditTrail).orderBy(desc(auditTrail.timestamp));
}

export async function getAuditTrailByRuleId(ruleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(auditTrail).where(eq(auditTrail.governanceRuleId, ruleId)).orderBy(desc(auditTrail.timestamp));
}
