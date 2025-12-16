import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamProvider } from '../../../src/contexts/TeamContext';
import Team from '../../../src/components/Team/Team';
import type { Team as ApiTeam } from '../../../src/types/api';

/**
 * Team Component Tests (Simplified after Context Refactoring)
 * 
 * Tests for the main Team component which now uses TeamContext.
 * Most functionality is tested in individual component tests and TeamContext tests.
 * This file focuses on essential integration and tab switching logic.
 */

// Mock all the hooks used by TeamProvider
vi.mock('../../../src/hooks/api/useTeams', () => ({
  useTeamById: vi.fn(() => ({
    data: {
      id: 'team1',
      name: 'My Team',
      organization_id: 'org1',
      members: [],
      links: [],
    },
    isLoading: false,
    error: null,
  })),
  useTeams: vi.fn(() => ({
    data: { teams: [] },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../../src/hooks/useScheduleData', () => ({
  useScheduleData: vi.fn(() => ({
    todayAssignments: {
      dayMember: null,
      nightMember: null,
    },
  })),
}));

vi.mock('../../../src/hooks/team/useJiraFiltering', () => ({
  useJiraFiltering: vi.fn(() => ({
    filteredIssues: [],
    search: '',
    setSearch: vi.fn(),
    assigneeFilter: 'all',
    setAssigneeFilter: vi.fn(),
    statusFilter: 'all',
    setStatusFilter: vi.fn(),
    sortBy: 'updated',
    setSortBy: vi.fn(),
    quickFilter: 'all',
    setQuickFilter: vi.fn(),
    currentPage: 1,
    setCurrentPage: vi.fn(),
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../../src/hooks/team/useUserManagement', () => ({
  useUserManagement: vi.fn(() => ({
    members: [],
    memberDialogOpen: false,
    setMemberDialogOpen: vi.fn(),
    editingMember: null,
    memberForm: {
      userId: '',
      fullName: '',
      email: '',
      role: '',
      team: '',
    },
    setMemberForm: vi.fn(),
    createMember: vi.fn(),
    deleteMember: vi.fn(),
    moveMember: vi.fn(),
    openAddMember: vi.fn(),
    openEditMember: vi.fn(),
  })),
}));

interface LocalTeamLink {
  id: string;
  name: string;
  url: string;
  category_id: string;
  description: string;
  tags: string[] | string;
}

vi.mock('../../../src/hooks/team/useTeamLinks', () => ({
  useTeamLinks: vi.fn(() => ({
    links: [],
    linkDialogOpen: false,
    onLinkDialogOpenChange: vi.fn(),
    setLinks: vi.fn(),
    removeLink: vi.fn(),
    toggleFavorite: vi.fn(),
  })),
}));

vi.mock('../../../src/hooks/team/useTeamComponents', () => ({
  useTeamComponents: vi.fn(() => ({
    componentsData: { components: [] },
    teamComponentsExpanded: {},
    toggleComponentExpansion: vi.fn(),
  })),
}));

vi.mock('../../../src/hooks/team/useTeamAuthorization', () => ({
  useTeamAuthorization: vi.fn(() => ({
    isAdmin: true,
  })),
}));

vi.mock('../../../src/hooks/team/useScoreboardData', () => ({
  useScoreboardData: vi.fn(() => ({
    jiraTop3: [],
    gitTop3: [],
    dutyTop3: [],
    crossTeamRows: [],
    SCORE_WEIGHTS: {},
  })),
}));

vi.mock('../../../src/hooks/api/mutations/useTeamMutations', () => ({
  useUpdateTeam: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUpdateTeamMetadata: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

const mockToastFn = vi.fn();
vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToastFn,
    dismiss: vi.fn(),
    toasts: []
  }),
}));

vi.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user1', email: 'test@example.com' },
  })),
}));

vi.mock('../../../src/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(() => ({
    data: { id: 'user1', email: 'test@example.com' },
  })),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock ProjectsContext
vi.mock('../../../src/contexts/ProjectsContext', () => ({
  useProjectsContext: vi.fn(() => ({
    projects: [
      { id: 'project-1', name: 'cis20', title: 'CIS 2.0' },
      { id: 'project-2', name: 'ca', title: 'Cloud Analytics' },
    ],
    isLoading: false,
    error: null,
    sidebarItems: [],
  })),
}));

// Mock child components to isolate Team component logic
vi.mock('../../../src/components/dialogs/TeamMemberDialog', () => ({
  TeamMemberDialog: vi.fn(() => <div data-testid="team-member-dialog">Team Member Dialog</div>),
}));

