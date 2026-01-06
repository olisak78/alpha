import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TeamProvider, useTeamContext } from '@/contexts/TeamContext';
import * as useTeams from '@/hooks/api/useTeams';
import * as useUserManagement from '@/hooks/team/useUserManagement';
import * as useJiraFiltering from '@/hooks/team/useJiraFiltering';
import * as useTeamLinks from '@/hooks/team/useTeamLinks';
import * as useTeamComponents from '@/hooks/team/useTeamComponents';
import * as useTeamAuthorization from '@/hooks/team/useTeamAuthorization';
import * as useScoreboardData from '@/hooks/team/useScoreboardData';
import * as useScheduleData from '@/hooks/useScheduleData';
import React from 'react';

// Mock all dependencies
vi.mock('@/hooks/api/useTeams', () => ({
  useTeamById: vi.fn(),
}));

vi.mock('@/hooks/team/useUserManagement', () => ({
  useUserManagement: vi.fn(),
}));

vi.mock('@/hooks/team/useJiraFiltering', () => ({
  useJiraFiltering: vi.fn(),
}));

vi.mock('@/hooks/team/useTeamLinks', () => ({
  useTeamLinks: vi.fn(),
}));

vi.mock('@/hooks/team/useTeamComponents', () => ({
  useTeamComponents: vi.fn(),
}));

vi.mock('@/hooks/team/useTeamAuthorization', () => ({
  useTeamAuthorization: vi.fn(),
}));

vi.mock('@/hooks/team/useScoreboardData', () => ({
  useScoreboardData: vi.fn(),
}));

vi.mock('@/hooks/useScheduleData', () => ({
  useScheduleData: vi.fn(),
}));

