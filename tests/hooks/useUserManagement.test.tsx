import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Import the hook to test
import { useUserManagement } from '../../src/hooks/team/useUserManagement';

// Import types
import type { Member as DutyMember } from '../../src/hooks/useOnDutyData';

// Mock dependencies with direct implementations
vi.mock('../../src/hooks/api/mutations/useMemberMutations', () => ({
  useDeleteMember: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
  useUpdateUserTeam: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
  useCreateUser: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../src/hooks/useAuthWithRole', () => ({
  useAuthWithRole: () => ({
    memberData: {
      id: 'current-user-123',
      uuid: 'current-uuid-123',
      team_id: 'team-123',
      first_name: 'Current',
      last_name: 'User',
      email: 'current@example.com',
    },
    memberError: null,
  }),
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
const createMockMember = (overrides?: Partial<DutyMember>): DutyMember => ({
  id: 'member-123',
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'Developer',
  iuser: 'jdoe',
  avatar: '',
  team: 'team-123',
  uuid: 'uuid-123',
  ...overrides,
});

// No need for setupDefaultMocks since mocks are directly implemented

// ============================================================================
// TESTS
// ============================================================================

describe('useUserManagement Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
    queryClient.getQueryCache().clear();
    queryClient.getMutationCache().clear();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default state', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useUserManagement({}),
        { wrapper }
      );

      expect(result.current.members).toEqual([]);
      expect(result.current.memberDialogOpen).toBe(false);
      expect(result.current.editingMember).toBe(null);
      expect(result.current.memberForm).toEqual({
        fullName: '',
        email: '',
        role: '',
        avatar: '',
        team: ''
      });
    }, 5000);

    it('should open add member dialog', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useUserManagement({}),
        { wrapper }
      );

      act(() => {
        result.current.openAddMember();
      });

      expect(result.current.memberDialogOpen).toBe(true);
      expect(result.current.editingMember).toBe(null);
    }, 5000);

    it('should set member dialog open state', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useUserManagement({}),
        { wrapper }
      );

      act(() => {
        result.current.setMemberDialogOpen(true);
      });

      expect(result.current.memberDialogOpen).toBe(true);

      act(() => {
        result.current.setMemberDialogOpen(false);
      });

      expect(result.current.memberDialogOpen).toBe(false);
    }, 5000);

    it('should update member form', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useUserManagement({}),
        { wrapper }
      );

      const newFormData = {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        role: 'Manager',
        avatar: 'https://example.com/avatar.jpg',
        team: 'team-456'
      };

      act(() => {
        result.current.setMemberForm(newFormData);
      });

      expect(result.current.memberForm).toEqual(newFormData);
    }, 5000);
  });

  describe('Static Member Operations', () => {
    it('should initialize with initial members', () => {
      // Create stable references to avoid infinite re-renders
      const member1 = createMockMember({ id: 'member-1' });
      const member2 = createMockMember({ id: 'member-2' });
      const initialMembers = [member1, member2];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useUserManagement({ initialMembers }),
        { wrapper }
      );

      expect(result.current.members).toHaveLength(2);
      expect(result.current.members[0].id).toBe('member-1');
      expect(result.current.members[1].id).toBe('member-2');
    }, 5000);

    it('should open edit member dialog with member data', () => {
      const member = createMockMember();
      const initialMembers = [member]; // Stable reference
      
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useUserManagement({ initialMembers }),
        { wrapper }
      );

      act(() => {
        result.current.openEditMember(member);
      });

      expect(result.current.memberDialogOpen).toBe(true);
      expect(result.current.editingMember).toEqual(member);
      expect(result.current.memberForm).toEqual(member);
    }, 5000);
  });
});
