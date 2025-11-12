import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the context and hook to test
import { TeamProvider, useTeamContext } from '../../src/contexts/TeamContext';

// Import types
import type { Team as ApiTeam } from '../../src/types/api';
import type { Member } from '../../src/hooks/useOnDutyData';
import type { TeamLink } from '../../src/components/Team/types';

/**
 * TeamContext Tests
 * 
 * Comprehensive tests for the TeamContext provider and hook including:
 * - Context value composition from multiple hooks
 * - Loading and error states
 * - Hook integration and data flow
 * - Edge cases and error handling
 */

// ============================================================================
// MOCKS
// ============================================================================

// Mock all the hooks used by TeamProvider
vi.mock('../../src/hooks/api/useTeams', () => ({
  useTeamById: vi.fn(),
}));

vi.mock('../../src/hooks/team/useUserManagement', () => ({
  useUserManagement: vi.fn(),
}));

vi.mock('../../src/hooks/team/useJiraFiltering', () => ({
  useJiraFiltering: vi.fn(),
}));

vi.mock('../../src/hooks/team/useTeamLinks', () => ({
  useTeamLinks: vi.fn(),
}));

vi.mock('../../src/hooks/team/useTeamComponents', () => ({
  useTeamComponents: vi.fn(),
}));

vi.mock('../../src/hooks/team/useTeamAuthorization', () => ({
  useTeamAuthorization: vi.fn(),
}));

vi.mock('../../src/hooks/team/useScoreboardData', () => ({
  useScoreboardData: vi.fn(),
}));

vi.mock('../../src/hooks/useScheduleData', () => ({
  useScheduleData: vi.fn(),
}));

// Import the mocked modules to get typed access to the mock functions
import { useTeamById } from '../../src/hooks/api/useTeams';
import { useUserManagement } from '../../src/hooks/team/useUserManagement';
import { useJiraFiltering } from '../../src/hooks/team/useJiraFiltering';
import { useTeamLinks } from '../../src/hooks/team/useTeamLinks';
import { useTeamComponents } from '../../src/hooks/team/useTeamComponents';
import { useTeamAuthorization } from '../../src/hooks/team/useTeamAuthorization';
import { useScoreboardData } from '../../src/hooks/team/useScoreboardData';
import { useScheduleData } from '../../src/hooks/useScheduleData';

