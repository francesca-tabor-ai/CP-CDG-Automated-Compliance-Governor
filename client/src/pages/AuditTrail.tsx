import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FileSearch, FileCode2, TestTube, PlayCircle, User, Clock } from "lucide-react";

export default function AuditTrail() {
  const { data: auditEntries, isLoading } = trpc.audit.list.useQuery();
  const { data: rules } = trpc.governanceRules.list.useQuery();
  const { data: users } = trpc.auth.me.useQuery();

  const getActionIcon = (action: string) => {
    if (action.includes("rule")) return <FileSearch className="h-4 w-4" />;
    if (action.includes("code")) return <FileCode2 className="h-4 w-4" />;
    if (action.includes("test")) return <TestTube className="h-4 w-4" />;
    if (action.includes("pipeline")) return <PlayCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getActionLabel = (action: string) => {
    return action.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  const getActionColor = (action: string) => {
    if (action.includes("created")) return "bg-green-100 text-green-800 border-green-200";
    if (action.includes("updated")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (action.includes("deleted")) return "bg-red-100 text-red-800 border-red-200";
    if (action.includes("generated")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (action.includes("executed")) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Group entries by governance rule for lineage view
  const entriesByRule = auditEntries?.reduce((acc, entry) => {
    const ruleId = entry.governanceRuleId;
    if (!acc[ruleId]) acc[ruleId] = [];
    acc[ruleId].push(entry);
    return acc;
  }, {} as Record<number, typeof auditEntries>) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Audit Trail</h1>
        <p className="text-muted-foreground mt-1">
          Complete lineage from governance rules to code to tests
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditEntries?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Audit trail entries</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rules Tracked</CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(entriesByRule).length}</div>
            <p className="text-xs text-muted-foreground">Governance rules</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Generated</CardTitle>
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditEntries?.filter(e => e.action === "code_generated").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Artifacts created</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipelines Run</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditEntries?.filter(e => e.action === "pipeline_executed").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">CI/CD executions</p>
          </CardContent>
        </Card>
      </div>

      {/* Lineage by Rule */}
      {Object.keys(entriesByRule).length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Compliance Lineage by Rule</h2>
          {Object.entries(entriesByRule).map(([ruleIdStr, entries]) => {
            const ruleId = Number(ruleIdStr);
            const rule = rules?.find(r => r.id === ruleId);
            return (
              <Card key={ruleId} className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-lg">{rule?.title || `Rule #${ruleId}`}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {rule?.ruleId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {entries
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="mt-1">
                            {getActionIcon(entry.action)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getActionColor(entry.action)}>
                                {getActionLabel(entry.action)}
                              </Badge>
                              {entry.codeArtifactId && (
                                <span className="text-xs text-muted-foreground">
                                  Code Artifact #{entry.codeArtifactId}
                                </span>
                              )}
                              {entry.testSuiteId && (
                                <span className="text-xs text-muted-foreground">
                                  Test Suite #{entry.testSuiteId}
                                </span>
                              )}
                              {entry.pipelineRunId && (
                                <span className="text-xs text-muted-foreground">
                                  Pipeline Run #{entry.pipelineRunId}
                                </span>
                              )}
                            </div>
                            {entry.details && Object.keys(entry.details).length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                {JSON.stringify(entry.details, null, 2)}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>User #{entry.actor}</span>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              <span>{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* All Events Timeline */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Complete Audit Timeline</CardTitle>
          <CardDescription>
            Chronological view of all compliance activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading audit trail...</p>
            </div>
          ) : auditEntries && auditEntries.length > 0 ? (
            <div className="space-y-3">
              {auditEntries.map((entry) => {
                const rule = rules?.find(r => r.id === entry.governanceRuleId);
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-1">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getActionColor(entry.action)}>
                          {getActionLabel(entry.action)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {rule?.ruleId || `Rule #${entry.governanceRuleId}`}
                        </span>
                        {entry.codeArtifactId && (
                          <span className="text-xs text-muted-foreground">
                            → Code #{entry.codeArtifactId}
                          </span>
                        )}
                        {entry.testSuiteId && (
                          <span className="text-xs text-muted-foreground">
                            → Tests #{entry.testSuiteId}
                          </span>
                        )}
                        {entry.pipelineRunId && (
                          <span className="text-xs text-muted-foreground">
                            → Pipeline #{entry.pipelineRunId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>User #{entry.actor}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileSearch className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No audit entries yet</p>
              <p className="text-sm text-muted-foreground">
                Activity will be tracked here as you work with governance rules
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
