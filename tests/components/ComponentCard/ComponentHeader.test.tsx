import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentHeader } from '../../../src/components/ComponentCard/ComponentHeader';
import { ComponentDisplayProvider } from '../../../src/contexts/ComponentDisplayContext';
import type { Component } from '../../../src/types/api';
import type { SystemInformation } from '../../../src/services/healthApi';
import type { ComponentHealthCheck } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock UI components
vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, className, style, ...props }: any) => (
    <span
      data-testid="badge"
      data-variant={variant}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </span>
  ),
}));

// Mock PinButton component
vi.mock('../../../src/components/PinButton', () => ({
  PinButton: ({ component, size, showOnHover }: any) => (
    <div data-testid="pin-button">
      Pin Button - {component.id} - size: {size} - showOnHover: {showOnHover}
    </div>
  ),
}));

// Mock child components
vi.mock('../../../src/components/ComponentCard/HealthStatusBadge', () => ({
  HealthStatusBadge: ({ component, isDisabled }: any) => (
    <div data-testid="health-status-badge">
      Health Badge - {component.id} - {isDisabled ? 'disabled' : 'enabled'}
    </div>
  ),
}));

vi.mock('../../../src/components/ComponentCard/SystemInfoBadges', () => ({
  SystemInfoBadges: ({ component, systemInfo, loadingSystemInfo, isDisabled }: any) => (
    <div data-testid="system-info-badges">
      System Info - {component.id} - {loadingSystemInfo ? 'loading' : 'loaded'} - {isDisabled ? 'disabled' : 'enabled'}
    </div>
  ),
}));

