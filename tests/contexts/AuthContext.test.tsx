import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as authService from '@/services/authService';
import * as useMembers from '@/hooks/api/useMembers';
import * as helpers from '@/utils/developer-portal-helpers';
import type { User } from '@/types/developer-portal';
import React from 'react';

// Mock all dependencies
vi.mock('@/services/authService', () => ({
  checkDualAuthStatus: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock('@/hooks/api/useMembers', () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock('@/utils/developer-portal-helpers', () => ({
  buildUserFromMe: vi.fn(),
}));

vi.mock('@/stores/useDualAuthStore', () => ({
  useDualAuthStore: vi.fn(),
}));

import { useDualAuthStore } from '@/stores/useDualAuthStore';

describe('AuthContext', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    c_number: 'C123456',
    team_id: 'team-1',
  };

  const mockMeData = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    c_number: 'C123456',
    team_id: 'team-1',
  };

  const mockDualAuthStatus = {
    githubtools: true,
    githubwdf: true,
  };

  const mockSetGithubToolsAuthenticated = vi.fn();
  const mockSetGithubWdfAuthenticated = vi.fn();
  const mockResetDualAuth = vi.fn();
  const mockIsBothAuthenticated = vi.fn();

  // Helper component to test context values
  const TestComponent = () => {
    const auth = useAuth();
    return (
      <div>
        <div data-testid="user">{auth.user ? auth.user.name : 'null'}</div>
        <div data-testid="isAuthenticated">{String(auth.isAuthenticated)}</div>
        <div data-testid="isLoading">{String(auth.isLoading)}</div>
        <button onClick={() => auth.logout().catch(() => {})} data-testid="logout-btn">Logout</button>
        <button onClick={() => auth.refreshAuth().catch(() => {})} data-testid="refresh-btn">Refresh</button>
      </div>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location
    delete (window as any).location;
    window.location = { pathname: '/' } as any;

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.sessionStorage = sessionStorageMock as any;

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Default useDualAuthStore mock
    vi.mocked(useDualAuthStore).mockReturnValue({
      isGithubToolsAuthenticated: false,
      isGithubWdfAuthenticated: false,
      isGithubToolsLoading: false,
      isGithubWdfLoading: false,
      githubToolsError: null,
      githubWdfError: null,
      setGithubToolsAuthenticated: mockSetGithubToolsAuthenticated,
      setGithubWdfAuthenticated: mockSetGithubWdfAuthenticated,
      setGithubToolsLoading: vi.fn(),
      setGithubWdfLoading: vi.fn(),
      setGithubToolsError: vi.fn(),
      setGithubWdfError: vi.fn(),
      isBothAuthenticated: mockIsBothAuthenticated,
      reset: mockResetDualAuth,
    });

    // Default isBothAuthenticated returns true
    mockIsBothAuthenticated.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AuthProvider Initialization', () => {
    it('should check dual auth status on mount when not on login page', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authService.checkDualAuthStatus).toHaveBeenCalledTimes(1);
        expect(useMembers.fetchCurrentUser).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    it('should update dual auth store with authentication statuses', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockSetGithubToolsAuthenticated).toHaveBeenCalledWith(true);
        expect(mockSetGithubWdfAuthenticated).toHaveBeenCalledWith(true);
      });
    });

    it('should not check auth status when on login page', async () => {
      window.location.pathname = '/login';

      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(authService.checkDualAuthStatus).not.toHaveBeenCalled();
      expect(useMembers.fetchCurrentUser).not.toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should start with loading state true and set to false after check', async () => {
      window.location.pathname = '/login';

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });
    });

    it('should set user to null when both auths are not valid', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue({
        githubtools: true,
        githubwdf: false, // Only one valid
      });
      mockIsBothAuthenticated.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should set user to null when fetchCurrentUser returns null', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should not fetch user when only githubtools is authenticated', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue({
        githubtools: true,
        githubwdf: false,
      });
      mockIsBothAuthenticated.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(useMembers.fetchCurrentUser).not.toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    it('should not fetch user when only githubwdf is authenticated', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue({
        githubtools: false,
        githubwdf: true,
      });
      mockIsBothAuthenticated.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(useMembers.fetchCurrentUser).not.toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    it('should fetch user only when both are authenticated', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(useMembers.fetchCurrentUser).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });
  });

  describe('logout function', () => {
    it('should call logoutUser service', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);
      vi.mocked(authService.logoutUser).mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });

      screen.getByTestId('logout-btn').click();

      await waitFor(() => {
        expect(authService.logoutUser).toHaveBeenCalledTimes(1);
      });
    });

    it('should reset dual auth store after logout', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);
      vi.mocked(authService.logoutUser).mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });

      screen.getByTestId('logout-btn').click();

      await waitFor(() => {
        expect(mockResetDualAuth).toHaveBeenCalledTimes(1);
      });
    });

    it('should clear user state after logout', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);
      vi.mocked(authService.logoutUser).mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });

      screen.getByTestId('logout-btn').click();

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should set loading state during logout', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);

      let resolveLogout: any;
      vi.mocked(authService.logoutUser).mockReturnValue(
        new Promise((resolve) => {
          resolveLogout = resolve;
        })
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });

      screen.getByTestId('logout-btn').click();

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('true');
      });

      resolveLogout();

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });
    });

    it('should handle logout errors gracefully', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);

      const logoutError = new Error('Logout failed');
      vi.mocked(authService.logoutUser).mockRejectedValue(logoutError);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });

      screen.getByTestId('logout-btn').click();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Logout error:', logoutError);
      });

      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    it('should handle logout service failure and keep user state', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);
      vi.mocked(authService.logoutUser).mockRejectedValue(new Error('Logout failed'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });

      screen.getByTestId('logout-btn').click();

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      // User should still be there because logout failed before setUser(null)
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Logout error:',
          expect.any(Error)
        );
      });
    });
  });

  describe('refreshAuth function', () => {
    it('should refresh user data successfully', async () => {
      window.location.pathname = '/login';

      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      screen.getByTestId('refresh-btn').click();

      await waitFor(() => {
        expect(authService.checkDualAuthStatus).toHaveBeenCalled();
        expect(useMembers.fetchCurrentUser).toHaveBeenCalled();
      });

      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should update dual auth store on successful refresh', async () => {
      window.location.pathname = '/login';

      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      screen.getByTestId('refresh-btn').click();

      await waitFor(() => {
        expect(mockSetGithubToolsAuthenticated).toHaveBeenCalledWith(true);
        expect(mockSetGithubWdfAuthenticated).toHaveBeenCalledWith(true);
      });
    });

    it('should clear quick-links from localStorage on successful refresh', async () => {
      window.location.pathname = '/login';

      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      screen.getByTestId('refresh-btn').click();

      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('quick-links');
      });
    });

    it('should handle localStorage errors gracefully', async () => {
      window.location.pathname = '/login';

      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);
      vi.mocked(localStorage.removeItem).mockImplementation(() => {
        throw new Error('localStorage error');
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      screen.getByTestId('refresh-btn').click();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to clear quick-links from localStorage:',
          expect.any(Error)
        );
      });

      // Should still have updated user
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });


    it('should throw error when fetchCurrentUser returns null', async () => {
      window.location.pathname = '/login';

      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.refreshAuth()).rejects.toThrow(
        'Failed to fetch current user'
      );

      expect(result.current.user).toBe(null);
    });

    it('should throw error when fetchCurrentUser fails', async () => {
      window.location.pathname = '/login';

      const fetchError = new Error('Network error');
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockRejectedValue(fetchError);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.refreshAuth()).rejects.toThrow('Network error');

      expect(console.error).toHaveBeenCalledWith('Refresh auth error:', fetchError);
      expect(result.current.user).toBe(null);
    });

  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });

    it('should return auth context when used inside AuthProvider', () => {
      window.location.pathname = '/login';

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('refreshAuth');
    });

    it('should have correct function types', () => {
      window.location.pathname = '/login';

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.refreshAuth).toBe('function');
    });
  });

  describe('Context Value', () => {
    it('should have isAuthenticated true when user exists and both auths valid', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    it('should have isAuthenticated false when user is null', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue({
        githubtools: false,
        githubwdf: false,
      });
      mockIsBothAuthenticated.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    it('should have isAuthenticated false when only one auth is valid', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue({
        githubtools: true,
        githubwdf: false,
      });
      mockIsBothAuthenticated.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });

  describe('Dual Authentication Integration', () => {
    it('should call isBothAuthenticated from store', async () => {
      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockIsBothAuthenticated).toHaveBeenCalled();
      });
    });

  });

  describe('Edge Cases', () => {
    it('should handle multiple children', async () => {
      window.location.pathname = '/login';

      render(
        <AuthProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child-1')).toBeInTheDocument();
        expect(screen.getByTestId('child-2')).toBeInTheDocument();
      });
    });

    it('should handle buildUserFromMe returning different user data', async () => {
      const differentUser = {
        ...mockUser,
        name: 'Different User',
        email: 'different@example.com',
      };

      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);
      vi.mocked(useMembers.fetchCurrentUser).mockResolvedValue(mockMeData);
      vi.mocked(helpers.buildUserFromMe).mockReturnValue(differentUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Different User');
      });
    });

    it('should handle pathname with trailing slash', async () => {
      window.location.pathname = '/login/';

      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      // Should still check auth because pathname is /login/ not /login
      expect(authService.checkDualAuthStatus).toHaveBeenCalled();
    });

    it('should handle pathname case sensitivity', async () => {
      window.location.pathname = '/Login';

      vi.mocked(authService.checkDualAuthStatus).mockResolvedValue(mockDualAuthStatus);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      // Should check auth because pathname is /Login not /login
      expect(authService.checkDualAuthStatus).toHaveBeenCalled();
    });
  });
});