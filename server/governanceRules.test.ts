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

describe("governanceRules", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should create a governance rule", async () => {
    const result = await caller.governanceRules.create({
      ruleId: `CP-CDG-TEST-${randomUUID().slice(0, 8)}`,
      title: "Test Governance Rule",
      statement: "This is a test governance rule statement",
      sourceOfTruth: "Test regulatory documentation",
      category: "Testing",
      priority: "medium",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("should list governance rules", async () => {
    const rules = await caller.governanceRules.list();
    expect(Array.isArray(rules)).toBe(true);
  });

  it("should get a governance rule by id", async () => {
    // Create a rule first
    const uniqueId = `CP-CDG-TEST-${randomUUID().slice(0, 8)}`;
    const createResult = await caller.governanceRules.create({
      ruleId: uniqueId,
      title: "Test Rule for Retrieval",
      statement: "Test statement",
      sourceOfTruth: "Test source",
      category: "Testing",
      priority: "high",
    });

    if (createResult.id) {
      const rule = await caller.governanceRules.getById({ id: createResult.id });
      expect(rule).toBeDefined();
      expect(rule?.ruleId).toBe(uniqueId);
      expect(rule?.title).toBe("Test Rule for Retrieval");
    }
  });

  it("should update a governance rule", async () => {
    // Create a rule first
    const createResult = await caller.governanceRules.create({
      ruleId: `CP-CDG-TEST-${randomUUID().slice(0, 8)}`,
      title: "Original Title",
      statement: "Original statement",
      sourceOfTruth: "Original source",
      category: "Testing",
      priority: "low",
    });

    if (createResult.id) {
      const updateResult = await caller.governanceRules.update({
        id: createResult.id,
        title: "Updated Title",
        priority: "critical",
      });

      expect(updateResult.success).toBe(true);

      const updatedRule = await caller.governanceRules.getById({ id: createResult.id });
      expect(updatedRule?.title).toBe("Updated Title");
      expect(updatedRule?.priority).toBe("critical");
    }
  });

  it("should delete a governance rule", async () => {
    // Create a rule first
    const createResult = await caller.governanceRules.create({
      ruleId: `CP-CDG-TEST-${randomUUID().slice(0, 8)}`,
      title: "Rule to Delete",
      statement: "This rule will be deleted",
      sourceOfTruth: "Test source",
      category: "Testing",
      priority: "low",
    });

    if (createResult.id) {
      const deleteResult = await caller.governanceRules.delete({ id: createResult.id });
      expect(deleteResult.success).toBe(true);

      const deletedRule = await caller.governanceRules.getById({ id: createResult.id });
      expect(deletedRule).toBeUndefined();
    }
  });

  it("should create rules with all priority levels", async () => {
    const priorities = ["critical", "high", "medium", "low"] as const;
    
    for (const priority of priorities) {
      const result = await caller.governanceRules.create({
        ruleId: `CP-CDG-PRIORITY-${priority}-${randomUUID().slice(0, 8)}`,
        title: `${priority} Priority Rule`,
        statement: "Test statement",
        sourceOfTruth: "Test source",
        category: "Testing",
        priority,
      });
      
      expect(result.success).toBe(true);
    }
  });
});
