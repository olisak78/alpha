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
import { useQuickLinksContext } from "@/contexts/QuickLinksContext";

export function DeleteConfirmationDialog() {
  const {
    deleteDialog,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useQuickLinksContext();

  return (
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
  );
}
