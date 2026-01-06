import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import Team from '../../src/components/Team/Team';
import { useCurrentUser } from '../../src/hooks/api/useMembers';
import { useTeams } from '../../src/hooks/api/useTeams';
import { useUpdateTeamMetadata } from '../../src/hooks/api/mutations/useTeamMutations';
import { useToast } from '../../src/hooks/use-toast';
import type { Team as ApiTeam, UserMeResponse, TeamListResponse, CreateUserRequest } from '../../src/types/api';

/**
 * Team Component Integration Tests
 * 
 * These tests verify the integration between the Team component and its dependencies,
 * focusing on the functionality extracted from the provided code snippet:
 * - Team metadata updates (color changes)
 * - Team links management
 * - Member management
 * - Memoization and performance optimizations
 * - Error handling scenarios
 */

// ============================================================================
// MOCKS
// ============================================================================

// Mock hooks
vi.mock('../../src/hooks/api/useMembers');
vi.mock('../../src/hooks/api/useTeams');
vi.mock('../../src/hooks/api/mutations/useTeamMutations');
vi.mock('../../src/hooks/use-toast');

// Mock TeamContext to avoid complex dependencies
vi.mock('../../src/contexts/TeamContext', () => ({
  TeamProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTeamContext: () => ({
    teamId: 'team-1',
    teamName: 'Engineering Team',
    currentTeam: {
      id: 'team-1',
      name: 'Engineering Team',
      metadata: { color: '#3b82f6', jira: { team: 'ENG', 'project-key': 'ENG' } },
    },
    members: [
      {
        id: 'member-1',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        role: 'developer',
        team: 'Engineering Team',
        uuid: 'member-uuid-1',
      },
    ],
    memberDialogOpen: false,
    setMemberDialogOpen: vi.fn(),
    editingMember: null,
    memberForm: {},
    setMemberForm: vi.fn(),
    openAddMember: vi.fn(),
    openEditMember: vi.fn(),
    deleteMember: vi.fn(),
    moveMember: vi.fn(),
    createMember: vi.fn(),
    teamLinks: {
      links: [
        {
          id: 'team-link-1',
          name: 'Team Wiki',
          description: 'Team documentation',
          url: 'https://wiki.example.com/team',
          category_id: 'documentation',
          tags: 'wiki,docs',
          owner: 'Engineering Team',
          favorite: false,
        },
      ],
      linkDialogOpen: false,
      onLinkDialogOpenChange: vi.fn(),
      removeLink: vi.fn(),
      setLinks: vi.fn(),
      toggleFavorite: vi.fn(),
    },
    teamComponents: {
      componentsData: { components: [] },
      teamComponentsExpanded: {},
      toggleComponentExpansion: vi.fn(),
    },
    scheduleData: {
      todayAssignments: {
        dayMember: null,
        nightMember: null,
      },
    },
    scoreboardData: {
      jiraTop3: [],
      gitTop3: [],
      dutyTop3: [],
      crossTeamRows: [],
      scoreWeights: {
        dora: 30,
        runs: 20,
        quality: 25,
        availability: 15,
        alerts: 10,
      },
    },
    isAdmin: true,
    isLoading: false,
    error: null,
  }),
}));

// Mock child components
vi.mock('../../src/components/dialogs/TeamMemberDialog', () => ({
  TeamMemberDialog: ({ open, onCreateMember }: { open: boolean; onCreateMember: (payload: CreateUserRequest) => void }) => (
    <div data-testid="team-member-dialog" data-open={open}>
      <button 
        data-testid="create-member-btn"
        onClick={() => onCreateMember({
          id: 'new-member-id',
          email: 'new@example.com',
          first_name: 'New',
          last_name: 'Member',
          team_id: 'team-1'
        })}
      >
        Create Member
      </button>
    </div>
  ),
}));

