import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildSystemInfoEndpoint,
  buildSystemInfoEndpointWithSubdomain,
  fetchSystemInformation,
  fetchComponentHealth,
  type SystemInformation
} from '../../src/services/healthApi';
import { apiClient } from '../../src/services/ApiClient';
import type { Component, HealthResponse, ComponentHealthCheck, LandscapeConfig } from '../../src/types/health';

// Mock the ApiClient
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('healthApi', () => {
  let mockComponent: Component;
  let mockLandscape: LandscapeConfig;
  let mockHealthResponse: HealthResponse;
  let mockSystemInfo: SystemInformation;

  beforeEach(() => {
    // Mock console methods to avoid noise in test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mock data
    mockComponent = {
      id: 'comp-123',
      name: 'accounts-service',
      title: 'Accounts Service',
      description: 'Service for managing accounts',
      owner_id: 'owner-123',
      metadata: {
        subdomain: 'sap-provisioning'
      }
    };

    mockLandscape = {
      id: 'landscape-123',
      name: 'eu10-canary',
      route: 'sap.hana.ondemand.com'
    };

    mockHealthResponse = {
      status: 'UP',
      details: {
        db: {
          status: 'UP',
          description: 'Database is healthy'
        }
      }
    };

    mockSystemInfo = {
      gitProperties: {
        'git.commit.id': 'abc123',
        'git.build.time': '2023-01-01T00:00:00Z',
        'git.commit.time': '2023-01-01T00:00:00Z'
      },
      buildProperties: {
        group: 'com.sap',
        artifact: 'accounts-service',
        time: 1672531200000,
        version: '1.0.0',
        name: 'accounts-service'
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // URL BUILDING FUNCTIONS
  // ============================================================================

  describe('URL Building Functions', () => {
    it('should build system info endpoints correctly', () => {
      // Test system info endpoint with default and custom paths
      expect(buildSystemInfoEndpoint(mockComponent, mockLandscape))
        .toBe('https://accounts-service.cfapps.sap.hana.ondemand.com/systemInformation/public');
      expect(buildSystemInfoEndpoint(mockComponent, mockLandscape, '/version'))
        .toBe('https://accounts-service.cfapps.sap.hana.ondemand.com/version');

      // Test system info endpoint with subdomain
      expect(buildSystemInfoEndpointWithSubdomain(mockComponent, mockLandscape, 'sap-provisioning', '/version'))
        .toBe('https://sap-provisioning.accounts-service.cfapps.sap.hana.ondemand.com/version');
    });

    it('should handle component names with uppercase letters and different landscapes', () => {
      const componentWithUppercase = { ...mockComponent, name: 'Accounts-Service' };
      const differentLandscape = { ...mockLandscape, route: 'eu20.hana.ondemand.com' };
      
      expect(buildSystemInfoEndpoint(componentWithUppercase, differentLandscape))
        .toBe('https://accounts-service.cfapps.eu20.hana.ondemand.com/systemInformation/public');
    });
  });

  // ============================================================================
  // SYSTEM INFORMATION FETCHING
  // ============================================================================

  describe('fetchSystemInformation', () => {
    it('should fetch system information from /systemInformation/public successfully', async () => {
      const mockApiResponse = { ...mockSystemInfo, componentSuccess: true };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockApiResponse);

      const result = await fetchSystemInformation(mockComponent, mockLandscape);

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockApiResponse);
      expect(result.url).toBe('https://accounts-service.cfapps.sap.hana.ondemand.com/systemInformation/public');
    });

    it('should fallback to subdomain endpoint when primary fails', async () => {
      const mockApiResponse = { ...mockSystemInfo, componentSuccess: true };
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce(mockApiResponse);

      const result = await fetchSystemInformation(mockComponent, mockLandscape);

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockApiResponse);
      expect(result.url).toBe('https://sap-provisioning.accounts-service.cfapps.sap.hana.ondemand.com/systemInformation/public');
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should fallback to /version endpoint when /systemInformation/public fails', async () => {
      const mockApiResponse = { ...mockSystemInfo, componentSuccess: true };
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockRejectedValueOnce(new Error('Subdomain failed'))
        .mockResolvedValueOnce(mockApiResponse);

      const result = await fetchSystemInformation(mockComponent, mockLandscape);

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockApiResponse);
      expect(result.url).toBe('https://accounts-service.cfapps.sap.hana.ondemand.com/version');
      expect(apiClient.get).toHaveBeenCalledTimes(3);
    });

    it('should fallback to /version with subdomain when all other attempts fail', async () => {
      const mockApiResponse = { ...mockSystemInfo, componentSuccess: true };
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockRejectedValueOnce(new Error('Subdomain failed'))
        .mockRejectedValueOnce(new Error('Version failed'))
        .mockResolvedValueOnce(mockApiResponse);

      const result = await fetchSystemInformation(mockComponent, mockLandscape);

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockApiResponse);
      expect(result.url).toBe('https://sap-provisioning.accounts-service.cfapps.sap.hana.ondemand.com/version');
      expect(apiClient.get).toHaveBeenCalledTimes(4);
    });

    it('should handle component without subdomain metadata', async () => {
      const componentWithoutSubdomain = { ...mockComponent, metadata: {} };
      const mockApiResponse = { ...mockSystemInfo, componentSuccess: true };
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce(mockApiResponse);

      const result = await fetchSystemInformation(componentWithoutSubdomain, mockLandscape);

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockApiResponse);
      expect(result.url).toBe('https://accounts-service.cfapps.sap.hana.ondemand.com/version');
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle component with non-string subdomain', async () => {
      const componentWithInvalidSubdomain = { 
        ...mockComponent, 
        metadata: { subdomain: 123 } 
      };
      const mockApiResponse = { ...mockSystemInfo, componentSuccess: true };
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce(mockApiResponse);

      const result = await fetchSystemInformation(componentWithInvalidSubdomain, mockLandscape);

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockApiResponse);
      expect(result.url).toBe('https://accounts-service.cfapps.sap.hana.ondemand.com/version');
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should return error when all endpoints fail', async () => {
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockRejectedValueOnce(new Error('Subdomain failed'))
        .mockRejectedValueOnce(new Error('Version failed'))
        .mockRejectedValueOnce(new Error('Version subdomain failed'));

      const result = await fetchSystemInformation(mockComponent, mockLandscape);

      expect(result.status).toBe('error');
      expect(result.error).toBe('All system info endpoints failed');
      expect(apiClient.get).toHaveBeenCalledTimes(4);
    });

    it('should handle componentSuccess false responses', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ componentSuccess: false })
        .mockResolvedValueOnce({ componentSuccess: false })
        .mockResolvedValueOnce({ componentSuccess: false })
        .mockResolvedValueOnce({ componentSuccess: false });

      const result = await fetchSystemInformation(mockComponent, mockLandscape);

      expect(result.status).toBe('error');
      expect(result.error).toBe('All system info endpoints failed');
    });

    it('should handle AbortSignal', async () => {
      const controller = new AbortController();
      const mockApiResponse = { ...mockSystemInfo, componentSuccess: true };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockApiResponse);

      const result = await fetchSystemInformation(mockComponent, mockLandscape, controller.signal);

      expect(result.status).toBe('success');
      expect(apiClient.get).toHaveBeenCalledWith('/cis-public/proxy', {
        params: { url: 'https://accounts-service.cfapps.sap.hana.ondemand.com/systemInformation/public' },
        signal: controller.signal,
      });
    });
  });


  // ============================================================================
  // FETCH COMPONENT HEALTH (NEW ENDPOINT)
  // ============================================================================

  describe('fetchComponentHealth', () => {
    it('should fetch component health successfully', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockHealthResponse);

      const result = await fetchComponentHealth('comp-123', 'landscape-456');

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockHealthResponse);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(apiClient.get).toHaveBeenCalledWith('/components/health', {
        params: {
          'component-id': 'comp-123',
          'landscape-id': 'landscape-456'
        },
        signal: undefined,
      });
    });

    it('should handle component health fetch with AbortSignal', async () => {
      const controller = new AbortController();
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockHealthResponse);

      const result = await fetchComponentHealth('comp-123', 'landscape-456', controller.signal);

      expect(result.status).toBe('success');
      expect(apiClient.get).toHaveBeenCalledWith('/components/health', {
        params: {
          'component-id': 'comp-123',
          'landscape-id': 'landscape-456'
        },
        signal: controller.signal,
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValueOnce(networkError);

      const result = await fetchComponentHealth('comp-123', 'landscape-456');

      expect(result.status).toBe('error');
      expect(result.error).toBe('Network error');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle unknown errors', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce('Unknown error');

      const result = await fetchComponentHealth('comp-123', 'landscape-456');

      expect(result.status).toBe('error');
      expect(result.error).toBe('Failed to fetch component health');
    });

  });
});
