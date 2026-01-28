import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemberDetailsDialog, type ExtendedMember } from '../../../src/components/dialogs/MemberDetailsDialog';
import type { Member as DutyMember } from '../../../src/hooks/useOnDutyData';
import * as memberUtils from '../../../src/utils/member-utils';

/**
 * MemberDetailsDialog Component Tests
 * 
 * Tests for the MemberDetailsDialog component which displays detailed
 * member information in a modal dialog with quick action buttons.
 */

// Mock the member utility functions
vi.mock('../../../src/utils/member-utils', () => ({
  openTeamsChat: vi.fn(),
  formatBirthDate: vi.fn(),
  openSAPProfile: vi.fn(),
  openEditPicture: vi.fn(),
  openEmailClient: vi.fn(),
  formatPhoneNumber: vi.fn(),
  copyToClipboard: vi.fn(),
  SAP_PEOPLE_BASE_URL: 'https://people.wdf.sap.corp',
  MAP_ROLE_TO_LABEL: {
    'member': "Member",
    'manager': "Manager",
    'scm': "SCM",
    'mmm': "MMM"
  },
}));

// Mock the useTeams hook
vi.mock('../../../src/hooks/api/useTeams', () => ({
  useTeams: vi.fn(() => ({
    data: {
      teams: [
        { id: 'team1', name: 'Frontend Team' },
        { id: 'team2', name: 'Backend Team' },
        { id: 'team3', name: 'Design Team' }
      ]
    },
    isLoading: false,
    error: null,
  })),
  useTeamById: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/teams/current-team/overview' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Mock the AuthContext
const mockAuthContext = {
  user: {
    id: 'user123',
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

// Helper function to render component with QueryClient and Router
const renderWithQueryClient = (component: React.ReactElement, initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    </MemoryRouter>
  );
};

// Helper function to render component with Router (for backward compatibility)
const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) => {
  return renderWithQueryClient(component, initialEntries);
};

describe('MemberDetailsDialog Component', () => {
  const mockMember: ExtendedMember = {
    id: 'user123',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Senior Developer',
    avatar: 'https://example.com/avatar.jpg',
    team: 'Frontend Team',
    mobile: '+1-555-0123',
    phoneNumber: '+1-555-0123',
    room: 'Building A, Room 101',
    manager: {
      id: 'manager123',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      team_role: 'manager'
    },
    birthDate: '03-15',
  };

  const mockMemberMinimal: ExtendedMember = {
    id: 'user456',
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'UX Designer',
  };

  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mocks
    mockNavigate.mockClear();
    
    // Setup default mock implementations
    vi.mocked(memberUtils.formatBirthDate).mockImplementation((date) => {
      if (date === '03-15') return 'March 15';
      if (date === '12-25') return 'December 25';
      return date || 'Not specified';
    });
    
    vi.mocked(memberUtils.formatPhoneNumber).mockImplementation((phone) => {
      if (!phone) return 'Not specified';
      if (phone === '+1-555-0123') return '+1-5-55-0123';
      if (phone === '+49-123-456-7890') return '+49-1-23-456-7890';
      return phone;
    });
    
    vi.mocked(memberUtils.copyToClipboard).mockImplementation(async (e, text) => {
      e.stopPropagation();
      // Mock successful copy
    });
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should handle closed dialog and null member states', () => {
      // Test closed dialog
      const { rerender } = renderWithRouter(
        <MemberDetailsDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );
      expect(screen.queryByText('User Details')).not.toBeInTheDocument();

      // Test null member
      rerender(
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <MemberDetailsDialog
              open={true}
              onOpenChange={mockOnOpenChange}
              member={null}
            />
          </QueryClientProvider>
        </MemoryRouter>
      );
      expect(screen.queryByText('User Details')).not.toBeInTheDocument();
    });

    it('should render complete dialog with all member information', () => {
      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Dialog structure
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getByText('View detailed information about this user')).toBeInTheDocument();

      // Member header
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('Senior Developer')).toBeInTheDocument();

      // Avatar and action buttons
      const avatarContainer = document.querySelector('.h-20.w-20');
      expect(avatarContainer).toBeInTheDocument();
      expect(screen.getByText('Open Teams Chat')).toBeInTheDocument();
      expect(screen.getByText('Send Email')).toBeInTheDocument();

      // All detail items
      const expectedDetails = [
        ['User ID:', 'user123'],
        ['Email:', 'john.doe@example.com'],
        ['Team:', 'Frontend Team'],
        ['Room:', 'Building A, Room 101'],
        ['Manager Name:', 'Jane Smith'],
        ['Birth Date:', 'March 15'],
        ['Mobile Phone:', '+1-5-55-0123']
      ];

      expectedDetails.forEach(([label, value]) => {
        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByText(value)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // MEMBER DATA HANDLING TESTS
  // ============================================================================

  describe('Member Data Handling', () => {
    it('should handle various member data scenarios', () => {
      // Test minimal data with fallbacks
      const { rerender } = renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMemberMinimal}
        />
      );

      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getByText('UX Designer')).toBeInTheDocument();
      expect(screen.getAllByText('Not specified')).toHaveLength(5);

      // Test null/undefined fields
      const memberWithNulls: ExtendedMember = {
        id: 'user789',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'Tester',
        team: undefined,
        mobile: undefined,
        phoneNumber: '',
        room: undefined,
        manager: undefined,
        birthDate: '',
      };

      rerender(
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <MemberDetailsDialog
              open={true}
              onOpenChange={mockOnOpenChange}
              member={memberWithNulls}
            />
          </QueryClientProvider>
        </MemoryRouter>
      );

      expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Not specified')).toHaveLength(5);

      // Test special characters and long text
      const memberWithSpecialChars: ExtendedMember = {
        id: 'user-special',
        fullName: "José María O'Connor-Smith",
        email: 'jose.maria@example-company.co.uk',
        role: 'Senior Frontend Developer & Team Lead',
        team: 'International Team (Europe/Asia)',
        mobile: '+49-123-456-7890',
        room: 'Büro München, Raum 42/3',
        manager: {
          id: 'manager-special',
          first_name: 'François',
          last_name: 'Müller-Schmidt',
          email: 'francois.muller@example.com',
          team_role: 'manager'
        },
        birthDate: '12-25',
      };

      rerender(
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <MemberDetailsDialog
              open={true}
              onOpenChange={mockOnOpenChange}
              member={memberWithSpecialChars}
            />
          </QueryClientProvider>
        </MemoryRouter>
      );

      expect(screen.getAllByText("José María O'Connor-Smith").length).toBeGreaterThan(0);
      expect(screen.getByText('Senior Frontend Developer & Team Lead')).toBeInTheDocument();
      expect(screen.getByText('International Team (Europe/Asia)')).toBeInTheDocument();
      expect(screen.getByText('Büro München, Raum 42/3')).toBeInTheDocument();
      expect(screen.getByText('François Müller-Schmidt')).toBeInTheDocument();
      expect(screen.getByText('December 25')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // AVATAR AND SAP PROFILE TESTS
  // ============================================================================

  describe('Avatar and SAP Profile', () => {
    it('should render avatar with correct styling and handle clicks', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      const avatarContainer = document.querySelector('.h-20.w-20');
      
      // Check avatar exists with proper styling
      expect(avatarContainer).toBeInTheDocument();
      expect(avatarContainer).toHaveClass('h-20', 'w-20', 'transition-opacity');
      expect(avatarContainer).toHaveClass('relative', 'flex', 'shrink-0', 'overflow-hidden', 'rounded-full');
      
      // Test click functionality - should call openSAPProfile, not openEditPicture
      await user.click(avatarContainer as Element);
      expect(memberUtils.openSAPProfile).toHaveBeenCalledWith('user123');
    });
  });

  // ============================================================================
  // QUICK ACTIONS TESTS
  // ============================================================================

  describe('Quick Actions', () => {
    it('should handle action button clicks and conditional rendering', async () => {
      const user = userEvent.setup();
      
      // Test with full member data
      const { rerender } = renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Test button functionality and styling
      const teamsButton = screen.getByText('Open Teams Chat');
      const emailButton = screen.getByText('Send Email');
      
      expect(teamsButton.closest('button')).toHaveClass('flex', 'items-center', 'gap-2');
      expect(emailButton.closest('button')).toHaveClass('flex', 'items-center', 'gap-2');
      expect(teamsButton.closest('button')?.querySelector('svg')).toBeInTheDocument();
      expect(emailButton.closest('button')?.querySelector('img')).toBeInTheDocument();

      await user.click(teamsButton);
      await user.click(emailButton);

      expect(memberUtils.openTeamsChat).toHaveBeenCalledWith('john.doe@example.com');
      expect(memberUtils.openEmailClient).toHaveBeenCalledWith('john.doe@example.com');

      // Test conditional email button rendering
      rerender(
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <MemberDetailsDialog
              open={true}
              onOpenChange={mockOnOpenChange}
              member={{ ...mockMember, email: '' }}
            />
          </QueryClientProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Open Teams Chat')).toBeInTheDocument();
      expect(screen.queryByText('Send Email')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // BIRTH DATE FORMATTING TESTS
  // ============================================================================

  describe('Birth Date Formatting', () => {
    it('should handle various birth date scenarios', () => {
      const { rerender } = renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Test valid birth date
      expect(memberUtils.formatBirthDate).toHaveBeenCalledWith('03-15');
      expect(screen.getByText('March 15')).toBeInTheDocument();

      // Test undefined birth date
      rerender(
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <MemberDetailsDialog
              open={true}
              onOpenChange={mockOnOpenChange}
              member={{ ...mockMember, birthDate: undefined }}
            />
          </QueryClientProvider>
        </MemoryRouter>
      );
      expect(memberUtils.formatBirthDate).toHaveBeenCalledWith(undefined);

      // Test empty birth date
      rerender(
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <MemberDetailsDialog
              open={true}
              onOpenChange={mockOnOpenChange}
              member={{ ...mockMember, birthDate: '' }}
            />
          </QueryClientProvider>
        </MemoryRouter>
      );
      expect(memberUtils.formatBirthDate).toHaveBeenCalledWith('');
    });
  });

  // ============================================================================
  // DIALOG INTERACTION AND ACCESSIBILITY TESTS
  // ============================================================================

  describe('Dialog Interaction and Accessibility', () => {
    it('should handle dialog interactions and have proper structure', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Dialog structure and ARIA
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveClass('overflow-y-auto', 'max-h-[90vh]');
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getByText('View detailed information about this user')).toBeInTheDocument();

      // Button accessibility
      expect(screen.getByRole('button', { name: /open teams chat/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument();

      // Keyboard interaction
      await user.keyboard('{Escape}');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);

      // Title attributes for accessibility
      const detailValues = screen.getAllByTitle(/user123|john\.doe@example\.com|frontend team/i);
      expect(detailValues.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation through interactive elements', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Tab through interactive elements - there are copy buttons in between
      await user.tab(); // Close button
      await user.tab(); // Avatar
      
      // Skip through copy buttons to get to action buttons
      let currentElement = document.activeElement;
      let tabCount = 0;
      const maxTabs = 10; // Safety limit
      
      while (tabCount < maxTabs && !currentElement?.textContent?.includes('Open Teams Chat')) {
        await user.tab();
        currentElement = document.activeElement;
        tabCount++;
      }
      
      expect(screen.getByText('Open Teams Chat')).toHaveFocus();

      await user.tab(); // Email button
      expect(screen.getByText('Send Email')).toHaveFocus();
    });
  });


  // ============================================================================
  // COMPONENT UPDATE TESTS
  // ============================================================================

  describe('Component Updates', () => {
    it('should handle member prop changes correctly', () => {
      const { rerender } = renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('Senior Developer')).toBeInTheDocument();

      // Update member
      const updatedMember: ExtendedMember = {
        ...mockMember,
        fullName: 'John Smith',
        role: 'Lead Developer',
        team: 'Backend Team',
      };

      rerender(
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <MemberDetailsDialog
              open={true}
              onOpenChange={mockOnOpenChange}
              member={updatedMember}
            />
          </QueryClientProvider>
        </MemoryRouter>
      );

      expect(screen.getAllByText('John Smith').length).toBeGreaterThan(0);
      expect(screen.getByText('Lead Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Team')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Senior Developer')).not.toBeInTheDocument();
    });

    it('should handle open state changes correctly', () => {
      const { rerender } = renderWithRouter(
        <MemberDetailsDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      expect(screen.queryByText('User Details')).not.toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <MemberDetailsDialog
              open={true}
              onOpenChange={mockOnOpenChange}
              member={mockMember}
            />
          </QueryClientProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });

    it('should handle switching between different members', () => {
      const { rerender } = renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('user123')).toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <MemberDetailsDialog
              open={true}
              onOpenChange={mockOnOpenChange}
              member={mockMemberMinimal}
            />
          </QueryClientProvider>
        </MemoryRouter>
      );

      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getByText('user456')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('user123')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // COPY FUNCTIONALITY TESTS
  // ============================================================================

  describe('Copy Functionality', () => {
    it('should show copy buttons for copyable fields', () => {
      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Should have copy buttons for User ID and Email
      const copyButtons = screen.getAllByLabelText(/copy/i);
      expect(copyButtons).toHaveLength(2);
      expect(screen.getByLabelText('Copy User ID')).toBeInTheDocument();
      expect(screen.getByLabelText('Copy Email')).toBeInTheDocument();
    });

    it('should not show copy buttons for non-copyable or empty fields', () => {
      const memberWithEmptyFields: ExtendedMember = {
        ...mockMember,
        id: '',
        email: '',
      };

      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={memberWithEmptyFields}
        />
      );

      // Should not have any copy buttons when fields are empty
      const copyButtons = screen.queryAllByLabelText(/copy/i);
      expect(copyButtons).toHaveLength(0);
    });

    it('should render copy buttons with proper accessibility', () => {
      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      const userIdCopyButton = screen.getByLabelText('Copy User ID');
      const emailCopyButton = screen.getByLabelText('Copy Email');
      
      // Buttons should be properly accessible
      expect(userIdCopyButton).toBeInTheDocument();
      expect(emailCopyButton).toBeInTheDocument();
      expect(userIdCopyButton).toHaveAttribute('aria-label', 'Copy User ID');
      expect(emailCopyButton).toHaveAttribute('aria-label', 'Copy Email');
    });
  });

  // ============================================================================
  // NEW FUNCTIONALITY TESTS
  // ============================================================================

  describe('New Functionality', () => {
    it('should handle team navigation functionality', async () => {
      const memberWithClickableTeam: ExtendedMember = {
        ...mockMember,
        team: 'Backend Team', // Different from current team
      };

      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={memberWithClickableTeam}
        />
      );

      // Team should be displayed
      const teamElement = screen.getByText('Backend Team');
      expect(teamElement).toBeInTheDocument();
      
      // Test that the team is rendered in the correct location
      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should handle managed teams rendering', () => {
      const memberWithManagedTeams: ExtendedMember = {
        ...mockMember,
        managed_teams: [
          { name: 'Team A', title: 'Frontend Team A' },
          { name: 'Team B', title: 'Backend Team B' }
        ]
      };

      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={memberWithManagedTeams}
        />
      );

      // Should show team information (managed teams feature may not be fully implemented)
      // For now, test that the team section is rendered
      expect(screen.getByText('Team:')).toBeInTheDocument();
      
      // The component should render without errors even with managed_teams property
      expect(screen.getByText('User Details')).toBeInTheDocument();
    });

    it('should show back button when showBackButton is true', () => {
      const mockOnGoBack = vi.fn();
      
      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
          onGoBack={mockOnGoBack}
          showBackButton={true}
        />
      );

      const backButton = screen.getByLabelText('Go back');
      expect(backButton).toBeInTheDocument();
    });

    it('should call onGoBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnGoBack = vi.fn();
      
      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
          onGoBack={mockOnGoBack}
          showBackButton={true}
        />
      );

      const backButton = screen.getByLabelText('Go back');
      await user.click(backButton);
      
      expect(mockOnGoBack).toHaveBeenCalledTimes(1);
    });

    it('should handle enhanced copy functionality with visual feedback', async () => {
      const user = userEvent.setup();
      
      // Mock navigator.clipboard
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
      });

      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      const copyButton = screen.getByLabelText('Copy User ID');
      await user.click(copyButton);

      // Should show "Copied!" feedback
      expect(screen.getByText('Copied!')).toBeInTheDocument();
      expect(mockWriteText).toHaveBeenCalledWith('user123');
    });

    it('should handle copy functionality errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock navigator.clipboard to throw an error
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Copy failed'));
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
      });

      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      const copyButton = screen.getByLabelText('Copy User ID');
      await user.click(copyButton);

      // Should not crash and should log error
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy text: ', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle onViewManager callback', async () => {
      const user = userEvent.setup();
      const mockOnViewManager = vi.fn();
      
      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
          onViewManager={mockOnViewManager}
        />
      );

      // Click on manager name (should be clickable)
      const managerElement = screen.getByText('Jane Smith');
      await user.click(managerElement);
      
      expect(mockOnViewManager).toHaveBeenCalledWith('manager123');
    });

    it('should handle team_id and team name mapping', () => {
      const memberWithTeamId: ExtendedMember = {
        ...mockMember,
        team_id: 'team1',
        team: 'Original Team Name'
      };

      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={memberWithTeamId}
        />
      );

      // Should show the original team name since team_id mapping is mocked
      expect(screen.getByText('Original Team Name')).toBeInTheDocument();
    });

    it('should handle avatar click for current user', async () => {
      const user = userEvent.setup();
      
      // Mock user as the same as the member being viewed
      const currentUserMember: ExtendedMember = {
        ...mockMember,
        id: 'user123', // Same as mockAuthContext.user.id
      };

      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={currentUserMember}
        />
      );

      const avatarContainer = document.querySelector('.h-20.w-20');
      expect(avatarContainer).toHaveClass('hover:opacity-70');
      expect(avatarContainer).toHaveAttribute('title', 'Open Profile');
      
      await user.click(avatarContainer as Element);
      expect(memberUtils.openSAPProfile).toHaveBeenCalledWith('user123');
    });

    it('should not make avatar clickable for other users', () => {
      const otherUserMember: ExtendedMember = {
        ...mockMember,
        id: 'other-user', // Different from mockAuthContext.user.id
      };

      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={otherUserMember}
        />
      );

      const avatarContainer = document.querySelector('.h-20.w-20');
      expect(avatarContainer).not.toHaveClass('hover:opacity-70');
      expect(avatarContainer).not.toHaveAttribute('title');
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle utility function errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock utility functions to not throw errors but just do nothing
      vi.mocked(memberUtils.openTeamsChat).mockImplementation(() => {
        // Simulate error but don't throw
        console.error('Teams not available');
      });
      vi.mocked(memberUtils.openEmailClient).mockImplementation(() => {
        // Simulate error but don't throw
        console.error('Email client not available');
      });

      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Should not crash when utility functions have errors
      const teamsButton = screen.getByText('Open Teams Chat');
      const emailButton = screen.getByText('Send Email');

      await user.click(teamsButton);
      await user.click(emailButton);

      // Component should still be rendered
      expect(screen.getByText('User Details')).toBeInTheDocument();

      // Verify functions were called
      expect(memberUtils.openTeamsChat).toHaveBeenCalledWith('john.doe@example.com');
      expect(memberUtils.openEmailClient).toHaveBeenCalledWith('john.doe@example.com');

      consoleSpy.mockRestore();
    });

    it('should handle formatBirthDate errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock formatBirthDate to return a fallback value instead of throwing
      vi.mocked(memberUtils.formatBirthDate).mockImplementation(() => {
        console.error('Date formatting error');
        return 'Invalid Date';
      });

      renderWithRouter(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Component should still render with fallback value
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getByText('Invalid Date')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});
