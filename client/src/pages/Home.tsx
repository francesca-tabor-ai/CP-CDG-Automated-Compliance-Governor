import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { FileCode2, PlayCircle, FileSearch, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function Home() {
  const { data: rules } = trpc.governanceRules.list.useQuery();
  const { data: codeArtifacts } = trpc.codeGeneration.list.useQuery();
  const { data: pipelineRuns } = trpc.pipeline.list.useQuery();

  const activeRules = rules?.filter(r => r.status === "active").length || 0;
  const totalArtifacts = codeArtifacts?.length || 0;
  const recentRuns = pipelineRuns?.slice(0, 5) || [];
  const passedRuns = pipelineRuns?.filter(r => r.status === "passed").length || 0;
  const totalRuns = pipelineRuns?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Automated Compliance Governor
        </h1>
        <p className="text-muted-foreground">
          Transform regulatory mandates into executable code and tests with AI-powered compliance-by-design
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRules}</div>
            <p className="text-xs text-muted-foreground">
              Governance rules enforced
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Artifacts</CardTitle>
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArtifacts}</div>
            <p className="text-xs text-muted-foreground">
              AI-generated implementations
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Runs</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
            <p className="text-xs text-muted-foreground">
              Total CI/CD executions
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Compliance gate pass rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pipeline Runs */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Recent Pipeline Runs</CardTitle>
          <CardDescription>
            Latest CI/CD executions with compliance gate enforcement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pipeline runs yet</p>
              <p className="text-sm mt-2">Generate code and run your first pipeline</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {run.status === "passed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : run.status === "failed" || run.status === "blocked" ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                    <div>
                      <p className="font-medium">Run #{run.runNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {run.complianceGatePassed ? "Compliance gate passed" : "Compliance gate failed"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium capitalize">{run.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(run.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Features */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-lg">Governance Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Define regulatory compliance rules with structured fields and source documentation
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-lg">AI Code Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Transform governance rules into production-ready C# code using LLM integration
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-lg">Automated Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate comprehensive xUnit/NUnit test suites that validate compliance enforcement
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
