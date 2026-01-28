/**
 * Tests for TokenManager race condition fixes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the constants module
vi.mock('@/constants/developer-portal', () => ({
  getNewBackendUrl: () => 'http://localhost:3000'
}));

// Import after mocking
import { tokenManager } from '@/lib/tokenManager';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TokenManager Race Condition Tests', () => {
  beforeEach(() => {
    // Clear any existing state
    tokenManager.clearToken();
    vi.clearAllMocks();
    
    // Mock successful refresh response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        accessToken: 'new-token-123',
        expirationTime: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent race condition in concurrent refresh attempts', async () => {
    // Set up scenario where token needs refresh
    tokenManager.setToken('expired-token', Math.floor(Date.now() / 1000) - 100); // expired token

    // Track fetch calls
    let fetchCallCount = 0;
    mockFetch.mockImplementation(async () => {
      fetchCallCount++;
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        ok: true,
        json: async () => ({
          accessToken: `new-token-${fetchCallCount}`,
          expirationTime: Math.floor(Date.now() / 1000) + 3600
        })
      };
    });

    // Make multiple concurrent calls that should trigger refresh
    const promises = Array.from({ length: 5 }, () => 
      tokenManager.ensureValidToken(60)
    );

    // Wait for all promises to resolve
    const results = await Promise.all(promises);

    // All should return the same token (from the single refresh call)
    expect(results.every(token => token === results[0])).toBe(true);
    
    // Only one fetch call should have been made
    expect(fetchCallCount).toBe(1);
    
    // The token should be the one from the single refresh
    expect(results[0]).toBe('new-token-1');
  });

  it('should handle rapid successive calls without race conditions', async () => {
    // Clear token to force refresh
    tokenManager.clearToken();

    let fetchCallCount = 0;
    mockFetch.mockImplementation(async () => {
      fetchCallCount++;
      // Very short delay to simulate real network conditions
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        ok: true,
        json: async () => ({
          accessToken: `token-${fetchCallCount}`,
          expirationTime: Math.floor(Date.now() / 1000) + 3600
        })
      };
    });

    // Make rapid successive calls
    const promise1 = tokenManager.ensureValidToken();
    const promise2 = tokenManager.ensureValidToken();
    const promise3 = tokenManager.ensureValidToken();

    const [token1, token2, token3] = await Promise.all([promise1, promise2, promise3]);

    // All tokens should be identical (from single refresh)
    expect(token1).toBe(token2);
    expect(token2).toBe(token3);
    expect(token1).toBe('token-1');
    
    // Only one fetch should have occurred
    expect(fetchCallCount).toBe(1);
  });

  it('should properly reset state after refresh completion', async () => {
    tokenManager.clearToken();

    // First refresh
    const token1 = await tokenManager.ensureValidToken();
    expect(token1).toBe('new-token-123');
    expect(tokenManager.isCurrentlyRefreshing()).toBe(false);

    // Clear token to force another refresh
    tokenManager.clearToken();
    
    // Second refresh should work independently
    const token2 = await tokenManager.ensureValidToken();
    expect(token2).toBe('new-token-123');
    expect(tokenManager.isCurrentlyRefreshing()).toBe(false);

    // Should have made 2 separate fetch calls
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle refresh failure without leaving inconsistent state', async () => {
    tokenManager.clearToken();

    // Mock fetch to fail
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // First call should fail
    await expect(tokenManager.ensureValidToken()).rejects.toThrow('Network error');
    expect(tokenManager.isCurrentlyRefreshing()).toBe(false);
    expect(tokenManager.getToken()).toBe(null);

    // Reset mock to succeed
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'recovery-token',
        expirationTime: Math.floor(Date.now() / 1000) + 3600
      })
    });

    // Second call should succeed
    const token = await tokenManager.ensureValidToken();
    expect(token).toBe('recovery-token');
    expect(tokenManager.isCurrentlyRefreshing()).toBe(false);
  });

  it('should use existing valid token without triggering refresh', async () => {
    // Set a valid token
    const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    tokenManager.setToken('valid-token', futureTime);

    const token = await tokenManager.ensureValidToken();
    
    expect(token).toBe('valid-token');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
