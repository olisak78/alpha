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
import { useDeleteDialog, useDeleteDialogActions } from "@/stores/quickLinksStore";
import { useQuickLinksContext } from "@/contexts/QuickLinksContext";

export function DeleteConfirmationDialog() {
  const deleteDialog = useDeleteDialog();
  const { closeDeleteDialog } = useDeleteDialogActions();
  
  // Mutation handler still from context (uses React Query mutation)
  const { handleDeleteConfirm } = useQuickLinksContext();

  return (
    <AlertDialog open={deleteDialog.isOpen} onOpenChange={() => closeDeleteDialog()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Quick Link</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{deleteDialog.linkTitle}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={closeDeleteDialog}>
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
  );
}