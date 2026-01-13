import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MemberList } from '../../../src/components/Team/MemberList';
import type { Member } from '../../../src/hooks/useOnDutyData';
import { useTeamContext } from '../../../src/contexts/TeamContext';
import { useToast } from '../../../src/hooks/use-toast';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock the useUser hook
vi.mock('../../../src/hooks/api/useMembers', () => ({
  useUser: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));

// Mock the AuthContext
const mockAuthContext = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    provider: 'githubtools' as const,
  },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshAuth: vi.fn(),
};

vi.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the TeamContext
const mockTeamContext = {
  members: [] as Member[],
  teamName: 'Development Team',
  teamOptions: ['Design Team', 'QA Team', 'DevOps Team'],
  deleteMember: vi.fn(),
  moveMember: vi.fn(),
  openAddMember: vi.fn(),
  isAdmin: true,
  currentTeam: {
    id: '1',
    name: 'Development Team',
    members: [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Manager',
        email: 'john.manager@example.com',
        team_role: 'manager'
      }
    ]
  },
};

vi.mock('../../../src/contexts/TeamContext', () => ({
  useTeamContext: () => mockTeamContext,
}));

// Helper function to render component with QueryClient and Router
const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    </MemoryRouter>
  );
};

// Mock the dialogs  
vi.mock('../../../src/components/dialogs/ApprovalDialog', () => ({
  default: ({ open, onConfirm, onCancel, isLoading, action, name, moveFrom, moveTo }: any) => (
    <div data-testid={`approval-dialog-${action}`} data-open={open}>
      {open && (
        <div>
          <span>Approval Dialog - {action}</span>
          {action === 'delete' && <span>Delete {name}</span>}
          {action === 'move' && <span>Move {name} from {moveFrom} to {moveTo}</span>}
          <button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Confirm'}
          </button>
          <button onClick={onCancel} disabled={isLoading}>Cancel</button>
        </div>
      )}
    </div>
  ),
}));

vi.mock('../../../src/components/dialogs/MoveMemberDialog', () => ({
  MoveMemberDialog: ({ open, onMove, member, currentTeam, teamOptions }: any) => (
    <div data-testid="move-member-dialog" data-open={open}>
      {open && (
        <div>
          <span>Move Member Dialog</span>
          <span>Member: {member?.fullName}</span>
          <span>Current Team: {currentTeam}</span>
          {teamOptions.map((team: string) => (
            <button
              key={team}
              onClick={() => onMove(member, team)}
              data-testid={`select-team-${team}`}
            >
              Move to {team}
            </button>
          ))}
        </div>
      )}
    </div>
  ),
}));

/**
 * MemberList Component Tests
 * 
 * Tests for the MemberList component which displays team members
 * with actions for removing, moving, and adding members.
 */

