import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PluginApiClient } from '@/plugins/utils/PluginApiClient';
import { apiClient } from '@/services/ApiClient';

// Mock ApiClient
vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    getToken: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('PluginApiClient', () => {
  let pluginApiClient: PluginApiClient;
  const mockPluginId = 'test-plugin';

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sessionStorage
    sessionStorage.clear();
    // Reset fetch mock
    vi.mocked(fetch).mockClear();
    
    pluginApiClient = new PluginApiClient(mockPluginId);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Constructor', () => {
    it('should create instance with plugin ID', () => {
      expect(pluginApiClient).toBeInstanceOf(PluginApiClient);
      expect(pluginApiClient.getPluginId()).toBe(mockPluginId);
    });

    it('should throw error if plugin ID is empty', () => {
      expect(() => new PluginApiClient('')).toThrow('Plugin ID is required for PluginApiClient');
    });

    it('should throw error if plugin ID is whitespace', () => {
      expect(() => new PluginApiClient('   ')).toThrow('Plugin ID is required for PluginApiClient');
    });

    it('should throw error if plugin ID is undefined', () => {
      expect(() => new PluginApiClient(undefined as any)).toThrow('Plugin ID is required for PluginApiClient');
    });

    it('should throw error if plugin ID is null', () => {
      expect(() => new PluginApiClient(null as any)).toThrow('Plugin ID is required for PluginApiClient');
    });

    it('should accept different plugin IDs', () => {
      const client1 = new PluginApiClient('plugin-1');
      const client2 = new PluginApiClient('plugin-2');

      expect(client1.getPluginId()).toBe('plugin-1');
      expect(client2.getPluginId()).toBe('plugin-2');
    });

    it('should handle special characters in plugin ID', () => {
      const specialId = 'plugin-with-dashes_and_underscores.123';
      const client = new PluginApiClient(specialId);

      expect(client.getPluginId()).toBe(specialId);
    });
  });

  describe('getPluginId', () => {
    it('should return the plugin ID', () => {
      expect(pluginApiClient.getPluginId()).toBe(mockPluginId);
    });

    it('should return consistent plugin ID', () => {
      expect(pluginApiClient.getPluginId()).toBe(pluginApiClient.getPluginId());
    });
  });

  describe('getBasePath', () => {
    it('should return correct base path', () => {
      const basePath = pluginApiClient.getBasePath();
      expect(basePath).toBe(`/plugins/${mockPluginId}`);
    });

    it('should include plugin ID in base path', () => {
      const customClient = new PluginApiClient('custom-plugin');
      expect(customClient.getBasePath()).toBe('/plugins/custom-plugin');
    });
  });

  describe('isProxyMode', () => {
    it('should return false when no backend proxy is set', () => {
      expect(pluginApiClient.isProxyMode()).toBe(false);
    });

    it('should return true when backend proxy is set', () => {
      sessionStorage.setItem('plugin-backend-proxy', 'http://localhost:3001');
      expect(pluginApiClient.isProxyMode()).toBe(true);
    });

    it('should return false after clearing backend proxy', () => {
      sessionStorage.setItem('plugin-backend-proxy', 'http://localhost:3001');
      expect(pluginApiClient.isProxyMode()).toBe(true);
      
      sessionStorage.removeItem('plugin-backend-proxy');
      expect(pluginApiClient.isProxyMode()).toBe(false);
    });
  });

  describe('getProxyUrl', () => {
    it('should return null when no backend proxy is set', () => {
      expect(pluginApiClient.getProxyUrl()).toBeNull();
    });

    it('should return backend proxy URL when set', () => {
      const proxyUrl = 'http://localhost:3001';
      sessionStorage.setItem('plugin-backend-proxy', proxyUrl);
      
      expect(pluginApiClient.getProxyUrl()).toBe(proxyUrl);
    });

    it('should return updated proxy URL after change', () => {
      sessionStorage.setItem('plugin-backend-proxy', 'http://localhost:3001');
      expect(pluginApiClient.getProxyUrl()).toBe('http://localhost:3001');
      
      sessionStorage.setItem('plugin-backend-proxy', 'http://localhost:4001');
      expect(pluginApiClient.getProxyUrl()).toBe('http://localhost:4001');
    });

  });

  describe('get', () => {
    describe('Portal Proxy Mode', () => {
      it('should call apiClient.get with proxy URL', async () => {
        const mockResponse = { data: { test: 'value' }, pluginSuccess: true };
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        await pluginApiClient.get('/endpoint');

        expect(apiClient.get).toHaveBeenCalledWith(
          `/plugins/${mockPluginId}/proxy?path=endpoint`,
          expect.objectContaining({
            params: {},
            headers: undefined,
            signal: undefined,
          })
        );
      });

      it('should unwrap proxy response envelope', async () => {
        const mockData = { test: 'value' };
        const proxyResponse = {
          data: mockData,
          pluginSuccess: true,
          statusCode: 200,
          responseTime: 123,
        };
        vi.mocked(apiClient.get).mockResolvedValue(proxyResponse);

        const result = await pluginApiClient.get('/endpoint');

        expect(result).toEqual(mockData);
      });

      it('should throw error if proxy response indicates failure', async () => {
        const proxyResponse = {
          data: null,
          pluginSuccess: false,
          error: 'Backend error',
        };
        vi.mocked(apiClient.get).mockResolvedValue(proxyResponse);

        await expect(pluginApiClient.get('/endpoint')).rejects.toThrow('Backend error');
      });

      it('should handle query params', async () => {
        const mockResponse = { data: { test: 'value' }, pluginSuccess: true };
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);
        const params = { page: 1, limit: 10 };

        await pluginApiClient.get('/endpoint', { params });

        expect(apiClient.get).toHaveBeenCalledWith(
          `/plugins/${mockPluginId}/proxy?path=endpoint`,
          expect.objectContaining({
            params,
          })
        );
      });

      it('should normalize path without leading slash', async () => {
        const mockResponse = { data: {}, pluginSuccess: true };
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        await pluginApiClient.get('endpoint');

        expect(apiClient.get).toHaveBeenCalledWith(
          `/plugins/${mockPluginId}/proxy?path=endpoint`,
          expect.any(Object)
        );
      });
    });

    describe('Direct Mode', () => {
      const backendProxyUrl = 'http://localhost:3001';

      beforeEach(() => {
        sessionStorage.setItem('plugin-backend-proxy', backendProxyUrl);
        vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      });

      it('should make direct fetch request with auth token', async () => {
        const mockData = { test: 'value' };
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockData,
        } as Response);

        await pluginApiClient.get('/endpoint');

        expect(fetch).toHaveBeenCalledWith(
          `${backendProxyUrl}/endpoint`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token',
            }),
            credentials: 'include',
          })
        );
      });

      it('should handle request without auth token if getToken fails', async () => {
        vi.mocked(apiClient.getToken).mockRejectedValue(new Error('No token'));
        const mockData = { test: 'value' };
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockData,
        } as Response);

        await pluginApiClient.get('/endpoint');

        const fetchCall = vi.mocked(fetch).mock.calls[0];
        const headers = (fetchCall[1] as RequestInit).headers as Record<string, string>;
        expect(headers['Authorization']).toBeUndefined();
      });

      it('should add query params to URL', async () => {
        const mockData = { test: 'value' };
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockData,
        } as Response);

        await pluginApiClient.get('/endpoint', { params: { page: 1, limit: 10 } });

        expect(fetch).toHaveBeenCalledWith(
          `${backendProxyUrl}/endpoint?page=1&limit=10`,
          expect.any(Object)
        );
      });

      it('should skip null/undefined params', async () => {
        const mockData = { test: 'value' };
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockData,
        } as Response);

        await pluginApiClient.get('/endpoint', {
          params: { page: 1, skip: null, ignore: undefined },
        });

        const url = vi.mocked(fetch).mock.calls[0][0] as string;
        expect(url).toContain('page=1');
        expect(url).not.toContain('skip');
        expect(url).not.toContain('ignore');
      });

      it('should handle 404 error', async () => {
        vi.mocked(fetch).mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ message: 'Resource not found' }),
        } as Response);

        await expect(pluginApiClient.get('/endpoint')).rejects.toThrow('Resource not found');
      });

      it('should handle 204 No Content', async () => {
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          status: 204,
          json: async () => { throw new Error('No content'); },
        } as Response);

        const result = await pluginApiClient.get('/endpoint');

        expect(result).toBeUndefined();
      });

      it('should handle network errors', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(fetch).mockRejectedValue(new Error('Network Error'));

        await expect(pluginApiClient.get('/endpoint')).rejects.toThrow('Network Error');
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[PluginApiClient] Direct request failed:',
          expect.any(Error)
        );
        
        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('post', () => {
    describe('Portal Proxy Mode', () => {
      it('should call apiClient.post with proxy URL and data', async () => {
        const mockResponse = { data: { id: 1 }, pluginSuccess: true };
        vi.mocked(apiClient.post).mockResolvedValue(mockResponse);
        const data = { name: 'test' };

        const result = await pluginApiClient.post('/endpoint', data);

        expect(apiClient.post).toHaveBeenCalledWith(
          `/plugins/${mockPluginId}/proxy?path=endpoint`,
          data,
          expect.any(Object)
        );
        expect(result).toEqual({ id: 1 });
      });

      it('should handle null data', async () => {
        const mockResponse = { data: {}, pluginSuccess: true };
        vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

        await pluginApiClient.post('/endpoint', null);

        expect(apiClient.post).toHaveBeenCalledWith(
          expect.any(String),
          null,
          expect.any(Object)
        );
      });
    });

    describe('Direct Mode', () => {
      beforeEach(() => {
        sessionStorage.setItem('plugin-backend-proxy', 'http://localhost:3001');
        vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      });

      it('should make POST request with body', async () => {
        const mockData = { id: 1 };
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockData,
        } as Response);
        const body = { name: 'test' };

        await pluginApiClient.post('/endpoint', body);

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/endpoint',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(body),
          })
        );
      });
    });
  });

  describe('put', () => {
    describe('Portal Proxy Mode', () => {
      it('should call apiClient.put with proxy URL and data', async () => {
        const mockResponse = { data: { updated: true }, pluginSuccess: true };
        vi.mocked(apiClient.put).mockResolvedValue(mockResponse);
        const data = { name: 'updated' };

        const result = await pluginApiClient.put('/endpoint', data);

        expect(apiClient.put).toHaveBeenCalledWith(
          `/plugins/${mockPluginId}/proxy?path=endpoint`,
          data,
          expect.any(Object)
        );
        expect(result).toEqual({ updated: true });
      });
    });

    describe('Direct Mode', () => {
      beforeEach(() => {
        sessionStorage.setItem('plugin-backend-proxy', 'http://localhost:3001');
        vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      });

      it('should make PUT request with body', async () => {
        const mockData = { updated: true };
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockData,
        } as Response);
        const body = { name: 'updated' };

        await pluginApiClient.put('/endpoint', body);

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/endpoint',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(body),
          })
        );
      });
    });
  });

  describe('delete', () => {
    describe('Portal Proxy Mode', () => {
      it('should call apiClient.delete with proxy URL', async () => {
        const mockResponse = { data: { deleted: true }, pluginSuccess: true };
        vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

        const result = await pluginApiClient.delete('/endpoint');

        expect(apiClient.delete).toHaveBeenCalledWith(
          `/plugins/${mockPluginId}/proxy?path=endpoint`,
          expect.any(Object)
        );
        expect(result).toEqual({ deleted: true });
      });
    });

    describe('Direct Mode', () => {
      beforeEach(() => {
        sessionStorage.setItem('plugin-backend-proxy', 'http://localhost:3001');
        vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      });

      it('should make DELETE request without body', async () => {
        const mockData = { deleted: true };
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockData,
        } as Response);

        await pluginApiClient.delete('/endpoint');

        const fetchCall = vi.mocked(fetch).mock.calls[0];
        expect(fetchCall[1]?.method).toBe('DELETE');
        expect(fetchCall[1]).not.toHaveProperty('body');
      });
    });
  });

  describe('patch', () => {
    describe('Portal Proxy Mode', () => {
      it('should call apiClient.patch with proxy URL and data', async () => {
        const mockResponse = { data: { patched: true }, pluginSuccess: true };
        vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);
        const data = { status: 'active' };

        const result = await pluginApiClient.patch('/endpoint', data);

        expect(apiClient.patch).toHaveBeenCalledWith(
          `/plugins/${mockPluginId}/proxy?path=endpoint`,
          data,
          expect.any(Object)
        );
        expect(result).toEqual({ patched: true });
      });
    });

    describe('Direct Mode', () => {
      beforeEach(() => {
        sessionStorage.setItem('plugin-backend-proxy', 'http://localhost:3001');
        vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      });

      it('should make PATCH request with body', async () => {
        const mockData = { patched: true };
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockData,
        } as Response);
        const body = { status: 'active' };

        await pluginApiClient.patch('/endpoint', body);

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/endpoint',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        );
      });
    });
  });

  describe('Multiple Instances', () => {
    it('should maintain separate state for different plugin IDs', async () => {
      const client1 = new PluginApiClient('plugin-1');
      const client2 = new PluginApiClient('plugin-2');

      const mockResponse = { data: {}, pluginSuccess: true };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await client1.get('/endpoint');
      await client2.get('/endpoint');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/plugins/plugin-1/proxy?path=endpoint',
        expect.any(Object)
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        '/plugins/plugin-2/proxy?path=endpoint',
        expect.any(Object)
      );
    });

    it('should not interfere with each other', () => {
      const client1 = new PluginApiClient('plugin-1');
      const client2 = new PluginApiClient('plugin-2');

      expect(client1.getPluginId()).toBe('plugin-1');
      expect(client2.getPluginId()).toBe('plugin-2');

      expect(client1.getBasePath()).toBe('/plugins/plugin-1');
      expect(client2.getBasePath()).toBe('/plugins/plugin-2');
    });
  });
});