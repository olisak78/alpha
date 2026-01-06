import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ComponentsTab from '../../src/components/tabs/ComponentsTab';
import type { Component } from '../../src/types/api';
import '@testing-library/jest-dom/vitest';

// Mock ComponentCard component
vi.mock('../../src/components/ComponentCard', () => ({
  default: ({ component, system }: { component: Component; system: string }) => (
    <div data-testid={`component-card-${component.id}`}>
      <div data-testid="component-name">{component.name}</div>
      <div data-testid="component-title">{component.title}</div>
      <div data-testid="component-description">{component.description}</div>
      <div data-testid="component-system">{system}</div>
    </div>
  ),
}));

// Mock UI components
vi.mock('../../src/components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, className, ...props }: any) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  ),
}));

vi.mock('../../src/components/ui/button', () => ({
  Button: ({ children, variant, size, ...props }: any) => (
    <button
      data-testid="filter-button"
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
}));

const mockComponents: Component[] = [
  {
    id: 'comp-1',
    name: 'accounts-service',
    title: 'Accounts Service',
    description: 'Handles account management and user authentication',
    owner_id: 'team-1',
    project_id: 'proj-1',
  },
  {
    id: 'comp-2',
    name: 'billing-service',
    title: 'Billing Service',
    description: 'Manages billing and payment processing',
    owner_id: 'team-2',
    project_id: 'proj-1',
  },
  {
    id: 'comp-3',
    name: 'notification-service',
    title: 'Notification Service',
    description: 'Sends notifications to users',
    owner_id: 'team-1',
    project_id: 'proj-2',
  },
];

const defaultProps = {
  components: mockComponents,
  selectedLandscape: 'prod',
  selectedLandscapeName: 'Production',
  expandedComponents: {},
  onToggleExpanded: vi.fn(),
  getComponentHealth: vi.fn().mockReturnValue('healthy'),
  getComponentAlerts: vi.fn().mockReturnValue(false),
  system: 'test-system',
};

describe('ComponentsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all UI elements with correct structure and styling', () => {
      const { container } = render(<ComponentsTab {...defaultProps} />);

      // Check search input with correct attributes
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search components...');
      expect(searchInput).toHaveClass('pl-10');

      // Check filter button with correct styling
      const filterButton = screen.getByTestId('filter-button');
      expect(filterButton).toBeInTheDocument();
      expect(filterButton).toHaveAttribute('data-variant', 'outline');
      expect(filterButton).toHaveAttribute('data-size', 'sm');
      expect(filterButton).toHaveTextContent('Filter');

      // Check icons are rendered
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();

      // Check CSS structure
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('space-y-6');
      expect(container.querySelector('.flex.items-center.gap-4')).toBeInTheDocument();
      expect(container.querySelector('.grid.gap-6')).toBeInTheDocument();

      // Check all components are rendered
      expect(screen.getByTestId('component-card-comp-1')).toBeInTheDocument();
      expect(screen.getByTestId('component-card-comp-2')).toBeInTheDocument();
      expect(screen.getByTestId('component-card-comp-3')).toBeInTheDocument();
    });

    it('should render empty state correctly', () => {
      render(<ComponentsTab {...defaultProps} components={[]} />);

      // UI elements should still be rendered
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('filter-button')).toBeInTheDocument();

      // No component cards should be rendered
      expect(screen.queryByTestId('component-card-comp-1')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter components by name and description with case insensitivity', async () => {
      render(<ComponentsTab {...defaultProps} />);
      const searchInput = screen.getByTestId('search-input');

      // Initially all components visible
      expect(screen.getByTestId('component-card-comp-1')).toBeInTheDocument();
      expect(screen.getByTestId('component-card-comp-2')).toBeInTheDocument();
      expect(screen.getByTestId('component-card-comp-3')).toBeInTheDocument();

      // Search by name (case insensitive)
      fireEvent.change(searchInput, { target: { value: 'ACCOUNTS' } });
      await waitFor(() => {
        expect(screen.getByTestId('component-card-comp-1')).toBeInTheDocument();
        expect(screen.queryByTestId('component-card-comp-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('component-card-comp-3')).not.toBeInTheDocument();
      });

      // Search by description
      fireEvent.change(searchInput, { target: { value: 'billing' } });
      await waitFor(() => {
        expect(screen.queryByTestId('component-card-comp-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('component-card-comp-2')).toBeInTheDocument();
        expect(screen.queryByTestId('component-card-comp-3')).not.toBeInTheDocument();
      });

      // No results
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      await waitFor(() => {
        expect(screen.queryByTestId('component-card-comp-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('component-card-comp-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('component-card-comp-3')).not.toBeInTheDocument();
      });

      // Clear search shows all components
      fireEvent.change(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByTestId('component-card-comp-1')).toBeInTheDocument();
        expect(screen.getByTestId('component-card-comp-2')).toBeInTheDocument();
        expect(screen.getByTestId('component-card-comp-3')).toBeInTheDocument();
      });
    });

    it('should handle search input value updates', () => {
      render(<ComponentsTab {...defaultProps} />);
      const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
      
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      expect(searchInput.value).toBe('test search');
    });

    it('should handle edge cases in search', async () => {
      // Test with components without description
      const componentsWithoutDescription = [
        {
          id: 'comp-no-desc',
          name: 'test-service',
          title: 'Test Service',
          description: '',
          owner_id: 'team-1',
          project_id: 'proj-1',
        },
      ];

      const { rerender } = render(<ComponentsTab {...defaultProps} components={componentsWithoutDescription} />);
      let searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: 'test' } });
      await waitFor(() => {
        expect(screen.getByTestId('component-card-comp-no-desc')).toBeInTheDocument();
      });

      // Test with undefined description
      const componentsWithUndefinedDescription = [
        {
          id: 'comp-undefined-desc',
          name: 'undefined-service',
          title: 'Undefined Service',
          description: undefined as any,
          owner_id: 'team-1',
          project_id: 'proj-1',
        },
      ];

      rerender(<ComponentsTab {...defaultProps} components={componentsWithUndefinedDescription} />);
      searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: 'undefined' } });
      expect(screen.getByTestId('component-card-comp-undefined-desc')).toBeInTheDocument();

      // Test with special characters
      rerender(<ComponentsTab {...defaultProps} />);
      searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: 'accounts-service' } });
      await waitFor(() => {
        expect(screen.getByTestId('component-card-comp-1')).toBeInTheDocument();
        expect(screen.queryByTestId('component-card-comp-2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Props and Data Handling', () => {
    it('should pass all required props to ComponentCard correctly', () => {
      render(<ComponentsTab {...defaultProps} />);

      // Check system prop is passed
      const systemElements = screen.getAllByTestId('component-system');
      systemElements.forEach(element => {
        expect(element).toHaveTextContent('test-system');
      });

      // Check component data is passed
      expect(screen.getByText('accounts-service')).toBeInTheDocument();
      expect(screen.getByText('Accounts Service')).toBeInTheDocument();
      expect(screen.getByText('Handles account management and user authentication')).toBeInTheDocument();
    });

    it('should handle optional props and edge cases', () => {
      // Test with optional props undefined
      const propsWithoutOptional = {
        ...defaultProps,
        selectedLandscapeName: undefined,
        selectedLandscape: null,
        expandedComponents: {},
      };

      render(<ComponentsTab {...propsWithoutOptional} />);

      expect(screen.getByTestId('component-card-comp-1')).toBeInTheDocument();
      expect(screen.getByTestId('component-card-comp-2')).toBeInTheDocument();
      expect(screen.getByTestId('component-card-comp-3')).toBeInTheDocument();
    });

    it('should handle callback functions', () => {
      const mockOnToggleExpanded = vi.fn();
      const mockGetComponentHealth = vi.fn().mockReturnValue('degraded');
      const mockGetComponentAlerts = vi.fn().mockReturnValue(true);

      render(
        <ComponentsTab
          {...defaultProps}
          onToggleExpanded={mockOnToggleExpanded}
          getComponentHealth={mockGetComponentHealth}
          getComponentAlerts={mockGetComponentAlerts}
        />
      );

      // Verify component renders with callback props
      expect(screen.getByTestId('component-card-comp-1')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large number of components efficiently', () => {
      const manyComponents = Array.from({ length: 100 }, (_, i) => ({
        id: `comp-${i}`,
        name: `service-${i}`,
        title: `Service ${i}`,
        description: `Description for service ${i}`,
        owner_id: `team-${i % 5}`,
        project_id: `proj-${i % 10}`,
      }));

      render(<ComponentsTab {...defaultProps} components={manyComponents} />);

      // Should render without issues
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('filter-button')).toBeInTheDocument();
      expect(screen.getByTestId('component-card-comp-0')).toBeInTheDocument();
      expect(screen.getByTestId('component-card-comp-99')).toBeInTheDocument();
    });
  });
});
