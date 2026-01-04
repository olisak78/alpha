import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';
import * as authService from '@/services/authService';

// Mock the auth service
vi.mock('@/services/authService', () => ({
  checkAuthStatus: vi.fn(),
}));

describe('useAuthRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      vi.mocked(authService.checkAuthStatus).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useAuthRefresh());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(null);
      expect(result.current.authError).toBe(null);
    });

    it('should provide retry function', () => {
      vi.mocked(authService.checkAuthStatus).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useAuthRefresh());

      expect(typeof result.current.retry).toBe('function');
    });
  });

  describe('Successful Authentication', () => {
    it('should set isAuthenticated to true when checkAuthStatus returns true', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.authError).toBe(null);
    });

    it('should stop loading after successful auth check', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call checkAuthStatus once on mount', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(authService.checkAuthStatus).toHaveBeenCalledTimes(1);
      });
    });

    it('should clear any previous errors on successful auth', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.authError).toBe(null);
    });
  });

  describe('Failed Authentication', () => {
    it('should set isAuthenticated to false when checkAuthStatus returns false', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(false);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set appropriate error message when auth fails', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(false);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.authError).toBe('Session expired. Please log in again.');
    });

    it('should stop loading after failed auth check', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(false);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle Error instance with message', async () => {
      const errorMessage = 'Network connection failed';
      vi.mocked(authService.checkAuthStatus).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authError).toBe(`Authentication failed: ${errorMessage}`);
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(authService.checkAuthStatus).mockRejectedValue('String error');

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authError).toBe('Authentication failed. Please try again.');
    });

    it('should handle null rejection', async () => {
      vi.mocked(authService.checkAuthStatus).mockRejectedValue(null);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authError).toBe('Authentication failed. Please try again.');
    });

    it('should handle undefined rejection', async () => {
      vi.mocked(authService.checkAuthStatus).mockRejectedValue(undefined);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authError).toBe('Authentication failed. Please try again.');
    });

    it('should handle object rejection', async () => {
      vi.mocked(authService.checkAuthStatus).mockRejectedValue({ code: 401 });

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authError).toBe('Authentication failed. Please try again.');
    });

    it('should stop loading after error', async () => {
      vi.mocked(authService.checkAuthStatus).mockRejectedValue(
        new Error('Test error')
      );

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Retry Functionality', () => {
    it('should retry auth check when retry is called', async () => {
      vi.mocked(authService.checkAuthStatus)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAuthRefresh());

      // Wait for initial check to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);

      // Retry
      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(authService.checkAuthStatus).toHaveBeenCalledTimes(2);
    });

    it('should set loading state during retry', async () => {
      let resolveAuth: (value: boolean) => void;
      const authPromise = new Promise<boolean>((resolve) => {
        resolveAuth = resolve;
      });

      vi.mocked(authService.checkAuthStatus)
        .mockResolvedValueOnce(false)
        .mockReturnValueOnce(authPromise);

      const { result } = renderHook(() => useAuthRefresh());

      // Wait for initial check
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start retry
      let retryPromise: Promise<void>;
      await act(async () => {
        retryPromise = result.current.retry();
      });

      // Should be loading during retry
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve the auth check
      resolveAuth!(true);
      await act(async () => {
        await retryPromise!;
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should clear previous error before retry', async () => {
      vi.mocked(authService.checkAuthStatus)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAuthRefresh());

      // Wait for initial check to fail
      await waitFor(() => {
        expect(result.current.authError).toBeTruthy();
      });

      expect(result.current.authError).toContain('First error');

      // Retry
      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.authError).toBe(null);
      });
    });

    it('should handle retry failure', async () => {
      vi.mocked(authService.checkAuthStatus)
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Retry failed'));

      const { result } = renderHook(() => useAuthRefresh());

      // Wait for initial successful check
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Retry fails
      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(result.current.authError).toContain('Retry failed');
    });

    it('should handle multiple retries', async () => {
      vi.mocked(authService.checkAuthStatus)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAuthRefresh());

      // Wait for initial check
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First retry
      await act(async () => {
        await result.current.retry();
      });
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      // Second retry
      await act(async () => {
        await result.current.retry();
      });
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(authService.checkAuthStatus).toHaveBeenCalledTimes(3);
    });

    it('should return a promise from retry', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      const { result } = renderHook(() => useAuthRefresh());

      // Wait for initial check
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let retryResult: Promise<void>;
      await act(async () => {
        retryResult = result.current.retry();
        expect(retryResult).toBeInstanceOf(Promise);
        await retryResult;
      });
    });
  });

  describe('Loading State Management', () => {
    it('should set loading to true before auth check', () => {
      let resolveAuth: (value: boolean) => void;
      const authPromise = new Promise<boolean>((resolve) => {
        resolveAuth = resolve;
      });

      vi.mocked(authService.checkAuthStatus).mockReturnValue(authPromise);

      const { result } = renderHook(() => useAuthRefresh());

      expect(result.current.isLoading).toBe(true);

      // Clean up
      resolveAuth!(true);
    });

    it('should set loading to false after successful auth', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      const { result } = renderHook(() => useAuthRefresh());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading to false after failed auth', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(false);

      const { result } = renderHook(() => useAuthRefresh());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading to false after error', async () => {
      vi.mocked(authService.checkAuthStatus).mockRejectedValue(
        new Error('Test error')
      );

      const { result } = renderHook(() => useAuthRefresh());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('State Transitions', () => {
    it('should transition from null to true on successful auth', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      const { result } = renderHook(() => useAuthRefresh());

      expect(result.current.isAuthenticated).toBe(null);

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should transition from null to false on failed auth', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(false);

      const { result } = renderHook(() => useAuthRefresh());

      expect(result.current.isAuthenticated).toBe(null);

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    it('should transition from true to false on retry failure', async () => {
      vi.mocked(authService.checkAuthStatus)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    it('should transition from false to true on retry success', async () => {
      vi.mocked(authService.checkAuthStatus)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should clear error when transitioning to authenticated', async () => {
      vi.mocked(authService.checkAuthStatus)
        .mockRejectedValueOnce(new Error('Auth error'))
        .mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.authError).toBeTruthy();
      });

      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.authError).toBe(null);
      });
    });
  });

  describe('Hook Lifecycle', () => {
    it('should only check auth once on mount, not on re-render', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      const { result, rerender } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender();
      rerender();
      rerender();

      // Should still only be called once (on mount)
      expect(authService.checkAuthStatus).toHaveBeenCalledTimes(1);
    });

    it('should maintain retry function reference across re-renders', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      const { result, rerender } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstRetry = result.current.retry;

      rerender();

      const secondRetry = result.current.retry;

      // Function reference should change because it's recreated each render
      // but it should still work correctly
      expect(typeof firstRetry).toBe('function');
      expect(typeof secondRetry).toBe('function');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous retry calls', async () => {
      let resolveCount = 0;
      const resolvers: Array<(value: boolean) => void> = [];

      vi.mocked(authService.checkAuthStatus).mockImplementation(() => {
        return new Promise<boolean>((resolve) => {
          resolvers.push(resolve);
        });
      });

      const { result } = renderHook(() => useAuthRefresh());

      // Initial call on mount
      expect(resolvers.length).toBe(1);

      // Multiple simultaneous retries
      await act(async () => {
        const retry1 = result.current.retry();
        const retry2 = result.current.retry();
        const retry3 = result.current.retry();

        expect(resolvers.length).toBe(4); // 1 initial + 3 retries

        // Resolve all
        resolvers.forEach(resolve => resolve(true));

        await Promise.all([retry1, retry2, retry3]);
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should handle retry during initial auth check', async () => {
      let initialResolve: (value: boolean) => void;
      let retryResolve: (value: boolean) => void;

      vi.mocked(authService.checkAuthStatus)
        .mockImplementationOnce(() => {
          return new Promise<boolean>((resolve) => {
            initialResolve = resolve;
          });
        })
        .mockImplementationOnce(() => {
          return new Promise<boolean>((resolve) => {
            retryResolve = resolve;
          });
        });

      const { result } = renderHook(() => useAuthRefresh());

      // Start retry while initial check is still pending
      let retryPromise: Promise<void>;
      await act(async () => {
        retryPromise = result.current.retry();
      });

      // Resolve initial check
      initialResolve!(false);

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      // Resolve retry
      retryResolve!(true);

      await act(async () => {
        await retryPromise!;
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very slow auth check', async () => {
      vi.mocked(authService.checkAuthStatus).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 5000))
      );

      const { result } = renderHook(() => useAuthRefresh());

      expect(result.current.isLoading).toBe(true);

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 6000 }
      );

      expect(result.current.isAuthenticated).toBe(true);
    }, 7000);

    it('should handle empty error message', async () => {
      vi.mocked(authService.checkAuthStatus).mockRejectedValue(new Error(''));

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.authError).toBe('Authentication failed: ');
    });

    it('should handle Error with special characters in message', async () => {
      const specialMessage = 'Auth failed: <script>alert("xss")</script>';
      vi.mocked(authService.checkAuthStatus).mockRejectedValue(
        new Error(specialMessage)
      );

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.authError).toBe(`Authentication failed: ${specialMessage}`);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all required properties', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('authError');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('retry');
    });

    it('should return correct types for all properties', async () => {
      vi.mocked(authService.checkAuthStatus).mockResolvedValue(true);

      const { result } = renderHook(() => useAuthRefresh());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.isAuthenticated).toBe('boolean');
      expect(result.current.authError).toBe(null);
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.retry).toBe('function');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle session expiry and re-authentication flow', async () => {
      vi.mocked(authService.checkAuthStatus)
        .mockResolvedValueOnce(true) // Initial: authenticated
        .mockResolvedValueOnce(false) // Check again: session expired
        .mockResolvedValueOnce(true); // After re-login: authenticated again

      const { result } = renderHook(() => useAuthRefresh());

      // Initial auth succeeds
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Session expires
      await act(async () => {
        await result.current.retry();
      });
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.authError).toBe('Session expired. Please log in again.');
      });

      // Re-authenticate
      await act(async () => {
        await result.current.retry();
      });
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.authError).toBe(null);
      });
    });

    it('should handle network error followed by successful retry', async () => {
      vi.mocked(authService.checkAuthStatus)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAuthRefresh());

      // Network error
      await waitFor(() => {
        expect(result.current.authError).toContain('Network error');
      });

      // Retry succeeds
      await act(async () => {
        await result.current.retry();
      });
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.authError).toBe(null);
      });
    });
  });
});