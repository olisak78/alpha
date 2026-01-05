// src/components/dialogs/ClosePRDialog.tsx

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GitHubPullRequest } from '@/types/developer-portal';


interface ClosePRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pullRequest: GitHubPullRequest | null;
  onConfirm: (deleteBranch: boolean) => void;
  isLoading?: boolean;
}

export function ClosePRDialog({
  open,
  onOpenChange,
  pullRequest,
  onConfirm,
  isLoading = false,
}: ClosePRDialogProps) {
  const [deleteBranch, setDeleteBranch] = useState(false);

  const handleConfirm = () => {
    onConfirm(deleteBranch);
    // Reset state when dialog closes
    setDeleteBranch(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset state when dialog closes
    setDeleteBranch(false);
  };

  if (!pullRequest) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close Pull Request</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to close{' '}
              <span className="font-semibold">PR #{pullRequest.number}</span>:{' '}
              "{pullRequest.title}"?
            </p>
            <p className="text-sm text-muted-foreground">
              Repository: {pullRequest.repository.full_name}
            </p>
            
            {/* Delete Branch Option */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 mt-4">
              <div className="flex-1">
                <Label htmlFor="delete-branch" className="text-sm font-medium cursor-pointer">
                  Delete branch after closing
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  This will permanently delete the source branch
                </p>
              </div>
              <Switch
                id="delete-branch"
                checked={deleteBranch}
                onCheckedChange={setDeleteBranch}
                disabled={isLoading}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Closing...' : 'Close PR'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}