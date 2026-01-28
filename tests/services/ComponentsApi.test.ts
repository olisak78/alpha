import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchComponentsByTeamId, fetchComponentsByOrganization } from '../../src/services/ComponentsApi';
import { apiClient } from '../../src/services/ApiClient';
import { DEFAULT_PAGE_SIZE } from '../../src/constants/developer-portal';
import type { 
  ComponentListResponse,
  Component
} from '../../src/types/api';

// Mock the apiClient
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock the constants
vi.mock('../../src/constants/developer-portal', () => ({
  DEFAULT_PAGE_SIZE: 100,
}));

describe('ComponentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to create mock components
  const createMockComponent = (overrides?: Partial<Component>): Component => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'test-component',
    title: 'Test Component',
    description: 'A test component',
    project_id: 'project-123',
    owner_id: 'owner-123',
    github: 'https://github.com/org/repo',
    sonar: 'https://sonar.example.com/project',
    qos: 'high',
    project_title: 'Test Project',
    ...overrides,
  });

  describe('fetchComponentsByTeamId', () => {
    const teamId = 'team-123';

    const mockResponse: ComponentListResponse = [
      createMockComponent({ id: '1', name: 'component-1' }),
      createMockComponent({ id: '2', name: 'component-2' }),
      createMockComponent({ id: '3', name: 'component-3' }),
    ];

    it('should fetch components by team ID successfully', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await fetchComponentsByTeamId(teamId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/components?team-id=${teamId}`
      );
      expect(result).toEqual(mockResponse);
      expect(result).toHaveLength(3);
    });

    it('should use correct endpoint path with team ID', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await fetchComponentsByTeamId(teamId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/components?team-id=${teamId}`
      );
    });

    it('should handle empty components list', async () => {
      const emptyResponse: ComponentListResponse = [];

      vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);

      const result = await fetchComponentsByTeamId(teamId);

      expect(result).toHaveLength(0);
    });

    it('should handle single component response', async () => {
      const singleComponentResponse: ComponentListResponse = [createMockComponent()];

      vi.mocked(apiClient.get).mockResolvedValue(singleComponentResponse);

      const result = await fetchComponentsByTeamId(teamId);

      expect(result).toHaveLength(1);
    });

    it('should handle large team with many components', async () => {
      const largeResponse: ComponentListResponse = Array.from({ length: 100 }, (_, i) =>
        createMockComponent({ id: `comp-${i}`, name: `component-${i}` })
      );

      vi.mocked(apiClient.get).mockResolvedValue(largeResponse);

      const result = await fetchComponentsByTeamId(teamId);

      expect(result).toHaveLength(100);
    });

    it('should handle components with different properties', async () => {
      const mixedResponse: ComponentListResponse = [
        createMockComponent({ 
          id: '1', 
          name: 'service-component',
          github: 'https://github.com/org/service-repo'
        }),
        createMockComponent({ 
          id: '2', 
          name: 'library-component',
          sonar: 'https://sonar.example.com/library'
        }),
        createMockComponent({ 
          id: '3', 
          name: 'app-component',
          qos: 'critical'
        }),
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mixedResponse);

      const result = await fetchComponentsByTeamId(teamId);

      expect(result[0].github).toBe('https://github.com/org/service-repo');
      expect(result[1].sonar).toBe('https://sonar.example.com/library');
      expect(result[2].qos).toBe('critical');
    });

    it('should handle API errors', async () => {
      const error = new Error('API request failed');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(
        fetchComponentsByTeamId(teamId)
      ).rejects.toThrow('API request failed');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(networkError);

      await expect(
        fetchComponentsByTeamId(teamId)
      ).rejects.toThrow('Network error');
    });

    it('should handle 404 errors for non-existent teams', async () => {
      const notFoundError = new Error('Team not found');
      (notFoundError as any).status = 404;
      vi.mocked(apiClient.get).mockRejectedValue(notFoundError);

      await expect(
        fetchComponentsByTeamId('non-existent-team')
      ).rejects.toThrow('Team not found');
    });

    it('should handle unauthorized errors', async () => {
      const unauthorizedError = new Error('Unauthorized');
      (unauthorizedError as any).status = 401;
      vi.mocked(apiClient.get).mockRejectedValue(unauthorizedError);

      await expect(
        fetchComponentsByTeamId(teamId)
      ).rejects.toThrow('Unauthorized');
    });

    it('should work with UUID format team IDs', async () => {
      const uuidTeamId = '550e8400-e29b-41d4-a716-446655440000';
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await fetchComponentsByTeamId(uuidTeamId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/components?team-id=${uuidTeamId}`
      );
    });

    it('should handle special characters in team IDs', async () => {
      const specialTeamId = 'team-with-special-chars_123';
      vi.mocked(apiClient.get).mockResolvedValue([]);

      await fetchComponentsByTeamId(specialTeamId);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/components?team-id=${specialTeamId}`
      );
    });
  });

  describe('fetchComponentsByOrganization', () => {
    const organizationId = 'org-789';

    const mockResponse: ComponentListResponse = [
      createMockComponent({ id: '1', name: 'component-1' }),
      createMockComponent({ id: '2', name: 'component-2' }),
      createMockComponent({ id: '3', name: 'component-3' }),
    ];

    it('should fetch components by organization successfully', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await fetchComponentsByOrganization(organizationId);

      expect(apiClient.get).toHaveBeenCalledWith('/components', {
        params: {
          organization_id: organizationId,
          page_size: DEFAULT_PAGE_SIZE,
        },
      });
      expect(result).toEqual(mockResponse);
      expect(result).toHaveLength(3);
    });

    it('should use DEFAULT_PAGE_SIZE constant', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await fetchComponentsByOrganization(organizationId);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            page_size: DEFAULT_PAGE_SIZE,
          }),
        })
      );
    });

    it('should include organization_id in request params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await fetchComponentsByOrganization(organizationId);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            organization_id: organizationId,
          }),
        })
      );
    });

    it('should use correct endpoint path', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await fetchComponentsByOrganization(organizationId);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/components',
        expect.any(Object)
      );
    });

    it('should handle empty components list', async () => {
      const emptyResponse: ComponentListResponse = [];

      vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);

      const result = await fetchComponentsByOrganization(organizationId);

      expect(result).toHaveLength(0);
    });

    it('should handle large number of components', async () => {
      const largeResponse: ComponentListResponse = Array.from({ length: 100 }, (_, i) =>
        createMockComponent({ id: `comp-${i}`, name: `component-${i}` })
      );

      vi.mocked(apiClient.get).mockResolvedValue(largeResponse);

      const result = await fetchComponentsByOrganization(organizationId);

      expect(result).toHaveLength(100);
    });

    it('should handle components with full properties', async () => {
      const fullComponent = createMockComponent({
        id: '1',
        name: 'full-component',
        github: 'https://github.com/org/repo',
        sonar: 'https://sonar.example.com/project',
        qos: 'high',
        project_title: 'Full Test Project'
      });

      const fullResponse: ComponentListResponse = [fullComponent];

      vi.mocked(apiClient.get).mockResolvedValue(fullResponse);

      const result = await fetchComponentsByOrganization(organizationId);

      expect(result[0].github).toBe('https://github.com/org/repo');
      expect(result[0].sonar).toBe('https://sonar.example.com/project');
      expect(result[0].qos).toBe('high');
      expect(result[0].project_title).toBe('Full Test Project');
    });

    it('should handle components without optional fields', async () => {
      const minimalComponent: Component = {
        id: '1',
        name: 'minimal-component',
        title: 'Minimal Component',
        description: 'A minimal component',
        project_id: 'project-123',
        owner_id: 'owner-123',
      };

      const minimalResponse: ComponentListResponse = [minimalComponent];

      vi.mocked(apiClient.get).mockResolvedValue(minimalResponse);

      const result = await fetchComponentsByOrganization(organizationId);

      expect(result[0].project_title).toBeUndefined();
      expect(result[0].github).toBeUndefined();
      expect(result[0].sonar).toBeUndefined();
      expect(result[0].qos).toBeUndefined();
    });

    it('should handle API errors', async () => {
      const error = new Error('API request failed');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(
        fetchComponentsByOrganization(organizationId)
      ).rejects.toThrow('API request failed');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(networkError);

      await expect(
        fetchComponentsByOrganization(organizationId)
      ).rejects.toThrow('Network error');
    });

    it('should handle 404 errors for non-existent organizations', async () => {
      const notFoundError = new Error('Organization not found');
      (notFoundError as any).status = 404;
      vi.mocked(apiClient.get).mockRejectedValue(notFoundError);

      await expect(
        fetchComponentsByOrganization('non-existent-org')
      ).rejects.toThrow('Organization not found');
    });

    it('should handle unauthorized errors', async () => {
      const unauthorizedError = new Error('Unauthorized');
      (unauthorizedError as any).status = 401;
      vi.mocked(apiClient.get).mockRejectedValue(unauthorizedError);

      await expect(
        fetchComponentsByOrganization(organizationId)
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle forbidden errors', async () => {
      const forbiddenError = new Error('Forbidden');
      (forbiddenError as any).status = 403;
      vi.mocked(apiClient.get).mockRejectedValue(forbiddenError);

      await expect(
        fetchComponentsByOrganization(organizationId)
      ).rejects.toThrow('Forbidden');
    });

    it('should work with UUID format organization IDs', async () => {
      const uuidOrgId = '770e8400-e29b-41d4-a716-446655440000';
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await fetchComponentsByOrganization(uuidOrgId);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            organization_id: uuidOrgId,
          }),
        })
      );
    });
  });

  describe('Response type validation', () => {
    it('should return ComponentListResponse (array) with correct structure', async () => {
      const response: ComponentListResponse = [createMockComponent()];

      vi.mocked(apiClient.get).mockResolvedValue(response);

      const result = await fetchComponentsByTeamId('team-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('project_id');
      expect(result[0]).toHaveProperty('owner_id');
    });

    it('should return ComponentListResponse for organization endpoint', async () => {
      const component = createMockComponent();
      const response: ComponentListResponse = [component];

      vi.mocked(apiClient.get).mockResolvedValue(response);

      const result = await fetchComponentsByOrganization('org-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('title');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string organization ID', async () => {
      const mockResponse: ComponentListResponse = [];

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await fetchComponentsByOrganization('');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            organization_id: '',
          }),
        })
      );
    });

    it('should handle very long organization IDs', async () => {
      const longOrgId = 'a'.repeat(200);
      const mockResponse: ComponentListResponse = [];

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await fetchComponentsByOrganization(longOrgId);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            organization_id: longOrgId,
          }),
        })
      );
    });
  });
});
