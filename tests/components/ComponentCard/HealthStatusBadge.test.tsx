import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HealthStatusBadge } from '../../../src/components/ComponentCard/HealthStatusBadge';
import { ComponentDisplayProvider } from '../../../src/contexts/ComponentDisplayContext';
import type { Component } from '../../../src/types/api';
import type { ComponentHealthCheck } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: any) => <div data-testid="loader-icon" className={className} />,
}));

// Mock UI components
vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span
      data-testid="badge"
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </span>
  ),
}));

describe('HealthStatusBadge', () => {
  let queryClient: QueryClient;

  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service component',
    owner_id: 'team-1',
    health: true,
  };

  const mockHealthCheck: ComponentHealthCheck = {
    componentId: 'comp-1',
    componentName: 'test-service',
    landscape: 'prod',
    healthUrl: 'https://test.com/health',
    status: 'UP',
    response: {
      status: 'UP',
      healthy: true,
    },
  };

  const mockContextProps = {
    selectedLandscape: 'prod' as string | null,
    selectedLandscapeData: { name: 'Production', route: 'prod.example.com' },
    isCentralLandscape: false,
    teamNamesMap: {},
    teamColorsMap: {},
    componentHealthMap: { 'comp-1': mockHealthCheck } as Record<string, ComponentHealthCheck>,
    isLoadingHealth: false,
    expandedComponents: {},
    onToggleExpanded: vi.fn(),
    system: 'test-system',
    projectId: 'test-project',
    noCentralLandscapes: false,
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

  describe('Health Status Display', () => {
    it('should render UP badge with green styling for successful health', () => {
      const healthyHealthCheck: ComponentHealthCheck = {
        ...mockHealthCheck,
        response: {
          status: 'UP',
          healthy: true,
        },
      };

      const contextWithHealthyComponent = {
        ...mockContextProps,
        componentHealthMap: { 'comp-1': healthyHealthCheck },
      };

      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />, contextWithHealthyComponent);

      expect(screen.getByText('UP')).toBeInTheDocument();
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('border-green-500', 'bg-green-50', 'text-green-700');
      
      const statusDot = screen.getByText('UP').previousElementSibling;
      expect(statusDot).toHaveClass('h-2', 'w-2', 'rounded-full', 'bg-green-500');
    });

    it('should render DOWN badge with red styling for failed health', () => {
      const unhealthyHealthCheck: ComponentHealthCheck = {
        ...mockHealthCheck,
        response: {
          status: 'DOWN',
          healthy: false,
        },
      };

      const contextWithUnhealthyComponent = {
        ...mockContextProps,
        componentHealthMap: { 'comp-1': unhealthyHealthCheck },
      };

      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />, contextWithUnhealthyComponent);

      expect(screen.getByText('DOWN')).toBeInTheDocument();
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('border-red-500', 'bg-red-50', 'text-red-700');
      
      const statusDot = screen.getByText('DOWN').previousElementSibling;
      expect(statusDot).toHaveClass('h-2', 'w-2', 'rounded-full', 'bg-red-500');
    });

    it('should render loading badge with spinner when health check is in progress', () => {
      const contextWithLoading = {
        ...mockContextProps,
        componentHealthMap: {}, // No health data yet
        isLoadingHealth: true,
      };

      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />, contextWithLoading);

      expect(screen.getByText('Checking')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toHaveClass('h-3', 'w-3', 'animate-spin');
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('border-blue-300', 'bg-blue-50', 'text-blue-700');
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render when conditions are not met', () => {
      // No landscape selected
      const contextWithoutLandscape = { ...mockContextProps, selectedLandscape: null };
      const { container, rerender } = renderWithProviders(
        <HealthStatusBadge component={mockComponent} isDisabled={false} />,
        contextWithoutLandscape
      );
      expect(container.firstChild).toBeNull();

      // Component disabled
      rerender(
        <QueryClientProvider client={queryClient}>
          <ComponentDisplayProvider {...mockContextProps}>
            <HealthStatusBadge component={mockComponent} isDisabled={true} />
          </ComponentDisplayProvider>
        </QueryClientProvider>
      );
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();

      // Health not enabled
      const componentWithoutHealth = { ...mockComponent, health: false };
      rerender(
        <QueryClientProvider client={queryClient}>
          <ComponentDisplayProvider {...mockContextProps}>
            <HealthStatusBadge component={componentWithoutHealth} isDisabled={false} />
          </ComponentDisplayProvider>
        </QueryClientProvider>
      );
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should not render for unknown or null health status', () => {
      const unknownHealthCheck: ComponentHealthCheck = {
        ...mockHealthCheck,
        response: {
          status: 'UNKNOWN',
          healthy: undefined,
        },
      };

      const contextWithUnknownHealth = {
        ...mockContextProps,
        componentHealthMap: { 'comp-1': unknownHealthCheck },
      };

      const { container } = renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />, contextWithUnknownHealth);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when no health data is available', () => {
      const contextWithoutHealthData = {
        ...mockContextProps,
        componentHealthMap: {}, // No health data
        isLoadingHealth: false,
      };

      const { container } = renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />, contextWithoutHealthData);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Context Integration', () => {
    it('should use health data from componentHealthMap', () => {
      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />);

      expect(screen.getByText('UP')).toBeInTheDocument();
    });

    it('should work with different landscapes', () => {
      const devHealthCheck: ComponentHealthCheck = {
        ...mockHealthCheck,
        landscape: 'dev',
      };

      const contextWithDifferentLandscape = { 
        ...mockContextProps, 
        selectedLandscape: 'dev',
        componentHealthMap: { 'comp-1': devHealthCheck },
      };

      renderWithProviders(
        <HealthStatusBadge component={mockComponent} isDisabled={false} />,
        contextWithDifferentLandscape
      );

      expect(screen.getByText('UP')).toBeInTheDocument();
    });

    it('should handle missing health data gracefully', () => {
      const contextWithoutHealthData = {
        ...mockContextProps,
        componentHealthMap: {}, // No health data for this component
        isLoadingHealth: false,
      };

      const { container } = renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />, contextWithoutHealthData);
      expect(container.firstChild).toBeNull();
    });
  });
});
