import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentsTabContent } from '@/components/ComponentsTabContent';
import type { Component } from '@/types/api';

// Mock the child components
vi.mock('@/components/Team/TeamComponents', () => ({
  TeamComponents: ({ 
    components, 
    teamName, 
    onToggleExpanded, 
    system, 
    showProjectGrouping 
  }: any) => (
    <div data-testid="team-components">
      <div data-testid="team-components-props">
        components: {components.length}, 
        teamName: {teamName}, 
        system: {system}, 
        showProjectGrouping: {showProjectGrouping?.toString()}
      </div>
      {components.map((comp: Component) => (
        <div key={comp.id} data-testid={`component-${comp.id}`}>
          {comp.name}
          <button onClick={() => onToggleExpanded(comp.id)}>
            Toggle {comp.id}
          </button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('@/components/ComponentsSearchFilter', () => ({
  ComponentsSearchFilter: ({ searchTerm, setSearchTerm }: any) => (
    <div data-testid="components-search-filter">
      <input
        data-testid="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search components"
      />
    </div>
  )
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-testid="badge" {...props}>{children}</span>
  )
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => (
    <div data-testid="alert" {...props}>{children}</div>
  ),
  AlertDescription: ({ children }: any) => (
    <div data-testid="alert-description">{children}</div>
  )
}));

// Mock icons
vi.mock('lucide-react', () => ({
  RefreshCw: ({ className }: any) => (
    <div data-testid="refresh-icon" className={className}>RefreshCw</div>
  ),
  AlertCircle: ({ className }: any) => (
    <div data-testid="alert-icon" className={className}>AlertCircle</div>
  )
}));

// Test data
const mockComponents: Component[] = [
  {
    id: 'comp-1',
    name: 'test-component-1',
    title: 'Test Component 1',
    description: 'First test component',
    project_id: 'proj-1',
    owner_id: 'owner-1',
    github: 'https://github.com/test/repo1',
    sonar: 'https://sonar.test/comp1'
  },
  {
    id: 'comp-2', 
    name: 'test-component-2',
    title: 'Test Component 2',
    description: 'Second test component',
    project_id: 'proj-2',
    owner_id: 'owner-2',
    github: 'https://github.com/test/repo2'
  },
  {
    id: 'comp-3',
    name: 'search-me',
    title: 'Searchable Component',
    description: 'This component should be found in search',
    project_id: 'proj-3',
    owner_id: 'owner-3'
  }
];

const defaultProps = {
  title: 'Test Components',
  components: mockComponents,
  teamName: 'test-team',
  isLoading: false,
  error: null,
  teamComponentsExpanded: {},
  onToggleExpanded: vi.fn(),
  system: 'test-system'
};

describe('ComponentsTabContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders title, badge, and TeamComponents with correct props', () => {
      const mockToggle = vi.fn();
      render(<ComponentsTabContent {...defaultProps} onToggleExpanded={mockToggle} />);
      
      // Title and badge
      expect(screen.getByText('Test Components')).toBeInTheDocument();
      expect(screen.getByTestId('badge')).toHaveTextContent('3');
      
      // TeamComponents integration
      const teamComponents = screen.getByTestId('team-components');
      expect(teamComponents).toBeInTheDocument();
      
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 3');
      expect(propsText).toHaveTextContent('teamName: test-team');
      expect(propsText).toHaveTextContent('system: test-system');
      expect(propsText).toHaveTextContent('showProjectGrouping: false');
      
      // onToggleExpanded callback
      const toggleButton = screen.getByText('Toggle comp-1');
      fireEvent.click(toggleButton);
      expect(mockToggle).toHaveBeenCalledWith('comp-1');
    });
  });

  describe('Loading State', () => {
    it('displays loading state and hides other content when loading', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          isLoading={true} 
          onSearchTermChange={vi.fn()} 
        />
      );
      
      // Loading indicators
      expect(screen.getByText('Loading test-team components...')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toHaveClass('animate-spin');
      
      // Hidden content during loading
      expect(screen.queryByTestId('team-components')).not.toBeInTheDocument();
      expect(screen.queryByTestId('components-search-filter')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error alert and hides other content when error occurs', () => {
      const error = new Error('Failed to fetch components');
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          error={error}
          onSearchTermChange={vi.fn()} 
        />
      );
      
      // Error display
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert-description')).toHaveTextContent(
        'Failed to load test-team components: Failed to fetch components'
      );
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      
      // Hidden content during error
      expect(screen.queryByTestId('team-components')).not.toBeInTheDocument();
      expect(screen.queryByTestId('components-search-filter')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search filter when onSearchTermChange is provided and not loading/error', () => {
      const mockSearchChange = vi.fn();
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          onSearchTermChange={mockSearchChange}
          searchTerm="test"
        />
      );
      
      expect(screen.getByTestId('components-search-filter')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toHaveValue('test');
    });

    it('does not render search filter when onSearchTermChange is not provided', () => {
      render(<ComponentsTabContent {...defaultProps} />);
      
      expect(screen.queryByTestId('components-search-filter')).not.toBeInTheDocument();
    });

    it('calls onSearchTermChange when search input changes', () => {
      const mockSearchChange = vi.fn();
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          onSearchTermChange={mockSearchChange}
          searchTerm=""
        />
      );
      
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'search-me' } });
      
      expect(mockSearchChange).toHaveBeenCalledWith('search-me');
    });

    it('filters components based on component name', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          searchTerm="search-me"
          onSearchTermChange={vi.fn()}
        />
      );
      
      // Should only show 1 component (search-me) in the filtered results
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 1');
      
      // Should show the specific component
      expect(screen.getByTestId('component-comp-3')).toBeInTheDocument();
      expect(screen.queryByTestId('component-comp-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('component-comp-2')).not.toBeInTheDocument();
    });

    it('filters components based on title', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          searchTerm="Searchable"
          onSearchTermChange={vi.fn()}
        />
      );
      
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 1');
      expect(screen.getByTestId('component-comp-3')).toBeInTheDocument();
    });

    it('filters components based on description', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          searchTerm="found in search"
          onSearchTermChange={vi.fn()}
        />
      );
      
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 1');
      expect(screen.getByTestId('component-comp-3')).toBeInTheDocument();
    });

    it('is case insensitive', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          searchTerm="SEARCH-ME"
          onSearchTermChange={vi.fn()}
        />
      );
      
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 1');
      expect(screen.getByTestId('component-comp-3')).toBeInTheDocument();
    });

    it('shows all components when search term is empty', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          searchTerm=""
          onSearchTermChange={vi.fn()}
        />
      );
      
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 3');
    });

    it('shows all components when search term is only whitespace', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          searchTerm="   "
          onSearchTermChange={vi.fn()}
        />
      );
      
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 3');
    });

    it('updates badge count based on filtered results', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          searchTerm="search-me"
          onSearchTermChange={vi.fn()}
        />
      );
      
      expect(screen.getByTestId('badge')).toHaveTextContent('1');
    });

    it('handles components with display_name property', () => {
      const componentsWithDisplayName = [
        {
          ...mockComponents[0],
          display_name: 'Display Name Component'
        }
      ];
      
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          components={componentsWithDisplayName}
          searchTerm="Display Name"
          onSearchTermChange={vi.fn()}
        />
      );
      
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 1');
    });
  });

  describe('Refresh Functionality', () => {
    it('renders refresh button when showRefreshButton is true and onRefresh is provided', () => {
      const mockRefresh = vi.fn();
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          showRefreshButton={true}
          onRefresh={mockRefresh}
        />
      );
      
      expect(screen.getByTestId('button')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('does not render refresh button when showRefreshButton is false', () => {
      const mockRefresh = vi.fn();
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          showRefreshButton={false}
          onRefresh={mockRefresh}
        />
      );
      
      expect(screen.queryByText('Refresh')).not.toBeInTheDocument();
    });

    it('does not render refresh button when onRefresh is not provided', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          showRefreshButton={true}
        />
      );
      
      expect(screen.queryByText('Refresh')).not.toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', () => {
      const mockRefresh = vi.fn();
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          showRefreshButton={true}
          onRefresh={mockRefresh}
        />
      );
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('disables refresh button when loading', () => {
      const mockRefresh = vi.fn();
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          showRefreshButton={true}
          onRefresh={mockRefresh}
          isLoading={true}
        />
      );
      
      const refreshButton = screen.getByTestId('button');
      expect(refreshButton).toBeDisabled();
    });

    it('shows spinning icon when loading', () => {
      const mockRefresh = vi.fn();
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          showRefreshButton={true}
          onRefresh={mockRefresh}
          isLoading={true}
        />
      );
      
      const refreshIcon = screen.getAllByTestId('refresh-icon')[1]; // Second one is in button
      expect(refreshIcon).toHaveClass('animate-spin');
    });
  });

  describe('Additional Controls', () => {
    it('renders additional controls when provided', () => {
      const additionalControls = <div data-testid="additional-controls">Custom Controls</div>;
      
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          additionalControls={additionalControls}
        />
      );
      
      expect(screen.getByTestId('additional-controls')).toBeInTheDocument();
      expect(screen.getByText('Custom Controls')).toBeInTheDocument();
    });

    it('does not render additional controls section when not provided', () => {
      render(<ComponentsTabContent {...defaultProps} />);
      
      expect(screen.queryByTestId('additional-controls')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders TeamComponents even with empty components array', () => {
      render(<ComponentsTabContent {...defaultProps} components={[]} />);
      
      // TeamComponents should still be rendered (it handles empty state internally)
      expect(screen.getByTestId('team-components')).toBeInTheDocument();
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 0');
    });

    it('updates badge to show 0 when no components', () => {
      render(<ComponentsTabContent {...defaultProps} components={[]} />);
      
      expect(screen.getByTestId('badge')).toHaveTextContent('0');
    });
  });

  describe('Edge Cases', () => {
    it('handles components without titles gracefully', () => {
      const componentsWithoutTitles = [
        {
          id: 'comp-no-title',
          name: 'no-title-component',
          title: '',
          description: 'Component without title',
          project_id: 'proj-1',
          owner_id: 'owner-1'
        }
      ];
      
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          components={componentsWithoutTitles}
          searchTerm="no-title"
          onSearchTermChange={vi.fn()}
        />
      );
      
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 1');
    });

    it('handles components without descriptions gracefully', () => {
      const componentsWithoutDescriptions = [
        {
          id: 'comp-no-desc',
          name: 'no-desc-component',
          title: 'No Description Component',
          description: '',
          project_id: 'proj-1',
          owner_id: 'owner-1'
        }
      ];
      
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          components={componentsWithoutDescriptions}
        />
      );
      
      expect(screen.getByTestId('team-components')).toBeInTheDocument();
    });

    it('handles null/undefined search term gracefully', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          searchTerm={undefined as any}
          onSearchTermChange={vi.fn()}
        />
      );
      
      // Should show all components when searchTerm is undefined
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 3');
    });

    it('defaults searchTerm to empty string when not provided', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          onSearchTermChange={vi.fn()}
        />
      );
      
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Component Integration', () => {
    it('passes correct props to TeamComponents', () => {
      render(<ComponentsTabContent {...defaultProps} />);
      
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 3');
      expect(propsText).toHaveTextContent('teamName: test-team');
      expect(propsText).toHaveTextContent('system: test-system');
      expect(propsText).toHaveTextContent('showProjectGrouping: false');
    });

    it('passes filtered components to TeamComponents when search is active', () => {
      render(
        <ComponentsTabContent 
          {...defaultProps} 
          searchTerm="test-component-1"
          onSearchTermChange={vi.fn()}
        />
      );
      
      const propsText = screen.getByTestId('team-components-props');
      expect(propsText).toHaveTextContent('components: 1');
      expect(screen.getByTestId('component-comp-1')).toBeInTheDocument();
    });
  });

});