describe('TeamContext', () => {
  const mockTeamId = 'team-123';
  const mockTeamName = 'Engineering Team';
  const mockCurrentTeam = {
    id: 'team-123',
    name: 'Engineering Team',
    owner: 'owner@example.com',
    organization_id: 'org-456',
  };
  const mockTeamOptions = ['Engineering Team', 'Design Team', 'Product Team'];

  const mockTeamData = {
    id: 'team-123',
    name: 'Engineering Team',
    owner: 'owner@example.com',
    organization_id: 'org-456',
    members: [
      {
        id: 'member-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        team_role: 'Lead',
        uuid: 'uuid-1',
        iuser: 'C123456',
      },
      {
        id: 'member-2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        team_role: 'Developer',
        uuid: 'uuid-2',
        iuser: 'C789012',
      },
    ],
    links: [
      {
        id: 'link-1',
        name: 'Team Wiki',
        url: 'https://wiki.example.com',
        description: 'Team documentation',
        category_id: 'docs',
        tags: ['wiki', 'docs'],
        favorite: true,
      },
      {
        id: 'link-2',
        name: 'Jira Board',
        url: 'https://jira.example.com',
        description: 'Sprint board',
        category_id: 'tools',
        tags: 'jira',
        favorite: false,
      },
    ],
  };

  const mockUserManagement = {
    members: [
      {
        id: 'member-1',
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'Lead',
        iuser: 'C123456',
        team: 'Engineering Team',
        uuid: 'uuid-1',
      },
      {
        id: 'member-2',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        role: 'Developer',
        iuser: 'C789012',
        team: 'Engineering Team',
        uuid: 'uuid-2',
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
  };

  const mockJiraFiltering = {
    assigneeFilter: 'all',
    setAssigneeFilter: vi.fn(),
    statusFilter: 'all',
    setStatusFilter: vi.fn(),
    sortBy: 'updated',
    setSortBy: vi.fn(),
    search: '',
    setSearch: vi.fn(),
    quickFilter: 'all' as const,
    setQuickFilter: vi.fn(),
    currentPage: 1,
    setCurrentPage: vi.fn(),
    totalPages: 5,
    totalItems: 50,
    itemsPerPage: 10,
    filteredIssues: [],
    isLoading: false,
    error: null,
  };

  const mockTeamLinks = {
    links: [],
    linkDialogOpen: false,
    onLinkDialogOpenChange: vi.fn(),
    removeLink: vi.fn(),
    setLinks: vi.fn(),
    toggleFavorite: vi.fn(),
  };

  const mockTeamComponents = {
    componentsData: undefined,
    teamComponentsExpanded: {},
    toggleComponentExpansion: vi.fn(),
  };

  const mockScheduleData = {
    todayAssignments: {
      dayMember: null,
      nightMember: null,
    },
  };

  const mockScoreboardData = {
    jiraTop3: [],
    gitTop3: [],
    dutyTop3: [],
    crossTeamRows: [],
    SCORE_WEIGHTS: {
      jira: 1,
      git: 1,
      duty: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(useTeams.useTeamById).mockReturnValue({
      data: mockTeamData,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useUserManagement.useUserManagement).mockReturnValue(mockUserManagement);
    vi.mocked(useJiraFiltering.useJiraFiltering).mockReturnValue(mockJiraFiltering);
    vi.mocked(useTeamLinks.useTeamLinks).mockReturnValue(mockTeamLinks);
    vi.mocked(useTeamComponents.useTeamComponents).mockReturnValue(mockTeamComponents);
    vi.mocked(useTeamAuthorization.useTeamAuthorization).mockReturnValue({ isAdmin: false });
    vi.mocked(useScheduleData.useScheduleData).mockReturnValue(mockScheduleData);
    vi.mocked(useScoreboardData.useScoreboardData).mockReturnValue(mockScoreboardData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should provide context value', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.teamId).toBe(mockTeamId);
      });
    });

    it('should throw error when used outside provider', () => {
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useTeamContext());
      }).toThrow('useTeamContext must be used within a TeamProvider');

      console.error = originalError;
    });
  });

  describe('Team Data', () => {
    it('should provide team ID and name', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.teamId).toBe(mockTeamId);
        expect(result.current.teamName).toBe(mockTeamName);
      });
    });

    it('should use fetched team data over prop team data', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.currentTeam).toEqual(mockTeamData);
      });
    });

    it('should fallback to prop team data when fetch fails', async () => {
      vi.mocked(useTeams.useTeamById).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.currentTeam).toEqual(mockCurrentTeam);
      });
    });

    it('should provide team options', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.teamOptions).toEqual(mockTeamOptions);
      });
    });
  });

  describe('Members Transformation', () => {
    it('should transform team members to expected format', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.members).toHaveLength(2);
      });

      // Check that useUserManagement was called with transformed members
      expect(useUserManagement.useUserManagement).toHaveBeenCalledWith(
        expect.objectContaining({
          initialMembers: expect.arrayContaining([
            expect.objectContaining({
              id: 'member-1',
              fullName: 'John Doe',
              email: 'john@example.com',
              role: 'Lead',
              iuser: 'C123456',
              team: 'Engineering Team',
              uuid: 'uuid-1',
            }),
          ]),
        })
      );
    });

    it('should handle members without names', async () => {
      vi.mocked(useTeams.useTeamById).mockReturnValue({
        data: {
          ...mockTeamData,
          members: [
            {
              id: 'member-3',
              first_name: '',
              last_name: '',
              email: 'noname@example.com',
              team_role: 'Member',
              uuid: 'uuid-3',
            },
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useUserManagement.useUserManagement).toHaveBeenCalledWith(
          expect.objectContaining({
            initialMembers: expect.arrayContaining([
              expect.objectContaining({
                fullName: 'noname@example.com',
              }),
            ]),
          })
        );
      });
    });

    it('should use "Unknown" when no name or email', async () => {
      vi.mocked(useTeams.useTeamById).mockReturnValue({
        data: {
          ...mockTeamData,
          members: [
            {
              id: 'member-4',
              first_name: '',
              last_name: '',
              email: '',
              team_role: 'Member',
              uuid: 'uuid-4',
            },
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useUserManagement.useUserManagement).toHaveBeenCalledWith(
          expect.objectContaining({
            initialMembers: expect.arrayContaining([
              expect.objectContaining({
                fullName: 'Unknown',
              }),
            ]),
          })
        );
      });
    });

    it('should handle no members', async () => {
      vi.mocked(useTeams.useTeamById).mockReturnValue({
        data: {
          ...mockTeamData,
          members: undefined,
        },
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useUserManagement.useUserManagement).toHaveBeenCalledWith(
          expect.objectContaining({
            initialMembers: [],
          })
        );
      });
    });

    it('should preserve UUID for API operations', async () => {
      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useUserManagement.useUserManagement).toHaveBeenCalledWith(
          expect.objectContaining({
            initialMembers: expect.arrayContaining([
              expect.objectContaining({
                uuid: 'uuid-1',
              }),
            ]),
          })
        );
      });
    });
  });

  describe('Links Transformation', () => {
    it('should transform team links to expected format', async () => {
      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useTeamLinks.useTeamLinks).toHaveBeenCalledWith(
          expect.objectContaining({
            initialLinks: expect.arrayContaining([
              expect.objectContaining({
                id: 'link-1',
                name: 'Team Wiki',
                url: 'https://wiki.example.com',
                description: 'Team documentation',
                category_id: 'docs',
                tags: 'wiki,docs',
                favorite: true,
                isExpanded: false,
              }),
            ]),
          })
        );
      });
    });

    it('should handle string tags', async () => {
      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useTeamLinks.useTeamLinks).toHaveBeenCalledWith(
          expect.objectContaining({
            initialLinks: expect.arrayContaining([
              expect.objectContaining({
                id: 'link-2',
                tags: 'jira',
              }),
            ]),
          })
        );
      });
    });

    it('should handle missing link properties', async () => {
      vi.mocked(useTeams.useTeamById).mockReturnValue({
        data: {
          ...mockTeamData,
          links: [
            {
              id: 'link-3',
            },
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useTeamLinks.useTeamLinks).toHaveBeenCalledWith(
          expect.objectContaining({
            initialLinks: expect.arrayContaining([
              expect.objectContaining({
                id: 'link-3',
                category_id: 'general',
                description: '',
                name: 'Untitled',
                url: '',
                tags: '',
                favorite: false,
              }),
            ]),
          })
        );
      });
    });

    it('should handle no links', async () => {
      vi.mocked(useTeams.useTeamById).mockReturnValue({
        data: {
          ...mockTeamData,
          links: undefined,
        },
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useTeamLinks.useTeamLinks).toHaveBeenCalledWith(
          expect.objectContaining({
            initialLinks: [],
          })
        );
      });
    });

    it('should pass team owner to links hook', async () => {
      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useTeamLinks.useTeamLinks).toHaveBeenCalledWith(
          expect.objectContaining({
            teamOwner: 'owner@example.com',
          })
        );
      });
    });
  });

  describe('Hook Integration', () => {
    it('should initialize useUserManagement with callbacks', async () => {
      const onMembersChange = vi.fn();
      const onMoveMember = vi.fn();
      const teamNameToIdMap = vi.fn();

      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
            onMembersChange={onMembersChange}
            onMoveMember={onMoveMember}
            teamNameToIdMap={teamNameToIdMap}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useUserManagement.useUserManagement).toHaveBeenCalledWith(
          expect.objectContaining({
            onMembersChange,
            onMoveMember,
            teamNameToIdMap,
          })
        );
      });
    });

    it('should initialize jiraFiltering with team name', async () => {
      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useJiraFiltering.useJiraFiltering).toHaveBeenCalledWith({
          teamName: 'Engineering Team',
        });
      });
    });

    it('should initialize teamComponents with IDs', async () => {
      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useTeamComponents.useTeamComponents).toHaveBeenCalledWith({
          teamId: mockTeamId,
          organizationId: 'org-456',
        });
      });
    });

    it('should pass members and year to scheduleData', async () => {
      const currentYear = new Date().getFullYear();

      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useScheduleData.useScheduleData).toHaveBeenCalledWith(
          mockUserManagement.members,
          currentYear
        );
      });
    });

    it('should pass data to scoreboardData hook', async () => {
      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useScoreboardData.useScoreboardData).toHaveBeenCalledWith(
          expect.objectContaining({
            jiraIssues: [],
            githubStats: [],
            onDutyData: mockScheduleData,
            memberById: expect.any(Object),
            members: mockUserManagement.members,
            allTeams: [],
          })
        );
      });
    });
  });

  describe('Context Value Structure', () => {
    it('should provide all expected properties', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        // Team data
        expect(result.current).toHaveProperty('teamId');
        expect(result.current).toHaveProperty('teamName');
        expect(result.current).toHaveProperty('currentTeam');
        expect(result.current).toHaveProperty('teamOptions');
        
        // Members
        expect(result.current).toHaveProperty('members');
        expect(result.current).toHaveProperty('memberDialogOpen');
        expect(result.current).toHaveProperty('setMemberDialogOpen');
        expect(result.current).toHaveProperty('editingMember');
        expect(result.current).toHaveProperty('memberForm');
        expect(result.current).toHaveProperty('setMemberForm');
        expect(result.current).toHaveProperty('openAddMember');
        expect(result.current).toHaveProperty('openEditMember');
        expect(result.current).toHaveProperty('deleteMember');
        expect(result.current).toHaveProperty('moveMember');
        expect(result.current).toHaveProperty('createMember');
        
        // Jira filters
        expect(result.current).toHaveProperty('jiraFilters');
        
        // Team links
        expect(result.current).toHaveProperty('teamLinks');
        
        // Components
        expect(result.current).toHaveProperty('teamComponents');
        
        // Schedule
        expect(result.current).toHaveProperty('scheduleData');
        
        // Scoreboard
        expect(result.current).toHaveProperty('scoreboardData');
        
        // Authorization
        expect(result.current).toHaveProperty('isAdmin');
        
        // Loading
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('error');
      });
    });

    it('should provide jiraFilters with all properties', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.jiraFilters).toEqual({
          assigneeFilter: 'all',
          setAssigneeFilter: expect.any(Function),
          statusFilter: 'all',
          setStatusFilter: expect.any(Function),
          sortBy: 'updated',
          setSortBy: expect.any(Function),
          search: '',
          setSearch: expect.any(Function),
          quickFilter: 'all',
          setQuickFilter: expect.any(Function),
          currentPage: 1,
          setCurrentPage: expect.any(Function),
          totalPages: 5,
          totalItems: 50,
          itemsPerPage: 10,
          filteredIssues: [],
          isLoading: false,
          error: null,
        });
      });
    });

    it('should provide teamLinks with all properties', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.teamLinks).toEqual({
          links: [],
          linkDialogOpen: false,
          onLinkDialogOpenChange: expect.any(Function),
          removeLink: expect.any(Function),
          setLinks: expect.any(Function),
          toggleFavorite: expect.any(Function),
        });
      });
    });

    it('should provide onOpenComponent callback', async () => {
      const onOpenComponent = vi.fn();

      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
            onOpenComponent={onOpenComponent}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.onOpenComponent).toBe(onOpenComponent);
      });
    });
  });

  describe('Loading State', () => {

    it('should pass loading state to context', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Authorization', () => {
    it('should provide admin status', async () => {
      vi.mocked(useTeamAuthorization.useTeamAuthorization).mockReturnValue({
        isAdmin: true,
      });

      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });
    });

    it('should default to non-admin', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(false);
      });
    });
  });

  describe('Member By ID Map', () => {
    it('should create memberById map for scoreboard', async () => {
      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useScoreboardData.useScoreboardData).toHaveBeenCalledWith(
          expect.objectContaining({
            memberById: expect.objectContaining({
              'member-1': expect.objectContaining({
                id: 'member-1',
                fullName: 'John Doe',
              }),
              'member-2': expect.objectContaining({
                id: 'member-2',
                fullName: 'Jane Smith',
              }),
            }),
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle organization ID from multiple sources', async () => {
      // Test with teamData having organization_id
      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useTeamComponents.useTeamComponents).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: 'org-456',
          })
        );
      });
    });

    it('should fallback to currentTeam organization_id', async () => {
      vi.mocked(useTeams.useTeamById).mockReturnValue({
        data: {
          ...mockTeamData,
          organization_id: undefined,
        },
        isLoading: false,
        error: null,
      } as any);

      renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={mockTeamOptions}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(useTeamComponents.useTeamComponents).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: 'org-456',
          })
        );
      });
    });

    it('should handle team with empty options', async () => {
      const { result } = renderHook(() => useTeamContext(), {
        wrapper: ({ children }) => (
          <TeamProvider
            teamId={mockTeamId}
            teamName={mockTeamName}
            currentTeam={mockCurrentTeam}
            teamOptions={[]}
          >
            {children}
          </TeamProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.teamOptions).toEqual([]);
      });
    });
  });
});