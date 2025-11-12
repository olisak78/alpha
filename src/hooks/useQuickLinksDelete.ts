import { useState } from "react";
import { useDeleteQuickLink } from "@/hooks/api/mutations/useQuickLinkMutations";
import { useToast } from "@/hooks/use-toast";

export function useQuickLinksDelete(memberId: string | null) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<{ url: string; title: string } | null>(null);
  const { toast } = useToast();

  const deleteQuickLinkMutation = useDeleteQuickLink({
    onSuccess: () => {
      toast({
        title: "Quick link removed",
        description: "The quick link has been successfully removed.",
      });
      setLinkToDelete(null);
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to delete quick link:', error);

      toast({
        variant: "destructive",
        title: "Failed to remove quick link",
        description: error.message || "There was an error removing the quick link. Please try again.",
      });

      setLinkToDelete(null);
      setDeleteDialogOpen(false);
    }
  });

  const handleDeleteClick = (url: string, title: string) => {
    setLinkToDelete({ url, title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (linkToDelete && memberId) {
      deleteQuickLinkMutation.mutate({
        memberId,
        url: linkToDelete.url
      });
    }
  };

  const handleDeleteCancel = () => {
    setLinkToDelete(null);
    setDeleteDialogOpen(false);
  };

  return {
    deleteDialogOpen,
    linkToDelete,
    isDeleting: deleteQuickLinkMutation.isPending,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    setDeleteDialogOpen,
  };
}