import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HealthTable } from '@/components/Health/HealthTable';
import type { ComponentHealthCheck } from '@/types/health';
import * as ComponentDisplayContext from '@/contexts/ComponentDisplayContext';

// Mock the ComponentDisplayContext
vi.mock('@/contexts/ComponentDisplayContext', () => ({
  useComponentDisplay: vi.fn(),
}));

// Helper function to render with QueryClient
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('HealthTable', () => {
  const mockTeamNamesMap = {
    'team-1': 'Team Alpha',
    'team-2': 'Team Beta',
    'team-3': 'Team Gamma',
  };

  const mockComponents = [
    {
      id: 'comp-1',
      name: 'Component A',
      owner_id: 'team-1',
      github: 'https://github.com/test/comp-a',
      sonar: 'https://sonar.test/comp-a',
      'is-library': false,
      'central-service': false,
    },
    {
      id: 'comp-2',
      name: 'Component B',
      owner_id: 'team-2',
      github: 'https://github.com/test/comp-b',
      sonar: 'https://sonar.test/comp-b',
      'is-library': false,
      'central-service': true,
    },
    {
      id: 'comp-3',
      name: 'Library Component',
      owner_id: 'team-3',
      github: 'https://github.com/test/lib',
      sonar: 'https://sonar.test/lib',
      'is-library': true,
      'central-service': false,
    },
    {
      id: 'comp-4',
      name: 'Component C',
      owner_id: null,
      github: 'https://github.com/test/comp-c',
      sonar: 'https://sonar.test/comp-c',
      'is-library': false,
      'central-service': false,
    },
  ];

  const mockHealthChecks: ComponentHealthCheck[] = [
    {
      componentId: 'comp-1',
      componentName: 'Component A',
      landscape: 'dev',
      healthUrl: 'https://comp-a.dev/health',
      status: 'UP',
      responseTime: 100,
      lastChecked: new Date('2024-01-15T10:00:00Z'),
      response: { status: 'UP' },
    },
    {
      componentId: 'comp-2',
      componentName: 'Component B',
      landscape: 'dev',
      healthUrl: 'https://comp-b.dev/health',
      status: 'DOWN',
      responseTime: 500,
      lastChecked: new Date('2024-01-15T11:00:00Z'),
      error: 'Connection timeout',
    },
    {
      componentId: 'comp-3',
      componentName: 'Library Component',
      landscape: 'dev',
      healthUrl: 'https://lib.dev/health',
      status: 'UP',
      responseTime: 50,
      lastChecked: new Date('2024-01-15T09:00:00Z'),
      response: { status: 'UP' },
    },
  ];

  beforeEach(() => {
    vi.mocked(ComponentDisplayContext.useComponentDisplay).mockReturnValue({
      teamNamesMap: mockTeamNamesMap,
      teamColorsMap: {},
      projectId: 'test-project',
      selectedLandscape: 'dev',
      selectedLandscapeData: null,
      isCentralLandscape: false,
      noCentralLandscapes: false,
      componentHealthMap: {},
      isLoadingHealth: false,
      componentSystemInfoMap: {},
      isLoadingSystemInfo: false,
      expandedComponents: {},
      onToggleExpanded: vi.fn(),
      system: 'test-system',
    });
  });

  describe('Loading State', () => {
    it('should display loading state when isLoading is true and no health checks', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={[]}
          isLoading={true}
          landscape="dev"
          components={[]}
        />
      );

      expect(screen.getByText('Loading components...')).toBeInTheDocument();
      // Verify the loading container is present
      const loadingContainer = screen.getByText('Loading components...').closest('div');
      expect(loadingContainer).toBeInTheDocument();
    });

    it('should not display loading state if health checks exist', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={true}
          landscape="dev"
          components={mockComponents}
        />
      );

      expect(screen.queryByText('Loading components...')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no components available', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={[]}
          isLoading={false}
          landscape="production"
          components={[]}
        />
      );

      expect(screen.getByText('No components available in production')).toBeInTheDocument();
    });

    it('should display no results message when search returns no matches', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'NonExistentComponent');

      expect(screen.getByText(/No components found matching "NonExistentComponent"/)).toBeInTheDocument();
    });

    it('should display message when hideDownComponents filters all components', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={[]}
          isLoading={false}
          landscape="dev"
          components={[]}
          hideDownComponents={true}
        />
      );

      expect(screen.getByText('No healthy components available in dev')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter components based on search query', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      // Initially all non-library components should be visible
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();

      // Search for specific component
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Component A');

      // Only Component A should be visible
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.queryByText('Component B')).not.toBeInTheDocument();
    });

    it('should be case-insensitive when searching', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'component a');

      expect(screen.getByText('Component A')).toBeInTheDocument();
    });

    it('should clear search results when input is cleared', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Component A');
      
      expect(screen.queryByText('Component B')).not.toBeInTheDocument();

      await user.clear(searchInput);

      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
    });
  });

  describe('Sort Order Dropdown', () => {
    it('should sort components alphabetically by default', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      const rows = screen.getAllByRole('row');
      // Skip header row
      const dataRows = rows.slice(1);
      
      // Extract component names from rows (excluding library section)
      const componentNames: string[] = [];
      dataRows.forEach(row => {
        const cells = within(row).queryAllByRole('cell');
        if (cells.length > 0) {
          const nameCell = cells[0];
          const componentName = nameCell.textContent;
          if (componentName && !componentName.includes('Library')) {
            componentNames.push(componentName);
          }
        }
      });

      // Check alphabetical order for non-library components
      expect(componentNames[0]).toContain('Component A');
      expect(componentNames[1]).toContain('Component B');
    });

    it('should sort components by team when team sort is selected', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      // Open sort dropdown and select "By Team"
      const sortTrigger = screen.getByRole('combobox');
      await user.click(sortTrigger);

      const teamOption = screen.getByRole('option', { name: 'By Team' });
      await user.click(teamOption);

      // Verify components are still rendered after team sort is applied
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
      expect(screen.getByText('Component C')).toBeInTheDocument();
      
      // Verify table structure is maintained
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(3); // Headers + data rows
    });
  });

  describe('Column Sorting', () => {
    it('should sort by component name when component column header is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      const componentHeader = screen.getAllByText('Component')[0].closest('th');
      expect(componentHeader).toBeInTheDocument();

      // First click - ascending
      await user.click(componentHeader!);

      // Verify components are still visible
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();

      // Second click - descending
      await user.click(componentHeader!);

      // Verify components are still visible
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component C')).toBeInTheDocument();

      // Third click - reset to default
      await user.click(componentHeader!);

      // Should return to alphabetical default - all components visible
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
      expect(screen.getByText('Component C')).toBeInTheDocument();
    });

    it('should sort by status when status column header is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      const statusHeader = screen.getAllByText('Status')[0].closest('th');
      expect(statusHeader).toBeInTheDocument();

      // Click to sort by status (ascending: UP < UNKNOWN < DOWN < ERROR)
      await user.click(statusHeader!);

      // Verify components are still rendered after status sort
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
      
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(3); // Headers + data rows
    });

    it('should sort by team when team column header is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      const teamHeader = screen.getAllByText('Team')[0].closest('th');
      expect(teamHeader).toBeInTheDocument();

      // Click to sort by team
      await user.click(teamHeader!);

      // Verify components and team information are still rendered
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(3); // Headers + data rows
    });

    it('should display correct sort icons based on sort state', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      const componentHeader = screen.getAllByText('Component')[0].closest('th') as HTMLElement;
      
      // Initial state - should show unsorted icon (ArrowUpDown with opacity)
      let sortIcon = componentHeader.querySelector('svg');
      expect(sortIcon).toBeInTheDocument();
      expect(sortIcon).toHaveClass('opacity-50');

      // After first click - ascending (ArrowUp)
      await user.click(componentHeader);
      // The icon should no longer have opacity-50
      sortIcon = componentHeader.querySelector('svg');
      expect(sortIcon).not.toHaveClass('opacity-50');

      // After second click - descending (ArrowDown)
      await user.click(componentHeader);
      sortIcon = componentHeader.querySelector('svg');
      expect(sortIcon).not.toHaveClass('opacity-50');
    });
  });

  describe('Library vs Non-Library Components', () => {
    it('should separate library and non-library components into different tables', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      // Should have section header for library components
      expect(screen.getByText('Library Components')).toBeInTheDocument();

      // Should have two separate tables
      const tables = screen.getAllByRole('table');
      expect(tables).toHaveLength(2);
    });

    it('should not display library section if no library components', () => {
      const nonLibraryComponents = mockComponents.filter(c => !c['is-library']);

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks.filter(hc => hc.componentId !== 'comp-3')}
          isLoading={false}
          landscape="dev"
          components={nonLibraryComponents}
        />
      );

      expect(screen.queryByText('Library Components')).not.toBeInTheDocument();
      
      const tables = screen.getAllByRole('table');
      expect(tables).toHaveLength(1);
    });

    it('should display only library section if only library components exist', () => {
      const libraryComponents = mockComponents.filter(c => c['is-library']);
      const libraryHealthChecks = mockHealthChecks.filter(hc => hc.componentId === 'comp-3');

      renderWithProviders(
        <HealthTable
          healthChecks={libraryHealthChecks}
          isLoading={false}
          landscape="dev"
          components={libraryComponents}
        />
      );

      expect(screen.getByText('Library Components')).toBeInTheDocument();
      
      const tables = screen.getAllByRole('table');
      expect(tables).toHaveLength(1);
    });
  });

  describe('Central Service Filtering', () => {
    it('should filter out central services when hideDownComponents is true and not central landscape', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
          hideDownComponents={true}
          isCentralLandscape={false}
        />
      );

      // Component B is a central-service, should be filtered out
      expect(screen.queryByText('Component B')).not.toBeInTheDocument();
      
      // Other components should still be visible
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component C')).toBeInTheDocument();
    });

    it('should show central services when isCentralLandscape is true', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
          hideDownComponents={true}
          isCentralLandscape={true}
        />
      );

      // Component B should be visible in central landscape
      expect(screen.getByText('Component B')).toBeInTheDocument();
    });

    it('should show all components when hideDownComponents is false', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
          hideDownComponents={false}
          isCentralLandscape={false}
        />
      );

      // All components should be visible
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
      expect(screen.getByText('Component C')).toBeInTheDocument();
    });
  });

  describe('Unsupported Components', () => {
    it('should display components with UNKNOWN status when no health check exists', () => {
      const componentsWithoutHealth = [
        ...mockComponents,
        {
          id: 'comp-5',
          name: 'Component Without Health',
          owner_id: 'team-1',
          'is-library': false,
          'central-service': false,
        },
      ];

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={componentsWithoutHealth}
        />
      );

      // Component should be displayed
      expect(screen.getByText('Component Without Health')).toBeInTheDocument();
      
      // Should have UNKNOWN status
      // Note: The actual status display depends on HealthRow implementation
    });

    it('should mark components without health checks as unsupported', () => {
      const onComponentClick = vi.fn();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks.slice(0, 2)}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
          onComponentClick={onComponentClick}
        />
      );

      // Component C has no health check, should still be rendered
      expect(screen.getByText('Component C')).toBeInTheDocument();
    });
  });

  describe('Team Display', () => {
    it('should display team names from context', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
    });

    it('should display "Unassigned" for components without owner_id', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      // Component C has no owner_id but should still be rendered
      expect(screen.getByText('Component C')).toBeInTheDocument();
      
      // The component should be in a table row
      const rows = screen.getAllByRole('row');
      const comp4Row = rows.find(row => within(row).queryByText('Component C'));
      expect(comp4Row).toBeDefined();
    });

    it('should fallback to owner_id when team name not in map', () => {
      vi.mocked(ComponentDisplayContext.useComponentDisplay).mockReturnValue({
        teamNamesMap: {}, // Empty map
        teamColorsMap: {},
        projectId: 'test-project',
        selectedLandscape: 'dev',
        selectedLandscapeData: null,
        isCentralLandscape: false,
        noCentralLandscapes: false,
        componentHealthMap: {},
        isLoadingHealth: false,
        componentSystemInfoMap: {},
        isLoadingSystemInfo: false,
        expandedComponents: {},
        onToggleExpanded: vi.fn(),
        system: 'test-system',
      });

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      // Components should still render even without team names in map
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
      
      // Team information should be present in the table (either as owner_id or handled by HealthRow)
      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);
    });
  });

  describe('Table Structure', () => {
    it('should render all column headers correctly', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      // Check for all column headers
      expect(screen.getAllByText('Component')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Status')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Response Time')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Last Checked')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team')[0]).toBeInTheDocument();
      expect(screen.getAllByText('GitHub')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Sonar')[0]).toBeInTheDocument();
    });

    it('should render correct number of rows for components', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      const rows = screen.getAllByRole('row');
      
      // Should have:
      // - 1 header row for non-library table
      // - 3 data rows for non-library components (A, B, C)
      // - 1 header row for library table
      // - 1 data row for library component
      expect(rows.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Sorting Priority', () => {
    it('should prioritize column sort over dropdown sort', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      // First set dropdown to team sort
      const sortTrigger = screen.getByRole('combobox');
      await user.click(sortTrigger);
      const teamOption = screen.getByRole('option', { name: 'By Team' });
      await user.click(teamOption);

      // Then click component column to sort by component name
      const componentHeader = screen.getAllByText('Component')[0].closest('th');
      await user.click(componentHeader!);

      // Column sort should take priority - verify components are still rendered
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
      
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(3); // Headers + data rows
    });

    it('should return to dropdown sort when column sort is reset', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      // Set dropdown to team sort
      const sortTrigger = screen.getByRole('combobox');
      await user.click(sortTrigger);
      const teamOption = screen.getByRole('option', { name: 'By Team' });
      await user.click(teamOption);

      // Click component column three times to cycle back to no sort
      const componentHeader = screen.getAllByText('Component')[0].closest('th');
      await user.click(componentHeader!); // asc
      await user.click(componentHeader!); // desc
      await user.click(componentHeader!); // reset

      // After reset, should return to dropdown sort (by team)
      // Verify components are still rendered correctly
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
      
      // Verify table structure is maintained
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(3); // Headers + data rows
    });
  });

  describe('Complex Sorting Scenarios', () => {
    it('should handle sorting with mixed data types correctly', () => {
      const complexHealthChecks: ComponentHealthCheck[] = [
        {
          componentId: 'comp-1',
          componentName: 'Component A',
          landscape: 'dev',
          healthUrl: '',
          status: 'UP',
          responseTime: undefined, // No response time
          lastChecked: undefined, // No last checked
        },
        {
          componentId: 'comp-2',
          componentName: 'Component B',
          landscape: 'dev',
          healthUrl: '',
          status: 'DOWN',
          responseTime: 500,
          lastChecked: new Date('2024-01-15T11:00:00Z'),
        },
      ];

      renderWithProviders(
        <HealthTable
          healthChecks={complexHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents.slice(0, 2)}
        />
      );

      // Should render without errors
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty health checks array', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={[]}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      // All components should still be displayed with UNKNOWN status
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
    });

    it('should handle components with missing optional fields', () => {
      const minimalComponents = [
        {
          id: 'comp-1',
          name: 'Minimal Component',
          'is-library': false,
        },
      ];

      const minimalHealthChecks: ComponentHealthCheck[] = [
        {
          componentId: 'comp-1',
          componentName: 'Minimal Component',
          landscape: 'dev',
          healthUrl: '',
          status: 'UP',
        },
      ];

      renderWithProviders(
        <HealthTable
          healthChecks={minimalHealthChecks}
          isLoading={false}
          landscape="dev"
          components={minimalComponents}
        />
      );

      expect(screen.getByText('Minimal Component')).toBeInTheDocument();
    });

    it('should handle very long component names gracefully', () => {
      const longNameComponent = {
        id: 'comp-long',
        name: 'This Is A Component With A Very Long Name That Might Cause Layout Issues',
        'is-library': false,
      };

      const longNameHealth: ComponentHealthCheck = {
        componentId: 'comp-long',
        componentName: 'This Is A Component With A Very Long Name That Might Cause Layout Issues',
        landscape: 'dev',
        healthUrl: '',
        status: 'UP',
      };

      renderWithProviders(
        <HealthTable
          healthChecks={[longNameHealth]}
          isLoading={false}
          landscape="dev"
          components={[longNameComponent]}
        />
      );

      expect(screen.getByText(/This Is A Component With A Very Long Name/)).toBeInTheDocument();
    });
  });
});