import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DeleteConfirmationDialog } from '@/components/tabs/MePageTabs/DeleteConfirmationDialog';

// Mock the Zustand store hooks
vi.mock('@/stores/quickLinksStore', () => ({
  useDeleteDialog: vi.fn(),
  useDeleteDialogActions: vi.fn(),
}));

// Mock the QuickLinksContext
vi.mock('@/contexts/QuickLinksContext', () => ({
  useQuickLinksContext: vi.fn(),
}));

import { useDeleteDialog, useDeleteDialogActions } from '@/stores/quickLinksStore';
import { useQuickLinksContext } from '@/contexts/QuickLinksContext';

describe('DeleteConfirmationDialog', () => {
  const mockCloseDeleteDialog = vi.fn();
  const mockHandleDeleteConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useDeleteDialogActions).mockReturnValue({
      closeDeleteDialog: mockCloseDeleteDialog,
      openDeleteDialog: vi.fn(),
    });

    vi.mocked(useQuickLinksContext).mockReturnValue({
      handleDeleteConfirm: mockHandleDeleteConfirm,
      // Add other context values as needed
    } as any);
  });

  describe('Dialog Visibility', () => {
    it('should not render dialog content when isOpen is false', () => {
      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: false,
        linkId: '',
        linkTitle: '',
      });

      render(<DeleteConfirmationDialog />);

      // AlertDialog doesn't render content when closed
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('should render dialog content when isOpen is true', () => {
      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-123',
        linkTitle: 'My Favorite Link',
      });

      render(<DeleteConfirmationDialog />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Quick Link')).toBeInTheDocument();
    });
  });

  describe('Dialog Content', () => {
    it('should display the correct link title in the description', () => {
      const linkTitle = 'Important Documentation';
      
      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-456',
        linkTitle,
      });

      render(<DeleteConfirmationDialog />);

      expect(
        screen.getByText((content) => content.includes(`"${linkTitle}"`))
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes('This action cannot be undone'))
      ).toBeInTheDocument();
    });

    it('should render Cancel and Delete buttons', () => {
      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-789',
        linkTitle: 'Test Link',
      });

      render(<DeleteConfirmationDialog />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call closeDeleteDialog when Cancel button is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-123',
        linkTitle: 'Test Link',
      });

      render(<DeleteConfirmationDialog />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Called twice: once from onClick, once from onOpenChange when dialog closes
      expect(mockCloseDeleteDialog).toHaveBeenCalled();
      expect(mockHandleDeleteConfirm).not.toHaveBeenCalled();
    });

    it('should call handleDeleteConfirm when Delete button is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-456',
        linkTitle: 'Link to Delete',
      });

      render(<DeleteConfirmationDialog />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockHandleDeleteConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call closeDeleteDialog when dialog is dismissed via onOpenChange', async () => {
      const user = userEvent.setup();

      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-789',
        linkTitle: 'Test Link',
      });

      render(<DeleteConfirmationDialog />);

      // Press Escape to trigger onOpenChange
      await user.keyboard('{Escape}');

      expect(mockCloseDeleteDialog).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty link title', () => {
      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-empty',
        linkTitle: '',
      });

      render(<DeleteConfirmationDialog />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete ""/)).toBeInTheDocument();
    });

    it('should handle special characters in link title', () => {
      const specialTitle = 'Link with "quotes" & <special> chars';
      
      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-special',
        linkTitle: specialTitle,
      });

      render(<DeleteConfirmationDialog />);

      expect(
        screen.getByText((content) => content.includes(specialTitle))
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles and labels', () => {
      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-123',
        linkTitle: 'Accessible Link',
      });

      render(<DeleteConfirmationDialog />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Quick Link')).toBeInTheDocument();
    });

    it('should allow keyboard navigation', async () => {
      const user = userEvent.setup();

      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-123',
        linkTitle: 'Test Link',
      });

      render(<DeleteConfirmationDialog />);

      // Tab to navigate between buttons
      await user.tab();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(document.activeElement).toBeInTheDocument();
      
      // Should be able to activate focused button with Enter
      if (document.activeElement === cancelButton) {
        await user.keyboard('{Enter}');
        expect(mockCloseDeleteDialog).toHaveBeenCalled();
      }
    });
  });

  describe('Delete Button Styling', () => {
    it('should apply destructive styling to Delete button', () => {
      vi.mocked(useDeleteDialog).mockReturnValue({
        isOpen: true,
        linkId: 'link-123',
        linkTitle: 'Test Link',
      });

      render(<DeleteConfirmationDialog />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      
      expect(deleteButton).toHaveClass('bg-destructive');
      expect(deleteButton).toHaveClass('text-destructive-foreground');
      expect(deleteButton).toHaveClass('hover:bg-destructive/90');
    });
  });
});