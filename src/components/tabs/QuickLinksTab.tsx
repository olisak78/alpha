import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuickLinksGrid } from "@/components/QuickLinks/QuickLinksGrid";
import { LoadingState} from "@/components/QuickLinks/QuickLinksStates";
import { UserMeResponse } from "@/types/api";
import { useCurrentUser } from "@/hooks/api/useMembers";
import { AddLinkDialog } from "@/components/dialogs/AddLinkDialog";
import { QuickLinksSearchFilter } from "@/components/QuickLinks/QuickLinksSearchFilter";
import { QuickLinksProvider, useQuickLinksContext } from "@/contexts/QuickLinksContext";
import { EditLinkDialog } from "@/components/dialogs/EditLinkDialog";
import { DeleteConfirmationDialog } from "@/components/dialogs/DeleteConfirmationDialog";
import { useEditDialog, useEditDialogActions } from "@/stores/quickLinksStore";

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
  
  const editDialog = useEditDialog();
  const { closeEditDialog } = useEditDialogActions();
  
  // Data and configuration from context
  const {
    quickLinks,
    isLoading,
    ownerId,
  } = useQuickLinksContext();

  // Find the link being edited
  const linkToEdit = useMemo(() => {
    if (!editDialog.isOpen || !editDialog.linkId) return null;
    const link = quickLinks.find(link => link.id === editDialog.linkId);
    if (!link) return null;
    
    // Convert QuickLink to UserLink format expected by EditLinkDialog
    return {
      id: link.id,
      name: link.title,
      title: link.title,
      description: link.description || '',
      url: link.url,
      category_id: link.categoryId,
      tags: link.tags || [],
      favorite: link.isFavorite
    };
  }, [editDialog, quickLinks]);

  // Render states
  if (isLoading) {
    return (
      <div className="px-6 pt-4 pb-6">
        <LoadingState />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col px-6 pt-4 pb-6 min-h-[400px]">
        {/* Search and Filter - only show if there are links */}
        {quickLinks.length > 0 && (
          <div className="mb-4">
            <QuickLinksSearchFilter
              onAddLinkClick={() => setIsAddLinkDialogOpen(true)}
            />
          </div>
        )}

        {/* Links Grid or Empty State - fills remaining height */}
        <div className="flex-1">
          {quickLinks.length === 0 ? (
            <div className="h-full min-h-[350px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="text-base text-muted-foreground text-center">
                  {emptyMessage || "No quick links yet. Add Links to Favorites or click 'Add Link' to get started."}
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddLinkDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
              </div>
            </div>
          ) : (
            <QuickLinksGrid />
          )}
        </div>
      </div>

      {/* Add Link Dialog */}
      <AddLinkDialog
        open={isAddLinkDialogOpen}
        onOpenChange={setIsAddLinkDialogOpen}
        ownerId={ownerId || currentUser?.uuid}
      />
      {linkToEdit && (
        <EditLinkDialog
          open={editDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) closeEditDialog();
          }}
          linkData={linkToEdit}
        />
      )}
      <DeleteConfirmationDialog />
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
