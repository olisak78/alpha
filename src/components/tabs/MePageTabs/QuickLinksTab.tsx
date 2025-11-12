import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuickLinksGrid } from "./QuickLinksGrid";
import { LoadingState, ErrorState, EmptyState } from "./QuickLinksStates";
import { UserMeResponse } from "@/types/api";
import { useCurrentUser } from "@/hooks/api/useMembers";
import { AddLinkDialog } from "@/components/dialogs/AddLinkDialog";
import { QuickLinksSearchFilter } from "./QuickLinksSearchFilter";
import { QuickLinksProvider, useQuickLinksContext } from "@/contexts/QuickLinksContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuickLinksTabProps {
  userData?: UserMeResponse;
  ownerId?: string;
  onDeleteLink?: (linkId: string) => void;
  onToggleFavorite?: (linkId: string) => void;
  emptyMessage?: string;
  title?: string;
  alwaysShowDelete?: boolean;
}

// Internal component that uses the context
const QuickLinksTabContent = ({ emptyMessage, title }: { emptyMessage?: string; title?: string }) => {
  const { data: currentUser } = useCurrentUser();
  const [isAddLinkDialogOpen, setIsAddLinkDialogOpen] = useState(false);
  
  const {
    quickLinks,
    isLoading,
    handleDeleteConfirm,
    handleDeleteCancel,
    deleteDialog,
    ownerId,
  } = useQuickLinksContext();

  // Render states
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <h3 className="font-semibold">{title}</h3>
          <Button
            size="sm"
            onClick={() => setIsAddLinkDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        </CardHeader>
        <CardContent className="p-0 px-6 pb-6 flex flex-col flex-1 overflow-hidden">
          {/* Search and Filter - only show if there are links */}
          {quickLinks.length > 0 && (
            <div className="mb-4">
              <QuickLinksSearchFilter />
            </div>
          )}

          {/* Links Grid or Empty State - fills remaining height */}
          <div className="flex-1 overflow-y-auto">
            {quickLinks.length === 0 ? (
              <EmptyState message={emptyMessage || "No quick links yet. Add Links to Favorites or click 'Add Quick Link' to get started."}/>
            ) : (
              <QuickLinksGrid />
            )}
          </div>
        </CardContent>
      </Card>

      <AddLinkDialog
        open={isAddLinkDialogOpen}
        onOpenChange={setIsAddLinkDialogOpen}
        ownerId={ownerId || currentUser?.uuid}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={() => handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quick Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.linkTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Main component that provides the context
export default function QuickLinksTab({ 
  userData, 
  ownerId, 
  onDeleteLink, 
  onToggleFavorite, 
  emptyMessage, 
  title = "Quick Links",
  alwaysShowDelete 
}: QuickLinksTabProps) {
  const customHandlers = {
    onDeleteLink,
    onToggleFavorite,
  };

  return (
    <QuickLinksProvider 
      userData={userData}
      ownerId={ownerId}
      customHandlers={customHandlers}
      alwaysShowDelete={alwaysShowDelete}
    >
      <QuickLinksTabContent emptyMessage={emptyMessage} title={title} />
    </QuickLinksProvider>
  );
}
