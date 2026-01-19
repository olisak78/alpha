import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Trash2, Loader2, Edit, Maximize2, Minimize2, MoreVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTeamDocumentations, useDeleteDocumentation } from "@/hooks/api/useDocumentation";
import { AddDocumentationDialog } from "@/components/dialogs/AddDocumentationDialog";
import { EditDocumentationDialog } from "@/components/dialogs/EditDocumentationDialog";
import { useToast } from "@/hooks/use-toast";
import DocsPage from "@/features/docs/DocsPage";
import type { Documentation } from "@/types/documentation";

interface TeamDocsProps {
  teamId: string;
  teamName: string;
}

export function TeamDocs({ teamId, teamName }: TeamDocsProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: documentations, isLoading, error } = useTeamDocumentations(teamId);
  const deleteDocumentation = useDeleteDocumentation();

  // Set the first doc as selected when documentations load
  const effectiveSelectedId = selectedDocId || documentations?.[0]?.id || null;
  const selectedDoc = documentations?.find(doc => doc.id === effectiveSelectedId) || null;

  const handleDeleteDoc = async (doc: Documentation) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      return;
    }

    try {
      await deleteDocumentation.mutateAsync({ id: doc.id, teamId: doc.team_id });
      toast({
        title: "Documentation deleted",
        description: `${doc.title} has been deleted successfully`,
      });
      // Select the first remaining doc
      const remainingDocs = documentations?.filter(d => d.id !== doc.id);
      setSelectedDocId(remainingDocs?.[0]?.id || null);
    } catch (error) {
      console.error("Failed to delete documentation:", error);
      toast({
        title: "Failed to delete documentation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEditDoc = (doc: Documentation) => {
    setSelectedDocId(doc.id);
    setShowEditDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-destructive">Error loading documentations: {error.message}</p>
      </div>
    );
  }

  // Empty state
  if (!documentations || documentations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documentation added yet</h3>
          <p className="text-muted-foreground mb-4">
            Add a GitHub documentation endpoint to get started
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Button>
        </div>
        <AddDocumentationDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          teamId={teamId}
        />
      </div>
    );
  }

  // Show documentation tabs
  return (
    <>
      <div
        className={`flex flex-col ${isExpanded ? 'fixed inset-0 z-50 bg-white dark:bg-[#0D0D0D]' : ''}`}
        style={isExpanded ? { height: '100vh' } : { height: 'calc(100vh - 200px)' }}
      >
        <Tabs value={effectiveSelectedId || undefined} onValueChange={setSelectedDocId} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-4 mb-4 flex-shrink-0">
            {!isExpanded && (
              <div className="flex items-center gap-2 flex-1">
                {/* Add Source button on the left with distinct style */}
                <Button
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                  size="sm"
                  className="border-dashed border-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>

                {/* Documentation tabs */}
                <TabsList className="h-auto min-h-10 items-center justify-start text-muted-foreground inline-flex bg-slate-100 dark:bg-slate-800 p-1">
                  {documentations.map((doc) => (
                    <div key={doc.id} className="relative inline-flex items-center">
                      <TabsTrigger
                        value={doc.id}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 pr-8 text-base font-medium bg-muted hover:bg-muted/80 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:rounded-md"
                      >
                        {doc.title}
                      </TabsTrigger>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditDoc(doc)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteDoc(doc)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </TabsList>
              </div>
            )}

            {/* Action buttons on the right */}
            <div className="flex items-center gap-2">
              <Button
                variant={isExpanded ? "default" : "ghost"}
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {documentations.map((doc) => (
            <TabsContent key={doc.id} value={doc.id} className="mt-0 flex-1 overflow-hidden">
              <DocsPage
                owner={doc.owner}
                repo={doc.repo}
                branch={doc.branch}
                docsPath={doc.docs_path}
                provider={doc.provider}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <AddDocumentationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        teamId={teamId}
      />

      {selectedDoc && (
        <EditDocumentationDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          documentation={selectedDoc}
        />
      )}
    </>
  );
}
