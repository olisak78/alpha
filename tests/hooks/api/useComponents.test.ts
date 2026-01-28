import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  useComponentsByTeam,
  useComponentsByOrganization,
  useComponentsByProject,
} from '../../../src/hooks/api/useComponents';
import {
  fetchComponentsByTeamId,
  fetchComponentsByOrganization,
  fetchComponentsByProject,
} from '../../../src/services/ComponentsApi';
import { createWrapper, testSetup } from './test-utils';

// Mock the ComponentsApi service
vi.mock('../../../src/services/ComponentsApi', () => ({
  fetchComponentsByTeamId: vi.fn(),
  fetchComponentsByOrganization: vi.fn(),
  fetchComponentsByProject: vi.fn(),
}));

// Mock queryKeys
vi.mock('../../../src/lib/queryKeys', () => ({
  queryKeys: {
    components: {
      byTeam: (teamId: string) => ['components', 'team', teamId],
      byOrganization: (orgId: string) => ['components', 'organization', orgId],
      byProject: (projectName: string) => ['components', 'project', projectName],
    },
  },
}));

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockComponent = (overrides?: any) => ({
  id: 'component-123',
  name: 'Test Component',
  description: 'A test component',
  type: 'service',
  status: 'active',
  owner: 'team-456',
  repository: 'https://github.com/test/component',
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:30:00Z',
  ...overrides,
});

const createMockComponentListResponse = (overrides?: any) => ({
  components: [
    createMockComponent(),
    createMockComponent({
      id: 'component-456',
      name: 'Another Component',
      type: 'library',
    }),
  ],
  ...overrides,
});

// ============================================================================
// useComponentsByTeam TESTS
// ============================================================================

describe('useComponentsByTeam', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch components by team successfully', async () => {
    const teamId = 'team-123';
    const organizationId = 'org-456';
    const mockComponents = [createMockComponent(), createMockComponent({ id: 'comp-2' })];
    const expectedResponse = { components: mockComponents };

    vi.mocked(fetchComponentsByTeamId).mockResolvedValue(mockComponents);

    const { result } = renderHook(
      () => useComponentsByTeam(teamId, organizationId),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(expectedResponse);
    expect(fetchComponentsByTeamId).toHaveBeenCalledWith(teamId);
  });

  it('should not fetch when required parameters are missing', async () => {
    const { result } = renderHook(
      () => useComponentsByTeam('', 'org-456'),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchComponentsByTeamId).not.toHaveBeenCalled();
  });
});

// ============================================================================
// useComponentsByOrganization TESTS
// ============================================================================

describe('useComponentsByOrganization', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch components by organization successfully', async () => {
    const organizationId = 'org-123';
    const mockResponse = createMockComponentListResponse();

    vi.mocked(fetchComponentsByOrganization).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useComponentsByOrganization(organizationId),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(fetchComponentsByOrganization).toHaveBeenCalledWith(organizationId);
  });

  it('should not fetch when organizationId is empty', async () => {
    const { result } = renderHook(
      () => useComponentsByOrganization(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchComponentsByOrganization).not.toHaveBeenCalled();
  });
});

// ============================================================================
// useComponentsByProject TESTS
// ============================================================================

describe('useComponentsByProject', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch components by project successfully', async () => {
    const projectName = 'test-project';
    const mockResponse = createMockComponentListResponse();

    vi.mocked(fetchComponentsByProject).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useComponentsByProject(projectName),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(fetchComponentsByProject).toHaveBeenCalledWith(projectName);
  });

  it('should not fetch when projectName is empty', async () => {
    const { result } = renderHook(
      () => useComponentsByProject(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchComponentsByProject).not.toHaveBeenCalled();
  });
});
