import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TeamMemberDialog } from '../../../src/components/dialogs/TeamMemberDialog';
import type { Member as DutyMember } from '../../../src/hooks/useOnDutyData';
import type { CreateUserRequest } from '../../../src/types/api';

/**
 * TeamMemberDialog Component Tests
 * 
 * Tests for the TeamMemberDialog component which displays a dialog
 * for adding and editing team members with LDAP user search functionality.
 */

// Mock the hooks
vi.mock('../../../src/hooks/api/useMembers', () => ({
  useLdapUserSearch: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../../src/hooks/api/useTeams', () => ({
  useTeams: vi.fn(() => ({
    data: {
      teams: [
        { id: 'team1', name: 'Team A', display_name: 'Team A', organization_id: 'org1' },
        { id: 'team2', name: 'Team B', display_name: 'Team B', organization_id: 'org1' },
      ],
    },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

interface MemberFormData {
  userId?: string;
  fullName?: string;
  email?: string;
  team?: string;
  avatar?: string;
  // Fields from CreateUserRequest
  first_name?: string;
  last_name?: string;
  mobile?: string;
  team_domain?: string;
  team_id?: string;
  team_role?: string;
}

describe('TeamMemberDialog Component', () => {
  const mockOnOpenChange = vi.fn();
  const mockSetMemberForm = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnCreateMember = vi.fn();

  const defaultMemberForm: MemberFormData = {
    userId: '',
    fullName: '',
    email: '',
    team: '',
  };

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    editingMember: null,
    memberForm: defaultMemberForm,
    teamName: 'Team A',
    setMemberForm: mockSetMemberForm,
    onRemove: mockOnRemove,
    onCreateMember: mockOnCreateMember,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING TESTS - ADD MODE
  // ============================================================================

  describe('Rendering - Add Mode', () => {
    it('should render dialog with add title when not editing', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      expect(screen.getByText('Add Member')).toBeInTheDocument();
      expect(screen.getByText(/Enter the User ID first to lookup member details/i)).toBeInTheDocument();
    });

    it('should render user search field when adding new member', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      expect(screen.getByLabelText(/search user/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type user ID...')).toBeInTheDocument();
    });



    it('should render action buttons', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should not render remove button when adding new member', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });

    it('should show info message about disabled fields', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      expect(screen.getByText(/Search and select a user above to enable other fields/i)).toBeInTheDocument();
    });

    it('should disable form fields when user is not validated', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);

      expect(fullNameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });
  });

  // ============================================================================
  // RENDERING TESTS - EDIT MODE
  // ============================================================================

  describe('Rendering - Edit Mode', () => {
    const editingMember: DutyMember = {
      id: '1',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'Developer',
      avatar: 'https://example.com/avatar.jpg',
      team: 'Team A',
    };

    it('should render dialog with edit title when editing', () => {
      render(
        <TeamMemberDialog
          {...defaultProps}
          editingMember={editingMember}
        />
      );

      expect(screen.getByText('Edit Member')).toBeInTheDocument();
      expect(screen.getByText('Update the member details below.')).toBeInTheDocument();
    });

    it('should not render user search field when editing', () => {
      render(
        <TeamMemberDialog
          {...defaultProps}
          editingMember={editingMember}
        />
      );

      expect(screen.queryByLabelText(/search user/i)).not.toBeInTheDocument();
    });

    it('should render remove button when editing', () => {
      render(
        <TeamMemberDialog
          {...defaultProps}
          editingMember={editingMember}
        />
      );

      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });

    it('should not show info message about disabled fields when editing', () => {
      render(
        <TeamMemberDialog
          {...defaultProps}
          editingMember={editingMember}
        />
      );

      expect(screen.queryByText(/Search and select a user above to enable other fields/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // USER SEARCH TESTS
  // ============================================================================

  describe('User Search Functionality', () => {
    it('should update search input when user types', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      const searchInput = screen.getByLabelText(/search user/i);
      fireEvent.change(searchInput, { target: { value: 'john' } });

      expect(searchInput).toHaveValue('john');
    });

    it('should show loading state while searching', async () => {
      const { useLdapUserSearch } = await import('../../../src/hooks/api/useMembers');
      vi.mocked(useLdapUserSearch).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any);

      render(<TeamMemberDialog {...defaultProps} />);

      const searchInput = screen.getByLabelText(/search user/i);
      fireEvent.change(searchInput, { target: { value: 'john' } });

      await waitFor(() => {
        expect(screen.getByText(/searching/i)).toBeInTheDocument();
      });
    });

    it('should show error message when search fails', async () => {
      const { useLdapUserSearch } = await import('../../../src/hooks/api/useMembers');
      vi.mocked(useLdapUserSearch).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Search failed'),
      } as any);

      render(<TeamMemberDialog {...defaultProps} />);

      const searchInput = screen.getByLabelText(/search user/i);
      fireEvent.change(searchInput, { target: { value: 'john' } });

      await waitFor(() => {
        expect(screen.getByText(/error searching users/i)).toBeInTheDocument();
      });
    });




  });

  // ============================================================================
  // FORM FIELD TESTS
  // ============================================================================

  describe('Form Fields', () => {
    it('should display current form values in inputs', () => {
      const filledForm: MemberFormData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        team: 'Team A',
      };

      render(
        <TeamMemberDialog
          {...defaultProps}
          memberForm={filledForm}
        />
      );

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });


    it('should have placeholder text in search input', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      expect(screen.getByPlaceholderText('Type user ID...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  describe('Form Validation', () => {
    it('should disable save button when form is invalid', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when user is not validated for new member', () => {
      const validForm: MemberFormData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        team: 'Team A',
      };

      render(
        <TeamMemberDialog
          {...defaultProps}
          memberForm={validForm}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should validate required fields', () => {
      const incompleteForm: MemberFormData = {
        fullName: '',
        email: '',
        team: '',
      };

      render(
        <TeamMemberDialog
          {...defaultProps}
          memberForm={incompleteForm}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  // ============================================================================
  // BUTTON ACTION TESTS
  // ============================================================================

  describe('Button Actions', () => {
    it('should call onOpenChange when cancel button is clicked', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onRemove and onOpenChange when remove button is clicked', () => {
      const editingMember: DutyMember = {
        id: '1',
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'Developer',
        avatar: '',
        team: 'Team A',
      };

      render(
        <TeamMemberDialog
          {...defaultProps}
          editingMember={editingMember}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('1');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not call onCreateMember when save button is clicked with invalid form', () => {
      render(<TeamMemberDialog {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      expect(mockOnCreateMember).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // OPEN/CLOSE STATE TESTS
  // ============================================================================

  describe('Open/Close State', () => {
    it('should not render dialog content when open is false', () => {
      render(
        <TeamMemberDialog
          {...defaultProps}
          open={false}
        />
      );

      expect(screen.queryByText('Add Member')).not.toBeInTheDocument();
    });

    it('should render dialog content when open is true', () => {
      render(
        <TeamMemberDialog
          {...defaultProps}
          open={true}
        />
      );

      expect(screen.getByText('Add Member')).toBeInTheDocument();
    });

    it('should reset form state when dialog opens', () => {
      const { rerender } = render(
        <TeamMemberDialog
          {...defaultProps}
          open={false}
        />
      );

      rerender(
        <TeamMemberDialog
          {...defaultProps}
          open={true}
        />
      );

      expect(screen.getByText('Add Member')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEAM SELECTION TESTS
  // ============================================================================

  describe('Team Selection', () => {


    it('should show loading state while teams are loading', async () => {
      const { useTeams } = await import('../../../src/hooks/api/useTeams');
      vi.mocked(useTeams).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any);

      render(<TeamMemberDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/loading teams/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very long names', () => {
      const longName = 'A'.repeat(200);
      const longForm: MemberFormData = {
        fullName: longName,
        email: 'test@example.com',
      };

      render(
        <TeamMemberDialog
          {...defaultProps}
          memberForm={longForm}
        />
      );

      expect(screen.getByDisplayValue(longName)).toBeInTheDocument();
    });

    it('should handle special characters in name', () => {
      const specialName = "O'Brien-Smith";
      const specialForm: MemberFormData = {
        fullName: specialName,
        email: 'test@example.com',
      };

      render(
        <TeamMemberDialog
          {...defaultProps}
          memberForm={specialForm}
        />
      );

      expect(screen.getByDisplayValue(specialName)).toBeInTheDocument();
    });

    it('should handle email addresses with special characters', () => {
      const specialEmail = 'user+tag@example.co.uk';
      const specialForm: MemberFormData = {
        fullName: 'John Doe',
        email: specialEmail,
      };

      render(
        <TeamMemberDialog
          {...defaultProps}
          memberForm={specialForm}
        />
      );

      expect(screen.getByDisplayValue(specialEmail)).toBeInTheDocument();
    });

    it('should handle missing teamName prop', () => {
      render(
        <TeamMemberDialog
          {...defaultProps}
          teamName={undefined}
        />
      );

      expect(screen.getByText('Add Member')).toBeInTheDocument();
    });

    it('should handle null editingMember', () => {
      render(
        <TeamMemberDialog
          {...defaultProps}
          editingMember={null}
        />
      );

      expect(screen.getByText('Add Member')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {



    it('should handle switching from add to edit mode', () => {
      const { rerender } = render(<TeamMemberDialog {...defaultProps} />);

      expect(screen.getByText('Add Member')).toBeInTheDocument();

      const editingMember: DutyMember = {
        id: '1',
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'Developer',
        avatar: '',
        team: 'Team A',
      };

      rerender(
        <TeamMemberDialog
          {...defaultProps}
          editingMember={editingMember}
        />
      );

      expect(screen.getByText('Edit Member')).toBeInTheDocument();
    });
  });
});
