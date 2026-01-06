import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchLandscapesByProject,
  getDefaultLandscapeId,
  type LandscapeApiResponse,
} from '../../src/services/LandscapesApi';
import { apiClient } from '../../src/services/ApiClient';
import type { Landscape } from '../../src/types/developer-portal';

// Mock the apiClient
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('LandscapesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to create mock landscape API response
  const createMockLandscapeApiResponse = (overrides?: Partial<LandscapeApiResponse>): LandscapeApiResponse => ({
    id: 'landscape-123',
    name: 'test-landscape',
    title: 'Test Landscape',
    description: 'A test landscape for development',
    domain: 'https://test-landscape.example.com',
    environment: 'development',
    git: 'https://github.com/org/test-landscape',
    concourse: 'https://concourse.test-landscape.example.com',
    kibana: 'https://kibana.test-landscape.example.com',
    dynatrace: 'https://dynatrace.test-landscape.example.com',
    cockpit: 'https://cockpit.test-landscape.example.com',
    'operation-console': 'https://ops.test-landscape.example.com',
    'control-center': 'https://control-center.test-landscape.example.com',
    type: 'development',
    grafana: 'https://grafana.test-landscape.example.com',
    prometheus: 'https://prometheus.test-landscape.example.com',
    gardener: 'https://gardener.test-landscape.example.com',
    plutono: 'https://plutono.test-landscape.example.com',
    metadata: {
      region: 'us-east-1',
      version: '1.0.0',
    },
    ...overrides,
  });

  describe('fetchLandscapesByProject', () => {
    it('should fetch landscapes by project name successfully', async () => {
      const mockApiResponse: LandscapeApiResponse[] = [
        createMockLandscapeApiResponse({
          id: 'landscape-1',
          name: 'dev-landscape',
          title: 'Development Landscape',
          environment: 'development',
        }),
        createMockLandscapeApiResponse({
          id: 'landscape-2',
          name: 'prod-landscape',
          title: 'Production Landscape',
          environment: 'production',
        }),
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await fetchLandscapesByProject('test-project');

      expect(apiClient.get).toHaveBeenCalledWith('/landscapes', {
        params: { 'project-name': 'test-project' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('landscape-1');
      expect(result[0].name).toBe('Development Landscape');
      expect(result[0].technical_name).toBe('dev-landscape');
      expect(result[0].environment).toBe('development');
      expect(result[1].id).toBe('landscape-2');
      expect(result[1].name).toBe('Production Landscape');
      expect(result[1].environment).toBe('production');
    });

    it('should handle landscape with and without title field', async () => {
      const mockApiResponse: LandscapeApiResponse[] = [
        createMockLandscapeApiResponse({
          id: 'landscape-1',
          name: 'technical-name',
          title: 'Human Readable Title',
        }),
        createMockLandscapeApiResponse({
          id: 'landscape-2',
          name: 'technical-name-2',
          title: undefined,
        }),
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await fetchLandscapesByProject('test-project');

      expect(result[0].name).toBe('Human Readable Title');
      expect(result[0].technical_name).toBe('technical-name');
      expect(result[1].name).toBe('technical-name-2');
      expect(result[1].technical_name).toBe('technical-name-2');
    });

    it('should handle empty response and API errors', async () => {
      // Test empty response
      vi.mocked(apiClient.get).mockResolvedValue([]);
      const emptyResult = await fetchLandscapesByProject('empty-project');
      expect(emptyResult).toEqual([]);

      // Test API error
      const error = new Error('API request failed');
      vi.mocked(apiClient.get).mockRejectedValue(error);
      await expect(fetchLandscapesByProject('test-project')).rejects.toThrow('API request failed');
    });

    it('should handle central region flag', async () => {
      const mockApiResponse: LandscapeApiResponse[] = [
        createMockLandscapeApiResponse({
          id: 'central-landscape',
          'is-central-region': true,
        } as any),
        createMockLandscapeApiResponse({
          id: 'non-central-landscape',
          'is-central-region': false,
        } as any),
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await fetchLandscapesByProject('test-project');

      expect(result[0].isCentral).toBe(true);
      expect(result[1].isCentral).toBe(false);
    });

    it('should transform control-center property correctly', async () => {
      const mockApiResponse: LandscapeApiResponse[] = [
        createMockLandscapeApiResponse({
          id: 'landscape-with-control-center',
          'control-center': 'https://control-center.example.com',
        }),
        createMockLandscapeApiResponse({
          id: 'landscape-without-control-center',
          'control-center': undefined,
        }),
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await fetchLandscapesByProject('test-project');

      expect(result[0]['control-center']).toBe('https://control-center.example.com');
      expect(result[1]['control-center']).toBeUndefined();
    });
  });

  describe('getDefaultLandscapeId', () => {
    it('should return null for empty landscapes array', () => {
      const result = getDefaultLandscapeId([]);
      expect(result).toBeNull();
    });

    it('should return staging landscape with isCentral=true when available', () => {
      const landscapes: Landscape[] = [
        { id: 'landscape-1', name: 'US East', environment: 'production', isCentral: false } as Landscape,
        { id: 'landscape-2', name: 'Israel (Tel Aviv)', environment: 'staging', isCentral: true } as Landscape,
        { id: 'landscape-3', name: 'EU West', environment: 'development', isCentral: false } as Landscape,
      ];

      const result = getDefaultLandscapeId(landscapes);
      expect(result).toBe('landscape-2');
    });

    it('should return first landscape ID when Israel (Tel Aviv) is not available', () => {
      const landscapes: Landscape[] = [
        { id: 'landscape-1', name: 'US East' } as Landscape,
        { id: 'landscape-2', name: 'EU West' } as Landscape,
      ];

      const result = getDefaultLandscapeId(landscapes);
      expect(result).toBe('landscape-1');
    });

    it('should prefer project-specific staging landscape when no central staging exists', () => {
      const landscapes: Landscape[] = [
        { id: 'landscape-1', name: 'Production', environment: 'production', technical_name: 'prod', isCentral: false } as Landscape,
        { id: 'landscape-2', name: 'Test Project Staging', environment: 'staging', technical_name: 'test-project-staging', isCentral: false } as Landscape,
      ];

      const result = getDefaultLandscapeId(landscapes, 'test-project');
      expect(result).toBe('landscape-2');
    });
  });

  describe('Integration Tests', () => {
    it('should fetch landscapes and get default landscape ID', async () => {
      const mockApiResponse: LandscapeApiResponse[] = [
        createMockLandscapeApiResponse({
          id: 'landscape-1',
          name: 'us-east',
          title: 'US East',
          environment: 'production',
        }),
        createMockLandscapeApiResponse({
          id: 'landscape-2',
          name: 'test-project-staging',
          title: 'Test Project Staging',
          environment: 'staging',
          'is-central-region': true,
        }),
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const landscapes = await fetchLandscapesByProject('test-project');
      const defaultId = getDefaultLandscapeId(landscapes, 'test-project');

      expect(landscapes).toHaveLength(2);
      expect(defaultId).toBe('landscape-2'); // Staging with isCentral=true
    });
  });
});
