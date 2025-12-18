import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, FileSearch } from "lucide-react";
import { toast } from "sonner";

export default function GovernanceRules() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<number | null>(null);

  const { data: rules, isLoading } = trpc.governanceRules.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.governanceRules.create.useMutation({
    onSuccess: () => {
      utils.governanceRules.list.invalidate();
      setIsCreateOpen(false);
      toast.success("Governance rule created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });

  const updateMutation = trpc.governanceRules.update.useMutation({
    onSuccess: () => {
      utils.governanceRules.list.invalidate();
      setEditingRule(null);
      toast.success("Governance rule updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update rule: ${error.message}`);
    },
  });

  const deleteMutation = trpc.governanceRules.delete.useMutation({
    onSuccess: () => {
      utils.governanceRules.list.invalidate();
      toast.success("Governance rule deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete rule: ${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      ruleId: formData.get("ruleId") as string,
      title: formData.get("title") as string,
      statement: formData.get("statement") as string,
      sourceOfTruth: formData.get("sourceOfTruth") as string,
      category: formData.get("category") as string,
      priority: formData.get("priority") as "critical" | "high" | "medium" | "low",
      status: "draft",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200";
      case "archived": return "bg-slate-100 text-slate-800 border-slate-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Governance Rules</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage regulatory compliance rules
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Governance Rule</DialogTitle>
                <DialogDescription>
                  Define a new regulatory compliance rule with structured fields
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="ruleId">Rule ID</Label>
                  <Input
                    id="ruleId"
                    name="ruleId"
                    placeholder="e.g., CP-CDG-PII-001"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Brief descriptive title"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="statement">Rule Statement</Label>
                  <Textarea
                    id="statement"
                    name="statement"
                    placeholder="Detailed rule statement..."
                    rows={4}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sourceOfTruth">Source of Truth</Label>
                  <Textarea
                    id="sourceOfTruth"
                    name="sourceOfTruth"
                    placeholder="Regulatory documentation, ADRs, etc."
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      placeholder="e.g., PII, Security"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="medium" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Rule"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading governance rules...</p>
        </div>
      ) : rules && rules.length > 0 ? (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="shadow-elegant">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{rule.title}</CardTitle>
                      <Badge variant="outline" className={getPriorityColor(rule.priority)}>
                        {rule.priority}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(rule.status)}>
                        {rule.status}
                      </Badge>
                    </div>
                    <CardDescription className="font-mono text-xs">
                      {rule.ruleId}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingRule(rule.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this rule?")) {
                          deleteMutation.mutate({ id: rule.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Statement</p>
                  <p className="text-sm text-muted-foreground">{rule.statement}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Source of Truth</p>
                  <p className="text-sm text-muted-foreground">{rule.sourceOfTruth}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Category: {rule.category}</span>
                  <span>•</span>
                  <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-elegant">
          <CardContent className="text-center py-12">
            <FileSearch className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No governance rules yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first governance rule to get started
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