vi.mock('../../../src/components/dialogs/AddLinkDialog', () => ({
  AddLinkDialog: vi.fn(() => <div data-testid="add-link-dialog">Add Link Dialog</div>),
}));

vi.mock('../../../src/components/Team/MemberList', () => ({
  MemberList: vi.fn(() => <div data-testid="member-list">Member List</div>),
}));

vi.mock('../../../src/components/ComponentsList', () => ({
  ComponentsList: vi.fn(({ onComponentClick }) => (
    <div data-testid="components-list">
      <button
        data-testid="mock-component-click"
        onClick={() => onComponentClick && onComponentClick('test-component')}
      >
        Mock Component
      </button>
    </div>
  )),
}));

vi.mock('../../../src/components/Team/TeamJiraIssues', () => ({
  TeamJiraIssues: vi.fn(() => <div data-testid="team-jira-issues">Team Jira Issues</div>),
}));

vi.mock('../../../src/components/tabs/MePageTabs/QuickLinksTab', () => ({
  default: vi.fn(() => <div data-testid="quick-links-tab">Quick Links Tab</div>),
}));

vi.mock('../../../src/components/Team/TeamDocs', () => ({
  TeamDocs: vi.fn(() => <div data-testid="team-docs">Team Docs</div>),
}));

describe('Team Component', () => {
  const mockCurrentTeam: ApiTeam = {
    id: 'team1',
    name: 'My Team',
    organization_id: 'org1',
    owner: 'owner1',
    created_at: '2024-01-01T00:00:00Z',
    description: 'Test team description',
    email: 'team@example.com',
    group_id: 'group1',
    links: [],
    members: [],
    metadata: {},
    picture_url: '',
    title: 'My Team',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const defaultTeamProviderProps = {
    teamId: 'team1',
    teamName: 'My Team',
    currentTeam: mockCurrentTeam,
    teamOptions: ['Team A', 'Team B'],
    onMembersChange: vi.fn(),
    onMoveMember: vi.fn(),
    teamNameToIdMap: vi.fn(),
  };

  const defaultTeamProps = {
    activeCommonTab: 'overview',
  };

  const renderTeamWithProvider = (teamProps = defaultTeamProps, providerProps = defaultTeamProviderProps) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TeamProvider {...providerProps}>
          <Team {...teamProps} />
        </TeamProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // ESSENTIAL TAB SWITCHING TESTS
  // ============================================================================

  describe('Tab Switching Logic', () => {
    it('should display overview tab content by default', () => {
      renderTeamWithProvider();

      expect(screen.getByTestId('member-list')).toBeInTheDocument();
      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });

    it('should display components tab content when active', () => {
      renderTeamWithProvider({ ...defaultTeamProps, activeCommonTab: "components" });

      expect(screen.getByTestId('components-list')).toBeInTheDocument();
      expect(screen.queryByTestId('member-list')).not.toBeInTheDocument();
    });

    it('should display jira tab content when active', () => {
      renderTeamWithProvider({ ...defaultTeamProps, activeCommonTab: "jira" });

      expect(screen.getByTestId('team-jira-issues')).toBeInTheDocument();
      expect(screen.queryByTestId('member-list')).not.toBeInTheDocument();
    });

    it('should handle docs tab with and without teamId', () => {
      // With teamId
      renderTeamWithProvider({ ...defaultTeamProps, activeCommonTab: "docs" });
      expect(screen.getByTestId('team-docs')).toBeInTheDocument();

      // Without teamId
      const { unmount } = renderTeamWithProvider(
        { ...defaultTeamProps, activeCommonTab: "docs" },
        { ...defaultTeamProviderProps, teamId: '' }
      );
      expect(screen.getByText('No team selected')).toBeInTheDocument();
      unmount();
    });
  });

  // ============================================================================
  // BASIC INTEGRATION TESTS
  // ============================================================================

  describe('Component Integration', () => {
    it('should render with default hooks', () => {
      renderTeamWithProvider();

      // Verify basic rendering works
      expect(screen.getByTestId('member-list')).toBeInTheDocument();
      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });

    it('should render main structure with dialogs', () => {
      renderTeamWithProvider();

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('team-member-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('add-link-dialog')).toBeInTheDocument();
    });

    it('should handle different tabs without errors', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      // Test overview tab
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <TeamProvider {...defaultTeamProviderProps}>
            <Team {...defaultTeamProps} />
          </TeamProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('member-list')).toBeInTheDocument();

      // Test components tab
      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamProvider {...defaultTeamProviderProps}>
            <Team {...defaultTeamProps} activeCommonTab="components" />
          </TeamProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('components-list')).toBeInTheDocument();

      // Test jira tab
      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamProvider {...defaultTeamProviderProps}>
            <Team {...defaultTeamProps} activeCommonTab="jira" />
          </TeamProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('team-jira-issues')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // COMPONENT NAVIGATION TESTS
  // ============================================================================

  describe('Component Navigation', () => {
    it('should navigate to component view when handleComponentClick is called', async () => {
      // Override the existing mock for this specific test
      const mockUseTeamComponents = vi.fn(() => ({
        componentsData: { 
          components: [
            {
              id: 'comp-1',
              name: 'test-component',
              title: 'Test Component',
              project_id: 'project-1',
              owner_id: 'team-1',
            }
          ]
        },
        teamComponentsExpanded: {},
        toggleComponentExpansion: vi.fn(),
        isLoading: false,
        error: null,
      }));

      // Use vi.mocked to override the existing mock
      const { useTeamComponents } = await import('../../../src/hooks/team/useTeamComponents');
      vi.mocked(useTeamComponents).mockImplementation(mockUseTeamComponents);

      renderTeamWithProvider({ ...defaultTeamProps, activeCommonTab: "components" });

      // Click the mock component button to trigger handleComponentClick
      const componentButton = screen.getByTestId('mock-component-click');
      componentButton.click();

      // Should navigate to the correct project and component
      expect(mockNavigate).toHaveBeenCalledWith('/cis20/component/test-component');
    });

    it('should show toast error when component project is not found', async () => {
      // Override the existing mock for this specific test
      const mockUseTeamComponents = vi.fn(() => ({
        componentsData: { 
          components: [
            {
              id: 'comp-1',
              name: 'test-component',
              title: 'Test Component',
              project_id: 'unknown-project',
              owner_id: 'team-1',
            }
          ]
        },
        teamComponentsExpanded: {},
        toggleComponentExpansion: vi.fn(),
        isLoading: false,
        error: null,
      }));

      // Use vi.mocked to override the existing mock
      const { useTeamComponents } = await import('../../../src/hooks/team/useTeamComponents');
      vi.mocked(useTeamComponents).mockImplementation(mockUseTeamComponents);

      renderTeamWithProvider({ ...defaultTeamProps, activeCommonTab: "components" });

      // Click the mock component button to trigger handleComponentClick
      const componentButton = screen.getByTestId('mock-component-click');
      componentButton.click();

      // Should show error toast with correct message
      expect(mockToastFn).toHaveBeenCalledWith({
        title: "Navigation failed",
        description: "Project not found for this component.",
        variant: "destructive",
      });

      // Should not navigate when project is not found
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate when component is not found', async () => {
      // Override the existing mock for this specific test
      const mockUseTeamComponents = vi.fn(() => ({
        componentsData: { components: [] },
        teamComponentsExpanded: {},
        toggleComponentExpansion: vi.fn(),
        isLoading: false,
        error: null,
      }));

      // Use vi.mocked to override the existing mock
      const { useTeamComponents } = await import('../../../src/hooks/team/useTeamComponents');
      vi.mocked(useTeamComponents).mockImplementation(mockUseTeamComponents);

      renderTeamWithProvider({ ...defaultTeamProps, activeCommonTab: "components" });

      // Click the mock component button to trigger handleComponentClick
      const componentButton = screen.getByTestId('mock-component-click');
      componentButton.click();

      // Should not navigate when component is not found
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show toast error and not navigate when project is not found for component', async () => {
      // Override the existing mock for this specific test - component exists but project_id doesn't match any project
      const mockUseTeamComponents = vi.fn(() => ({
        componentsData: { 
          components: [
            {
              id: 'comp-1',
              name: 'test-component',
              title: 'Test Component',
              project_id: 'non-existent-project-id', // This project_id doesn't exist in the mocked projects
              owner_id: 'team-1',
            }
          ]
        },
        teamComponentsExpanded: {},
        toggleComponentExpansion: vi.fn(),
        isLoading: false,
        error: null,
      }));

      // Use vi.mocked to override the existing mock
      const { useTeamComponents } = await import('../../../src/hooks/team/useTeamComponents');
      vi.mocked(useTeamComponents).mockImplementation(mockUseTeamComponents);

      renderTeamWithProvider({ ...defaultTeamProps, activeCommonTab: "components" });

      // Click the mock component button to trigger handleComponentClick
      const componentButton = screen.getByTestId('mock-component-click');
      componentButton.click();

      // Should show error toast with correct message
      expect(mockToastFn).toHaveBeenCalledWith({
        title: "Navigation failed",
        description: "Project not found for this component.",
        variant: "destructive",
      });

      // Should not navigate when project is not found
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