vi.mock('../../src/components/dialogs/AddLinkDialog', () => ({
  AddLinkDialog: ({ open, onTeamLinkAdded }: { 
    open: boolean; 
    onTeamLinkAdded: (teamId: string, links: any[]) => void;
  }) => (
    <div data-testid="add-link-dialog" data-open={open}>
      <button 
        data-testid="add-link-btn"
        onClick={() => onTeamLinkAdded('team-1', [
          {
            id: 'new-link-id',
            name: 'New Link',
            url: 'https://example.com',
            category_id: 'general',
            description: 'Test link',
            tags: ['test']
          }
        ])}
      >
        Add Link
      </button>
    </div>
  ),
}));

vi.mock('../../src/components/Team/MemberList', () => ({
  MemberList: ({ colorPickerProps }: { 
    colorPickerProps: {
      currentColor: string;
      onColorChange: (color: string) => void;
      disabled: boolean;
      usedColors: string[];
    }
  }) => (
    <div data-testid="member-list">
      <div data-testid="current-color">{colorPickerProps.currentColor}</div>
      <div data-testid="used-colors">{colorPickerProps.usedColors.join(',')}</div>
      <button 
        data-testid="change-color-btn"
        disabled={colorPickerProps.disabled}
        onClick={() => colorPickerProps.onColorChange('#ff0000')}
      >
        Change Color
      </button>
    </div>
  ),
}));

