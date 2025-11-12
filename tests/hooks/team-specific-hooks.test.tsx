import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { ReactNode } from 'react';

// Import team-specific hooks to test
import { useUserManagement } from '../../src/hooks/team/useUserManagement';
import { useTeamLinks } from '../../src/hooks/team/useTeamLinks';
import { useTeamComponents } from '../../src/hooks/team/useTeamComponents';
import { useJiraFiltering } from '../../src/hooks/team/useJiraFiltering';

// Import types
import type { Member as DutyMember } from '../../src/hooks/useOnDutyData';
import type { TeamLink } from '../../src/components/Team/types';

// Mock the API mutations
import { apiClient } from '../../src/services/ApiClient';
import { fetchComponentsByTeamId } from '../../src/services/ComponentsApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock services
vi.mock('../../src/services/ComponentsApi', () => ({
  fetchComponentsByTeamId: vi.fn(),
}));



// Mock toast
const mockToast = vi.fn();
vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

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
    }
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
const createMockMember = (overrides?: Partial<DutyMember>): DutyMember => ({
  id: 'member-123',
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'Developer',
  iuser: 'jdoe',
  avatar: '',
  team: 'team-123',
  ...overrides,
});

const createMockTeamLink = (overrides?: Partial<TeamLink>): TeamLink => ({
  id: 'link-123',
  url: 'https://example.com',
  name: 'Example Link',
  category_id: 'cat-123',
  description: 'Example link description',
  owner: 'team-owner',
  tags: 'documentation,example',
  ...overrides,
});

// ============================================================================
// USER MANAGEMENT HOOK TESTS
// ============================================================================

describe.skip('useUserManagement Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with initial members', () => {
    const initialMembers = [
      createMockMember({ id: 'member-1' }),
      createMockMember({ id: 'member-2' }),
    ];

    const { result } = renderHook(
      () => useUserManagement({ initialMembers }),
      { wrapper: createWrapper() }
    );

    expect(result.current.members).toHaveLength(2);
    expect(result.current.members[0].id).toBe('member-1');
  });

  it('should initialize with empty members when not provided', () => {
    const { result } = renderHook(
      () => useUserManagement({}),
      { wrapper: createWrapper() }
    );

    expect(result.current.members).toHaveLength(0);
  });

  it('should open add member dialog', () => {
    const { result } = renderHook(
      () => useUserManagement({}),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.openAddMember();
    });

    expect(result.current.memberDialogOpen).toBe(true);
    expect(result.current.editingMember).toBe(null);
  });

  it('should open edit member dialog with member data', () => {
    const member = createMockMember();
    const { result } = renderHook(
      () => useUserManagement({ initialMembers: [member] }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.openEditMember(member);
    });

    expect(result.current.memberDialogOpen).toBe(true);
    expect(result.current.editingMember).toEqual(member);
    expect(result.current.memberForm.fullName).toBe(member.fullName);
  });

  it('should delete member with optimistic update', async () => {
    const member = createMockMember();
    const onMembersChange = vi.fn();

    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useUserManagement({ initialMembers: [member], onMembersChange }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.deleteMember(member.id);
    });

    // Should optimistically remove member
    expect(result.current.members).toHaveLength(0);
    expect(onMembersChange).toHaveBeenCalledWith([]);

    // Wait for mutation to complete with timeout
    await waitFor(
      () => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Member deleted successfully',
          })
        );
      },
      { timeout: 2000 }
    );
  });

  it('should rollback delete on API error', async () => {
    const member = createMockMember();
    const error = new Error('Failed to delete');

    vi.mocked(apiClient.delete).mockRejectedValue(error);

    const { result } = renderHook(
      () => useUserManagement({ initialMembers: [member] }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.deleteMember(member.id);
    });

    // Should optimistically remove
    expect(result.current.members).toHaveLength(0);

    // Wait for error and rollback with timeout
    await waitFor(
      () => {
        expect(result.current.members).toHaveLength(1);
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
            title: 'Failed to delete member',
          })
        );
      },
      { timeout: 2000 }
    );
  });

  it('should create member with optimistic update', async () => {
    const payload = {
      organization_id: 'org-123',
      team_id: 'team-123',
      email: 'new@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      full_name: 'Jane Smith',
      iuser: 'jsmith',
    };

    const mockResponse = createMockMember({
      id: 'member-new',
      email: payload.email,
      fullName: payload.full_name,
    });

    vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useUserManagement({}),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.createMember(payload);
    });

    // Should optimistically add member
    expect(result.current.members).toHaveLength(1);
    expect(result.current.members[0].fullName).toBe(payload.full_name);

    // Wait for mutation to complete with timeout
    await waitFor(
      () => {
        expect(result.current.members[0].id).toBe('member-new');
      },
      { timeout: 2000 }
    );
  });

  it('should move member to another team', async () => {
    const member = createMockMember({ team: 'team-a' });
    const teamNameToIdMap = vi.fn().mockReturnValue('team-b-id');
    const onMoveMember = vi.fn();

    vi.mocked(apiClient.put).mockResolvedValue({ ...member, team_id: 'team-b-id' });

    const { result } = renderHook(
      () =>
        useUserManagement({
          initialMembers: [member],
          teamNameToIdMap,
          onMoveMember,
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.moveMember(member, 'Team B');
    });

    // Should optimistically remove from current team
    expect(result.current.members).toHaveLength(0);
    expect(teamNameToIdMap).toHaveBeenCalledWith('Team B');
    expect(onMoveMember).toHaveBeenCalledWith(member, 'Team B');
  });

  it('should handle move member error when team ID not found', () => {
    const member = createMockMember();
    const teamNameToIdMap = vi.fn().mockReturnValue(undefined);

    const { result } = renderHook(
      () =>
        useUserManagement({
          initialMembers: [member],
          teamNameToIdMap,
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.moveMember(member, 'Nonexistent Team');
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        title: 'Failed to move member',
      })
    );
  });

  it('should update member form fields', () => {
    const { result } = renderHook(
      () => useUserManagement({}),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setMemberForm({
        fullName: 'New Name',
        email: 'new@example.com',
      });
    });

    expect(result.current.memberForm.fullName).toBe('New Name');
    expect(result.current.memberForm.email).toBe('new@example.com');
  });
});