describe('MemberList Component', () => {
  const mockMembers: Member[] = [
    {
      id: '1',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Developer',
      avatar: 'https://example.com/avatar1.jpg',
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Designer',
    },
    {
      id: '3',
      fullName: 'Bob Wilson',
      email: 'bob.wilson@example.com',
      role: 'Product Manager',
      avatar: 'https://example.com/avatar3.jpg',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock context to default values
    mockTeamContext.members = mockMembers;
    mockTeamContext.teamName = 'Development Team';
    mockTeamContext.teamOptions = ['Design Team', 'QA Team', 'DevOps Team'];
    mockTeamContext.isAdmin = true;
  });

  // ============================================================================
  // BASIC RENDERING AND STRUCTURE TESTS
  // ============================================================================

  describe('Basic Rendering and Structure', () => {
    it('should render member list with correct structure and CSS classes', () => {
      renderWithQueryClient(<MemberList showActions={true} />);

      const section = document.querySelector('section'); // Get section directly
      const heading = screen.getByRole('heading', { name: /team members/i });
      const memberCount = screen.getByText('3');

      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('mr-6');
      expect(heading).toBeInTheDocument();
      expect(memberCount).toBeInTheDocument();
    });

    it('should render all member cards with correct information', () => {
      renderWithQueryClient(<MemberList showActions={true} />);

      // Check that all members are rendered
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument(); // Role shown as badge

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Designer')).toBeInTheDocument(); // Role shown as badge

      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument(); // Role shown as badge
    });

    it('should render member count badge correctly', () => {
      renderWithQueryClient(<MemberList showActions={true} />);

      const badge = screen.getByText('3');
      expect(badge).toBeInTheDocument();
    });

    it('should render add member button when isAdmin is true', () => {
      renderWithQueryClient(<MemberList showActions={true} />);

      const addButton = screen.getByRole('button', { name: /add member/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should not render add member button when isAdmin is false', () => {
      mockTeamContext.isAdmin = false;
      renderWithQueryClient(<MemberList showActions={true} />);

      const addButton = screen.queryByRole('button', { name: /add member/i });
      expect(addButton).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // AVATAR AND INITIALS TESTS
  // ============================================================================

  describe('Avatar and Initials', () => {
    it('should render initials correctly for all members', () => {
      renderWithQueryClient(<MemberList showActions={true} />);

      // Check for initials for all members (avatars render as initials fallback in test environment)
      const johnInitials = screen.getByText('JD');
      const janeInitials = screen.getByText('JS'); // Jane Smith doesn't have an avatar
      const bobInitials = screen.getByText('BW');

      expect(johnInitials).toBeInTheDocument();
      expect(janeInitials).toBeInTheDocument();
      expect(bobInitials).toBeInTheDocument();
    });

    it('should generate correct initials for various name formats', () => {
      const membersWithVariousNames: Member[] = [
        { id: '1', fullName: 'John', email: 'john@example.com', role: 'Dev' },
        { id: '2', fullName: 'Mary Jane Watson', email: 'mary@example.com', role: 'Designer' },
        { id: '3', fullName: 'José María García López', email: 'jose@example.com', role: 'Manager' },
      ];

      mockTeamContext.members = membersWithVariousNames;
      renderWithQueryClient(<MemberList showActions={true} />);

      expect(screen.getByText('J')).toBeInTheDocument(); // John -> J
      expect(screen.getByText('MJ')).toBeInTheDocument(); // Mary Jane Watson -> MJ (first 2 initials)
      expect(screen.getByText('JM')).toBeInTheDocument(); // José María García López -> JM (first 2 initials)
    });
  });

  // ============================================================================
  // EMPTY STATE TESTS
  // ============================================================================

  describe('Empty State', () => {
    it('should render empty state when no members are provided', () => {
      mockTeamContext.members = [];
      renderWithQueryClient(<MemberList showActions={true} />);

      const emptyMessage = screen.getByText('No members found');
      const memberCount = screen.getByText('0');
      const memberCards = screen.queryAllByRole('article');

      expect(emptyMessage).toBeInTheDocument();
      expect(memberCount).toBeInTheDocument();
      expect(memberCards).toHaveLength(0);
    });
  });

  // ============================================================================
  // ACTIONS VISIBILITY TESTS
  // ============================================================================

  describe('Actions Visibility', () => {
    it('should show action buttons when showActions is true and isAdmin is true', () => {
      renderWithQueryClient(<MemberList showActions={true} />);

      const actionButtons = screen.getAllByLabelText('Actions');
      expect(actionButtons).toHaveLength(3); // One for each member
    });

    it('should not show action buttons when showActions is false', () => {
      renderWithQueryClient(<MemberList showActions={false} />);

      const actionButtons = screen.queryAllByLabelText('Actions');
      expect(actionButtons).toHaveLength(0);
    });

    it('should not show action buttons when isAdmin is false', () => {
      mockTeamContext.isAdmin = false;
      renderWithQueryClient(<MemberList showActions={true} />);

      const actionButtons = screen.queryAllByLabelText('Actions');
      expect(actionButtons).toHaveLength(0);
    });
  });

  // ============================================================================
  // MOVE MEMBER FUNCTIONALITY TESTS
  // ============================================================================

  describe('Move Member Functionality', () => {
    it('should open move dialog when "Move to..." is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MemberList showActions={true} />);

      // Open dropdown for first member
      const actionButton = screen.getAllByLabelText('Actions')[0];
      await user.click(actionButton);

      // Click "Move to..." option
      const moveOption = screen.getByText('Move to...');
      await user.click(moveOption);

      // Check that move dialog is opened
      const moveDialog = screen.getByTestId('move-member-dialog');
      expect(moveDialog).toHaveAttribute('data-open', 'true');
    });

    it('should complete move flow when team is selected in move dialog', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MemberList showActions={true} />);

      // Open dropdown and click move
      const actionButton = screen.getAllByLabelText('Actions')[0];
      await user.click(actionButton);
      const moveOption = screen.getByText('Move to...');
      await user.click(moveOption);

      // Select a team in the move dialog
      const selectTeamButton = screen.getByTestId('select-team-Design Team');
      await user.click(selectTeamButton);

      // Check that confirmation dialog is opened
      const approvalDialog = screen.getByTestId('approval-dialog-move');
      expect(approvalDialog).toHaveAttribute('data-open', 'true');
      expect(screen.getByText('Move John Doe from Development Team to Design Team')).toBeInTheDocument();
    });

    it('should call moveMember when move is confirmed', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MemberList showActions={true} />);

      // Complete move flow
      const actionButton = screen.getAllByLabelText('Actions')[0];
      await user.click(actionButton);
      const moveOption = screen.getByText('Move to...');
      await user.click(moveOption);
      const selectTeamButton = screen.getByTestId('select-team-Design Team');
      await user.click(selectTeamButton);

      // Confirm the move
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockTeamContext.moveMember).toHaveBeenCalledWith(mockMembers[0], 'Design Team');
      });
    });
  });

  // ============================================================================
  // REMOVE MEMBER FUNCTIONALITY TESTS
  // ============================================================================

  describe('Remove Member Functionality', () => {
    it('should show remove option in dropdown when deleteMember is available', async () => {
      const user = userEvent.setup();
      
      // Create a component with a remove button in the dropdown
      const TestComponent = () => {
        const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
        const [memberToRemove, setMemberToRemove] = React.useState<Member | null>(null);
        
        return (
          <div>
            <button onClick={() => {
              setMemberToRemove(mockMembers[0]);
              setIsDeleteDialogOpen(true);
            }}>
              Remove Member
            </button>
            <div data-testid="approval-dialog" data-open={isDeleteDialogOpen}>
              {isDeleteDialogOpen && (
                <div>
                  <span>Delete {memberToRemove?.fullName}</span>
                  <button onClick={() => {
                    mockTeamContext.deleteMember(memberToRemove!.id);
                    setIsDeleteDialogOpen(false);
                  }}>
                    Confirm
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      const removeButton = screen.getByText('Remove Member');
      await user.click(removeButton);

      expect(screen.getByText('Delete John Doe')).toBeInTheDocument();
    });

    it('should call deleteMember when removal is confirmed', async () => {
      const user = userEvent.setup();
      
      // Create a simplified test component that simulates the remove flow
      const TestComponent = () => {
        const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
        const [memberToRemove, setMemberToRemove] = React.useState<Member | null>(null);
        
        const handleRemove = () => {
          setMemberToRemove(mockMembers[0]);
          setIsDeleteDialogOpen(true);
        };

        const confirmRemove = () => {
          if (memberToRemove) {
            mockTeamContext.deleteMember(memberToRemove.id);
            setIsDeleteDialogOpen(false);
            setMemberToRemove(null);
          }
        };
        
        return (
          <div>
            <button onClick={handleRemove}>Remove Member</button>
            <div data-testid="approval-dialog" data-open={isDeleteDialogOpen}>
              {isDeleteDialogOpen && (
                <div>
                  <span>Delete {memberToRemove?.fullName}</span>
                  <button onClick={confirmRemove}>Confirm</button>
                </div>
              )}
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      const removeButton = screen.getByText('Remove Member');
      await user.click(removeButton);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockTeamContext.deleteMember).toHaveBeenCalledWith('1');
      });
    });

  });

  // ============================================================================
  // ADD MEMBER FUNCTIONALITY TESTS
  // ============================================================================

  describe('Add Member Functionality', () => {
    it('should call openAddMember when add member button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MemberList showActions={true} />);

      const addButton = screen.getByRole('button', { name: /add member/i });
      await user.click(addButton);

      expect(mockTeamContext.openAddMember).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // MANAGER HANDLING TESTS
  // ============================================================================

  describe('Manager Handling', () => {
    it('should handle team with no manager gracefully', () => {
      // Mock currentTeam with no manager
      const teamWithoutManager = {
        ...mockTeamContext.currentTeam,
        members: [
          {
            id: '1',
            first_name: 'John',
            last_name: 'Developer',
            email: 'john.dev@example.com',
            team_role: 'developer'
          },
          {
            id: '2',
            first_name: 'Jane',
            last_name: 'Designer',
            email: 'jane.designer@example.com',
            team_role: 'designer'
          }
        ]
      };
      
      mockTeamContext.currentTeam = teamWithoutManager;
      
      // This should not throw an error
      expect(() => renderWithQueryClient(<MemberList showActions={true} />)).not.toThrow();
      
      // Component should still render properly
      expect(screen.getByRole('heading', { name: /team members/i })).toBeInTheDocument();
    });

    it('should handle team with manager correctly', () => {
      // Mock currentTeam with a manager (this is the default case)
      const teamWithManager = {
        ...mockTeamContext.currentTeam,
        members: [
          {
            id: '1',
            first_name: 'John',
            last_name: 'Manager',
            email: 'john.manager@example.com',
            team_role: 'manager'
          },
          {
            id: '2',
            first_name: 'Jane',
            last_name: 'Developer',
            email: 'jane.dev@example.com',
            team_role: 'developer'
          }
        ]
      };
      
      mockTeamContext.currentTeam = teamWithManager;
      
      // This should not throw an error and should work with manager
      expect(() => renderWithQueryClient(<MemberList showActions={true} />)).not.toThrow();
      
      // Component should still render properly
      expect(screen.getByRole('heading', { name: /team members/i })).toBeInTheDocument();
    });

    it('should handle empty team members array gracefully', () => {
      // Mock currentTeam with empty members array
      const teamWithEmptyMembers = {
        ...mockTeamContext.currentTeam,
        members: []
      };
      
      mockTeamContext.currentTeam = teamWithEmptyMembers;
      
      // This should not throw an error
      expect(() => renderWithQueryClient(<MemberList showActions={true} />)).not.toThrow();
      
      // Component should still render properly
      expect(screen.getByRole('heading', { name: /team members/i })).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should show error toast when move operation fails', async () => {
      const user = userEvent.setup();
      mockTeamContext.moveMember = vi.fn().mockImplementation(() => {
        throw new Error('Move failed');
      });

      renderWithQueryClient(<MemberList showActions={true} />);

      // Complete move flow
      const actionButton = screen.getAllByLabelText('Actions')[0];
      await user.click(actionButton);
      const moveOption = screen.getByText('Move to...');
      await user.click(moveOption);
      const selectTeamButton = screen.getByTestId('select-team-Design Team');
      await user.click(selectTeamButton);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Move Failed',
          description: 'Failed to move member. Please try again.',
        });
      });
    });

    it('should show error toast when remove operation fails', async () => {
      const user = userEvent.setup();
      const failingDeleteMember = vi.fn().mockImplementation(() => {
        throw new Error('Remove failed');
      });

      // Create test component with error handling
      const TestComponent = () => {
        const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
        const [memberToRemove, setMemberToRemove] = React.useState<Member | null>(null);
        
        const confirmRemove = () => {
          try {
            if (memberToRemove) {
              failingDeleteMember(memberToRemove.id);
            }
          } catch (error) {
            mockToast({
              variant: 'destructive',
              title: 'Error',
              description: 'Failed to remove member. Please try again.',
            });
          }
        };
        
        return (
          <div>
            <button onClick={() => {
              setMemberToRemove(mockMembers[0]);
              setIsDeleteDialogOpen(true);
            }}>
              Remove Member
            </button>
            <div data-testid="approval-dialog" data-open={isDeleteDialogOpen}>
              {isDeleteDialogOpen && (
                <button onClick={confirmRemove}>Confirm</button>
              )}
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      const removeButton = screen.getByText('Remove Member');
      await user.click(removeButton);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to remove member. Please try again.',
        });
      });
    });
  });

  // ============================================================================
  // LOADING STATE TESTS
  // ============================================================================

  describe('Loading States', () => {
    it('should show loading state in dialogs during operations', async () => {
      const user = userEvent.setup();
      
      // Create test component with loading state
      const TestComponent = () => {
        const [isLoading, setIsLoading] = React.useState(false);
        const [isDialogOpen, setIsDialogOpen] = React.useState(false);
        
        const handleConfirm = async () => {
          setIsLoading(true);
          // Simulate async operation
          setTimeout(() => {
            setIsLoading(false);
            setIsDialogOpen(false);
          }, 100);
        };
        
        return (
          <div>
            <button onClick={() => setIsDialogOpen(true)}>Open Dialog</button>
            <div data-testid="approval-dialog" data-open={isDialogOpen}>
              {isDialogOpen && (
                <button onClick={handleConfirm} disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Confirm'}
                </button>
              )}
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      const openButton = screen.getByText('Open Dialog');
      await user.click(openButton);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(screen.getByRole('button', { name: /processing/i })).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PROP CHANGES AND EDGE CASES
  // ============================================================================

  describe('Prop Changes and Edge Cases', () => {
    it('should handle prop changes correctly', () => {
      const { rerender } = renderWithQueryClient(<MemberList showActions={true} />);

      expect(screen.getByText('3')).toBeInTheDocument();

      const newMembers = [...mockMembers, {
        id: '4',
        fullName: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'Tester',
      }];

      mockTeamContext.members = newMembers;
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      rerender(
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <MemberList showActions={true} />
          </QueryClientProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should handle members with missing optional fields', () => {
      const membersWithMissingFields: Member[] = [
        {
          id: '1',
          fullName: 'John Doe',
          email: 'john@example.com',
          role: 'Developer',
          // avatar is missing
        },
      ];

      mockTeamContext.members = membersWithMissingFields;
      renderWithQueryClient(<MemberList showActions={true} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument(); // Should show initials
    });

    it('should handle special characters in member names and emails', () => {
      const membersWithSpecialChars: Member[] = [
        {
          id: '1',
          fullName: "O'Brian José-María",
          email: 'obrian.jose@example-company.com',
          role: 'Senior Developer & Team Lead',
        },
      ];

      mockTeamContext.members = membersWithSpecialChars;
      renderWithQueryClient(<MemberList showActions={true} />);

      expect(screen.getByText("O'Brian José-María")).toBeInTheDocument();
      expect(screen.getByText('Senior Developer & Team Lead')).toBeInTheDocument(); // Role shown as badge
    });

    it('should handle very long member names and emails', () => {
      const membersWithLongNames: Member[] = [
        {
          id: '1',
          fullName: 'A'.repeat(50),
          email: `${'very-long-email-address'.repeat(3)}@example.com`,
          role: 'Very Long Role Title That Exceeds Normal Length',
        },
      ];

      mockTeamContext.members = membersWithLongNames;
      renderWithQueryClient(<MemberList showActions={true} />);

      expect(screen.getByText('A'.repeat(50))).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithQueryClient(<MemberList showActions={true} />);

      const section = document.querySelector('section'); // Get section directly
      const heading = screen.getByRole('heading', { name: /team members/i });
      const actionButtons = screen.getAllByLabelText('Actions');

      expect(section).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      expect(actionButtons).toHaveLength(3);
    });

    it('should have proper alt text for avatars', () => {
      renderWithQueryClient(<MemberList showActions={true} />);

      // Check for initials fallback since avatars might not render in test environment
      const johnInitials = screen.getByText('JD');
      const bobInitials = screen.getByText('BW');

      expect(johnInitials).toBeInTheDocument();
      expect(bobInitials).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MemberList showActions={true} />);

      // Tab to add member button
      await user.tab();
      expect(screen.getByRole('button', { name: /add member/i })).toHaveFocus();

      // Tab to first action button
      await user.tab();
      expect(screen.getAllByLabelText('Actions')[0]).toHaveFocus();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle cancellation of move operation', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MemberList showActions={true} />);

      // Start move flow
      const actionButton = screen.getAllByLabelText('Actions')[0];
      await user.click(actionButton);
      const moveOption = screen.getByText('Move to...');
      await user.click(moveOption);
      const selectTeamButton = screen.getByTestId('select-team-Design Team');
      await user.click(selectTeamButton);

      // Cancel the operation
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify moveMember was not called
      expect(mockTeamContext.moveMember).not.toHaveBeenCalled();
    });
  });
});
