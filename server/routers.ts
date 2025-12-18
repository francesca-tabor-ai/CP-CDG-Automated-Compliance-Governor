import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ Governance Rules ============
  governanceRules: router({
    list: protectedProcedure.query(async () => {
      return await db.getGovernanceRules();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getGovernanceRuleById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        ruleId: z.string(),
        title: z.string(),
        statement: z.string(),
        sourceOfTruth: z.string(),
        category: z.string(),
        priority: z.enum(["critical", "high", "medium", "low"]),
        status: z.enum(["active", "draft", "archived"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createGovernanceRule({
          ...input,
          createdBy: ctx.user.id,
        });

        // Get the created rule to obtain its ID
        const rules = await db.getGovernanceRules();
        const createdRule = rules.find(r => r.ruleId === input.ruleId);
        
        if (createdRule) {
          // Create audit entry
          await db.createAuditEntry({
            governanceRuleId: createdRule.id,
            action: "rule_created",
            actor: ctx.user.id,
            details: { ruleId: input.ruleId, title: input.title },
          });
        }

        return { success: true, id: createdRule?.id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        statement: z.string().optional(),
        sourceOfTruth: z.string().optional(),
        category: z.string().optional(),
        priority: z.enum(["critical", "high", "medium", "low"]).optional(),
        status: z.enum(["active", "draft", "archived"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        await db.updateGovernanceRule(id, updates);

        // Create audit entry
        await db.createAuditEntry({
          governanceRuleId: id,
          action: "rule_updated",
          actor: ctx.user.id,
          details: updates,
        });

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteGovernanceRule(input.id);

        // Create audit entry
        await db.createAuditEntry({
          governanceRuleId: input.id,
          action: "rule_deleted",
          actor: ctx.user.id,
          details: {},
        });

        return { success: true };
      }),
  }),

  // ============ Context Documents (RAG) ============
  contextDocuments: router({
    list: protectedProcedure.query(async () => {
      return await db.getContextDocuments();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getContextDocumentById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        type: z.enum(["regulatory_doc", "adr", "utility_signature", "best_practice"]),
        content: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createContextDocument({
          ...input,
          createdBy: ctx.user.id,
        });

        // Get the created document
        const docs = await db.getContextDocuments();
        const createdDoc = docs[0]; // Most recent

        return { success: true, id: createdDoc?.id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateContextDocument(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContextDocument(input.id);
        return { success: true };
      }),
  }),

  // ============ Code Generation ============
  codeGeneration: router({
    generate: protectedProcedure
      .input(z.object({
        governanceRuleId: z.number(),
        contextDocumentIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Fetch the governance rule
        const rule = await db.getGovernanceRuleById(input.governanceRuleId);
        if (!rule) {
          throw new Error("Governance rule not found");
        }

        // Fetch context documents if provided
        let contextContent = "";
        if (input.contextDocumentIds && input.contextDocumentIds.length > 0) {
          const contexts = await Promise.all(
            input.contextDocumentIds.map(id => db.getContextDocumentById(id))
          );
          contextContent = contexts
            .filter(c => c)
            .map(c => `${c!.title}:\n${c!.content}`)
            .join("\n\n");
        }

        // Generate code using LLM
        const prompt = `You are an expert C# developer specializing in compliance-by-design patterns.

Governance Rule:
ID: ${rule.ruleId}
Title: ${rule.title}
Statement: ${rule.statement}
Source: ${rule.sourceOfTruth}

${contextContent ? `Additional Context:\n${contextContent}\n` : ""}

Generate production-ready C# code that enforces this governance rule. The code should:
1. Be a complete, compilable C# class
2. Follow best practices and ADR-approved patterns
3. Include proper error handling
4. Use approved internal utilities where applicable
5. Include XML documentation comments

Return ONLY the C# code, no explanations.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert C# developer. Generate clean, production-ready code." },
            { role: "user", content: prompt }
          ],
        });

        const messageContent = response.choices[0]?.message?.content;
        const generatedCode = typeof messageContent === 'string' ? messageContent : "";

        // Extract class name from generated code (simple heuristic)
        const classMatch = generatedCode.match(/class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : "ComplianceGovernor";

        // Save code artifact
        await db.createCodeArtifact({
          governanceRuleId: input.governanceRuleId,
          language: "csharp",
          className,
          code: generatedCode,
          generationPrompt: prompt,
          contextUsed: input.contextDocumentIds || [],
          status: "generated",
          generatedBy: ctx.user.id,
        });

        // Get the created artifact
        const artifacts = await db.getCodeArtifacts();
        const createdArtifact = artifacts[0]; // Most recent

        if (createdArtifact) {
          // Create audit entry
          await db.createAuditEntry({
            governanceRuleId: input.governanceRuleId,
            codeArtifactId: createdArtifact.id,
            action: "code_generated",
            actor: ctx.user.id,
            details: { className },
          });
        }

        return {
          success: true,
          id: createdArtifact?.id,
          code: generatedCode,
          className,
        };
      }),

    list: protectedProcedure.query(async () => {
      return await db.getCodeArtifacts();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCodeArtifactById(input.id);
      }),

    getByRuleId: protectedProcedure
      .input(z.object({ ruleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCodeArtifactsByRuleId(input.ruleId);
      }),
  }),

  // ============ Test Suite Generation ============
  testGeneration: router({
    generate: protectedProcedure
      .input(z.object({
        codeArtifactId: z.number(),
        framework: z.enum(["xunit", "nunit"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Fetch the code artifact
        const artifact = await db.getCodeArtifactById(input.codeArtifactId);
        if (!artifact) {
          throw new Error("Code artifact not found");
        }

        // Fetch the governance rule
        const rule = await db.getGovernanceRuleById(artifact.governanceRuleId);
        if (!rule) {
          throw new Error("Governance rule not found");
        }

        const framework = input.framework || "xunit";

        // Generate tests using LLM
        const prompt = `You are an expert in C# testing and compliance validation.

Governance Rule:
${rule.statement}

Generated Code:
\`\`\`csharp
${artifact.code}
\`\`\`

Generate a comprehensive ${framework} test suite that:
1. Tests that the governance rule is properly enforced
2. Includes positive test cases (compliance)
3. Includes negative test cases (violations should be caught)
4. Tests edge cases
5. Uses proper ${framework} attributes and assertions
6. Is production-ready and compilable

Return ONLY the test code, no explanations.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are an expert C# test engineer specializing in ${framework}.` },
            { role: "user", content: prompt }
          ],
        });

        const testMessageContent = response.choices[0]?.message?.content;
        const generatedTests = typeof testMessageContent === 'string' ? testMessageContent : "";

        // Count test methods (simple heuristic)
        const testCount = (generatedTests.match(/\[Fact\]|\[Test\]/g) || []).length;

        // Save test suite
        await db.createTestSuite({
          codeArtifactId: input.codeArtifactId,
          governanceRuleId: artifact.governanceRuleId,
          framework,
          testCode: generatedTests,
          testCount,
          generationPrompt: prompt,
          status: "generated",
          generatedBy: ctx.user.id,
        });

        // Get the created test suite
        const testSuites = await db.getTestSuites();
        const createdSuite = testSuites[0]; // Most recent

        if (createdSuite) {
          // Create audit entry
          await db.createAuditEntry({
            governanceRuleId: artifact.governanceRuleId,
            codeArtifactId: input.codeArtifactId,
            testSuiteId: createdSuite.id,
            action: "tests_generated",
            actor: ctx.user.id,
            details: { framework, testCount },
          });
        }

        return {
          success: true,
          id: createdSuite?.id,
          testCode: generatedTests,
          testCount,
        };
      }),

    list: protectedProcedure.query(async () => {
      return await db.getTestSuites();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTestSuiteById(input.id);
      }),
  }),

  // ============ Pipeline Runs ============
  pipeline: router({
    run: protectedProcedure
      .input(z.object({
        codeArtifactId: z.number(),
        testSuiteId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const artifact = await db.getCodeArtifactById(input.codeArtifactId);
        const testSuite = await db.getTestSuiteById(input.testSuiteId);

        if (!artifact || !testSuite) {
          throw new Error("Code artifact or test suite not found");
        }

        // Simulate pipeline stages
        const stages = [
          { name: "Build", status: "passed" as const, startedAt: Date.now(), completedAt: Date.now() + 2000 },
          { name: "Unit Tests", status: "passed" as const, startedAt: Date.now() + 2000, completedAt: Date.now() + 5000 },
          { name: "Compliance Gate", status: "passed" as const, startedAt: Date.now() + 5000, completedAt: Date.now() + 7000 },
          { name: "Deploy", status: "passed" as const, startedAt: Date.now() + 7000, completedAt: Date.now() + 10000 },
        ];

        // Simulate test results
        const testResults = {
          total: testSuite.testCount,
          passed: testSuite.testCount,
          failed: 0,
        };

        await db.createPipelineRun({
          codeArtifactId: input.codeArtifactId,
          testSuiteId: input.testSuiteId,
          governanceRuleId: artifact.governanceRuleId,
          runNumber: Math.floor(Math.random() * 1000) + 1,
          status: "passed",
          stages,
          complianceGatePassed: true,
          testResults,
          triggeredBy: ctx.user.id,
          completedAt: new Date(Date.now() + 10000),
        });

        // Get the created pipeline run
        const runs = await db.getPipelineRuns();
        const createdRun = runs[0]; // Most recent

        if (createdRun) {
          // Create audit entry
          await db.createAuditEntry({
            governanceRuleId: artifact.governanceRuleId,
            codeArtifactId: input.codeArtifactId,
            testSuiteId: input.testSuiteId,
            pipelineRunId: createdRun.id,
            action: "pipeline_executed",
            actor: ctx.user.id,
            details: { status: "passed", complianceGatePassed: true },
          });
        }

        return {
          success: true,
          id: createdRun?.id,
          status: "passed",
          complianceGatePassed: true,
        };
      }),

    list: protectedProcedure.query(async () => {
      return await db.getPipelineRuns();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPipelineRunById(input.id);
      }),
  }),

  // ============ Evaluation Metrics ============
  evaluation: router({
    create: protectedProcedure
      .input(z.object({
        governanceRuleId: z.number(),
        codeArtifactId: z.number().optional(),
        testSuiteId: z.number().optional(),
        metricType: z.enum(["prompt_effectiveness", "rule_adherence", "code_quality", "test_coverage"]),
        score: z.number().min(0).max(100),
        details: z.record(z.string(), z.any()).optional(),
        evaluatedBy: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.createEvaluationMetric(input);
        const metrics = await db.getEvaluationMetrics();
        return { success: true, id: metrics[0]?.id };
      }),

    list: protectedProcedure.query(async () => {
      return await db.getEvaluationMetrics();
    }),

    getByRuleId: protectedProcedure
      .input(z.object({ ruleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEvaluationMetricsByRuleId(input.ruleId);
      }),
  }),

  // ============ Audit Trail ============
  audit: router({
    list: protectedProcedure.query(async () => {
      return await db.getAuditTrail();
    }),

    getByRuleId: protectedProcedure
      .input(z.object({ ruleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAuditTrailByRuleId(input.ruleId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