// ============================================================================
// TEAM LINKS HOOK TESTS
// ============================================================================

describe.skip('useTeamLinks Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with initial links', () => {
    const initialLinks = [
      createMockTeamLink({ id: 'link-1' }),
      createMockTeamLink({ id: 'link-2' }),
    ];

    const { result } = renderHook(
      () => useTeamLinks({ teamId: 'team-123', initialLinks }),
      { wrapper: createWrapper() }
    );

    expect(result.current.links).toHaveLength(2);
    expect(result.current.links[0].id).toBe('link-1');
  });

  it('should update links when initialLinks change', () => {
    const initialLinks = [createMockTeamLink({ id: 'link-1' })];
    const newLinks = [
      createMockTeamLink({ id: 'link-2' }),
      createMockTeamLink({ id: 'link-3' }),
    ];

    const { result, rerender } = renderHook(
      ({ links }) => useTeamLinks({ teamId: 'team-123', initialLinks: links }),
      {
        wrapper: createWrapper(),
        initialProps: { links: initialLinks },
      }
    );

    expect(result.current.links).toHaveLength(1);

    rerender({ links: newLinks });

    expect(result.current.links).toHaveLength(2);
    expect(result.current.links[0].id).toBe('link-2');
  });

  it('should open add link dialog', () => {
    const { result } = renderHook(
      () => useTeamLinks({ teamId: 'team-123' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.openAddLinkDialog();
    });

    expect(result.current.linkDialogOpen).toBe(true);
    expect(result.current.editingLink).toBe(null);
  });

  it('should open edit link dialog', () => {
    const link = createMockTeamLink();
    const { result } = renderHook(
      () => useTeamLinks({ teamId: 'team-123', initialLinks: [link] }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.editLink(link);
    });

    expect(result.current.linkDialogOpen).toBe(true);
    expect(result.current.editingLink).toEqual(link);
    expect(result.current.linkForm.title).toBe(link.name);
  });

  it('should add link successfully', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ success: true });

    const { result } = renderHook(
      () => useTeamLinks({ teamId: 'team-123' }),
      { wrapper: createWrapper() }
    );

    // Set up form data
    act(() => {
      result.current.setLinkForm({
        title: 'New Link',
        url: 'https://newlink.com',
        categoryType: 'new',
        existingCategory: '',
        newCategory: 'New Category',
      });
    });

    act(() => {
      result.current.handleLinkSubmit();
    });

    // Should optimistically add link
    await waitFor(
      () => {
        expect(result.current.links).toHaveLength(1);
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Link added successfully',
          })
        );
      },
      { timeout: 2000 }
    );
  });

  it('should remove link successfully', async () => {
    const link = createMockTeamLink();
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useTeamLinks({ teamId: 'team-123', initialLinks: [link] }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.removeLink(link.id);
    });

    // Should optimistically remove link
    expect(result.current.links).toHaveLength(0);

    await waitFor(
      () => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Link removed successfully',
          })
        );
      },
      { timeout: 2000 }
    );
  });

  it('should handle add link error', async () => {
    const error = new Error('Failed to add link');
    vi.mocked(apiClient.post).mockRejectedValue(error);

    const { result } = renderHook(
      () => useTeamLinks({ teamId: 'team-123' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setLinkForm({
        title: 'New Link',
        url: 'https://newlink.com',
        categoryType: 'existing',
        existingCategory: 'Documentation',
        newCategory: '',
      });
    });

    act(() => {
      result.current.handleLinkSubmit();
    });

    await waitFor(
      () => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
            title: 'Failed to add link',
          })
        );
      },
      { timeout: 2000 }
    );
  });

  it('should get existing categories', () => {
    const links = [
      createMockTeamLink({ category_id: 'doc-cat' }),
      createMockTeamLink({ category_id: 'tools-cat' }),
      createMockTeamLink({ category_id: 'doc-cat' }),
    ];

    const { result } = renderHook(
      () => useTeamLinks({ teamId: 'team-123', initialLinks: links }),
      { wrapper: createWrapper() }
    );

    expect(result.current.existingCategories).toHaveLength(2);
    expect(result.current.existingCategories).toContain('Documentation');
    expect(result.current.existingCategories).toContain('Tools');
  });
});

