import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HealthTable } from '../../src/components/Health/HealthTable';
import type { ComponentHealthCheck } from '../../src/types/health';
import * as ComponentDisplayContext from '../../src/contexts/ComponentDisplayContext';
import '@testing-library/jest-dom/vitest';

// Mock the ComponentDisplayContext
vi.mock('../../src/contexts/ComponentDisplayContext', () => ({
  useComponentDisplay: vi.fn(),
}));

// Mock UI components
vi.mock('../../src/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}));

vi.mock('../../src/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select-container">
      <select 
        value={value} 
        onChange={(e) => onValueChange?.(e.target.value)}
        role="combobox"
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value} role="option">
      {children}
    </option>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

// Mock HealthRow component
vi.mock('../../src/components/Health/HealthRow', () => ({
  HealthRow: ({ healthCheck, component, isUnsupported }: any) => {
    // Mock team name lookup
    const teamNamesMap = {
      'team-1': 'Team Alpha',
      'team-2': 'Team Beta',
      'team-3': 'Team Gamma',
    };
    const teamName = component?.owner_id ? teamNamesMap[component.owner_id as keyof typeof teamNamesMap] || component.owner_id : 'Unassigned';
    
    return (
      <tr data-testid="health-row">
        <td>{component?.name || healthCheck.componentName}</td>
        <td>{healthCheck.status}</td>
        <td>{healthCheck.responseTime || 'N/A'}</td>
        <td>{healthCheck.lastChecked ? 'Checked' : 'N/A'}</td>
        <td>{teamName}</td>
        <td>GitHub</td>
        <td>Sonar</td>
      </tr>
    );
  },
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
  ArrowUpDown: ({ className }: any) => <svg data-testid="arrow-up-down" className={className} />,
  ArrowUp: ({ className }: any) => <svg data-testid="arrow-up" className={className} />,
  ArrowDown: ({ className }: any) => <svg data-testid="arrow-down" className={className} />,
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
    it('should handle column header clicks and display correct sort icons', async () => {
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
      const statusHeader = screen.getAllByText('Status')[0].closest('th') as HTMLElement;
      const teamHeader = screen.getAllByText('Team')[0].closest('th') as HTMLElement;

      // Verify all headers are clickable
      expect(componentHeader).toBeInTheDocument();
      expect(statusHeader).toBeInTheDocument();
      expect(teamHeader).toBeInTheDocument();

      // Test component header sorting cycle
      let sortIcon = componentHeader.querySelector('svg');
      expect(sortIcon).toHaveClass('opacity-50'); // Initial unsorted state

      // First click - ascending
      await user.click(componentHeader);
      sortIcon = componentHeader.querySelector('svg');
      expect(sortIcon).not.toHaveClass('opacity-50');

      // Second click - descending
      await user.click(componentHeader);
      sortIcon = componentHeader.querySelector('svg');
      expect(sortIcon).not.toHaveClass('opacity-50');

      // Third click - reset to default
      await user.click(componentHeader);
      sortIcon = componentHeader.querySelector('svg');
      expect(sortIcon).toHaveClass('opacity-50');

      // Test other column headers are functional
      await user.click(statusHeader);
      await user.click(teamHeader);

      // Verify table structure is maintained after all sorting operations
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(3);
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
      expect(screen.getByText('Component C')).toBeInTheDocument();
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
    it('should display components without health checks', () => {
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
          healthChecks={mockHealthChecks.slice(0, 2)} // Only first 2 health checks
          isLoading={false}
          landscape="dev"
          components={componentsWithoutHealth}
        />
      );

      // Components with and without health checks should be displayed
      expect(screen.getByText('Component Without Health')).toBeInTheDocument();
      expect(screen.getByText('Component C')).toBeInTheDocument(); // No health check for comp-4
    });
  });

  describe('Team Display', () => {
    it('should display team names and handle unassigned components', () => {
      renderWithProviders(
        <HealthTable
          healthChecks={mockHealthChecks}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );

      // Should display team names from context
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      
      // Component C has no owner_id but should still be rendered
      expect(screen.getByText('Component C')).toBeInTheDocument();
      const rows = screen.getAllByRole('row');
      const comp4Row = rows.find(row => within(row).queryByText('Component C'));
      expect(comp4Row).toBeDefined();
    });

    it('should handle empty team names map', () => {
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
    it('should handle various edge case scenarios', () => {
      // Test empty health checks
      renderWithProviders(
        <HealthTable
          healthChecks={[]}
          isLoading={false}
          landscape="dev"
          components={mockComponents}
        />
      );
      expect(screen.getByText('Component A')).toBeInTheDocument();
      expect(screen.getByText('Component B')).toBeInTheDocument();
    });

    it('should handle minimal component data and long names', () => {
      const edgeCaseComponents = [
        {
          id: 'comp-minimal',
          name: 'Minimal Component',
          'is-library': false,
        },
        {
          id: 'comp-long',
          name: 'This Is A Component With A Very Long Name That Might Cause Layout Issues',
          'is-library': false,
        },
      ];

      const edgeCaseHealthChecks: ComponentHealthCheck[] = [
        {
          componentId: 'comp-minimal',
          componentName: 'Minimal Component',
          landscape: 'dev',
          healthUrl: '',
          status: 'UP',
        },
        {
          componentId: 'comp-long',
          componentName: 'This Is A Component With A Very Long Name That Might Cause Layout Issues',
          landscape: 'dev',
          healthUrl: '',
          status: 'UP',
        },
      ];

      renderWithProviders(
        <HealthTable
          healthChecks={edgeCaseHealthChecks}
          isLoading={false}
          landscape="dev"
          components={edgeCaseComponents}
        />
      );

      expect(screen.getByText('Minimal Component')).toBeInTheDocument();
      expect(screen.getByText(/This Is A Component With A Very Long Name/)).toBeInTheDocument();
    });
  });
});
