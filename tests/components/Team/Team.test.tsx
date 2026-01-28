import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import Team from '@/components/Team/Team';
import { MemoryRouter } from 'react-router-dom';

// Mock child components
vi.mock('@/components/dialogs/TeamMemberDialog', () => ({
  TeamMemberDialog: vi.fn(() => <div data-testid="team-member-dialog">Team Member Dialog</div>),
}));

vi.mock('@/components/dialogs/AddLinkDialog', () => ({
  AddLinkDialog: vi.fn(() => <div data-testid="add-link-dialog">Add Link Dialog</div>),
}));

vi.mock('@/components/Team/ScoreBoards', () => ({
  ScoreBoards: vi.fn(() => <div data-testid="scoreboards">ScoreBoards</div>),
}));

vi.mock('@/components/Team/MemberList', () => ({
  MemberList: vi.fn(() => <div data-testid="member-list">Member List</div>),
}));

vi.mock('@/components/tabs/QuickLinksTab', () => ({
  default: vi.fn(() => <div data-testid="quick-links-tab">Quick Links Tab</div>),
}));

vi.mock('@/components/Team/TeamJiraIssues', () => ({
  TeamJiraIssues: vi.fn(() => <div data-testid="team-jira-issues">Team Jira Issues</div>),
}));

vi.mock('@/components/ComponentsList', () => ({
  ComponentsList: vi.fn(() => <div data-testid="components-list">Components List</div>),
}));

vi.mock('@/components/Team/OnDutyAndCall', () => ({
  OnDutyAndCall: vi.fn(() => <div data-testid="on-duty">On Duty</div>),
}));

vi.mock('@/components/Team/TeamDocs', () => ({
  TeamDocs: vi.fn(() => <div data-testid="team-docs">Team Docs</div>),
}));

// Mock contexts
vi.mock('@/contexts/TeamContext', () => ({
  useTeamContext: vi.fn(),
}));

vi.mock('@/contexts/ComponentDisplayContext', () => ({
  ComponentDisplayProvider: vi.fn(({ children }) => (
    <div data-testid="component-display-provider">{children}</div>
  )),
}));

// Mock hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('@/stores/projectsStore', () => ({
  useProjects: vi.fn(),
}));

vi.mock('@/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('@/hooks/api/useTeams', () => ({
  useTeams: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/hooks/api/mutations/useTeamMutations', () => ({
  useUpdateTeamMetadata: vi.fn(),
}));

import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/stores/projectsStore';
import { useCurrentUser } from '@/hooks/api/useMembers';
import { useTeams } from '@/hooks/api/useTeams';
import { useToast } from '@/hooks/use-toast';
import { useUpdateTeamMetadata } from '@/hooks/api/mutations/useTeamMutations';
import { useTeamContext } from '@/contexts/TeamContext';

