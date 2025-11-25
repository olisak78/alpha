import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentsTabContent } from '../../src/components/ComponentsTabContent';
import type { Component } from '../../src/types/api';
import '@testing-library/jest-dom/vitest';

// Mock TeamComponents
vi.mock('../../src/components/Team/TeamComponents', () => ({
  TeamComponents: ({ components }: { components: Component[] }) => (
    <div data-testid="team-components">
      {components.map((c) => (
        <div key={c.id} data-testid={`component-${c.id}`}>
          {c.name}
        </div>
      ))}
    </div>
  ),
}));

const mockComponents: Component[] = [
  {
    id: 'comp-1',
    name: 'accounts-service',
    title: 'Accounts Service',
    description: 'Handles account management',
    owner_id: 'team-1',
    project_id: 'proj-1',
  },
  {
    id: 'comp-2',
    name: 'billing-service',
    title: 'Billing Service',
    description: 'Handles billing',
    owner_id: 'team-2',
    project_id: 'proj-1',
  },
];

const defaultProps = {
  title: 'Test Components',
  components: mockComponents,
  teamName: 'Test Team',
  isLoading: false,
  error: null,
  teamComponentsExpanded: {},
  onToggleExpanded: vi.fn(),
  system: 'test',
  teamNamesMap: {
    'team-1': 'Team Alpha',
    'team-2': 'Team Beta',
  },
  teamColorsMap: {},
  sortOrder: 'alphabetic' as const,
  componentHealthMap: {},
  isLoadingHealth: false,
};

describe('ComponentsTabContent', () => {
  it('should render without Card wrapper', () => {
    const { container } = render(<ComponentsTabContent {...defaultProps} />);
    
    // Should not have Card component structure
    expect(container.querySelector('[class*="card"]')).toBeNull();
    
    // Should have space-y-4 wrapper
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('space-y-4');
  });

  it('should render search input when onSearchTermChange is provided', () => {
    const onSearchTermChange = vi.fn();
    render(
      <ComponentsTabContent
        {...defaultProps}
        searchTerm=""
        onSearchTermChange={onSearchTermChange}
      />
    );

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search components...');
  });

  it('should render sort dropdown when onSortOrderChange is provided', () => {
    const onSortOrderChange = vi.fn();
    render(
      <ComponentsTabContent
        {...defaultProps}
        searchTerm=""
        onSearchTermChange={vi.fn()}
        onSortOrderChange={onSortOrderChange}
      />
    );

    // Sort dropdown should be rendered
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should NOT render viewSwitcher in controls section', () => {
    const viewSwitcher = <div data-testid="view-switcher">View Switcher</div>;
    const { container } = render(
      <ComponentsTabContent
        {...defaultProps}
        searchTerm=""
        onSearchTermChange={vi.fn()}
        onSortOrderChange={vi.fn()}
        viewSwitcher={viewSwitcher}
      />
    );

    // viewSwitcher should not be in the controls section
    const controlsSection = container.querySelector('.flex.items-center.gap-4');
    expect(controlsSection).not.toContainElement(screen.queryByTestId('view-switcher'));
  });

  it('should render refresh button when showRefreshButton is true', () => {
    const onRefresh = vi.fn();
    render(
      <ComponentsTabContent
        {...defaultProps}
        searchTerm=""
        onSearchTermChange={vi.fn()}
        onRefresh={onRefresh}
        showRefreshButton={true}
      />
    );

    const refreshButton = screen.getByRole('button');
    expect(refreshButton).toBeInTheDocument();
  });

  it('should call onSearchTermChange when typing in search', () => {
    const onSearchTermChange = vi.fn();
    render(
      <ComponentsTabContent
        {...defaultProps}
        searchTerm=""
        onSearchTermChange={onSearchTermChange}
      />
    );

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'account' } });

    expect(onSearchTermChange).toHaveBeenCalledWith('account');
  });

  it('should filter components based on search term', () => {
    const { rerender } = render(
      <ComponentsTabContent
        {...defaultProps}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('component-comp-1')).toBeInTheDocument();
    expect(screen.getByTestId('component-comp-2')).toBeInTheDocument();

    rerender(
      <ComponentsTabContent
        {...defaultProps}
        searchTerm="accounts"
        onSearchTermChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('component-comp-1')).toBeInTheDocument();
    expect(screen.queryByTestId('component-comp-2')).not.toBeInTheDocument();
  });

  it('should sort components alphabetically by default', () => {
    render(
      <ComponentsTabContent
        {...defaultProps}
        searchTerm=""
        onSearchTermChange={vi.fn()}
        sortOrder="alphabetic"
      />
    );

    const teamComponents = screen.getByTestId('team-components');
    const componentElements = teamComponents.querySelectorAll('[data-testid^="component-"]');
    
    expect(componentElements[0]).toHaveTextContent('accounts-service');
    expect(componentElements[1]).toHaveTextContent('billing-service');
  });

  it('should render loading state with white background', () => {
    const { container } = render(
      <ComponentsTabContent {...defaultProps} isLoading={true} />
    );

    expect(screen.getByText('Loading components...')).toBeInTheDocument();
    
    // Should have white background card
    const loadingCard = container.querySelector('.bg-white.dark\\:bg-\\[\\#0D0D0D\\]');
    expect(loadingCard).toBeInTheDocument();
  });

  it('should render error state', () => {
    const error = new Error('Failed to load components');
    render(<ComponentsTabContent {...defaultProps} error={error} />);

    // Use a more flexible text matcher for error messages
    expect(screen.getByText(/Error loading components/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load components/i)).toBeInTheDocument();
  });

  it('should render empty state with white background', () => {
    render(
      <ComponentsTabContent
        {...defaultProps}
        components={[]}
        emptyStateMessage="No components found"
      />
    );

    expect(screen.getByText('No components found')).toBeInTheDocument();
    
    // Empty state should have white background
    const emptyStateCard = screen.getByText('No components found').closest('.bg-white');
    expect(emptyStateCard).toBeInTheDocument();
  });

  it('should render TeamComponents when components are available', () => {
    render(<ComponentsTabContent {...defaultProps} />);

    expect(screen.getByTestId('team-components')).toBeInTheDocument();
    expect(screen.getByTestId('component-comp-1')).toBeInTheDocument();
    expect(screen.getByTestId('component-comp-2')).toBeInTheDocument();
  });

  it('should not render search section when onSearchTermChange is not provided', () => {
    render(<ComponentsTabContent {...defaultProps} />);

    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
  });

  it('should render library components in separate section', () => {
    const componentsWithLibrary: Component[] = [
      {
        id: 'comp-1',
        name: 'accounts-service',
        title: 'Accounts Service',
        description: 'Handles account management',
        owner_id: 'team-1',
        project_id: 'proj-1',
      },
      {
        id: 'comp-2',
        name: 'ui-library',
        title: 'UI Library',
        description: 'Shared UI components',
        owner_id: 'team-2',
        project_id: 'proj-1',
        'is-library': true,
      },
    ];

    render(
      <ComponentsTabContent
        {...defaultProps}
        components={componentsWithLibrary}
      />
    );

    // Should render the "Library Components" heading
    expect(screen.getByText('Library Components')).toBeInTheDocument();
    
    // Should render both library and non-library components
    expect(screen.getByTestId('component-comp-1')).toBeInTheDocument(); // non-library
    expect(screen.getByTestId('component-comp-2')).toBeInTheDocument(); // library
  });
});
