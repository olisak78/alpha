/**
 * Create Item Dialog - Dialog for creating new folders or documents
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FolderPlus, FilePlus } from 'lucide-react';

export type CreateItemType = 'folder' | 'document';

interface CreateItemDialogProps {
  type: CreateItemType;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
  currentPath?: string; // Optional path where item will be created
}

export const CreateItemDialog: React.FC<CreateItemDialogProps> = ({
  type,
  isOpen,
  onClose,
  onConfirm,
  currentPath,
}) => {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFolder = type === 'folder';
  const title = isFolder ? 'Create New Folder' : 'Create New Document';
  const description = isFolder
    ? 'Enter a name for the new folder. It will be created with a .gitkeep file.'
    : 'Enter a name for the new markdown document (without .md extension).';
  const placeholder = isFolder ? 'folder-name' : 'document-name';
  const Icon = isFolder ? FolderPlus : FilePlus;

  const validateName = (value: string): string | null => {
    if (!value.trim()) {
      return `${isFolder ? 'Folder' : 'Document'} name is required`;
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*\\]/g;
    if (invalidChars.test(value)) {
      return 'Name contains invalid characters (< > : " | ? * \\)';
    }

    // Check for spaces (convert to hyphens suggestion)
    if (value.includes(' ')) {
      return 'Name should not contain spaces. Use hyphens (-) instead.';
    }

    // Check if starts with dot
    if (value.startsWith('.')) {
      return 'Name should not start with a dot';
    }

    return null;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setError(null);
  };

  const handleConfirm = async () => {
    // Validate
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onConfirm(name);
      // Reset and close on success
      setName('');
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setError(null);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {currentPath && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Location:</span> {currentPath || 'Root'}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">
              {isFolder ? 'Folder Name' : 'Document Name'}
            </Label>
            <Input
              id="name"
              placeholder={placeholder}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isCreating}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {!isFolder && (
            <div className="text-sm text-muted-foreground">
              The file will be created as <span className="font-mono">{name || placeholder}.md</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isCreating || !name.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Icon className="mr-2 h-4 w-4" />
                Create
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