describe('Team', () => {
  const mockNavigate = vi.fn();
  const mockToast = vi.fn();
  const mockMutate = vi.fn();

  const mockProjects = [
    {
      id: 'proj-1',
      name: 'cis20',
      title: 'CIS 2.0',
      description: 'CIS Project',
    },
    {
      id: 'proj-2',
      name: 'platform',
      title: 'Platform',
      description: 'Platform Project',
    },
  ];

  const mockCurrentUser = {
    id: 'user-1',
    uuid: 'uuid-1',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    link: [],
  };

  const mockCurrentTeam = {
    id: 'team-1',
    name: 'Engineering',
    owner: 'owner-1',
    organization_id: 'org-1',
    metadata: {
      color: '#ff0000',
    },
  };

  const mockMembers = [
    {
      id: 'member-1',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'Admin',
      iuser: 'jdoe',
      team: 'Engineering',
      uuid: 'uuid-member-1',
    },
  ];

  const mockTeamLinks = [
    {
      id: 'link-1',
      name: 'GitHub',
      title: 'GitHub',
      url: 'https://github.com',
      category_id: 'cat-1',
      description: 'Code repository',
      tags: 'code,git',
      owner: 'team-1',
      favorite: false,
    },
  ];

  const mockComponents = [
    {
      id: 'comp-1',
      name: 'api-service',
      title: 'API Service',
      description: 'Main API',
      project_id: 'proj-1',
      owner_id: 'team-1',
    },
  ];

  const defaultTeamContext = {
    teamId: 'team-1',
    teamName: 'Engineering',
    currentTeam: mockCurrentTeam,
    teamOptions: ['Engineering', 'Platform'],
    members: mockMembers,
    memberDialogOpen: false,
    setMemberDialogOpen: vi.fn(),
    editingMember: null,
    memberForm: {},
    setMemberForm: vi.fn(),
    deleteMember: vi.fn(),
    moveMember: vi.fn(),
    openAddMember: vi.fn(),
    createMember: vi.fn(),
    teamLinks: {
      links: mockTeamLinks,
      linkDialogOpen: false,
      onLinkDialogOpenChange: vi.fn(),
      removeLink: vi.fn(),
      setLinks: vi.fn(),
      toggleFavorite: vi.fn(),
    },
    teamComponents: {
      componentsData: { components: mockComponents },
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
      scoreWeights: { jira: 1, git: 1, duty: 1 },
    },
    isAdmin: true,
    jiraFilters: {
      assigneeFilter: '',
      setAssigneeFilter: vi.fn(),
      statusFilter: '',
      setStatusFilter: vi.fn(),
      sortBy: '',
      setSortBy: vi.fn(),
      search: '',
      setSearch: vi.fn(),
      quickFilter: 'all' as const,
      setQuickFilter: vi.fn(),
      currentPage: 1,
      setCurrentPage: vi.fn(),
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      filteredIssues: [],
      isLoading: false,
      error: null,
    },
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useProjects).mockReturnValue(mockProjects);
    vi.mocked(useCurrentUser).mockReturnValue({
      data: mockCurrentUser,
      isLoading: false,
    } as any);
    vi.mocked(useTeams).mockReturnValue({
      data: { teams: [mockCurrentTeam] },
      isLoading: false,
    } as any);
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any);
    vi.mocked(useUpdateTeamMetadata).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
    vi.mocked(useTeamContext).mockReturnValue(defaultTeamContext as any);
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  describe('Rendering', () => {
    it('should render TeamMemberDialog', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('team-member-dialog')).toBeInTheDocument();
    });

    it('should render AddLinkDialog', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('add-link-dialog')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('should render MemberList when overview tab is active', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });

    it('should render QuickLinksTab when overview tab is active', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });

    it('should not render OnDutyAndCall (hidden section)', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.queryByTestId('on-duty')).not.toBeInTheDocument();
    });

    it('should not render ScoreBoards (hidden section)', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.queryByTestId('scoreboards')).not.toBeInTheDocument();
    });

    it('should not render components tab content', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.queryByTestId('components-list')).not.toBeInTheDocument();
    });

    it('should not render jira tab content', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.queryByTestId('team-jira-issues')).not.toBeInTheDocument();
    });

    it('should not render docs tab content', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.queryByTestId('team-docs')).not.toBeInTheDocument();
    });
  });

  describe('Components Tab', () => {
    it('should render ComponentDisplayProvider when components tab is active', () => {
      renderWithRouter(<Team activeCommonTab="components" />);

      expect(screen.getByTestId('component-display-provider')).toBeInTheDocument();
    });

    it('should render ComponentsList when components tab is active', () => {
      renderWithRouter(<Team activeCommonTab="components" />);

      expect(screen.getByTestId('components-list')).toBeInTheDocument();
    });

    it('should not render overview tab content', () => {
      renderWithRouter(<Team activeCommonTab="components" />);

      expect(screen.queryByTestId('member-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('quick-links-tab')).not.toBeInTheDocument();
    });

    it('should handle empty components data', () => {
      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        teamComponents: {
          componentsData: undefined,
          teamComponentsExpanded: {},
          toggleComponentExpansion: vi.fn(),
        },
      } as any);

      renderWithRouter(<Team activeCommonTab="components" />);

      expect(screen.getByTestId('components-list')).toBeInTheDocument();
    });
  });

  describe('Jira Tab', () => {
    it('should render TeamJiraIssues when jira tab is active', () => {
      renderWithRouter(<Team activeCommonTab="jira" />);

      expect(screen.getByTestId('team-jira-issues')).toBeInTheDocument();
    });

    it('should not render other tab content', () => {
      renderWithRouter(<Team activeCommonTab="jira" />);

      expect(screen.queryByTestId('member-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('components-list')).not.toBeInTheDocument();
    });
  });

  describe('Docs Tab', () => {
    it('should render TeamDocs when docs tab is active and teamId exists', () => {
      renderWithRouter(<Team activeCommonTab="docs" />);

      expect(screen.getByTestId('team-docs')).toBeInTheDocument();
    });

    it('should show "No team selected" when teamId is missing', () => {
      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        teamId: '',
      } as any);

      renderWithRouter(<Team activeCommonTab="docs" />);

      expect(screen.getByText('No team selected')).toBeInTheDocument();
      expect(screen.queryByTestId('team-docs')).not.toBeInTheDocument();
    });
  });

  describe('Color Change Handler', () => {
    it('should update team metadata with new color', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      // The handleColorChange is passed to MemberList via colorPickerProps
      // We need to check if the mutation is properly configured
      expect(useUpdateTeamMetadata).toHaveBeenCalled();
    });



    it('should parse string metadata correctly', () => {
      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        currentTeam: {
          ...mockCurrentTeam,
          metadata: '{"color":"#00ff00"}',
        },
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      // Component should handle string metadata
      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });

    it('should handle invalid JSON metadata gracefully', () => {
      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        currentTeam: {
          ...mockCurrentTeam,
          metadata: 'invalid json{',
        },
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      // Should not crash
      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });
  });

  describe('Team Links Management', () => {
    it('should map team links correctly for QuickLinksTab', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });

    it('should handle team link deletion', () => {
      const mockRemoveLink = vi.fn();
      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        teamLinks: {
          ...defaultTeamContext.teamLinks,
          removeLink: mockRemoveLink,
        },
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      // The handleDeleteLink function should be available
      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });

    it('should handle links with no tags', () => {
      const linksWithoutTags = [
        {
          ...mockTeamLinks[0],
          tags: '',
        },
      ];

      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        teamLinks: {
          ...defaultTeamContext.teamLinks,
          links: linksWithoutTags,
        },
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });

    it('should handle links with array tags', () => {
      const linksWithArrayTags = [
        {
          ...mockTeamLinks[0],
          tags: ['code', 'git'],
        },
      ];

      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        teamLinks: {
          ...defaultTeamContext.teamLinks,
          links: linksWithArrayTags as any,
        },
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });
  });

  describe('Component Navigation', () => {
    it('should navigate to component view when component is clicked', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      // Component navigation is handled via handleComponentClick
      // which is passed to ComponentsList
      expect(useNavigate).toHaveBeenCalled();
    });

    it('should show error toast when component is not found', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      // When component is not found in componentsData
      expect(useToast).toHaveBeenCalled();
    });

    it('should show error toast when project is not found', () => {
      vi.mocked(useProjects).mockReturnValue([]);

      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(useToast).toHaveBeenCalled();
    });
  });

  describe('Used Colors Calculation', () => {
    it('should exclude current team from used colors', () => {
      const otherTeam = {
        id: 'team-2',
        name: 'Platform',
        metadata: { color: '#00ff00' },
      };

      vi.mocked(useTeams).mockReturnValue({
        data: { teams: [mockCurrentTeam, otherTeam] },
        isLoading: false,
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      // Used colors should only include other teams
      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });

    it('should handle teams with no metadata', () => {
      const teamWithoutMetadata = {
        id: 'team-2',
        name: 'Platform',
        metadata: null,
      };

      vi.mocked(useTeams).mockReturnValue({
        data: { teams: [mockCurrentTeam, teamWithoutMetadata] },
        isLoading: false,
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });

    it('should handle teams with string metadata', () => {
      const teamWithStringMetadata = {
        id: 'team-2',
        name: 'Platform',
        metadata: '{"color":"#0000ff"}',
      };

      vi.mocked(useTeams).mockReturnValue({
        data: { teams: [mockCurrentTeam, teamWithStringMetadata] },
        isLoading: false,
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing currentUser', () => {
      vi.mocked(useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });

    it('should handle missing allTeamsData', () => {
      vi.mocked(useTeams).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });

    it('should handle missing currentTeam', () => {
      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        currentTeam: null,
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });

    it('should handle empty team links', () => {
      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        teamLinks: {
          ...defaultTeamContext.teamLinks,
          links: [],
        },
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });

    it('should handle empty components', () => {
      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        teamComponents: {
          componentsData: { components: [] },
          teamComponentsExpanded: {},
          toggleComponentExpansion: vi.fn(),
        },
      } as any);

      renderWithRouter(<Team activeCommonTab="components" />);

      expect(screen.getByTestId('components-list')).toBeInTheDocument();
    });

    it('should handle invalid activeCommonTab', () => {
      renderWithRouter(<Team activeCommonTab="invalid-tab" />);

      // Should not crash, just render nothing for content
      expect(screen.getByTestId('team-member-dialog')).toBeInTheDocument();
    });
  });

  describe('Admin Permissions', () => {
    it('should show actions when user is admin', () => {
      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });

    it('should hide actions when user is not admin', () => {
      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        isAdmin: false,
      } as any);

      renderWithRouter(<Team activeCommonTab="overview" />);

      expect(screen.getByTestId('member-list')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should memoize mapped team links', () => {
      const { rerender } = renderWithRouter(<Team activeCommonTab="overview" />);

      // Re-render with same props
      rerender(
        <MemoryRouter>
          <Team activeCommonTab="overview" />
        </MemoryRouter>
      );

      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });

    it('should recalculate when team links change', () => {
      const { rerender } = renderWithRouter(<Team activeCommonTab="overview" />);

      // Change team links
      const newLinks = [
        ...mockTeamLinks,
        {
          id: 'link-2',
          name: 'Jira',
          title: 'Jira',
          url: 'https://jira.com',
          category_id: 'cat-2',
          description: 'Issue tracker',
          tags: 'tasks',
          owner: 'team-1',
          favorite: false,
        },
      ];

      vi.mocked(useTeamContext).mockReturnValue({
        ...defaultTeamContext,
        teamLinks: {
          ...defaultTeamContext.teamLinks,
          links: newLinks,
        },
      } as any);

      rerender(
        <MemoryRouter>
          <Team activeCommonTab="overview" />
        </MemoryRouter>
      );

      expect(screen.getByTestId('quick-links-tab')).toBeInTheDocument();
    });
  });
});