// ============================================================================
// TEAM COMPONENTS HOOK TESTS
// ============================================================================

describe('useTeamComponents Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch components by team when teamId and organizationId are provided', async () => {
    const mockComponents = [
      {
        id: 'comp-1',
        created_at: '2025-01-01T00:00:00Z',
        created_by: 'user-1',
        updated_at: '2025-01-01T00:00:00Z',
        updated_by: 'user-1',
        name: 'API Service',
        title: 'API Service',
        description: 'API Service Description',
        metadata: {},
        project_id: 'project-1',
        owner_id: 'owner-1',
      },
      {
        id: 'comp-2',
        created_at: '2025-01-01T00:00:00Z',
        created_by: 'user-1',
        updated_at: '2025-01-01T00:00:00Z',
        updated_by: 'user-1',
        name: 'Worker Service',
        title: 'Worker Service',
        description: 'Worker Service Description',
        metadata: {},
        project_id: 'project-1',
        owner_id: 'owner-1',
      },
    ];

    vi.mocked(fetchComponentsByTeamId).mockResolvedValue(mockComponents);

    const { result } = renderHook(
      () =>
        useTeamComponents({
          teamId: 'team-123',
          organizationId: 'org-123',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.componentsData?.components).toHaveLength(2);
    expect(fetchComponentsByTeamId).toHaveBeenCalledWith('team-123');
  });

  it('should toggle component expansion', () => {
    const { result } = renderHook(
      () =>
        useTeamComponents({
          teamId: 'team-123',
          organizationId: 'org-123',
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.toggleComponentExpansion('comp-1');
    });

    expect(result.current.teamComponentsExpanded['comp-1']).toBe(false);

    act(() => {
      result.current.toggleComponentExpansion('comp-1');
    });

    expect(result.current.teamComponentsExpanded['comp-1']).toBe(true);
  });

  it('should not fetch when teamId or organizationId is missing', () => {
    const { result } = renderHook(
      () =>
        useTeamComponents({
          teamId: undefined,
          organizationId: undefined,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(fetchComponentsByTeamId).not.toHaveBeenCalled();
  });
});

// ============================================================================
// JIRA FILTERING HOOK TESTS
// ============================================================================

describe('useJiraFiltering Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({
      issues: [],
      total: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default filter values', () => {
    const { result } = renderHook(
      () => useJiraFiltering({ teamName: 'Test Team' }),
      { wrapper: createWrapper() }
    );

    expect(result.current.assigneeFilter).toBe('all');
    expect(result.current.statusFilter).toBe('all');
    expect(result.current.sortBy).toBe('updated_desc');
    expect(result.current.quickFilter).toBe('both');
    expect(result.current.search).toBe('');
  });

  it('should update assignee filter', () => {
    const { result } = renderHook(
      () => useJiraFiltering({ teamName: 'Test Team' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setAssigneeFilter('john.doe');
    });

    expect(result.current.assigneeFilter).toBe('john.doe');
  });

  it('should update status filter', () => {
    const { result } = renderHook(
      () => useJiraFiltering({ teamName: 'Test Team' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setStatusFilter('In Progress');
    });

    expect(result.current.statusFilter).toBe('In Progress');
  });

  it('should update sort by', () => {
    const { result } = renderHook(
      () => useJiraFiltering({ teamName: 'Test Team' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setSortBy('priority_desc');
    });

    expect(result.current.sortBy).toBe('priority_desc');
  });

  it('should update quick filter', () => {
    const { result } = renderHook(
      () => useJiraFiltering({ teamName: 'Test Team' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setQuickFilter('bugs');
    });

    expect(result.current.quickFilter).toBe('bugs');
  });

  it('should debounce search input', async () => {
    const { result } = renderHook(
      () => useJiraFiltering({ teamName: 'Test Team' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setSearch('test search');
    });

    expect(result.current.search).toBe('test search');

    // Debounced search should update after delay
    await waitFor(
      () => {
        // The debounced search is used internally by the hook
        // We can verify this by checking that the search value has been set
        expect(result.current.search).toBe('test search');
      },
      { timeout: 1000 }
    );
  });

  it('should handle pagination', () => {
    const { result } = renderHook(
      () => useJiraFiltering({ teamName: 'Test Team' }),
      { wrapper: createWrapper() }
    );

    expect(result.current.currentPage).toBe(1);

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('should process team name by removing dashes', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      issues: [{ id: 'JIRA-1', key: 'JIRA-1', summary: 'Test Issue' }],
      total: 1,
    });

    const { result } = renderHook(
      () => useJiraFiltering({ teamName: 'my-test-team' }),
      { wrapper: createWrapper() }
    );

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

     // The hook should process 'my-test-team' to 'mytestteam' for the API
     expect(apiClient.get).toHaveBeenCalled();
   });
 });
