import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Target, Award } from "lucide-react";

export default function Evaluation() {
  const { data: metrics } = trpc.evaluation.list.useQuery();
  const { data: rules } = trpc.governanceRules.list.useQuery();

  const avgScore = metrics && metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length)
    : 0;

  const metricsByType = metrics?.reduce((acc, m) => {
    acc[m.metricType] = acc[m.metricType] || [];
    acc[m.metricType].push(m);
    return acc;
  }, {} as Record<string, typeof metrics>) || {};

  const getMetricTypeLabel = (type: string) => {
    switch (type) {
      case "prompt_effectiveness": return "Prompt Effectiveness";
      case "rule_adherence": return "Rule Adherence";
      case "code_quality": return "Code Quality";
      case "test_coverage": return "Test Coverage";
      default: return type;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Evaluation Framework</h1>
        <p className="text-muted-foreground mt-1">
          AI output correctness metrics via LangSmith/HoneyHive integration
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</div>
            <p className="text-xs text-muted-foreground">
              Overall AI quality score
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all metric types
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rules Evaluated</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(metrics?.map(m => m.governanceRuleId)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique governance rules
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Performers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.filter(m => m.score >= 90).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Scores ≥ 90
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics by Type */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(metricsByType).map(([type, typeMetrics]) => {
          const avgTypeScore = Math.round(
            typeMetrics.reduce((sum, m) => sum + m.score, 0) / typeMetrics.length
          );
          return (
            <Card key={type} className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-lg">{getMetricTypeLabel(type)}</CardTitle>
                <CardDescription>
                  Average score: <span className={`font-semibold ${getScoreColor(avgTypeScore)}`}>
                    {avgTypeScore}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {typeMetrics.slice(0, 5).map((metric) => {
                    const rule = rules?.find(r => r.id === metric.governanceRuleId);
                    return (
                      <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {rule?.ruleId || `Rule #${metric.governanceRuleId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(metric.evaluatedAt).toLocaleDateString()} • {metric.evaluatedBy}
                          </p>
                        </div>
                        <div className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                          {metric.score}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All Metrics */}
      {metrics && metrics.length > 0 ? (
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>All Evaluation Metrics</CardTitle>
            <CardDescription>
              Complete history of AI output quality assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.map((metric) => {
                const rule = rules?.find(r => r.id === metric.governanceRuleId);
                return (
                  <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{getMetricTypeLabel(metric.metricType)}</p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-sm text-muted-foreground">
                          {rule?.ruleId || `Rule #${metric.governanceRuleId}`}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Evaluated by {metric.evaluatedBy} on {new Date(metric.evaluatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                        {metric.score}
                      </div>
                      <p className="text-xs text-muted-foreground">/ 100</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-elegant">
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No evaluation metrics yet</p>
            <p className="text-sm text-muted-foreground">
              Metrics will appear here as code and tests are evaluated
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