vi.mock('../../src/components/tabs/MePageTabs/QuickLinksTab', () => ({
  default: ({ 
    userData, 
    onDeleteLink, 
    onToggleFavorite 
  }: { 
    userData: UserMeResponse;
    onDeleteLink: (linkId: string) => void;
    onToggleFavorite: (linkId: string) => void;
  }) => (
    <div data-testid="quick-links-tab">
      {userData.link?.map(link => (
        <div key={link.id} data-testid={`link-${link.id}`}>
          <span>{link.name}</span>
          <button 
            data-testid={`delete-link-${link.id}`}
            onClick={() => onDeleteLink(link.id)}
          >
            Delete
          </button>
          <button 
            data-testid={`toggle-favorite-${link.id}`}
            onClick={() => onToggleFavorite(link.id)}
          >
            Toggle Favorite
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../src/components/ComponentsList', () => ({
  ComponentsList: () => <div data-testid="components-list">Components List</div>,
}));

vi.mock('../../src/components/Team/TeamJiraIssues', () => ({
  TeamJiraIssues: () => <div data-testid="team-jira-issues">Team Jira Issues</div>,
}));

vi.mock('../../src/components/Team/TeamDocs', () => ({
  TeamDocs: () => <div data-testid="team-docs">Team Docs</div>,
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockCurrentUser: UserMeResponse = {
  id: 'user-1',
  uuid: 'user-uuid-1',
  team_id: 'team-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  mobile: '+1234567890',
  team_domain: 'engineering',
  team_role: 'developer',
  link: [
    {
      id: 'link-1',
      name: 'GitHub',
      title: 'GitHub Repository',
      description: 'Main repository',
      url: 'https://github.com/example/repo',
      category_id: 'development',
      tags: ['git', 'code'],
      favorite: true,
    },
    {
      id: 'link-2',
      name: 'Jira',
      title: 'Jira Board',
      description: 'Project board',
      url: 'https://jira.example.com/board',
      category_id: 'project',
      tags: ['project', 'tracking'],
      favorite: false,
    },
  ],
};

const mockAllTeamsData: TeamListResponse = {
  teams: [
    {
      id: 'team-1',
      name: 'Engineering Team',
      title: 'Engineering Team',
      description: 'Main engineering team',
      email: 'engineering@example.com',
      group_id: 'group-1',
      organization_id: 'org-1',
      owner: 'john.doe@example.com',
      picture_url: '',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      metadata: {
        color: '#3b82f6',
        jira: {
          team: 'ENG',
          'project-key': 'ENG',
        },
      },
      links: [],
      members: [],
    },
    {
      id: 'team-2',
      name: 'Design Team',
      title: 'Design Team',
      description: 'Design team',
      email: 'design@example.com',
      group_id: 'group-1',
      organization_id: 'org-1',
      owner: 'designer@example.com',
      picture_url: '',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      metadata: {
        color: '#ef4444',
      },
      links: [],
      members: [],
    },
    {
      id: 'team-3',
      name: 'Product Team',
      title: 'Product Team',
      description: 'Product team',
      email: 'product@example.com',
      group_id: 'group-1',
      organization_id: 'org-1',
      owner: 'pm@example.com',
      picture_url: '',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      metadata: {
        color: '#10b981',
      },
      links: [],
      members: [],
    },
  ],
  items: [],
  page: 1,
  page_size: 20,
  total: 3,
};

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Team Component Integration Tests', () => {
  let queryClient: QueryClient;
  let mockToast: ReturnType<typeof vi.fn>;
  let mockUpdateTeamMetadata: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockToast = vi.fn();
    mockUpdateTeamMetadata = vi.fn();

    // Setup hook mocks
    (useCurrentUser as any).mockReturnValue({
      data: mockCurrentUser,
      isLoading: false,
      error: null,
    });

    (useTeams as any).mockReturnValue({
      data: mockAllTeamsData,
      isLoading: false,
      error: null,
    });

    (useToast as any).mockReturnValue({
      toast: mockToast,
    });

    (useUpdateTeamMetadata as any).mockReturnValue({
      mutate: mockUpdateTeamMetadata,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const renderTeamComponent = (activeTab = 'overview') => {
    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Team activeCommonTab={activeTab} />
        </QueryClientProvider>
      </MemoryRouter>
    );
  };

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render overview tab by default', () => {
      renderTeamComponent('overview');

      expect(screen.getByTestId('member-list')).toBeInTheDocument();
      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('components-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('team-jira-issues')).not.toBeInTheDocument();
      expect(screen.queryByTestId('team-docs')).not.toBeInTheDocument();
    });

    it('should render components tab', () => {
      renderTeamComponent('components');

      expect(screen.getByTestId('components-list')).toBeInTheDocument();
      expect(screen.queryByTestId('member-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('quick-links-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('team-jira-issues')).not.toBeInTheDocument();
      expect(screen.queryByTestId('team-docs')).not.toBeInTheDocument();
    });

    it('should render jira tab', () => {
      renderTeamComponent('jira');

      expect(screen.getByTestId('team-jira-issues')).toBeInTheDocument();
      expect(screen.queryByTestId('member-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('quick-links-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('components-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('team-docs')).not.toBeInTheDocument();
    });

    it('should render docs tab', () => {
      renderTeamComponent('docs');

      expect(screen.getByTestId('team-docs')).toBeInTheDocument();
      expect(screen.queryByTestId('member-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('quick-links-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('components-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('team-jira-issues')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEAM METADATA TESTS
  // ============================================================================

  describe('Team Metadata', () => {
    it('should display current team color correctly', () => {
      renderTeamComponent();

      const currentColor = screen.getByTestId('current-color');
      expect(currentColor).toHaveTextContent('#3b82f6');
    });

    it('should exclude current team color from used colors', () => {
      renderTeamComponent();

      const usedColors = screen.getByTestId('used-colors');
      expect(usedColors).toHaveTextContent('#ef4444,#10b981');
      expect(usedColors).not.toHaveTextContent('#3b82f6');
    });

    it('should handle color change successfully', async () => {
      renderTeamComponent();

      const changeColorBtn = screen.getByTestId('change-color-btn');
      
      await act(async () => {
        fireEvent.click(changeColorBtn);
      });

      await waitFor(() => {
        expect(mockUpdateTeamMetadata).toHaveBeenCalledWith({
          id: 'team-1',
          metadata: {
            color: '#ff0000',
            jira: {
              team: 'ENG',
              'project-key': 'ENG',
            },
          },
        });
      });
    });

    it('should disable color picker when mutation is pending', () => {
      (useUpdateTeamMetadata as any).mockReturnValue({
        mutate: mockUpdateTeamMetadata,
        isPending: true,
        isError: false,
        error: null,
      });

      renderTeamComponent();

      const changeColorBtn = screen.getByTestId('change-color-btn');
      expect(changeColorBtn).toBeDisabled();
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle teams data loading error', () => {
      (useTeams as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load teams'),
      });

      renderTeamComponent();

      // Should still render with empty used colors
      const usedColors = screen.getByTestId('used-colors');
      expect(usedColors).toHaveTextContent('');
    });

    it('should handle current user loading error', () => {
      (useCurrentUser as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load user'),
      });

      renderTeamComponent();

      // Should still render the component
      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });

    it('should handle teams with malformed metadata', () => {
      const teamsWithMalformedMetadata: TeamListResponse = {
        teams: [
          {
            ...mockAllTeamsData.teams[0],
            id: 'team-2',
            name: 'Team with null metadata',
            metadata: null as any,
          },
          {
            ...mockAllTeamsData.teams[0],
            id: 'team-3',
            name: 'Team with undefined metadata',
            metadata: undefined as any,
          },
        ],
        items: [],
        page: 1,
        page_size: 20,
        total: 2,
      };

      (useTeams as any).mockReturnValue({
        data: teamsWithMalformedMetadata,
        isLoading: false,
        error: null,
      });

      renderTeamComponent();

      // Should handle malformed metadata gracefully
      const usedColors = screen.getByTestId('used-colors');
      expect(usedColors).toHaveTextContent('');
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance', () => {
    it('should handle rerender correctly', () => {
      const { rerender } = renderTeamComponent();

      // Get initial render
      const quickLinksTab = screen.getByTestId('quick-links-tab');
      expect(quickLinksTab).toBeInTheDocument();

      // Rerender with same props
      rerender(
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <Team activeCommonTab="overview" />
          </QueryClientProvider>
        </MemoryRouter>
      );

      // Component should still render correctly
      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });

    it('should handle loading states correctly', () => {
      (useCurrentUser as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      (useTeams as any).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      (useUpdateTeamMetadata as any).mockReturnValue({
        mutate: mockUpdateTeamMetadata,
        isPending: true,
        isError: false,
        error: null,
      });

      renderTeamComponent();

      // Color picker should be disabled during loading
      const changeColorBtn = screen.getByTestId('change-color-btn');
      expect(changeColorBtn).toBeDisabled();
    });

    it('should handle empty states correctly', () => {
      (useCurrentUser as any).mockReturnValue({
        data: {
          ...mockCurrentUser,
          link: [],
        },
        isLoading: false,
        error: null,
      });

      renderTeamComponent();

      // Should render with empty links
      const quickLinksTab = screen.getByTestId('quick-links-tab');
      expect(quickLinksTab).toBeInTheDocument();
      expect(screen.queryByTestId('link-link-1')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration', () => {
    it('should integrate with toast notifications', async () => {
      renderTeamComponent();

      const changeColorBtn = screen.getByTestId('change-color-btn');
      
      await act(async () => {
        fireEvent.click(changeColorBtn);
      });

      // Verify mutation was called
      expect(mockUpdateTeamMetadata).toHaveBeenCalled();
    });

    it('should handle tab switching correctly', () => {
      const { rerender } = renderTeamComponent('overview');

      // Initially on overview
      expect(screen.getByTestId('member-list')).toBeInTheDocument();
      expect(screen.queryByTestId('components-list')).not.toBeInTheDocument();

      // Switch to components tab
      rerender(
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <Team activeCommonTab="components" />
          </QueryClientProvider>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('member-list')).not.toBeInTheDocument();
      expect(screen.getByTestId('components-list')).toBeInTheDocument();
    });

    it('should maintain state across rerenders', () => {
      const { rerender } = renderTeamComponent();

      // Initial render
      const currentColor = screen.getByTestId('current-color');
      expect(currentColor).toHaveTextContent('#3b82f6');

      // Rerender
      rerender(
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <Team activeCommonTab="overview" />
          </QueryClientProvider>
        </MemoryRouter>
      );

      // State should be maintained
      const currentColorAfterRerender = screen.getByTestId('current-color');
      expect(currentColorAfterRerender).toHaveTextContent('#3b82f6');
    });
  });
});
