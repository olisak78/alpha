import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HealthStatusBadge } from '../../../src/components/ComponentCard/HealthStatusBadge';
import { ComponentDisplayProvider } from '../../../src/contexts/ComponentDisplayContext';
import type { Component } from '../../../src/types/api';
import type { ComponentHealthCheck } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock the useComponentHealth hook
vi.mock('../../../src/hooks/api/useComponentHealth', () => ({
  useComponentHealth: vi.fn(),
}));

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
  let mockUseComponentHealth: any;

  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service component',
    project_id: 'proj-1',
    owner_id: 'team-1',
    health: true,
  };

  const mockContextProps = {
    selectedLandscape: 'prod' as string | null,
    selectedLandscapeData: { name: 'Production', route: 'prod.example.com' },
    isCentralLandscape: false,
    teamNamesMap: {},
    teamColorsMap: {},
    componentHealthMap: {} as Record<string, ComponentHealthCheck>,
    isLoadingHealth: false,
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

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Get the mocked function
    const { useComponentHealth } = await import('../../../src/hooks/api/useComponentHealth');
    mockUseComponentHealth = vi.mocked(useComponentHealth);

    // Default mock implementation
    mockUseComponentHealth.mockReturnValue({
      data: {
        status: 'success',
        data: { status: 'UP' },
      },
      isLoading: false,
      error: null,
    });
  });

  describe('Health Status Display', () => {
    it('should render UP badge with green styling for successful health', () => {
      mockUseComponentHealth.mockReturnValue({
        data: { status: 'success' },
        isLoading: false,
        error: null,
      });

      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />);

      expect(screen.getByText('UP')).toBeInTheDocument();
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('border-green-500', 'bg-green-50', 'text-green-700');
      
      const statusDot = screen.getByText('UP').previousElementSibling;
      expect(statusDot).toHaveClass('h-2', 'w-2', 'rounded-full', 'bg-green-500');
    });

    it('should render DOWN badge with red styling for failed health', () => {
      mockUseComponentHealth.mockReturnValue({
        data: { status: 'error' },
        isLoading: false,
        error: null,
      });

      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />);

      expect(screen.getByText('DOWN')).toBeInTheDocument();
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('border-red-500', 'bg-red-50', 'text-red-700');
      
      const statusDot = screen.getByText('DOWN').previousElementSibling;
      expect(statusDot).toHaveClass('h-2', 'w-2', 'rounded-full', 'bg-red-500');
    });

    it('should render loading badge with spinner when health check is in progress', () => {
      mockUseComponentHealth.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />);

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
      const { rerender } = renderWithProviders(
        <HealthStatusBadge component={mockComponent} isDisabled={false} />,
        contextWithoutLandscape
      );
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();

      // Component disabled
      rerender(
        <ComponentDisplayProvider {...mockContextProps}>
          <HealthStatusBadge component={mockComponent} isDisabled={true} />
        </ComponentDisplayProvider>
      );
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();

      // Health not enabled
      const componentWithoutHealth = { ...mockComponent, health: false };
      rerender(
        <ComponentDisplayProvider {...mockContextProps}>
          <HealthStatusBadge component={componentWithoutHealth} isDisabled={false} />
        </ComponentDisplayProvider>
      );
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should not render for unknown or null health status', () => {
      mockUseComponentHealth.mockReturnValue({
        data: { status: 'unknown' },
        isLoading: false,
        error: null,
      });

      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />);
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should not render when no health data is available', () => {
      mockUseComponentHealth.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />);
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should call useComponentHealth with correct parameters', () => {
      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />);

      expect(mockUseComponentHealth).toHaveBeenCalledWith('comp-1', 'prod', true);
    });

    it('should work with different landscapes', () => {
      const contextWithDifferentLandscape = { ...mockContextProps, selectedLandscape: 'dev' };
      renderWithProviders(
        <HealthStatusBadge component={mockComponent} isDisabled={false} />,
        contextWithDifferentLandscape
      );

      expect(mockUseComponentHealth).toHaveBeenCalledWith('comp-1', 'dev', true);
    });

    it('should handle hook errors gracefully', () => {
      mockUseComponentHealth.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Health check failed'),
      });

      renderWithProviders(<HealthStatusBadge component={mockComponent} isDisabled={false} />);
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });
});
