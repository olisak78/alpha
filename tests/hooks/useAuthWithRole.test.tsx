import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthWithRole } from '@/hooks/useAuthWithRole';
import * as AuthContext from '@/contexts/AuthContext';
import * as useMembers from '@/hooks/api/useMembers';
import type { User } from '@/types/developer-portal';

// Mock the dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(),
}));

describe('useAuthWithRole', () => {
  const mockBaseUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    c_number: 'C123456',
    team_id: 'team-1',
  };

  const mockCurrentUserData = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    c_number: 'C123456',
    team_id: 'team-1',
    team_role: 'developer',
    portal_admin: true,
  };

  const mockAuthContextBase = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return loading state when auth is loading', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        isLoading: true,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBe(null);
    });

    it('should return loading state when current user is loading', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.isLoading).toBe(true);
    });

    it('should return loading when both are loading', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        isLoading: true,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.isLoading).toBe(true);
    });

    it('should not be loading when both have finished loading', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('User Data Combination', () => {
    it('should return null when no base user', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: null,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).toBe(null);
    });

    it('should return base user when no current user data', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).toEqual(mockBaseUser);
      expect(result.current.user).not.toHaveProperty('team_role');
      expect(result.current.user).not.toHaveProperty('portal_admin');
    });

    it('should combine base user with team_role and portal_admin', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).toEqual({
        ...mockBaseUser,
        team_role: 'developer',
        portal_admin: true,
      });
    });

    it('should add only team_role when portal_admin is not present', () => {
      const currentUserWithOnlyRole = {
        ...mockCurrentUserData,
        team_role: 'developer',
        portal_admin: undefined,
      };

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: currentUserWithOnlyRole,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).toEqual({
        ...mockBaseUser,
        team_role: 'developer',
      });
      expect(result.current.user).not.toHaveProperty('portal_admin');
    });

    it('should add only portal_admin when team_role is not present', () => {
      const currentUserWithOnlyAdmin = {
        ...mockCurrentUserData,
        team_role: undefined,
        portal_admin: true,
      };

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: currentUserWithOnlyAdmin,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).toEqual({
        ...mockBaseUser,
        portal_admin: true,
      });
      expect(result.current.user).not.toHaveProperty('team_role');
    });

    it('should not add team_role when it is null', () => {
      const currentUserWithNullRole = {
        ...mockCurrentUserData,
        team_role: null,
        portal_admin: true,
      };

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: currentUserWithNullRole,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).toEqual({
        ...mockBaseUser,
        portal_admin: true,
      });
      expect(result.current.user).not.toHaveProperty('team_role');
    });

    it('should not add portal_admin when it is false', () => {
      const currentUserWithFalseAdmin = {
        ...mockCurrentUserData,
        team_role: 'developer',
        portal_admin: false,
      };

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: currentUserWithFalseAdmin,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).toEqual({
        ...mockBaseUser,
        team_role: 'developer',
      });
      expect(result.current.user).not.toHaveProperty('portal_admin');
    });

    it('should handle empty string team_role as falsy', () => {
      const currentUserWithEmptyRole = {
        ...mockCurrentUserData,
        team_role: '',
        portal_admin: true,
      };

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: currentUserWithEmptyRole,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).toEqual({
        ...mockBaseUser,
        portal_admin: true,
      });
      expect(result.current.user).not.toHaveProperty('team_role');
    });
  });

  describe('Auth Context Passthrough', () => {
    it('should pass through all auth context properties', () => {
      const mockLogin = vi.fn();
      const mockLogout = vi.fn();

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
        isAuthenticated: true,
        login: mockLogin,
        logout: mockLogout,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.login).toBe(mockLogin);
      expect(result.current.logout).toBe(mockLogout);
    });

    it('should override isLoading from auth context', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false, // Auth is not loading
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: true, // But current user is loading
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.isLoading).toBe(true);
    });

    it('should override user from auth context', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser, // Base user
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      // Should be enhanced user, not base user
      expect(result.current.user).toEqual({
        ...mockBaseUser,
        team_role: 'developer',
        portal_admin: true,
      });
      expect(result.current.user).not.toBe(mockBaseUser);
    });
  });

  describe('Additional Properties', () => {
    it('should expose memberError', () => {
      const mockError = new Error('Failed to fetch user');

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.memberError).toBe(mockError);
    });

    it('should expose memberData for backward compatibility', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.memberData).toBe(mockCurrentUserData);
    });

    it('should have memberError as null when no error', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.memberError).toBe(null);
    });

    it('should have memberData as undefined when not loaded', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.memberData).toBe(undefined);
    });
  });

  describe('useCurrentUser Configuration', () => {
    it('should call useCurrentUser with staleTime configuration', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      const mockUseCurrentUser = vi.mocked(useMembers.useCurrentUser);
      mockUseCurrentUser.mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      renderHook(() => useAuthWithRole());

      expect(mockUseCurrentUser).toHaveBeenCalledWith({
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    });

    it('should call useCurrentUser only once on mount', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      const mockUseCurrentUser = vi.mocked(useMembers.useCurrentUser);
      mockUseCurrentUser.mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { rerender } = renderHook(() => useAuthWithRole());

      expect(mockUseCurrentUser).toHaveBeenCalledTimes(1);

      rerender();
      rerender();

      // Should still be called same number of times (hooks are called on every render)
      expect(mockUseCurrentUser).toHaveBeenCalledTimes(3);
    });
  });

  describe('useMemo Optimization', () => {
    it('should return same user object reference when dependencies do not change', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useAuthWithRole());

      const firstUser = result.current.user;

      rerender();

      const secondUser = result.current.user;

      expect(firstUser).toBe(secondUser); // Same reference
    });

    it('should return new user object when base user changes', () => {
      const mockAuth1 = {
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      };

      const mockAuth2 = {
        ...mockAuthContextBase,
        user: { ...mockBaseUser, name: 'Updated User' },
        isLoading: false,
      };

      vi.mocked(AuthContext.useAuth).mockReturnValue(mockAuth1);

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useAuthWithRole());

      const firstUser = result.current.user;

      // Change base user
      vi.mocked(AuthContext.useAuth).mockReturnValue(mockAuth2);

      rerender();

      const secondUser = result.current.user;

      expect(firstUser).not.toBe(secondUser); // Different reference
      expect(secondUser?.name).toBe('Updated User');
    });

    it('should return new user object when current user data changes', () => {
      const mockCurrentUserData1 = {
        ...mockCurrentUserData,
        team_role: 'developer',
      };

      const mockCurrentUserData2 = {
        ...mockCurrentUserData,
        team_role: 'lead',
      };

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData1,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useAuthWithRole());

      const firstUser = result.current.user;
      expect(firstUser?.team_role).toBe('developer');

      // Change current user data
      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData2,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      rerender();

      const secondUser = result.current.user;
      expect(secondUser?.team_role).toBe('lead');
      expect(firstUser).not.toBe(secondUser); // Different reference
    });
  });

  describe('Different Team Roles', () => {
    const roles = ['developer', 'lead', 'manager', 'architect', 'admin'];

    roles.forEach((role) => {
      it(`should handle team_role: ${role}`, () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
          ...mockAuthContextBase,
          user: mockBaseUser,
          isLoading: false,
        });

        vi.mocked(useMembers.useCurrentUser).mockReturnValue({
          data: { ...mockCurrentUserData, team_role: role },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        } as any);

        const { result } = renderHook(() => useAuthWithRole());

        expect(result.current.user?.team_role).toBe(role);
      });
    });
  });

  describe('Portal Admin Variations', () => {
    it('should handle portal_admin as true', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: { ...mockCurrentUserData, portal_admin: true },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user?.portal_admin).toBe(true);
    });

    it('should not include portal_admin when false', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: { ...mockCurrentUserData, portal_admin: false },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).not.toHaveProperty('portal_admin');
    });

    it('should not include portal_admin when null', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: { ...mockCurrentUserData, portal_admin: null },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).not.toHaveProperty('portal_admin');
    });

    it('should not include portal_admin when undefined', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: { ...mockCurrentUserData, portal_admin: undefined },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).not.toHaveProperty('portal_admin');
    });
  });

  describe('Edge Cases', () => {
    it('should handle when baseUser becomes null after being set', () => {
      const mockAuth1 = {
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      };

      const mockAuth2 = {
        ...mockAuthContextBase,
        user: null,
        isLoading: false,
      };

      vi.mocked(AuthContext.useAuth).mockReturnValue(mockAuth1);

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useAuthWithRole());

      expect(result.current.user).toBeTruthy();

      // User logs out
      vi.mocked(AuthContext.useAuth).mockReturnValue(mockAuth2);

      rerender();

      expect(result.current.user).toBe(null);
    });

    it('should handle when currentUserData becomes null after being set', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useAuthWithRole());

      expect(result.current.user?.team_role).toBe('developer');

      // Current user data is cleared
      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      rerender();

      expect(result.current.user).toEqual(mockBaseUser);
      expect(result.current.user).not.toHaveProperty('team_role');
    });

    it('should handle user with all optional fields undefined', () => {
      const minimalUser: User = {
        id: 'user-123',
        name: 'Minimal User',
        email: 'minimal@example.com',
      };

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: minimalUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current.user).toEqual(minimalUser);
    });

    it('should preserve other currentUserData fields not explicitly handled', () => {
      const currentUserWithExtra = {
        ...mockCurrentUserData,
        team_role: 'developer',
        portal_admin: true,
        custom_field: 'custom_value',
      };

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: currentUserWithExtra,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      // Should only add team_role and portal_admin, not custom_field
      expect(result.current.user).toEqual({
        ...mockBaseUser,
        team_role: 'developer',
        portal_admin: true,
      });
      expect(result.current.user).not.toHaveProperty('custom_field');
    });
  });

  describe('Return Value Structure', () => {
    it('should return all required properties', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...mockAuthContextBase,
        user: mockBaseUser,
        isLoading: false,
        isAuthenticated: true,
      });

      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: mockCurrentUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthWithRole());

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('memberError');
      expect(result.current).toHaveProperty('memberData');
    });
  });
});