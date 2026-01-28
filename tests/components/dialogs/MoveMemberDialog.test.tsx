import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MoveMemberDialog } from '../../../src/components/dialogs/MoveMemberDialog';
import type { Member as DutyMember } from '../../../src/hooks/useOnDutyData';

/**
 * MoveMemberDialog Component Tests
 * 
 * Tests for the MoveMemberDialog component which displays a dialog
 * for moving team members between teams with proper validation and user feedback.
 */

describe('MoveMemberDialog Component', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnMove = vi.fn();

  const mockMember: DutyMember = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Developer',
    avatar: 'https://example.com/avatar.jpg',
    id: 'user-123',
  };

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    member: mockMember,
    currentTeam: 'Team Alpha',
    teamOptions: ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'],
    onMove: mockOnMove,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render dialog with all essential elements', () => {
      render(<MoveMemberDialog {...defaultProps} />);

      expect(screen.getByText('Move Team Member')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Destination Team')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /move member/i })).toBeInTheDocument();
    });

    it('should render member avatar or initials', () => {
      const { rerender } = render(<MoveMemberDialog {...defaultProps} />);

      // With avatar - the Avatar component renders an img element but it might not be visible in the test
      // Let's check for the avatar container instead
      expect(screen.getByText('JD')).toBeInTheDocument(); // Fallback is always rendered

      // Without avatar - should show initials
      const memberWithoutAvatar = { ...mockMember, avatar: undefined };
      rerender(<MoveMemberDialog {...defaultProps} member={memberWithoutAvatar} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should control dialog visibility based on open prop', () => {
      const { rerender } = render(<MoveMemberDialog {...defaultProps} open={false} />);
      expect(screen.queryByText('Move Team Member')).not.toBeInTheDocument();

      rerender(<MoveMemberDialog {...defaultProps} open={true} />);
      expect(screen.getByText('Move Team Member')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEAM SELECTION TESTS
  // ============================================================================

  describe('Team Selection', () => {
    it('should show available teams excluding current team', async () => {
      render(<MoveMemberDialog {...defaultProps} />);

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      await waitFor(() => {
        // Check that the available teams are shown as options
        expect(screen.getByRole('option', { name: 'Team Beta' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Team Gamma' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Team Delta' })).toBeInTheDocument();
        // Team Alpha should not be available as an option
        expect(screen.queryByRole('option', { name: 'Team Alpha' })).not.toBeInTheDocument();
      });
    });

    it('should handle no available teams', async () => {
      render(<MoveMemberDialog {...defaultProps} teamOptions={['Team Alpha']} />);

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByText('No other teams available')).toBeInTheDocument();
      });

      // Close the select dropdown first
      fireEvent.click(selectTrigger);

      const moveButton = screen.getByText('Move Member');
      expect(moveButton.closest('button')).toBeDisabled();
    });

    it('should update selected team and enable move button', async () => {
      render(<MoveMemberDialog {...defaultProps} />);

      // Initially disabled
      const moveButton = screen.getByRole('button', { name: /move member/i });
      expect(moveButton).toBeDisabled();

      // Select a team
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      await waitFor(() => {
        const betaOption = screen.getByRole('option', { name: 'Team Beta' });
        fireEvent.click(betaOption);
      });

      // Should be enabled now
      expect(moveButton).not.toBeDisabled();
      // Check that the select trigger shows the selected team
      expect(selectTrigger).toHaveTextContent('Team Beta');
    });
  });

  // ============================================================================
  // USER INTERACTION TESTS
  // ============================================================================

  describe('User Interactions', () => {
    it('should call onOpenChange when cancel button is clicked', () => {
      render(<MoveMemberDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onMove with correct parameters when move button is clicked', async () => {
      render(<MoveMemberDialog {...defaultProps} />);

      // Select a team
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      await waitFor(() => {
        const betaOption = screen.getByRole('option', { name: 'Team Beta' });
        fireEvent.click(betaOption);
      });

      // Wait for the button to be enabled and click it
      await waitFor(() => {
        const moveButton = screen.getByRole('button', { name: 'Move Member' });
        expect(moveButton).not.toBeDisabled();
        fireEvent.click(moveButton);
      });

      expect(mockOnMove).toHaveBeenCalledWith(mockMember, 'Team Beta');
    });

    it('should reset selection when dialog is closed and reopened', async () => {
      const { rerender } = render(<MoveMemberDialog {...defaultProps} />);

      // Select a team
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      await waitFor(() => {
        const betaOption = screen.getByRole('option', { name: 'Team Beta' });
        fireEvent.click(betaOption);
      });

      // Verify team was selected - the select trigger should show the selected team
      await waitFor(() => {
        expect(selectTrigger).toHaveTextContent('Team Beta');
      });

      // Close dialog by calling onOpenChange(false) - this should trigger the reset
      rerender(<MoveMemberDialog {...defaultProps} open={false} />);
      
      // Reopen dialog
      rerender(<MoveMemberDialog {...defaultProps} open={true} />);

      // Selection should be reset - the move button should be disabled and placeholder should be visible
      const newSelectTrigger = screen.getByRole('combobox');
      const moveButton = screen.getByRole('button', { name: /move member/i });
      
      expect(moveButton).toBeDisabled();
      expect(newSelectTrigger).toHaveTextContent('Choose a team...');
    });
  });

  // ============================================================================
  // LOADING STATE TESTS
  // ============================================================================

  describe('Loading State', () => {
    it('should show loading state and disable buttons when isLoading is true', () => {
      render(<MoveMemberDialog {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Moving...')).toBeInTheDocument();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const moveButton = screen.getByRole('button', { name: /moving/i });

      expect(cancelButton).toBeDisabled();
      expect(moveButton).toBeDisabled();
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle null member gracefully', () => {
      render(<MoveMemberDialog {...defaultProps} member={null} />);

      expect(screen.getByText('Move Team Member')).toBeInTheDocument();
      // Should not crash
    });

    it('should generate correct initials for different name formats', () => {
      const testCases = [
        { name: 'John Doe', expected: 'JD' },
        { name: 'John', expected: 'J' },
        { name: 'John Michael Doe', expected: 'JM' },
      ];

      testCases.forEach(({ name, expected }) => {
        const member = { ...mockMember, fullName: name, avatar: undefined };
        const { unmount } = render(<MoveMemberDialog {...defaultProps} member={member} />);
        
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle special characters in team names', async () => {
      const specialTeamOptions = ['Team Alpha', 'Team "Beta"', 'Team & Gamma'];
      render(<MoveMemberDialog {...defaultProps} teamOptions={specialTeamOptions} />);

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByText('Team "Beta"')).toBeInTheDocument();
        expect(screen.getByText('Team & Gamma')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      render(<MoveMemberDialog {...defaultProps} />);

      expect(screen.getByLabelText('Destination Team')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /move member/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