describe('ComponentHeader', () => {
  let queryClient: QueryClient;

  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service component',
    owner_ids: ['team-1'],
    'central-service': false,
  };

  const mockSystemInfo: SystemInformation = {
    app: '1.2.3',
    sapui5: '1.108.0',
  };

  const mockContextProps = {
    projectId: 'test-project',
    selectedLandscape: 'prod' as string | null,
    selectedLandscapeData: { name: 'Production', route: 'prod.example.com' },
    isCentralLandscape: false,
    noCentralLandscapes: false,
    teamNamesMap: {},
    teamColorsMap: {},
    componentHealthMap: {} as Record<string, ComponentHealthCheck>,
    isLoadingHealth: false,
    componentSystemInfoMap: {},
    isLoadingSystemInfo: false,
    expandedComponents: {},
    onToggleExpanded: vi.fn(),
    system: 'test-system',
  };

  const renderWithProviders = (ui: React.ReactElement, contextProps: typeof mockContextProps = mockContextProps) => {
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

  describe('Component Name/Title Display', () => {
    it('should render component title when provided, otherwise name', () => {
      const { rerender } = renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.getByText('Test Service')).toBeInTheDocument();

      const componentWithoutTitle = { ...mockComponent, title: '' };
      rerender(
        <QueryClientProvider client={queryClient}>
          <ComponentDisplayProvider {...mockContextProps}>
            <ComponentHeader
              component={componentWithoutTitle}
              systemInfo={mockSystemInfo}
              loadingSystemInfo={false}
              isDisabled={false}
            />
          </ComponentDisplayProvider>
        </QueryClientProvider>
      );

      expect(screen.getByText('test-service')).toBeInTheDocument();
    });

    it('should apply correct styling to component name', () => {
      renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      const componentName = screen.getByText('Test Service');
      expect(componentName).toHaveClass('font-semibold', 'text-base', 'truncate', 'leading-tight');
    });
  });

  describe('Health Status Badge', () => {
    it('should render health status badge when not disabled', () => {
      renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.getByTestId('health-status-badge')).toBeInTheDocument();
      expect(screen.getByText(/Health Badge - comp-1 - enabled/)).toBeInTheDocument();
    });

    it('should not render health status badge when disabled', () => {
      renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={true}
        />
      );

      expect(screen.queryByTestId('health-status-badge')).not.toBeInTheDocument();
    });
  });

  describe('Team Badge', () => {
    it('should render team badge with correct styling and color', () => {
      renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          teamNames={["Test Team"]}
          teamColors={["#ff0000"]}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      const teamBadge = screen.getByText('Test Team');
      expect(teamBadge).toBeInTheDocument();
      expect(teamBadge.closest('[data-testid="badge"]')).toHaveStyle({
        backgroundColor: '#ff0000',
      });

      const badgeElement = teamBadge.closest('[data-testid="badge"]');
      expect(badgeElement).toHaveAttribute('data-variant', 'outline');
      expect(badgeElement).toHaveClass(
        'flex', 'items-center', 'gap-1', 'text-xs', 'px-2', 'py-0.5',
        'flex-shrink-0', 'text-white', 'border-0', 'min-h-[24px]'
      );
    });

    it('should render team badge with gray background when disabled', () => {
      renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          teamNames={["Test Team"]}
          teamColors={["#ff0000"]}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={true}
        />
      );

      const teamBadge = screen.getByText('Test Team');
      expect(teamBadge.closest('[data-testid="badge"]')).toHaveClass('bg-gray-500');
    });

    it('should not render team badge when team name is not provided', () => {
      renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.queryByText(/Test Team/)).not.toBeInTheDocument();
    });
  });

  describe('System Info and Central Service Badges', () => {
    it('should render system info badges with correct props', () => {
      renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.getByTestId('system-info-badges')).toBeInTheDocument();
      expect(screen.getByText(/System Info - comp-1 - loaded - enabled/)).toBeInTheDocument();
    });

    it('should pass loading and disabled states to system info badges', () => {
      const { rerender } = renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          systemInfo={null}
          loadingSystemInfo={true}
          isDisabled={false}
        />
      );

      expect(screen.getByText(/System Info - comp-1 - loading - enabled/)).toBeInTheDocument();

      rerender(
        <QueryClientProvider client={queryClient}>
          <ComponentDisplayProvider {...mockContextProps}>
            <ComponentHeader
              component={mockComponent}
              systemInfo={mockSystemInfo}
              loadingSystemInfo={false}
              isDisabled={true}
            />
          </ComponentDisplayProvider>
        </QueryClientProvider>
      );

      expect(screen.getByText(/System Info - comp-1 - loaded - disabled/)).toBeInTheDocument();
    });

    it('should render central service badge when component is central service', () => {
      const centralComponent = { ...mockComponent, 'central-service': true };
      renderWithProviders(
        <ComponentHeader
          component={centralComponent}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.getByText('Central Service')).toBeInTheDocument();
      const centralBadge = screen.getByText('Central Service').closest('[data-testid="badge"]');
      expect(centralBadge).toHaveAttribute('data-variant', 'secondary');
      expect(centralBadge).toHaveClass('text-xs', 'px-2', 'py-0.5');
    });
  });

  describe('Layout and Structure', () => {
    it('should have correct two-row layout structure', () => {
      const { container } = renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          teamNames={["Test Team"]}
          teamColors={["#ff0000"]}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      // Check for proper flex layouts
      const firstRow = container.querySelector('.flex.items-center.justify-between.gap-2');
      expect(firstRow).toBeInTheDocument();

      const secondRow = container.querySelector('.flex.items-center.justify-between.gap-2.py-3');
      expect(secondRow).toBeInTheDocument();

      // Verify content in each row
      expect(screen.getByText('Test Service')).toBeInTheDocument();
      expect(screen.getByTestId('health-status-badge')).toBeInTheDocument();
      expect(screen.getByText('Test Team')).toBeInTheDocument();
      expect(screen.getByTestId('system-info-badges')).toBeInTheDocument();
    });

    it('should apply responsive design classes', () => {
      const { container } = renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          teamNames={["Test Team"]}
          teamColors={["#ff0000"]}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      const componentName = screen.getByText('Test Service');
      expect(componentName).toHaveClass('truncate');

      const nameContainer = container.querySelector('.flex-1.min-w-0');
      expect(nameContainer).toBeInTheDocument();

      const teamBadge = screen.getByText('Test Team').closest('[data-testid="badge"]');
      expect(teamBadge).toHaveClass('flex-shrink-0');
    });
  });

  describe('Accessibility', () => {
    it('should use proper heading element for component name', () => {
      renderWithProviders(
        <ComponentHeader
          component={mockComponent}
          systemInfo={mockSystemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Test Service');
    });
  });
});
