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
import { Database, Plus, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ContextStore() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: documents, isLoading } = trpc.contextDocuments.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.contextDocuments.create.useMutation({
    onSuccess: () => {
      utils.contextDocuments.list.invalidate();
      setIsCreateOpen(false);
      toast.success("Context document created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create document: ${error.message}`);
    },
  });

  const deleteMutation = trpc.contextDocuments.delete.useMutation({
    onSuccess: () => {
      utils.contextDocuments.list.invalidate();
      toast.success("Context document deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tagsInput = formData.get("tags") as string;
    const tags = tagsInput ? tagsInput.split(",").map(t => t.trim()).filter(Boolean) : [];
    
    createMutation.mutate({
      title: formData.get("title") as string,
      type: formData.get("type") as "regulatory_doc" | "adr" | "utility_signature" | "best_practice",
      content: formData.get("content") as string,
      tags,
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "regulatory_doc": return "Regulatory Document";
      case "adr": return "ADR";
      case "utility_signature": return "Utility Signature";
      case "best_practice": return "Best Practice";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "regulatory_doc": return "bg-blue-100 text-blue-800 border-blue-200";
      case "adr": return "bg-purple-100 text-purple-800 border-purple-200";
      case "utility_signature": return "bg-green-100 text-green-800 border-green-200";
      case "best_practice": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Context Store (RAG)</h1>
          <p className="text-muted-foreground mt-1">
            Manage regulatory documentation, ADRs, and approved utilities
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Context Document</DialogTitle>
                <DialogDescription>
                  Add regulatory documentation, ADRs, or utility signatures to the context store
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Document title"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Document Type</Label>
                  <Select name="type" defaultValue="regulatory_doc" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regulatory_doc">Regulatory Document</SelectItem>
                      <SelectItem value="adr">ADR (Architectural Decision Record)</SelectItem>
                      <SelectItem value="utility_signature">Utility Signature</SelectItem>
                      <SelectItem value="best_practice">Best Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Document content, code signatures, or guidelines..."
                    rows={8}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="e.g., PII, masking, compliance"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Document"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading context documents...</p>
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="shadow-elegant">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <Badge variant="outline" className={getTypeColor(doc.type)}>
                        {getTypeLabel(doc.type)}
                      </Badge>
                    </div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this document?")) {
                        deleteMutation.mutate({ id: doc.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                  {doc.content}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Created: {new Date(doc.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-elegant">
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No context documents yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add regulatory documentation, ADRs, or utility signatures to enhance code generation
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="shadow-elegant border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            About Context Store
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            The Context Store provides additional context to the AI during code generation:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Regulatory Documents:</strong> Compliance rules and regulatory requirements</li>
            <li><strong>ADRs:</strong> Architectural Decision Records defining approved patterns</li>
            <li><strong>Utility Signatures:</strong> Method signatures of approved internal utilities</li>
            <li><strong>Best Practices:</strong> Coding standards and implementation guidelines</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
