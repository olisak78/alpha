import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SystemInfoBadges } from '../../../src/components/ComponentCard/SystemInfoBadges';
import { ComponentDisplayProvider } from '../../../src/contexts/ComponentDisplayContext';
import type { Component } from '../../../src/types/api';
import type { SystemInformation } from '../../../src/services/healthApi';
import type { ComponentHealthCheck } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';

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

// Mock useTeams hook
vi.mock('../../../src/hooks/api/useTeams', () => ({
  useTeams: () => ({
    data: { teams: [] }
  })
}));

describe('SystemInfoBadges', () => {
  let queryClient: QueryClient;

  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service component',
    owner_ids: ['team-1'],
  };

  const mockContextProps = {
    projectId: 'cis20',
    selectedLandscape: 'prod' as string | null,
    selectedLandscapeData: { name: 'Production', route: 'prod.example.com' },
    isCentralLandscape: false,
    noCentralLandscapes: false,
    componentHealthMap: {} as Record<string, ComponentHealthCheck>,
    isLoadingHealth: false,
    expandedComponents: {},
    onToggleExpanded: vi.fn(),
    system: 'test-system',
    components: [mockComponent],
  };

  const renderWithProvider = (ui: React.ReactElement, contextProps: typeof mockContextProps = mockContextProps) => {
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

  describe('Conditional Rendering', () => {
    it('should render disabled message when component is disabled', () => {
      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={null}
          loadingSystemInfo={false}
          isDisabled={true}
        />
      );

      expect(screen.getByText('Not Available in this Landscape')).toBeInTheDocument();
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('text-muted-foreground');
    });

    it('should show loading message when system info is loading', () => {
      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={null}
          loadingSystemInfo={true}
          isDisabled={false}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not render when no landscape is selected', () => {
      const contextWithoutLandscape = { ...mockContextProps, selectedLandscape: null };
      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={null}
          loadingSystemInfo={false}
          isDisabled={false}
        />,
        contextWithoutLandscape
      );

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should not render when no system info is available', () => {
      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={null}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });

  describe('Version Display', () => {
    it('should render direct app and sapui5 properties', () => {
      const systemInfo: SystemInformation = {
        app: '1.2.3',
        sapui5: '1.108.0',
      };

      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={systemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.getByText('App: 1.2.3')).toBeInTheDocument();
      expect(screen.getByText('UI5: 1.108.0')).toBeInTheDocument();
    });

    it('should render versions from buildProperties when direct properties are not available', () => {
      const systemInfo: SystemInformation = {
        buildProperties: {
          version: {
            app: '2.0.0',
            sapui5: '1.110.0',
          },
        },
      };

      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={systemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.getByText('App: 2.0.0')).toBeInTheDocument();
      expect(screen.getByText('UI5: 1.110.0')).toBeInTheDocument();
    });

    it('should prefer direct properties over buildProperties', () => {
      const systemInfo: SystemInformation = {
        app: '1.2.3',
        sapui5: '1.108.0',
        buildProperties: {
          version: {
            app: '2.0.0',
            sapui5: '1.110.0',
          },
        },
      };

      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={systemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.getByText('App: 1.2.3')).toBeInTheDocument();
      expect(screen.getByText('UI5: 1.108.0')).toBeInTheDocument();
      expect(screen.queryByText('App: 2.0.0')).not.toBeInTheDocument();
    });

    it('should render simple string version from buildProperties', () => {
      const systemInfo: SystemInformation = {
        buildProperties: {
          version: '3.1.0',
        },
      };

      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={systemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.getByText('3.1.0')).toBeInTheDocument();
    });
  });

  describe('Badge Styling', () => {
    it('should apply correct styling to all badges', () => {
      const systemInfo: SystemInformation = {
        app: '1.2.3',
        sapui5: '1.108.0',
      };

      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={systemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      const badges = screen.getAllByTestId('badge');
      badges.forEach(badge => {
        expect(badge).toHaveAttribute('data-variant', 'outline');
        expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5', 'text-muted-foreground');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty or undefined version values', () => {
      const systemInfo: SystemInformation = {
        app: '',
        buildProperties: {
          version: undefined,
        },
      };

      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={systemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should handle complex system info with additional properties', () => {
      const systemInfo: SystemInformation = {
        app: '1.2.3',
        sapui5: '1.108.0',
        buildProperties: {
          version: '3.1.0',
          time: 1672531200000,
          name: 'test-service',
        },
        gitProperties: {
          'git.commit.id': 'abc123',
        },
      };

      renderWithProvider(
        <SystemInfoBadges
          component={mockComponent}
          systemInfo={systemInfo}
          loadingSystemInfo={false}
          isDisabled={false}
        />
      );

      // Should only show app and sapui5, ignoring other properties
      expect(screen.getByText('App: 1.2.3')).toBeInTheDocument();
      expect(screen.getByText('UI5: 1.108.0')).toBeInTheDocument();
      expect(screen.queryByText('3.1.0')).not.toBeInTheDocument();
    });
  });
});
