import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useComponentOwner } from '../../src/hooks/useComponentOwner';
import { Component } from '../../src/types/api';
import { ComponentDisplayProvider } from '../../src/contexts/ComponentDisplayContext';
import { ReactNode } from 'react';
import '@testing-library/jest-dom/vitest';

// Mock component data
const mockComponent: Component = {
  id: 'test-component-1',
  name: 'test-service',
  title: 'Test Service',
  description: 'A test service component',
  owner_ids: ['team-1'],
  github: 'https://github.com/example/test-service',
  health: true,
};

const mockComponentWithoutOwner: Component = {
  id: 'test-component-2',
  name: 'orphan-service',
  title: 'Orphan Service',
  description: 'A service without an owner',
  owner_ids: [],
  health: true,
};

// Mock team data
const mockTeamNamesMap = {
  'team-1': 'Alpha Team',
  'team-2': 'Beta Team',
};

const mockTeamColorsMap = {
  'team-1': '#3b82f6',
  'team-2': '#ef4444',
};

// Mock the useTeams hook since ComponentDisplayProvider uses it
vi.mock('../../src/hooks/api/useTeams', () => ({
  useTeams: () => ({
    data: {
      teams: [
        { id: 'team-1', title: 'Alpha Team', name: 'alpha-team', metadata: { color: '#3b82f6' } },
        { id: 'team-2', title: 'Beta Team', name: 'beta-team', metadata: { color: '#ef4444' } },
      ]
    }
  })
}));

// Test wrapper component
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <ComponentDisplayProvider
      projectId="test-project"
      selectedLandscape="test-landscape"
      selectedLandscapeData={null}
      isCentralLandscape={false}
      noCentralLandscapes={false}
      componentHealthMap={{}}
      isLoadingHealth={false}
      expandedComponents={{}}
      onToggleExpanded={() => {}}
      system="test"
      components={[]}
    >
      {children}
    </ComponentDisplayProvider>
  );
}

describe('useComponentOwner', () => {
  it('should return team information for component with owner', () => {
    const { result } = renderHook(
      () => useComponentOwner(mockComponent),
      { wrapper: TestWrapper }
    );

    expect(result.current.teamNames).toEqual(['Alpha Team']);
    expect(result.current.teamColors).toEqual(['#3b82f6']);
    expect(result.current.owner_ids).toEqual(['team-1']);
    expect(result.current.sortKey).toBe('alpha team');
    expect(result.current.displayName).toBe('Alpha Team');
  });

  it('should return empty arrays for component without owner', () => {
    const { result } = renderHook(
      () => useComponentOwner(mockComponentWithoutOwner),
      { wrapper: TestWrapper }
    );

    expect(result.current.teamNames).toEqual([]);
    expect(result.current.teamColors).toEqual([]);
    expect(result.current.owner_ids).toEqual([]);
    expect(result.current.sortKey).toBe('');
    expect(result.current.displayName).toBe('Unassigned');
  });

  it('should handle component with unknown owner_ids', () => {
    const componentWithUnknownOwner: Component = {
      ...mockComponent,
      owner_ids: ['unknown-team'],
    };

    const { result } = renderHook(
      () => useComponentOwner(componentWithUnknownOwner),
      { wrapper: TestWrapper }
    );

    expect(result.current.teamNames).toEqual([]);
    expect(result.current.teamColors).toEqual([]);
    expect(result.current.owner_ids).toEqual(['unknown-team']);
    expect(result.current.sortKey).toBe('');
    expect(result.current.displayName).toBe('Unassigned');
  });

  it('should handle component with null owner_ids', () => {
    const componentWithNullOwner: Component = {
      ...mockComponent,
      owner_ids: null as any,
    };

    const { result } = renderHook(
      () => useComponentOwner(componentWithNullOwner),
      { wrapper: TestWrapper }
    );

    expect(result.current.teamNames).toEqual([]);
    expect(result.current.teamColors).toEqual([]);
    expect(result.current.owner_ids).toEqual([]);
    expect(result.current.sortKey).toBe('');
    expect(result.current.displayName).toBe('Unassigned');
  });
});
