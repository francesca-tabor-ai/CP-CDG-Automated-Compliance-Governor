import { describe, expect, it, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("evaluation", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should create an evaluation metric", async () => {
    // First create a governance rule
    const ruleResult = await caller.governanceRules.create({
      ruleId: `CP-CDG-EVAL-${randomUUID().slice(0, 8)}`,
      title: "Rule for Evaluation",
      statement: "Test statement",
      sourceOfTruth: "Test source",
      category: "Testing",
      priority: "medium",
    });

    if (ruleResult.id) {
      const result = await caller.evaluation.create({
        governanceRuleId: ruleResult.id,
        metricType: "prompt_effectiveness",
        score: 85,
        evaluatedBy: "langsmith",
        details: { accuracy: 0.85, latency: 250 },
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    }
  });

  it("should list evaluation metrics", async () => {
    const metrics = await caller.evaluation.list();
    expect(Array.isArray(metrics)).toBe(true);
  });

  it("should get evaluation metrics by rule id", async () => {
    const ruleResult = await caller.governanceRules.create({
      ruleId: `CP-CDG-EVAL-${randomUUID().slice(0, 8)}`,
      title: "Rule for Metrics",
      statement: "Test statement",
      sourceOfTruth: "Test source",
      category: "Testing",
      priority: "high",
    });

    if (ruleResult.id) {
      await caller.evaluation.create({
        governanceRuleId: ruleResult.id,
        metricType: "rule_adherence",
        score: 92,
        evaluatedBy: "honeyhive",
      });

      const metrics = await caller.evaluation.getByRuleId({ ruleId: ruleResult.id });
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
    }
  });

  it("should support all metric types", async () => {
    const ruleResult = await caller.governanceRules.create({
      ruleId: `CP-CDG-EVAL-${randomUUID().slice(0, 8)}`,
      title: "Rule for All Metrics",
      statement: "Test statement",
      sourceOfTruth: "Test source",
      category: "Testing",
      priority: "low",
    });

    if (ruleResult.id) {
      const metricTypes = ["prompt_effectiveness", "rule_adherence", "code_quality", "test_coverage"] as const;

      for (const metricType of metricTypes) {
        const result = await caller.evaluation.create({
          governanceRuleId: ruleResult.id,
          metricType,
          score: 80,
          evaluatedBy: "test-framework",
        });

        expect(result.success).toBe(true);
      }
    }
  });

  it("should enforce score range validation", async () => {
    const ruleResult = await caller.governanceRules.create({
      ruleId: `CP-CDG-EVAL-${randomUUID().slice(0, 8)}`,
      title: "Rule for Score Validation",
      statement: "Test statement",
      sourceOfTruth: "Test source",
      category: "Testing",
      priority: "medium",
    });

    if (ruleResult.id) {
      // Score too high
      await expect(
        caller.evaluation.create({
          governanceRuleId: ruleResult.id,
          metricType: "code_quality",
          score: 101,
          evaluatedBy: "test",
        })
      ).rejects.toThrow();

      // Score too low
      await expect(
        caller.evaluation.create({
          governanceRuleId: ruleResult.id,
          metricType: "code_quality",
          score: -1,
          evaluatedBy: "test",
        })
      ).rejects.toThrow();

      // Valid score
      const validResult = await caller.evaluation.create({
        governanceRuleId: ruleResult.id,
        metricType: "code_quality",
        score: 75,
        evaluatedBy: "test",
      });

      expect(validResult.success).toBe(true);
    }
  });
});
