import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService, checkAuthStatus, logoutUser } from '../../src/services/authService';

const NEW_BACKEND_URL = 'http://localhost:7008';

describe('authService', () => {
  let originalFetch: typeof global.fetch;
  let originalWindowOpen: typeof window.open;
  let mockSessionStorage: Record<string, string>;

  beforeEach(() => {
    // Store originals
    originalFetch = global.fetch;
    originalWindowOpen = window.open;

    // Setup session storage mock
    mockSessionStorage = {};
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockSessionStorage[key];
        }),
        clear: vi.fn(() => {
          mockSessionStorage = {};
        }),
      },
      writable: true,
      configurable: true,
    });

    // Mock window.location
    delete (window as any).location;
    (window as any).location = {
      href: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    // Restore originals
    global.fetch = originalFetch;
    window.open = originalWindowOpen;
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ============================================================================
  // authService FUNCTION TESTS
  // ============================================================================

  describe('authService', () => {
    it('should store return URL in sessionStorage by default', () => {
      window.open = vi.fn(() => null);

      const options = { returnUrl: 'http://localhost:3000/dashboard' };
      authService(options);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'authReturnUrl',
        'http://localhost:3000/dashboard'
      );
    });

    it('should not store return URL when storeReturnUrl is false', () => {
      window.open = vi.fn(() => null);

      const options = { returnUrl: 'http://localhost:3000/dashboard', storeReturnUrl: false };
      authService(options);

      expect(sessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should use current URL when returnUrl is not provided', () => {
      window.open = vi.fn(() => null);

      authService();

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'authReturnUrl',
        'http://localhost:3000'
      );
    });

    it('should open popup with correct URL and parameters', () => {
      const mockPopup = {
        closed: false,
        close: vi.fn(),
      };

      window.open = vi.fn(() => mockPopup as any);

      authService();

      expect(window.open).toHaveBeenCalledWith(
        `${NEW_BACKEND_URL}/api/auth/githubtools/start`,
        'auth-popup-githubtools',
        'width=500,height=600,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
      );
    });

    it('should redirect to auth URL when popup is blocked', () => {
      window.open = vi.fn(() => null);

      const hrefSetter = vi.fn();
      Object.defineProperty(window.location, 'href', {
        set: hrefSetter,
        get: () => 'http://localhost:3000',
        configurable: true,
      });

      authService();

      expect(hrefSetter).toHaveBeenCalledWith(
        `${NEW_BACKEND_URL}/api/auth/githubtools/start`
      );
    });

    it('should handle message event from popup with success', async () => {
      const mockPopup = {
        closed: false,
        close: vi.fn(),
      };

      window.open = vi.fn(() => mockPopup as any);

      const authPromise = authService({ storeReturnUrl: false });

      // Simulate message event from popup
      const messageEvent = new MessageEvent('message', {
        origin: NEW_BACKEND_URL,
        data: { type: 'auth-result', success: true },
      });

      window.dispatchEvent(messageEvent);

      await expect(authPromise).resolves.toBeUndefined();
      expect(mockPopup.close).toHaveBeenCalled();
    });

    it('should handle message event from popup with failure', async () => {
      const mockPopup = {
        closed: false,
        close: vi.fn(),
      };

      window.open = vi.fn(() => mockPopup as any);

      const authPromise = authService({ storeReturnUrl: false });

      // Simulate message event from popup with failure
      const messageEvent = new MessageEvent('message', {
        origin: NEW_BACKEND_URL,
        data: { type: 'auth-result', success: false },
      });

      window.dispatchEvent(messageEvent);

      await expect(authPromise).rejects.toThrow('Authentication failed');
      expect(mockPopup.close).toHaveBeenCalled();
    });

    it('should ignore messages from wrong origin', () => {
      const mockPopup = {
        closed: false,
        close: vi.fn(),
      };

      window.open = vi.fn(() => mockPopup as any);

      authService({ storeReturnUrl: false }).catch(() => {
        // Catch to prevent unhandled rejection
      });

      // Simulate message event from wrong origin
      const messageEvent = new MessageEvent('message', {
        origin: 'http://evil.com',
        data: { type: 'auth-result', success: true },
      });

      window.dispatchEvent(messageEvent);

      // Popup should not be closed for wrong origin
      expect(mockPopup.close).not.toHaveBeenCalled();
    });

  });

  // ============================================================================
  // checkAuthStatus FUNCTION TESTS
  // ============================================================================

  describe('checkAuthStatus', () => {
    it('should return user data when authenticated', async () => {
      const mockUserData = {
        profile: { id: '123', name: 'Test User', email: 'test@example.com' },
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        } as Response)
      );

      const result = await checkAuthStatus();

      expect(fetch).toHaveBeenCalledWith(
        `${NEW_BACKEND_URL}/api/auth/refresh`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      expect(result).toEqual(mockUserData);
    });

    it('should return null when not authenticated', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        } as Response)
      );

      const result = await checkAuthStatus();

      expect(result).toBeNull();
    });

    it('should return null and log error on network failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const result = await checkAuthStatus();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking auth status:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should include correct headers in the request', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await checkAuthStatus();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
      );
    });
  });

  // ============================================================================
  // logoutUser FUNCTION TESTS
  // ============================================================================

  describe('logoutUser', () => {
    it('should call logout endpoint with correct parameters', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
        } as Response)
      );

      await logoutUser();

      expect(fetch).toHaveBeenCalledWith(
        `${NEW_BACKEND_URL}/api/auth/logout`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );
    });

    it('should handle successful logout', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
        } as Response)
      );

      await expect(logoutUser()).resolves.toBeUndefined();
    });

    it('should handle network failure gracefully and still clear storage', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');

      global.fetch = vi.fn(() => Promise.reject(error));

      // logoutUser doesn't throw - it catches errors and still clears storage/redirects
      await expect(logoutUser()).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', error);

      consoleErrorSpy.mockRestore();
    });

    it('should include correct headers in the request', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
        } as Response)
      );

      await logoutUser();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
      );
    });
  });
});