// Cast to mock functions
const mockUseTeamById = useTeamById as ReturnType<typeof vi.fn>;
const mockUseUserManagement = useUserManagement as ReturnType<typeof vi.fn>;
const mockUseJiraFiltering = useJiraFiltering as ReturnType<typeof vi.fn>;
const mockUseTeamLinks = useTeamLinks as ReturnType<typeof vi.fn>;
const mockUseTeamComponents = useTeamComponents as ReturnType<typeof vi.fn>;
const mockUseTeamAuthorization = useTeamAuthorization as ReturnType<typeof vi.fn>;
const mockUseScoreboardData = useScoreboardData as ReturnType<typeof vi.fn>;
const mockUseScheduleData = useScheduleData as ReturnType<typeof vi.fn>;

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Mock data factories
const createMockApiTeam = (overrides?: Partial<ApiTeam>): ApiTeam => ({
  id: 'team-123',
  name: 'Test Team',
  organization_id: 'org-123',
  owner: 'owner-123',
  created_at: '2024-01-01T00:00:00Z',
  description: 'Test team description',
  email: 'test@example.com',
  group_id: 'group-123',
  links: [],
  members: [],
  metadata: {},
  picture_url: '',
  title: 'Test Team',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockMember = (overrides?: Partial<Member>): Member => ({
  id: 'member-123',
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'Developer',
  iuser: 'jdoe',
  avatar: '',
  team: 'Test Team',
  ...overrides,
});

const createMockTeamLink = (overrides?: Partial<TeamLink>): TeamLink => ({
  id: 'link-123',
  name: 'Documentation',
  url: 'https://docs.example.com',
  category_id: 'docs',
  description: 'Team documentation',
  owner: 'Test Team',
  tags: 'docs,help',
  favorite: false,
  ...overrides,
});

// Default mock implementations
const getDefaultMockImplementations = () => ({
  useTeamById: {
    data: createMockApiTeam(),
    isLoading: false,
    error: null,
  },
  useUserManagement: {
    members: [createMockMember()],
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
  },
  useJiraFiltering: {
    assigneeFilter: 'all',
    setAssigneeFilter: vi.fn(),
    statusFilter: 'all',
    setStatusFilter: vi.fn(),
    sortBy: 'updated_desc',
    setSortBy: vi.fn(),
    search: '',
    setSearch: vi.fn(),
    quickFilter: 'both',
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
  useTeamLinks: {
    links: [createMockTeamLink()],
    linkDialogOpen: false,
    onLinkDialogOpenChange: vi.fn(),
    removeLink: vi.fn(),
    setLinks: vi.fn(),
    toggleFavorite: vi.fn(),
  },
  useTeamComponents: {
    componentsData: { components: [] },
    teamComponentsExpanded: {},
    toggleComponentExpansion: vi.fn(),
  },
  useTeamAuthorization: {
    isAdmin: true,
  },
  useScoreboardData: {
    jiraTop3: [],
    gitTop3: [],
    dutyTop3: [],
    crossTeamRows: [],
    SCORE_WEIGHTS: {},
  },
  useScheduleData: {
    todayAssignments: {
      dayMember: null,
      nightMember: null,
    },
  },
});

const setupDefaultMocks = () => {
  const mocks = getDefaultMockImplementations();
  
  mockUseTeamById.mockReturnValue(mocks.useTeamById);
  mockUseUserManagement.mockReturnValue(mocks.useUserManagement);
  mockUseJiraFiltering.mockReturnValue(mocks.useJiraFiltering);
  mockUseTeamLinks.mockReturnValue(mocks.useTeamLinks);
  mockUseTeamComponents.mockReturnValue(mocks.useTeamComponents);
  mockUseTeamAuthorization.mockReturnValue(mocks.useTeamAuthorization);
  mockUseScoreboardData.mockReturnValue(mocks.useScoreboardData);
  mockUseScheduleData.mockReturnValue(mocks.useScheduleData);
  
  return mocks;
};

// Default props for TeamProvider
const getDefaultTeamProviderProps = () => ({
  teamId: 'team-123',
  teamName: 'Test Team',
  currentTeam: createMockApiTeam(),
  teamOptions: ['Team A', 'Team B', 'Test Team'],
  onMembersChange: vi.fn(),
  onMoveMember: vi.fn(),
  teamNameToIdMap: vi.fn(),
});

// Test component that uses the context
const TestConsumer = () => {
  const context = useTeamContext();
  return (
    <div data-testid="test-consumer">
      <div data-testid="team-id">{context.teamId}</div>
      <div data-testid="team-name">{context.teamName}</div>
      <div data-testid="members-count">{context.members.length}</div>
      <div data-testid="is-admin">{context.isAdmin.toString()}</div>
      <div data-testid="is-loading">{context.isLoading.toString()}</div>
    </div>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('TeamContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // BASIC FUNCTIONALITY TESTS
  // ============================================================================

  describe('TeamProvider Basic Functionality', () => {
    it('should provide context value to consumers', () => {
      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('team-id')).toHaveTextContent('team-123');
      expect(screen.getByTestId('team-name')).toHaveTextContent('Test Team');
      expect(screen.getByTestId('members-count')).toHaveTextContent('1');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    it('should pass correct props to hooks', () => {
      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      // Verify useTeamById was called with correct teamId
      expect(mockUseTeamById).toHaveBeenCalledWith('team-123', {
        enabled: true,
      });

      // Verify useJiraFiltering was called with correct team name
      expect(mockUseJiraFiltering).toHaveBeenCalledWith({
        teamName: 'Test Team',
      });

      // Verify useTeamLinks was called with correct parameters
      expect(mockUseTeamLinks).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-123',
          teamOwner: 'owner-123',
        })
      );
    });

    it('should compose context value correctly from all hooks', () => {
      const props = getDefaultTeamProviderProps();
      
      const { result } = renderHook(
        () => useTeamContext(),
        {
          wrapper: ({ children }) => (
            <TeamProvider {...props}>
              {children}
            </TeamProvider>
          ),
        }
      );

      const contextValue = result.current;

      // Verify all sections of the context value are present
      expect(contextValue).toHaveProperty('teamId', 'team-123');
      expect(contextValue).toHaveProperty('teamName', 'Test Team');
      expect(contextValue).toHaveProperty('members');
      expect(contextValue).toHaveProperty('jiraFilters');
      expect(contextValue).toHaveProperty('teamLinks');
      expect(contextValue).toHaveProperty('teamComponents');
      expect(contextValue).toHaveProperty('scheduleData');
      expect(contextValue).toHaveProperty('scoreboardData');
      expect(contextValue).toHaveProperty('isAdmin');
      expect(contextValue).toHaveProperty('isLoading');
      expect(contextValue).toHaveProperty('error');
    });
  });

  // ============================================================================
  // LOADING STATES TESTS
  // ============================================================================

  describe('Loading States', () => {
    it('should display loading UI when team data is loading', () => {
      mockUseTeamById.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Loading team data...')).toBeInTheDocument();
      // Check for the loading spinner by class instead of role
      expect(screen.getByText('Loading team data...').previousElementSibling).toHaveClass('animate-spin');
      expect(screen.queryByTestId('test-consumer')).not.toBeInTheDocument();
    });

    it('should still show loading UI even when team data is available if loading is true', () => {
      // The implementation shows loading UI when teamLoading is true, regardless of data
      mockUseTeamById.mockReturnValue({
        data: createMockApiTeam(),
        isLoading: true,
        error: null,
      });

      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      // Should show loading UI since teamLoading is true (early return)
      expect(screen.getByText('Loading team data...')).toBeInTheDocument();
      expect(screen.queryByTestId('test-consumer')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR STATES TESTS
  // ============================================================================

  describe('Error States', () => {
    it('should display error UI when team data fetch fails', () => {
      const error = new Error('Failed to fetch team data');
      mockUseTeamById.mockReturnValue({
        data: null,
        isLoading: false,
        error,
      });

      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Error loading team data: Failed to fetch team data')).toBeInTheDocument();
      expect(screen.queryByTestId('test-consumer')).not.toBeInTheDocument();
    });

    it('should pass error state to context when no early return occurs', () => {
      // Test error state when there's no early return (no teamError in this case)
      const error = new Error('API Error');
      mockUseTeamById.mockReturnValue({
        data: createMockApiTeam(),
        isLoading: false,
        error: null, // No team error, so context will be provided
      });
      
      // Mock jira filtering to have an error instead
      mockUseJiraFiltering.mockReturnValue({
        ...getDefaultMockImplementations().useJiraFiltering,
        error,
      });

      const props = getDefaultTeamProviderProps();
      
      const { result } = renderHook(
        () => useTeamContext(),
        {
          wrapper: ({ children }) => (
            <TeamProvider {...props}>
              {children}
            </TeamProvider>
          ),
        }
      );

      // The error from useTeamById should be null, but jira error should be in jiraFilters
      expect(result.current.error).toBe(null);
      expect(result.current.jiraFilters.error).toBe(error);
    });
  });

  // ============================================================================
  // DATA TRANSFORMATION TESTS
  // ============================================================================

  describe('Data Transformation', () => {
    it('should transform team members to expected format', () => {
      const mockTeamData = createMockApiTeam({
        members: [
          {
            id: 'member-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            team_role: 'Developer',
            iuser: 'jdoe',
          } as any,
          {
            id: 'member-2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            team_role: 'Manager',
            iuser: 'jsmith',
          } as any,
        ],
      });

      mockUseTeamById.mockReturnValue({
        data: mockTeamData,
        isLoading: false,
        error: null,
      });

      const expectedMember1 = {
        id: 'member-1',
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'Developer',
        iuser: 'jdoe',
        team: 'Test Team',
      };

      // Verify useUserManagement is called with transformed members
      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      expect(mockUseUserManagement).toHaveBeenCalledWith(
        expect.objectContaining({
          initialMembers: expect.arrayContaining([
            expect.objectContaining(expectedMember1),
          ]),
        })
      );
    });

    it('should handle members with missing names gracefully', () => {
      const mockTeamData = createMockApiTeam({
        members: [
          {
            id: 'member-1',
            first_name: '',
            last_name: '',
            email: 'john@example.com',
            team_role: 'Developer',
          } as any,
          {
            id: 'member-2',
            first_name: 'Jane',
            last_name: '',
            email: 'jane@example.com',
            team_role: 'Manager',
          } as any,
        ],
      });

      mockUseTeamById.mockReturnValue({
        data: mockTeamData,
        isLoading: false,
        error: null,
      });

      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      expect(mockUseUserManagement).toHaveBeenCalledWith(
        expect.objectContaining({
          initialMembers: expect.arrayContaining([
            expect.objectContaining({
              fullName: 'john@example.com', // Falls back to email
            }),
            expect.objectContaining({
              fullName: 'Jane', // Uses first name only
            }),
          ]),
        })
      );
    });

    it('should transform team links to expected format', () => {
      const mockTeamData = createMockApiTeam({
        links: [
          {
            id: 'link-1',
            name: 'Documentation',
            url: 'https://docs.example.com',
            description: 'Team docs',
            category_id: 'docs',
            tags: ['documentation', 'help'],
          } as any,
        ],
      });

      mockUseTeamById.mockReturnValue({
        data: mockTeamData,
        isLoading: false,
        error: null,
      });

      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      expect(mockUseTeamLinks).toHaveBeenCalledWith(
        expect.objectContaining({
          initialLinks: expect.arrayContaining([
            expect.objectContaining({
              id: 'link-1',
              name: 'Documentation',
              url: 'https://docs.example.com',
              description: 'Team docs',
              category_id: 'docs',
              tags: 'documentation,help', // Array converted to string
              owner: 'Test Team',
              favorite: false, // Include favorite field
            }),
          ]),
        })
      );
    });

    it('should handle empty or missing team data gracefully', () => {
      mockUseTeamById.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      // Should use currentTeam from props when team data is null
      expect(screen.getByTestId('team-name')).toHaveTextContent('Test Team');
    });
  });

  // ============================================================================
  // HOOK INTEGRATION TESTS
  // ============================================================================

  describe('Hook Integration', () => {
    it('should pass current year to useScheduleData', () => {
      const currentYear = new Date().getFullYear();
      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      expect(mockUseScheduleData).toHaveBeenCalledWith(
        expect.any(Array), // members
        currentYear
      );
    });
  });


  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing teamId gracefully', () => {
      const props = {
        ...getDefaultTeamProviderProps(),
        teamId: '',
      };
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      // Should call useTeamById with empty teamId and enabled: false
      expect(mockUseTeamById).toHaveBeenCalledWith('', {
        enabled: false,
      });
    });

    it('should handle missing currentTeam gracefully', () => {
      const props = {
        ...getDefaultTeamProviderProps(),
        currentTeam: null,
      };
      
      const { result } = renderHook(
        () => useTeamContext(),
        {
          wrapper: ({ children }) => (
            <TeamProvider {...props}>
              {children}
            </TeamProvider>
          ),
        }
      );

      // Should still provide context value
      expect(result.current.teamName).toBe('Test Team');
      expect(result.current.currentTeam).toBeDefined(); // Should use teamData
    });

    it('should handle empty teamOptions array', () => {
      const props = {
        ...getDefaultTeamProviderProps(),
        teamOptions: [],
      };
      
      const { result } = renderHook(
        () => useTeamContext(),
        {
          wrapper: ({ children }) => (
            <TeamProvider {...props}>
              {children}
            </TeamProvider>
          ),
        }
      );

      expect(result.current.teamOptions).toEqual([]);
    });

    it('should create memberById map correctly', () => {
      const members = [
        createMockMember({ id: 'member-1', fullName: 'John Doe' }),
        createMockMember({ id: 'member-2', fullName: 'Jane Smith' }),
      ];

      mockUseUserManagement.mockReturnValue({
        ...getDefaultMockImplementations().useUserManagement,
        members,
      });

      const props = getDefaultTeamProviderProps();
      
      render(
        <TeamProvider {...props}>
          <TestConsumer />
        </TeamProvider>,
        { wrapper: createWrapper() }
      );

      // Verify the memberById map is passed correctly to useScoreboardData
      expect(mockUseScoreboardData).toHaveBeenCalledWith(
        expect.objectContaining({
          memberById: {
            'member-1': members[0],
            'member-2': members[1],
          },
        })
      );
    });
  });

  // ============================================================================
  // HOOK USAGE ERROR TESTS
  // ============================================================================

  describe('Hook Usage Errors', () => {
    it('should throw error when useTeamContext is used outside TeamProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useTeamContext());
      }).toThrow('useTeamContext must be used within a TeamProvider');
      
      consoleSpy.mockRestore();
    });

    it('should not throw error when useTeamContext is used within TeamProvider', () => {
      const props = getDefaultTeamProviderProps();
      
      expect(() => {
        renderHook(
          () => useTeamContext(),
          {
            wrapper: ({ children }) => (
              <TeamProvider {...props}>
                {children}
              </TeamProvider>
            ),
          }
        );
      }).not.toThrow();
    });
  });

  // ============================================================================
  // PROP CHANGES TESTS
  // ============================================================================

  describe('Prop Changes', () => {
    it('should update context values when props change', () => {
      let currentProps = getDefaultTeamProviderProps();
      
      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <TeamProvider {...currentProps}>
          {children}
        </TeamProvider>
      );

      const { result, rerender } = renderHook(
        () => useTeamContext(),
        {
          wrapper: Wrapper,
        }
      );

      expect(result.current.teamId).toBe('team-123');
      expect(result.current.teamName).toBe('Test Team');

      // Change props by updating the current props and rerendering
      currentProps = {
        ...currentProps,
        teamId: 'team-456',
        teamName: 'New Team',
      };

      rerender();

      expect(result.current.teamId).toBe('team-456');
      expect(result.current.teamName).toBe('New Team');
    });
  });
});
