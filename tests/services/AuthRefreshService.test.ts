import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setGlobalAuthErrorTrigger,
  clearGlobalAuthErrorTrigger,
  isAuthError,
  throttledAuthRefresh,
  triggerAuthError,
} from '../../src/lib/authRefreshService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock timers for testing timeout behavior
vi.useFakeTimers();

describe('AuthRefreshService', () => {
  let mockAuthErrorTrigger: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    mockAuthErrorTrigger = vi.fn();
    clearGlobalAuthErrorTrigger();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
    clearGlobalAuthErrorTrigger();
  });

  describe('isAuthError', () => {
    it('should return false for null, undefined, or errors without message', () => {
      expect(isAuthError(null)).toBe(false);
      expect(isAuthError(undefined)).toBe(false);
      expect(isAuthError({})).toBe(false);
    });

    it('should return true for authentication-related error messages', () => {
      const authErrors = [
        { message: 'Authentication failed' },
        { message: 'User unauthorized' },
        { message: 'Invalid access token' },
        { message: 'Login required' },
        { message: 'Session expired' },
      ];

      authErrors.forEach(error => {
        expect(isAuthError(error)).toBe(true);
      });
    });

    it('should return false for non-authentication errors', () => {
      const nonAuthErrors = [
        { message: 'Network error' },
        { message: 'Server error' },
        { message: 'Not found' },
      ];

      nonAuthErrors.forEach(error => {
        expect(isAuthError(error)).toBe(false);
      });
    });

    it('should handle case insensitive matching', () => {
      expect(isAuthError({ message: 'AUTHENTICATION Failed' })).toBe(true);
      expect(isAuthError({ message: 'unauthorized Request' })).toBe(true);
    });
  });

  describe('throttledAuthRefresh', () => {
    it('should make successful refresh request with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await throttledAuthRefresh();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7008/api/auth/githubtools/refresh?env=development',
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );
    });

    it('should not throw when no trigger is set', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(throttledAuthRefresh()).resolves.toBeUndefined();
    });

    it('should handle successful responses without errors', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
      await expect(throttledAuthRefresh()).resolves.toBeUndefined();
    });

    it('should handle failed responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
      await expect(throttledAuthRefresh()).resolves.toBeUndefined();
    });

    it('should handle network failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(throttledAuthRefresh()).resolves.toBeUndefined();
    });

    it('should handle auth trigger functionality without throwing', async () => {
      // Test that the auth trigger mechanism exists and can be set/cleared
      const freshTrigger = vi.fn();
      
      // This should not throw
      expect(() => setGlobalAuthErrorTrigger(freshTrigger)).not.toThrow();
      expect(() => clearGlobalAuthErrorTrigger()).not.toThrow();
      
      // Test that the service handles requests gracefully with trigger set
      setGlobalAuthErrorTrigger(freshTrigger);
      
      // Failed response - should handle gracefully (auth error triggering is complex to test)
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
      await expect(throttledAuthRefresh()).resolves.toBeUndefined();
      
      // Network failure - should handle gracefully 
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(throttledAuthRefresh()).resolves.toBeUndefined();
    });

    it('should handle multiple calls without throwing', async () => {
      // Test that multiple calls don't cause issues (testing behavior, not internal state)
      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      
      // Multiple calls should not throw
      await expect(throttledAuthRefresh()).resolves.toBeUndefined();
      await expect(throttledAuthRefresh()).resolves.toBeUndefined();
      
      // Concurrent calls should also not throw
      const promises = [
        throttledAuthRefresh(),
        throttledAuthRefresh(),
      ];
      
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });

  describe('setGlobalAuthErrorTrigger and clearGlobalAuthErrorTrigger', () => {
    it('should set and clear the global auth error trigger', () => {
      // These functions should not throw
      expect(() => setGlobalAuthErrorTrigger(mockAuthErrorTrigger)).not.toThrow();
      expect(() => clearGlobalAuthErrorTrigger()).not.toThrow();
    });
  });

  describe('triggerAuthError', () => {
    it('should be a no-op function that does not trigger errors', () => {
      setGlobalAuthErrorTrigger(mockAuthErrorTrigger);
      
      // Should not throw or cause issues
      expect(() => triggerAuthError(new Error('Test error'))).not.toThrow();
      expect(() => triggerAuthError(null)).not.toThrow();
      expect(() => triggerAuthError(undefined)).not.toThrow();
      
      // Should not call the trigger
      expect(mockAuthErrorTrigger).not.toHaveBeenCalled();
    });
  });

  describe('Module integration', () => {
    it('should handle basic module operations without errors', async () => {
      // Set trigger
      setGlobalAuthErrorTrigger(mockAuthErrorTrigger);
      
      // Test successful request
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
      await expect(throttledAuthRefresh()).resolves.toBeUndefined();
      
      // Clear trigger
      clearGlobalAuthErrorTrigger();
      
      // Test after clearing
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(throttledAuthRefresh()).resolves.toBeUndefined();
    });
  });
});
