import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient, apiClient } from '../../src/services/ApiClient';
import { tokenManager } from '../../src/lib/tokenManager';

const BASE_URL = 'http://localhost:7008/api/v1';
const AUTH_BASE_URL = 'http://localhost:7008/api/auth';

describe('ApiClient', () => {
  let client: ApiClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch;

    // Create new client instance for each test
    client = new ApiClient();

    // Clear token manager state
    tokenManager.clearToken();

    // Mock console methods to avoid noise in test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    // Clear token manager state
    tokenManager.clearToken();
    vi.restoreAllMocks();
  });

  // ============================================================================
  // CONSTRUCTOR & INITIALIZATION
  // ============================================================================

  describe('Constructor', () => {
    it('should create a new instance with default configuration', () => {
      const newClient = new ApiClient();
      expect(newClient).toBeInstanceOf(ApiClient);
      expect(newClient.hasToken()).toBe(false);
    });

    it('should create singleton apiClient instance', () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });
  });

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  describe('Token Management', () => {
    it('should fetch and store access token on first request', async () => {
      const mockToken = 'test-jwt-token';
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      global.fetch = vi.fn()
        // First call: token refresh
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: mockToken,
            expirationTime: mockExpirationTime
          }),
        } as Response)
        // Second call: actual API request
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'test' }),
        } as Response);

      await client.get('/test');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(client.hasToken()).toBe(true);
    });

    it('should reuse existing token for subsequent requests', async () => {
      const mockToken = 'test-jwt-token';
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      global.fetch = vi.fn()
        // First call: token refresh
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: mockToken,
            expirationTime: mockExpirationTime
          }),
        } as Response)
        // Second call: first API request
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'test1' }),
        } as Response)
        // Third call: second API request (no token refresh)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'test2' }),
        } as Response);

      await client.get('/test1');
      await client.get('/test2');

      // Should only refresh token once
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should clear token when clearToken is called', async () => {
      const mockToken = 'test-jwt-token';
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: mockToken,
            expirationTime: mockExpirationTime
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'test' }),
        } as Response);

      await client.get('/test');
      expect(client.hasToken()).toBe(true);

      client.clearToken();
      expect(client.hasToken()).toBe(false);
    });

    it('should handle token refresh failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(client.get('/test')).rejects.toThrow('Failed to load data. Authentication required.');
    });

    it('should handle invalid token response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing accessToken should trigger error
        }),
      } as Response);

      await expect(client.get('/test')).rejects.toThrow('Failed to load data. Authentication required.');
    });

    it('should prevent multiple simultaneous token refreshes', async () => {
      const mockToken = 'test-jwt-token';
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      let tokenRefreshCount = 0;

      global.fetch = vi.fn().mockImplementation((url) => {
        // Track token refresh calls
        if (url.toString().includes('/refresh')) {
          tokenRefreshCount++;
          return new Promise(resolve =>
            setTimeout(() => resolve({
              ok: true,
              json: async () => ({
                accessToken: mockToken,
                expirationTime: mockExpirationTime
              }),
            }), 100)
          );
        }
        // API calls
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: 'test' }),
        } as Response);
      });

      // Make multiple requests simultaneously
      const promises = [
        client.get('/test1'),
        client.get('/test2'),
        client.get('/test3')
      ];

      await Promise.all(promises);

      // Token should only be refreshed once despite 3 simultaneous requests
      expect(tokenRefreshCount).toBe(1);
      // Total calls: 1 token refresh + 3 API calls = 4
      expect(fetch).toHaveBeenCalledTimes(4);
    });
  });

  // ============================================================================
  // GET REQUESTS
  // ============================================================================

  describe('GET Requests', () => {
    beforeEach(() => {
      // Mock successful token refresh for all tests
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: 'test-token',
            expirationTime: mockExpirationTime
          }),
        } as Response);
    });

    it('should make GET request without params', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Test' }),
      } as Response);

      const result = await client.get('/teams');

      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/teams`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should make GET request with query parameters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      await client.get('/teams', {
        params: {
          organization_id: '123',
          page: 1,
          page_size: 20
        }
      });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/teams?organization_id=123&page=1&page_size=20`,
        expect.any(Object)
      );
    });

    it('should filter out undefined and null params', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      await client.get('/teams', {
        params: {
          organization_id: '123',
          page: undefined,
          limit: null as any,
          search: 'test'
        }
      });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/teams?organization_id=123&search=test`,
        expect.any(Object)
      );
    });

    it('should handle GET request with custom headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      await client.get('/teams', {
        headers: {
          'X-Custom-Header': 'custom-value'
        }
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value'
          })
        })
      );
    });

    it('should support AbortSignal', async () => {
      const controller = new AbortController();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      await client.get('/teams', {
        signal: controller.signal
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal
        })
      );
    });
  });

  // ============================================================================
  // POST REQUESTS
  // ============================================================================

  describe('POST Requests', () => {
    beforeEach(() => {
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: 'test-token',
            expirationTime: mockExpirationTime
          }),
        } as Response);
    });

    it('should make POST request with data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'New Team' }),
      } as Response);

      const data = { name: 'new-team', display_name: 'New Team' };
      const result = await client.post('/teams', data);

      expect(result).toEqual({ id: '123', name: 'New Team' });
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/teams`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

  });

  // ============================================================================
  // PUT REQUESTS
  // ============================================================================

  describe('PUT Requests', () => {
    beforeEach(() => {
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: 'test-token',
            expirationTime: mockExpirationTime
          }),
        } as Response);
    });

    it('should make PUT request with data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'Updated Team' }),
      } as Response);

      const data = { display_name: 'Updated Team' };
      const result = await client.put('/teams/123', data);

      expect(result).toEqual({ id: '123', name: 'Updated Team' });
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/teams/123`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data)
        })
      );
    });
  });

  // ============================================================================
  // PATCH REQUESTS
  // ============================================================================

  describe('PATCH Requests', () => {
    beforeEach(() => {
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: 'test-token',
            expirationTime: mockExpirationTime
          }),
        } as Response);
    });

    it('should make PATCH request with partial data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', status: 'archived' }),
      } as Response);

      const data = { status: 'archived' };
      const result = await client.patch('/teams/123', data);

      expect(result).toEqual({ id: '123', status: 'archived' });
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/teams/123`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data)
        })
      );
    });
  });

  // ============================================================================
  // DELETE REQUESTS
  // ============================================================================

  describe('DELETE Requests', () => {
    beforeEach(() => {
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: 'test-token',
            expirationTime: mockExpirationTime
          }),
        } as Response);
    });

    it('should make DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as Response);

      const result = await client.delete('/teams/123');

      expect(result).toBeUndefined();
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/teams/123`,
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    it('should handle DELETE request with response body', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Deleted' }),
      } as Response);

      const result = await client.delete<{ success: boolean; message: string }>('/teams/123');

      expect(result).toEqual({ success: true, message: 'Deleted' });
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: 'test-token',
            expirationTime: mockExpirationTime
          }),
        } as Response);
    });


    it('should handle 400 Bad Request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          message: 'Invalid request data',
          details: { field: 'name', error: 'required' }
        }),
      } as Response);

      await expect(client.get('/teams')).rejects.toThrow('Invalid request data');
    });

    it('should handle 404 Not Found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          message: 'Resource not found'
        }),
      } as Response);

      await expect(client.get('/teams/999')).rejects.toThrow('Resource not found');
    });

    it('should handle 500 Internal Server Error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          message: 'Something went wrong'
        }),
      } as Response);

      await expect(client.get('/teams')).rejects.toThrow('Something went wrong');
    });

    it('should handle response with no JSON body', async () => {
      (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
              throw new Error('Not JSON');
          },
      } as unknown as Response);

      await expect(client.get('/teams')).rejects.toThrow('Internal Server Error');
    });

    it('should handle 204 No Content response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as Response);

      const result = await client.delete('/teams/123');

      expect(result).toBeUndefined();
    });
  });

  // ============================================================================
  // AUTHENTICATION FLOW
  // ============================================================================

  describe('Authentication Flow', () => {
    it('should call refresh endpoint with correct parameters', async () => {
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: 'test-token',
            expirationTime: mockExpirationTime
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'test' }),
        } as Response);

      await client.get('/teams');

      expect(fetch).toHaveBeenNthCalledWith(1,
        `${AUTH_BASE_URL}/refresh`,
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          })
        })
      );
    });

    it('should include Authorization header in API requests', async () => {
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: 'test-jwt-token',
            expirationTime: mockExpirationTime
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'test' }),
        } as Response);

      await client.get('/teams');

      expect(fetch).toHaveBeenNthCalledWith(2,
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-jwt-token'
          })
        })
      );
    });

    it('should include credentials in all requests', async () => {
      const mockExpirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            accessToken: 'test-token',
            expirationTime: mockExpirationTime
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'test' }),
        } as Response);

      await client.get('/teams');

      expect(fetch).toHaveBeenNthCalledWith(2,
        expect.any(String),
        expect.objectContaining({
          credentials: 'include'
        })
      );
    });
  });
});
