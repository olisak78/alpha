import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom/vitest';
import { ComponentsList } from '../../src/components/ComponentsList';
import { ComponentDisplayProvider } from '../../src/contexts/ComponentDisplayContext';
import type { Component } from '../../src/types/api';
import type { ComponentHealthCheck } from '../../src/types/health';

// Mock ComponentCard since it has complex dependencies
vi.mock('../../src/components/ComponentCard', () => ({
  default: vi.fn(({ component, onClick }) => (
    <div 
      data-testid={`component-card-${component.id}`}
      onClick={() => onClick && onClick()}
    >
      <h3>{component.title || component.name}</h3>
      <p>{component.description}</p>
    </div>
  )),
}));

// Mock Badge component
vi.mock('../../src/components/ui/badge', () => ({
  Badge: vi.fn(({ children, variant, style, className }) => (
    <span 
      data-testid="badge" 
      data-variant={variant}
      style={style}
      className={className}
    >
      {children}
    </span>
  )),
}));

// Mock Button component
vi.mock('../../src/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, variant, size, className }) => (
    <button 
      data-testid="button"
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  )),
}));

// Mock GithubIcon
vi.mock('../../src/components/icons/GithubIcon', () => ({
  GithubIcon: vi.fn(({ className }) => (
    <svg data-testid="github-icon" className={className}>
      <path d="github-icon-path" />
    </svg>
  )),
}));

