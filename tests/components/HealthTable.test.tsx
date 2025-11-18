import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthTable } from '../../src/components/Health/HealthTable';
import type { ComponentHealthCheck } from '../../src/types/health';
import '@testing-library/jest-dom/vitest';


// Mock the HealthRow component
vi.mock('../../src/components/Health/HealthRow', () => ({
  HealthRow: ({ healthCheck, teamName }: any) => (
    <tr data-testid="health-row">
      <td>{healthCheck.componentName}</td>
      <td>{healthCheck.status}</td>
      <td>{teamName || 'No Team'}</td>
    </tr>
  ),
}));

describe('HealthTable', () => {
  const mockHealthChecks: ComponentHealthCheck[] = [
    {
      componentId: '1',
      componentName: 'accounts-service',
      status: 'UP',
      responseTime: 150,
      lastChecked: new Date().toISOString(),
    },
    {
      componentId: '2',
      componentName: 'billing-service',
      status: 'DOWN',
      responseTime: 0,
      lastChecked: new Date().toISOString(),
      error: 'Connection refused',
    },
  ];

  const mockComponents = [
    { id: '1', name: 'accounts-service', owner_id: 'team1' },
    { id: '2', name: 'billing-service', owner_id: 'team2' },
  ];

  const mockTeamNamesMap = {
    team1: 'Team Alpha',
    team2: 'Team Beta',
  };

  const defaultProps = {
    healthChecks: mockHealthChecks,
    isLoading: false,
    landscape: 'eu10-canary',
    teamNamesMap: mockTeamNamesMap,
    components: mockComponents,
  };

  it('should render search input', () => {
    render(<HealthTable {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search components...');
    expect(searchInput).toBeTruthy();
  });

  it('should render sort order dropdown', () => {
    render(<HealthTable {...defaultProps} />);

    const sortDropdown = screen.getByText('Alphabetic');
    expect(sortDropdown).toBeTruthy();
  });

  it('should render health checks in a table', () => {
    render(<HealthTable {...defaultProps} />);

    // Check for table headers
    expect(screen.getByText('Component')).toBeTruthy();
    expect(screen.getByText('Status')).toBeTruthy();
    expect(screen.getByText('Response Time')).toBeTruthy();
    expect(screen.getByText('Last Checked')).toBeTruthy();
    expect(screen.getByText('Team')).toBeTruthy();

    // Check for health rows
    const rows = screen.getAllByTestId('health-row');
    expect(rows).toHaveLength(2);
  });

  it('should render loading state when isLoading is true', () => {
    render(<HealthTable {...defaultProps} isLoading={true} healthChecks={[]} />);

    expect(screen.getByText('Loading components...')).toBeTruthy();
  });

  it('should sort health checks alphabetically by default', () => {
    render(<HealthTable {...defaultProps} />);

    const rows = screen.getAllByTestId('health-row');
    
    // Should be in alphabetical order
    expect(rows[0].textContent).toContain('accounts-service');
    expect(rows[1].textContent).toContain('billing-service');
  });

  it('should display team names from teamNamesMap', () => {
    render(<HealthTable {...defaultProps} />);

    expect(screen.getByText('Team Alpha')).toBeTruthy();
    expect(screen.getByText('Team Beta')).toBeTruthy();
  });

  it('should show empty state when no health checks match search', () => {
    render(<HealthTable {...defaultProps} healthChecks={[]} />);

    // Should show empty state message
    const emptyMessage = screen.getByText(/No components available/);
    expect(emptyMessage).toBeTruthy();
  });

  it('should handle health checks without team assignment', () => {
    const healthChecksWithoutTeam: ComponentHealthCheck[] = [
      {
        componentId: '3',
        componentName: 'orphan-service',
        status: 'UP',
        responseTime: 100,
        lastChecked: new Date().toISOString(),
      },
    ];

    const componentsWithoutTeam = [
      { id: '3', name: 'orphan-service', owner_id: null },
    ];

    render(
      <HealthTable
        {...defaultProps}
        healthChecks={healthChecksWithoutTeam}
        components={componentsWithoutTeam}
      />
    );

    // Should still render the row
    const rows = screen.getAllByTestId('health-row');
    expect(rows).toHaveLength(1);
    expect(screen.getByText('No Team')).toBeTruthy();
  });

  it('should render with controls section layout matching ComponentsTabContent', () => {
    const { container } = render(<HealthTable {...defaultProps} />);

    // Should have flex container with gap-4 for controls
    const controlsSection = container.querySelector('.flex.items-center.gap-4');
    expect(controlsSection).toBeTruthy();

    // Search should have max-w-md
    const searchContainer = container.querySelector('.max-w-md');
    expect(searchContainer).toBeTruthy();

    // Sort dropdown should have w-[180px]
    const sortTrigger = container.querySelector('[class*="w-\\[180px\\]"]');
    expect(sortTrigger).toBeTruthy();
  });
});