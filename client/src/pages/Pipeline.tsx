import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { PlayCircle, CheckCircle2, XCircle, Clock, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Pipeline() {
  const [selectedArtifactId, setSelectedArtifactId] = useState<number | null>(null);
  const [selectedTestSuiteId, setSelectedTestSuiteId] = useState<number | null>(null);

  const { data: pipelineRuns } = trpc.pipeline.list.useQuery();
  const { data: codeArtifacts } = trpc.codeGeneration.list.useQuery();
  const { data: testSuites } = trpc.testGeneration.list.useQuery();
  const utils = trpc.useUtils();

  const runPipelineMutation = trpc.pipeline.run.useMutation({
    onSuccess: () => {
      utils.pipeline.list.invalidate();
      toast.success("Pipeline run completed successfully");
    },
    onError: (error) => {
      toast.error(`Pipeline run failed: ${error.message}`);
    },
  });

  const handleRunPipeline = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedArtifactId || !selectedTestSuiteId) {
      toast.error("Please select both code artifact and test suite");
      return;
    }
    runPipelineMutation.mutate({
      codeArtifactId: selectedArtifactId,
      testSuiteId: selectedTestSuiteId,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
      case "blocked":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed": return "badge-success";
      case "failed": return "badge-error";
      case "blocked": return "badge-error";
      case "running": return "badge-info";
      default: return "badge-warning";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">CI/CD Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Simulate pipeline execution with compliance gate enforcement
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Run Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleRunPipeline}>
              <DialogHeader>
                <DialogTitle>Run CI/CD Pipeline</DialogTitle>
                <DialogDescription>
                  Execute a pipeline run with code artifact and test suite
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="artifact">Code Artifact</Label>
                  <Select
                    value={selectedArtifactId?.toString() || ""}
                    onValueChange={(value) => setSelectedArtifactId(Number(value))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select code artifact..." />
                    </SelectTrigger>
                    <SelectContent>
                      {codeArtifacts?.map((artifact) => (
                        <SelectItem key={artifact.id} value={artifact.id.toString()}>
                          {artifact.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="testSuite">Test Suite</Label>
                  <Select
                    value={selectedTestSuiteId?.toString() || ""}
                    onValueChange={(value) => setSelectedTestSuiteId(Number(value))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select test suite..." />
                    </SelectTrigger>
                    <SelectContent>
                      {testSuites?.map((suite) => (
                        <SelectItem key={suite.id} value={suite.id.toString()}>
                          {suite.framework.toUpperCase()} - {suite.testCount} tests
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={runPipelineMutation.isPending}
                  className="gap-2"
                >
                  {runPipelineMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      Run Pipeline
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Runs */}
      {pipelineRuns && pipelineRuns.length > 0 ? (
        <div className="grid gap-4">
          {pipelineRuns.map((run) => (
            <Card key={run.id} className="shadow-elegant">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(run.status)}
                      <CardTitle className="text-lg">Pipeline Run #{run.runNumber}</CardTitle>
                      <Badge variant="outline" className={getStatusColor(run.status)}>
                        {run.status}
                      </Badge>
                      {run.complianceGatePassed && (
                        <Badge variant="outline" className="badge-success gap-1">
                          <Shield className="h-3 w-3" />
                          Compliance Passed
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Started: {new Date(run.startedAt).toLocaleString()}
                      {run.completedAt && ` • Completed: ${new Date(run.completedAt).toLocaleString()}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pipeline Stages */}
                {run.stages && run.stages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-3">Pipeline Stages</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {run.stages.map((stage, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            stage.status === "passed"
                              ? "bg-green-50 border-green-200"
                              : stage.status === "failed"
                              ? "bg-red-50 border-red-200"
                              : stage.status === "running"
                              ? "bg-blue-50 border-blue-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {stage.status === "passed" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            {stage.status === "failed" && <XCircle className="h-4 w-4 text-red-600" />}
                            {stage.status === "running" && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
                            {stage.status === "pending" && <Clock className="h-4 w-4 text-gray-600" />}
                            <p className="text-sm font-medium">{stage.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{stage.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Results */}
                {run.testResults && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Test Results</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Tests</p>
                        <p className="text-lg font-semibold">{run.testResults.total}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Passed</p>
                        <p className="text-lg font-semibold text-green-600">{run.testResults.passed}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="text-lg font-semibold text-red-600">{run.testResults.failed}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compliance Gate Status */}
                <div className={`p-4 rounded-lg border ${
                  run.complianceGatePassed
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}>
                  <div className="flex items-center gap-2">
                    <Shield className={`h-5 w-5 ${run.complianceGatePassed ? "text-green-600" : "text-red-600"}`} />
                    <p className="font-medium">
                      Compliance Gate: {run.complianceGatePassed ? "PASSED" : "FAILED"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {run.complianceGatePassed
                      ? "All governance tests passed. Deployment authorized."
                      : "Governance violations detected. Deployment blocked."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-elegant">
          <CardContent className="text-center py-12">
            <PlayCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No pipeline runs yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Run your first CI/CD pipeline with compliance enforcement
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
