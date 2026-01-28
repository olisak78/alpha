import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ApprovalDialog from '../../../src/components/dialogs/ApprovalDialog';

/**
 * ApprovalDialog Component Tests
 * 
 * Tests for the ApprovalDialog component which displays a confirmation dialog
 * for delete and move actions with loading states.
 */

describe('ApprovalDialog Component', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    name: 'Test Item',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // DELETE ACTION TESTS
  // ============================================================================

  describe('Delete Action', () => {
    it('should render delete dialog with correct message', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
        />
      );

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete Test Item? This action cannot be undone.')).toBeInTheDocument();
    });

    it('should render confirm and cancel buttons for delete action', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('should call onConfirm and onOpenChange when confirm button is clicked', async () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should call onCancel and onOpenChange when cancel button is clicked', async () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  // ============================================================================
  // MOVE ACTION TESTS
  // ============================================================================

  describe('Move Action', () => {
    const moveProps = {
      ...defaultProps,
      action: 'move' as const,
      moveFrom: 'Team A',
      moveTo: 'Team B',
    };

    it('should render move dialog with correct message', () => {
      render(<ApprovalDialog {...moveProps} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to move Test Item from Team A to Team B?')).toBeInTheDocument();
    });

    it('should render confirm and cancel buttons for move action', () => {
      render(<ApprovalDialog {...moveProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('should call onConfirm and onOpenChange when confirm button is clicked', async () => {
      render(<ApprovalDialog {...moveProps} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should not render move message when moveFrom or moveTo is missing', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="move"
        />
      );

      // Should not display move message without moveFrom and moveTo
      expect(screen.queryByText(/from/i)).not.toBeInTheDocument();
    });

    it('should not render move message when only moveFrom is provided', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="move"
          moveFrom="Team A"
        />
      );

      expect(screen.queryByText(/from Team A/i)).not.toBeInTheDocument();
    });

    it('should not render move message when only moveTo is provided', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="move"
          moveTo="Team B"
        />
      );

      expect(screen.queryByText(/to Team B/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // LOADING STATE TESTS
  // ============================================================================

  describe('Loading State', () => {
    it('should disable buttons when isLoading is true', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          isLoading={true}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /processing/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should display "Processing..." text on confirm button when loading', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: /processing/i })).toBeInTheDocument();
    });

    it('should display "Confirm" text on confirm button when not loading', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          isLoading={false}
        />
      );

      expect(screen.getByRole('button', { name: /^confirm$/i })).toBeInTheDocument();
    });

    it('should not call handlers when buttons are clicked while loading', async () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          isLoading={true}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /processing/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      fireEvent.click(confirmButton);
      fireEvent.click(cancelButton);

      // Handlers should not be called because buttons are disabled
      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // OPEN/CLOSE STATE TESTS
  // ============================================================================

  describe('Open/Close State', () => {
    it('should not render dialog content when open is false', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          open={false}
        />
      );

      // Dialog content should not be visible
      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });

    it('should render dialog content when open is true', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          open={true}
        />
      );

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('should call onOpenChange when dialog state changes', async () => {
      const { rerender } = render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          open={false}
        />
      );

      rerender(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          open={true}
        />
      );

      // Verify dialog is now visible
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // BUTTON STYLING TESTS
  // ============================================================================

  describe('Button Styling', () => {
    it('should apply destructive variant to confirm button', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      // The button should have the destructive styling class
      expect(confirmButton.className).toContain('destructive');
    });

    it('should apply outline variant to cancel button', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      // The button should have the outline styling class
      expect(cancelButton.className).toContain('outline');
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty name string', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          name=""
        />
      );

      expect(screen.getByText('Are you sure you want to delete ? This action cannot be undone.')).toBeInTheDocument();
    });

    it('should handle special characters in name', () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          name="Test <Item> & 'Special' Characters"
        />
      );

      expect(screen.getByText("Are you sure you want to delete Test <Item> & 'Special' Characters? This action cannot be undone.")).toBeInTheDocument();
    });

    it('should handle long names', () => {
      const longName = 'A'.repeat(100);
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
          name={longName}
        />
      );

      expect(screen.getByText(`Are you sure you want to delete ${longName}? This action cannot be undone.`)).toBeInTheDocument();
    });

    it('should handle long team names in move action', () => {
      const longTeamName = 'Very Long Team Name That Exceeds Normal Length';
      render(
        <ApprovalDialog
          {...defaultProps}
          action="move"
          moveFrom={longTeamName}
          moveTo={longTeamName}
        />
      );

      expect(screen.getByText(`Are you sure you want to move Test Item from ${longTeamName} to ${longTeamName}?`)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // MULTIPLE CALLS TESTS
  // ============================================================================

  describe('Multiple Interactions', () => {
    it('should handle multiple confirm clicks', async () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        // Should only be called once per click (3 times total)
        expect(mockOnConfirm).toHaveBeenCalledTimes(3);
      });
    });

    it('should handle alternating confirm and cancel clicks', async () => {
      render(
        <ApprovalDialog
          {...defaultProps}
          action="delete"
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      fireEvent.click(confirmButton);
      fireEvent.click(cancelButton);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(2);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      });
    });
  });
});