describe('ComponentsList', () => {
  const mockComponents: Component[] = [
    {
      id: 'comp-1',
      name: 'component-1',
      title: 'Component One',
      description: 'First component description',
      owner_ids: ['team-1'],
      project_title: 'Project Alpha',
      github: 'https://github.com/example/comp1',
      sonar: 'https://sonar.example.com/comp1',
      qos: 'high',
    },
    {
      id: 'comp-2',
      name: 'component-2',
      title: 'Component Two',
      description: 'Second component description',
      owner_ids: ['team-1'],
      project_title: 'Project Alpha',
      github: 'https://github.com/example/comp2',
      sonar: 'https://sonar.example.com/comp2',
      qos: 'medium',
    },
    {
      id: 'comp-3',
      name: 'component-3',
      title: 'Component Three',
      description: 'Third component description',
      owner_ids: ['team-1'],
      project_title: 'Project Beta',
      github: 'https://github.com/example/comp3',
      sonar: 'https://sonar.example.com/comp3',
      qos: 'low',
    },
  ];

  let queryClient: QueryClient;

  const mockContextProps = {
    projectId: 'cis20',
    selectedLandscape: 'prod' as string | null,
    selectedLandscapeData: { 
      name: 'Production', 
      metadata: { route: 'prod.example.com' }
    },
    isCentralLandscape: false,
    noCentralLandscapes: false,
    teamNamesMap: { 'team-1': 'Alpha Team', 'team-2': 'Beta Team' },
    teamColorsMap: { 'team-1': '#ff6b6b', 'team-2': '#4ecdc4' },
    componentHealthMap: {} as Record<string, ComponentHealthCheck>,
    isLoadingHealth: false,
    componentSystemInfoMap: {},
    isLoadingSystemInfo: false,
    expandedComponents: {},
    onToggleExpanded: vi.fn(),
    system: 'test-system',
    components: mockComponents,
  };

  const renderWithProviders = (
    ui: React.ReactElement, 
    contextProps: typeof mockContextProps = mockContextProps
  ) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ComponentDisplayProvider {...contextProps}>
          {ui}
        </ComponentDisplayProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render component cards when components are provided', () => {
      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
        />
      );

      expect(screen.getByTestId('component-card-comp-1')).toBeInTheDocument();
      expect(screen.getByTestId('component-card-comp-2')).toBeInTheDocument();
      expect(screen.getByTestId('component-card-comp-3')).toBeInTheDocument();
    });

    it('should render empty state when no components are provided', () => {
      renderWithProviders(
        <ComponentsList 
          components={[]}
        />
      );

      expect(screen.getByText('No components found for this team.')).toBeInTheDocument();
      expect(screen.queryByTestId('component-card-comp-1')).not.toBeInTheDocument();
    });
  });

  describe('Simple Grid Layout', () => {
    it('should render components in a simple grid layout when showProjectGrouping is false', () => {
      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          showProjectGrouping={false}
        />
      );

      expect(screen.getByTestId('component-card-comp-1')).toBeInTheDocument();
      expect(screen.getAllByTestId(/component-card-comp-/)).toHaveLength(3);

      // Should use simple grid structure (not grouped)
      const container = screen.getByTestId('component-card-comp-1').parentElement;
      expect(container).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-4');
    });
  });

  describe('Project Grouping Layout', () => {
    it('should render components grouped by project when showProjectGrouping is true', () => {
      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          showProjectGrouping={true}
        />
      );

      // Should render project headers as h3 elements
      expect(screen.getByRole('heading', { name: 'Project Alpha' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Project Beta' })).toBeInTheDocument();

      // Should render all components
      expect(screen.getAllByTestId(/component-card-comp-/)).toHaveLength(3);
    });

    it('should display component count badges', () => {
      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          showProjectGrouping={true}
        />
      );

      const badges = screen.getAllByTestId('badge');
      expect(badges.length).toBeGreaterThan(0);
      
      // Should have badges for component counts
      expect(screen.getByText('2')).toBeInTheDocument(); // Project Alpha has 2 components
      expect(screen.getByText('1')).toBeInTheDocument(); // Project Beta has 1 component
    });
  });

  describe('Compact View', () => {
    it('should render compact component items when compactView is true', () => {
      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          compactView={true}
        />
      );

      // Should render component titles directly (not in ComponentCard)
      expect(screen.getByText('Component One')).toBeInTheDocument();
      expect(screen.getByText('Component Two')).toBeInTheDocument();
      expect(screen.getByText('Component Three')).toBeInTheDocument();

      // Should not render ComponentCard test ids in compact view
      expect(screen.queryByTestId('component-card-comp-1')).not.toBeInTheDocument();
    });

    it('should group components by project_title in compact view with project grouping', () => {
      const componentsWithProjects = [
        {
          id: 'comp-1',
          name: 'component-1',
          title: 'Component One',
          description: 'First component description',
          project_id: 'project-1',
          owner_id: 'team-1',
          project_title: 'Alpha Project',
          github: 'https://github.com/example/comp1',
          qos: 'high',
        },
        {
          id: 'comp-2',
          name: 'component-2',
          title: 'Component Two',
          description: 'Second component description',
          project_id: 'project-1',
          owner_id: 'team-1',
          project_title: 'Alpha Project',
          github: 'https://github.com/example/comp2',
          qos: 'medium',
        },
        {
          id: 'comp-3',
          name: 'component-3',
          title: 'Component Three',
          description: 'Third component description',
          project_id: 'project-2',
          owner_id: 'team-1',
          project_title: 'Beta Project',
          github: 'https://github.com/example/comp3',
          qos: 'low',
        },
        {
          id: 'comp-4',
          name: 'component-4',
          title: 'Component Four',
          description: 'Fourth component description',
          project_id: 'project-2',
          owner_id: 'team-1',
          project_title: 'Beta Project',
          github: 'https://github.com/example/comp4',
          qos: 'medium',
        },
      ];

      renderWithProviders(
        <ComponentsList 
          components={componentsWithProjects}
          compactView={true}
          showProjectGrouping={true}
        />
      );

      // Should render project headers sorted alphabetically
      const projectHeaders = screen.getAllByRole('heading', { level: 3 });
      expect(projectHeaders).toHaveLength(2);
      expect(projectHeaders[0]).toHaveTextContent('Alpha Project');
      expect(projectHeaders[1]).toHaveTextContent('Beta Project');

      // Should render component count badges for each project
      const badges = screen.getAllByTestId('badge');
      const countBadges = badges.filter(badge => 
        badge.textContent === '2' || badge.textContent === '2'
      );
      expect(countBadges).toHaveLength(2); // Both projects have 2 components each

      // Should render all components in their respective groups
      expect(screen.getByText('Component One')).toBeInTheDocument();
      expect(screen.getByText('Component Two')).toBeInTheDocument();
      expect(screen.getByText('Component Three')).toBeInTheDocument();
      expect(screen.getByText('Component Four')).toBeInTheDocument();

      // Should use correct grid layout for compact view with grouping
      const gridContainers = screen.getAllByText('Component One')[0]
        .closest('.grid');
      expect(gridContainers).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'gap-3');

      // Should have proper spacing structure
      const mainContainer = screen.getByText('Alpha Project').closest('.space-y-8');
      expect(mainContainer).toBeInTheDocument();
      
      const projectSections = screen.getAllByText(/Project/).map(header => 
        header.closest('.space-y-4')
      );
      expect(projectSections).toHaveLength(2);
    });

    it('should render GitHub buttons for components with GitHub links in compact view', () => {
      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          compactView={true}
        />
      );

      const githubButtons = screen.getAllByTestId('button');
      expect(githubButtons.length).toBeGreaterThan(0);
      
      // Check that GitHub buttons contain the GitHub icon
      const githubIcons = screen.getAllByTestId('github-icon');
      expect(githubIcons.length).toBeGreaterThan(0);
    });

    it('should render components without team badges in compact view', () => {
      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          compactView={true}
        />
      );

      // Should render component titles
      expect(screen.getByText('Component One')).toBeInTheDocument();
      expect(screen.getByText('Component Two')).toBeInTheDocument();
      expect(screen.getByText('Component Three')).toBeInTheDocument();
      
      // Should not render team badges in compact view (ComponentItem doesn't show them)
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should open GitHub links when clicked in compact view', () => {
      // Mock window.open
      const mockWindowOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        value: mockWindowOpen,
        writable: true,
      });

      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          compactView={true}
        />
      );

      const githubButtons = screen.getAllByTestId('button');
      fireEvent.click(githubButtons[0]);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/example/comp1',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Component Interactions', () => {
    it('should call onComponentClick when component card is clicked', () => {
      const mockOnComponentClick = vi.fn();
      
      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          onComponentClick={mockOnComponentClick}
        />
      );

      fireEvent.click(screen.getByTestId('component-card-comp-1'));

      expect(mockOnComponentClick).toHaveBeenCalledWith('component-1');
    });

    it('should call onComponentClick when compact component item is clicked', () => {
      const mockOnComponentClick = vi.fn();
      
      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          compactView={true}
          onComponentClick={mockOnComponentClick}
        />
      );

      // Click on the component item (not the button)
      const componentItem = screen.getByText('Component One').closest('div');
      fireEvent.click(componentItem!);

      expect(mockOnComponentClick).toHaveBeenCalledWith('component-1');
    });

    it('should not call onComponentClick when clicking on GitHub button in compact view', () => {
      const mockOnComponentClick = vi.fn();
      const mockWindowOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        value: mockWindowOpen,
        writable: true,
      });
      
      renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          compactView={true}
          onComponentClick={mockOnComponentClick}
        />
      );

      // Click on the GitHub button
      const githubButton = screen.getAllByTestId('button')[0];
      fireEvent.click(githubButton);

      // Should open GitHub link but not call onComponentClick
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/example/comp1',
        '_blank',
        'noopener,noreferrer'
      );
      expect(mockOnComponentClick).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle components without GitHub links', () => {
      const componentsWithoutGithub = mockComponents.map(comp => ({
        ...comp,
        github: undefined,
      }));

      renderWithProviders(
        <ComponentsList 
          components={componentsWithoutGithub}
          compactView={true}
        />
      );

      // Should not render any GitHub buttons
      expect(screen.queryByTestId('button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('github-icon')).not.toBeInTheDocument();
    });

    it('should handle components without descriptions in compact view', () => {
      const componentsWithoutDescriptions = mockComponents.map(comp => ({
        ...comp,
        description: undefined,
      }));

      renderWithProviders(
        <ComponentsList 
          components={componentsWithoutDescriptions}
          compactView={true}
        />
      );

      // Should still render component titles
      expect(screen.getByText('Component One')).toBeInTheDocument();
      expect(screen.getByText('Component Two')).toBeInTheDocument();
      
      // Should not render description paragraphs
      expect(screen.queryByText('First component description')).not.toBeInTheDocument();
    });

    it('should handle empty project titles', () => {
      const componentsWithEmptyProject = [
        { ...mockComponents[0], project_title: '' },
        { ...mockComponents[1], project_title: undefined },
        { ...mockComponents[2], project_title: 'Valid Project' },
      ];

      renderWithProviders(
        <ComponentsList 
          components={componentsWithEmptyProject}
          showProjectGrouping={true}
        />
      );

      expect(screen.getByRole('heading', { name: 'Valid Project' })).toBeInTheDocument();
      expect(screen.getAllByTestId(/component-card-comp-/)).toHaveLength(3);
    });
  });

  describe('Layout Differences', () => {
    it('should use different grid layouts for compact vs full view', () => {
      const { rerender } = renderWithProviders(
        <ComponentsList 
          components={mockComponents}
          compactView={false}
        />
      );

      // Full view should use lg:grid-cols-3
      let gridContainer = screen.getByTestId('component-card-comp-1').parentElement;
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-4');

      // Switch to compact view
      rerender(
        <QueryClientProvider client={queryClient}>
          <ComponentDisplayProvider {...mockContextProps}>
            <ComponentsList 
              components={mockComponents}
              compactView={true}
            />
          </ComponentDisplayProvider>
        </QueryClientProvider>
      );

      // Compact view should use md:grid-cols-2 (no lg:grid-cols-3)
      gridContainer = screen.getByText('Component One').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'gap-3');
    });
  });
});
