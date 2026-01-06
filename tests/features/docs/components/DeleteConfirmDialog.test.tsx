import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmDialog } from '@/features/docs/components/DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Document Deletion', () => {
    it('should render document deletion dialog when open', () => {
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-document.md"
          itemType="document"
        />
      );

      expect(screen.getByText('Delete Document')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText('test-document.md')).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <DeleteConfirmDialog
          isOpen={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-document.md"
          itemType="document"
        />
      );

      expect(screen.queryByText('Delete Document')).not.toBeInTheDocument();
    });

    it('should call onConfirm when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-document.md"
          itemType="document"
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-document.md"
          itemType="document"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should display warning icon for document deletion', () => {
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-document.md"
          itemType="document"
        />
      );

      // Check for AlertTriangle icon (via SVG)
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Folder Deletion', () => {
    it('should render folder deletion dialog when open', () => {
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-folder"
          itemType="folder"
        />
      );

      expect(screen.getByText('Delete Folder')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText('test-folder')).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
    });

    it('should call onConfirm when delete button is clicked for folder', async () => {
      const user = userEvent.setup();
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-folder"
          itemType="folder"
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should display warning icon for folder deletion', () => {
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-folder"
          itemType="folder"
        />
      );

      // Check for AlertTriangle icon (via SVG)
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Default Behavior', () => {
    it('should default to document type when itemType not specified', () => {
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-item"
        />
      );

      // Should show "Delete Document" as default
      expect(screen.getByText('Delete Document')).toBeInTheDocument();
    });
  });

  describe('Dialog Styling', () => {
    it('should apply destructive styling to delete button', () => {
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-document.md"
          itemType="document"
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toHaveClass('bg-destructive');
    });

    it('should display item name with emphasis', () => {
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-document.md"
          itemType="document"
        />
      );

      const itemName = screen.getByText('test-document.md');
      expect(itemName).toHaveClass('font-semibold');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long item names', () => {
      const longName = 'a'.repeat(100) + '.md';
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName={longName}
          itemType="document"
        />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle item names with special characters', () => {
      const specialName = 'test-doc_v2.0.md';
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName={specialName}
          itemType="document"
        />
      );

      expect(screen.getByText(specialName)).toBeInTheDocument();
    });

    it('should handle empty item name gracefully', () => {
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName=""
          itemType="document"
        />
      );

      expect(screen.getByText('Delete Document')).toBeInTheDocument();
    });
  });

  describe('Keyboard Interaction', () => {
    it('should handle dialog close on escape (via AlertDialog)', async () => {
      const user = userEvent.setup();
      render(
        <DeleteConfirmDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          documentName="test-document.md"
          itemType="document"
        />
      );

      // AlertDialog handles escape automatically
      await user.keyboard('{Escape}');

      // onClose is called when dialog is dismissed
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
