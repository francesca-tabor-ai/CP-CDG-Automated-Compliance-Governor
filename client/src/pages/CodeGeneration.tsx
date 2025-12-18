import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FileCode2, Sparkles, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function CodeGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedCodeId, setGeneratedCodeId] = useState<number | null>(null);

  const { data: rules } = trpc.governanceRules.list.useQuery();
  const { data: codeArtifacts } = trpc.codeGeneration.list.useQuery();
  const { data: contextDocs } = trpc.contextDocuments.list.useQuery();
  const utils = trpc.useUtils();

  const generateCodeMutation = trpc.codeGeneration.generate.useMutation({
    onSuccess: (data) => {
      utils.codeGeneration.list.invalidate();
      setGeneratedCode(data.code);
      setGeneratedCodeId(data.id || null);
      setIsGenerating(false);
      toast.success("Code generated successfully");
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(`Failed to generate code: ${error.message}`);
    },
  });

  const generateTestMutation = trpc.testGeneration.generate.useMutation({
    onSuccess: () => {
      utils.testGeneration.list.invalidate();
      toast.success("Test suite generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate tests: ${error.message}`);
    },
  });

  const handleGenerateCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRuleId) {
      toast.error("Please select a governance rule");
      return;
    }
    setIsGenerating(true);
    setGeneratedCode(null);
    generateCodeMutation.mutate({
      governanceRuleId: selectedRuleId,
      contextDocumentIds: contextDocs?.slice(0, 3).map(d => d.id) || [],
    });
  };

  const handleGenerateTests = (artifactId: number) => {
    generateTestMutation.mutate({
      codeArtifactId: artifactId,
      framework: "xunit",
    });
  };

  const activeRules = rules?.filter(r => r.status === "active") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AI Code Generation</h1>
          <p className="text-muted-foreground mt-1">
            Transform governance rules into production-ready code and tests
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-primary text-white">
              <Sparkles className="h-4 w-4" />
              Generate Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleGenerateCode}>
              <DialogHeader>
                <DialogTitle>Generate Code from Governance Rule</DialogTitle>
                <DialogDescription>
                  Select a governance rule to generate production-ready C# code
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="ruleId">Governance Rule</Label>
                  <Select
                    value={selectedRuleId?.toString() || ""}
                    onValueChange={(value) => setSelectedRuleId(Number(value))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a rule..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeRules.map((rule) => (
                        <SelectItem key={rule.id} value={rule.id.toString()}>
                          {rule.ruleId} - {rule.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeRules.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No active governance rules available. Create and activate a rule first.
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isGenerating || !selectedRuleId}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Code
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>

            {generatedCode && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Generated Code</h3>
                  {generatedCodeId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateTests(generatedCodeId)}
                      disabled={generateTestMutation.isPending}
                      className="gap-2"
                    >
                      <Play className="h-3 w-3" />
                      Generate Tests
                    </Button>
                  )}
                </div>
                <div className="code-block max-h-96 overflow-auto">
                  <Streamdown>{`\`\`\`csharp\n${generatedCode}\n\`\`\``}</Streamdown>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Generated Code Artifacts */}
      {codeArtifacts && codeArtifacts.length > 0 ? (
        <div className="grid gap-4">
          {codeArtifacts.map((artifact) => {
            const rule = rules?.find(r => r.id === artifact.governanceRuleId);
            return (
              <Card key={artifact.id} className="shadow-elegant">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{artifact.className}</CardTitle>
                        <Badge variant="outline" className={
                          artifact.status === "deployed" ? "badge-success" :
                          artifact.status === "validated" ? "badge-info" :
                          "badge-warning"
                        }>
                          {artifact.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {rule?.ruleId} - {rule?.title}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateTests(artifact.id)}
                      disabled={generateTestMutation.isPending}
                      className="gap-2"
                    >
                      <Play className="h-3 w-3" />
                      Generate Tests
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="code-block max-h-64 overflow-auto">
                    <Streamdown>{`\`\`\`csharp\n${artifact.code}\n\`\`\``}</Streamdown>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Language: {artifact.language}</span>
                    <span>•</span>
                    <span>Generated: {new Date(artifact.generatedAt).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-elegant">
          <CardContent className="text-center py-12">
            <FileCode2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No code artifacts yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Generate your first code artifact from a governance rule
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
