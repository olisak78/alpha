import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ComponentCard from '../../src/components/ComponentCard';
import { ComponentDisplayProvider } from '../../src/contexts/ComponentDisplayContext';
import type { Component } from '../../src/types/api';
import type { ComponentHealthCheck } from '../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock the hooks
vi.mock('../../src/hooks/api/useSonarMeasures', () => ({
  useSonarMeasures: vi.fn(),
}));

vi.mock('../../src/hooks/api/useComponentHealth', () => ({
  useComponentHealth: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock toast
vi.mock('../../src/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock UI components
vi.mock('../../src/components/ui/card', () => ({
  Card: ({ children, className, style, onClick, ...props }: any) => (
    <div 
      data-testid="component-card" 
      className={className}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>
      {children}
    </div>
  ),
}));

vi.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size, ...props }: any) => (
    <button
      type="button"
      data-testid="button"
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../src/components/ui/badge', () => ({
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

// Mock icons
vi.mock('lucide-react', () => ({
  Activity: () => <div data-testid="activity-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: ({ className }: any) => <div data-testid="check-circle-icon" className={className} />,
  Loader2: ({ className }: any) => <div data-testid="loader-icon" className={className} />,
}));

vi.mock('../../src/components/icons/GithubIcon', () => ({
  GithubIcon: ({ className }: any) => <div data-testid="github-icon" className={className} />,
}));

// Mock utils
vi.mock('../../src/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock healthApi
vi.mock('../../src/services/healthApi', () => ({
  fetchSystemInformation: vi.fn(),
}));

// Mock ComponentCard subcomponents
vi.mock('../../src/components/ComponentCard/ComponentHeader', () => ({
  ComponentHeader: ({ component, teamNames, teamColors, systemInfo, loadingSystemInfo, isDisabled }: any) => (
    <div data-testid="component-header">
      <h3>{component.title || component.name}</h3>
      {teamNames && teamNames.length > 0 && teamNames.map((teamName: string, index: number) => (
        <span 
          key={`${teamName}-${index}`}
          data-testid="badge" 
          style={{ backgroundColor: teamColors?.[index] || '#6b7280' }}
        >
          {teamName}
        </span>
      ))}
      {component['central-service'] && <span>Central Service</span>}
      {isDisabled && <span>Not Available in this Landscape</span>}
      {systemInfo && (
        <div>
          {systemInfo.app && <span>App: {systemInfo.app}</span>}
          {systemInfo.sapui5 && <span>UI5: {systemInfo.sapui5}</span>}
          {systemInfo.buildProperties?.version && typeof systemInfo.buildProperties.version === 'string' && (
            <span>{systemInfo.buildProperties.version}</span>
          )}
          {systemInfo.buildProperties?.version?.app && <span>App: {systemInfo.buildProperties.version.app}</span>}
          {systemInfo.buildProperties?.version?.sapui5 && <span>UI5: {systemInfo.buildProperties.version.sapui5}</span>}
        </div>
      )}
      {loadingSystemInfo && <span>Loading...</span>}
    </div>
  ),
}));

vi.mock('../../src/components/ComponentCard/ActionButtons', () => ({
  ActionButtons: ({ component }: any) => (
    <div data-testid="action-buttons">
      {component.github && component.github.trim() !== '' && component.github !== '#' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (component.github !== '#') {
              window.open(component.github, '_blank', 'noopener,noreferrer');
            }
          }}
        >
          <div data-testid="github-icon" />
          GitHub
        </button>
      )}
      {component.sonar && component.sonar.trim() !== '' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(component.sonar, '_blank', 'noopener,noreferrer');
          }}
        >
          <div data-testid="activity-icon" />
          Sonar
        </button>
      )}
    </div>
  ),
}));

vi.mock('../../src/components/ComponentCard/QualityMetricsGrid', () => ({
  QualityMetricsGrid: ({ component }: any) => (
    <div data-testid="quality-metrics-grid">
      <div data-testid="activity-icon" />
      <div data-testid="shield-icon" />
      <div data-testid="alert-triangle-icon" />
      <div data-testid="check-circle-icon" className="text-green-600" />
      <span>85%</span>
      <span>2</span>
      <span>5</span>
      <span>Passed</span>
    </div>
  ),
}));

vi.mock('../../src/components/ComponentCard/HealthStatusBadge', () => ({
  HealthStatusBadge: ({ component, isDisabled }: any) => {
    const { useComponentHealth } = require('../../src/hooks/api/useComponentHealth');
    const { useComponentDisplay } = require('../../src/contexts/ComponentDisplayContext');
    
    const { selectedLandscape } = useComponentDisplay();
    const { data: componentHealthResult, isLoading: isLoadingComponentHealth } = useComponentHealth(
      component.id,
      selectedLandscape,
      component.health ?? false
    );

    if (!selectedLandscape || isDisabled || component.health !== true) {
      return null;
    }

    if (isLoadingComponentHealth) {
      return (
        <span data-testid="badge">
          <div data-testid="loader-icon" />
          Checking
        </span>
      );
    }

    if (!componentHealthResult) {
      return null;
    }

    const status = componentHealthResult?.status;
    
    if (status === 'success') {
      return <span data-testid="badge">UP</span>;
    } else if (status === 'error') {
      return <span data-testid="badge">DOWN</span>;
    }
    
    return null;
  },
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('ComponentCard', () => {
  let queryClient: QueryClient;
  let mockUseSonarMeasures: any;
  let mockUseComponentHealth: any;
  let mockFetchSystemInformation: any;

  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service component',
    owner_ids: ['team-1'],
    github: 'https://github.com/example/test-service',
    sonar: 'https://sonar.example.com/dashboard?id=test-service',
    health: true,
  };

  const mockContextProps = {
    projectId: 'cis20',
    selectedLandscape: 'prod' as string | null,
    selectedLandscapeData: { 
      name: 'Production', 
      metadata: { route: 'prod.example.com' }
    },
    isCentralLandscape: false,
    noCentralLandscapes: false,
    teamNamesMap: { 'team-1': 'Test Team' },
    teamColorsMap: { 'team-1': '#ff0000' },
    componentHealthMap: {} as Record<string, ComponentHealthCheck>,
    isLoadingHealth: false,
    componentSystemInfoMap: {},
    isLoadingSystemInfo: false,
    expandedComponents: {},
    onToggleExpanded: vi.fn(),
    system: 'test-system',
    components: [mockComponent],
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

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockWindowOpen.mockClear();

    // Get the mocked functions
    const { useSonarMeasures } = await import('../../src/hooks/api/useSonarMeasures');
    const { useComponentHealth } = await import('../../src/hooks/api/useComponentHealth');
    const { fetchSystemInformation } = await import('../../src/services/healthApi');
    mockUseSonarMeasures = vi.mocked(useSonarMeasures);
    mockUseComponentHealth = vi.mocked(useComponentHealth);
    mockFetchSystemInformation = vi.mocked(fetchSystemInformation);

    // Default mock implementations
    mockUseSonarMeasures.mockReturnValue({
      data: {
        coverage: 85,
        codeSmells: 5,
        vulnerabilities: 2,
        qualityGate: 'Passed',
      },
      isLoading: false,
      error: null,
      hasAlias: true,
    });

    mockUseComponentHealth.mockReturnValue({
      data: {
        status: 'success',
        data: { status: 'UP' },
      },
      isLoading: false,
      error: null,
    });

    // Default mock for fetchSystemInformation to prevent errors in other tests
    mockFetchSystemInformation.mockResolvedValue({
      status: 'success',
      data: {
        app: '1.2.3',
        sapui5: '1.108.0',
      }
    });
  });

  describe('Rendering', () => {
    it('should render component card with all basic elements', () => {
      renderWithProviders(<ComponentCard component={mockComponent} />);

      expect(screen.getByTestId('component-card')).toBeInTheDocument();
      expect(screen.getByText('Test Service')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByTestId('component-header')).toBeInTheDocument();
    });

    it('should render component name when title is not provided', () => {
      const componentWithoutTitle = { ...mockComponent, title: '' };
      renderWithProviders(<ComponentCard component={componentWithoutTitle} />);

      expect(screen.getByText('test-service')).toBeInTheDocument();
    });

    it('should render central service badge when component is central service', () => {
      const centralComponent = { ...mockComponent, 'central-service': true };
      renderWithProviders(<ComponentCard component={centralComponent} />);

      expect(screen.getByText('Central Service')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render and handle GitHub and Sonar buttons correctly', () => {
      renderWithProviders(<ComponentCard component={mockComponent} />);

      // Check buttons are rendered
      const githubButton = screen.getByText('GitHub').closest('button');
      const sonarButton = screen.getByText('Sonar').closest('button');
      expect(githubButton).toBeInTheDocument();
      expect(sonarButton).toBeInTheDocument();

      // Test GitHub button click
      fireEvent.click(githubButton!);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/example/test-service',
        '_blank',
        'noopener,noreferrer'
      );

      // Test Sonar button click
      fireEvent.click(sonarButton!);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://sonar.example.com/dashboard?id=test-service',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should not render buttons when URLs are empty', () => {
      const componentWithoutUrls = { ...mockComponent, github: '', sonar: '' };
      renderWithProviders(<ComponentCard component={componentWithoutUrls} />);

      expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
      expect(screen.queryByText('Sonar')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle card clicks and button event propagation', () => {
      const mockOnClick = vi.fn();
      renderWithProviders(<ComponentCard component={mockComponent} onClick={mockOnClick} />);

      // Card click should trigger onClick
      const card = screen.getByTestId('component-card');
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalled();

      // Button click should not trigger card onClick
      mockOnClick.mockClear();
      const githubButton = screen.getByText('GitHub').closest('button');
      fireEvent.click(githubButton!);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should show correct cursor styles', () => {
      const mockOnClick = vi.fn();
      const { rerender } = renderWithProviders(<ComponentCard component={mockComponent} onClick={mockOnClick} />);

      // Should have pointer cursor when clickable
      let card = screen.getByTestId('component-card');
      expect(card).toHaveStyle({ cursor: 'pointer' });

      // Should not have pointer cursor when not clickable
      rerender(
        <QueryClientProvider client={queryClient}>
          <ComponentDisplayProvider {...mockContextProps}>
            <ComponentCard component={mockComponent} />
          </ComponentDisplayProvider>
        </QueryClientProvider>
      );
      card = screen.getByTestId('component-card');
      expect(card).not.toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Disabled State', () => {
    it('should render disabled state for central service in non-central landscape', () => {
      const centralComponent = { ...mockComponent, 'central-service': true };
      renderWithProviders(<ComponentCard component={centralComponent} />);
      
      const card = screen.getByTestId('component-card');
      expect(card).toHaveClass('border-gray-300');
      expect(screen.getByText('Not Available in this Landscape')).toBeInTheDocument();
    });

    it('should not render disabled state for central service in central landscape', () => {
      const centralComponent = { ...mockComponent, 'central-service': true };
      const centralContext = { ...mockContextProps, isCentralLandscape: true };
      renderWithProviders(<ComponentCard component={centralComponent} />, centralContext);
      
      const card = screen.getByTestId('component-card');
      expect(card).not.toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(screen.queryByText('Not Available in this Landscape')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API errors and missing data gracefully', () => {
      // Test with API errors
      mockUseSonarMeasures.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API error'),
        hasAlias: true,
      });

      // Test with missing component data
      const componentWithMissingData = { ...mockComponent, sonar: undefined, title: '', name: '' };
      renderWithProviders(<ComponentCard component={componentWithMissingData} />);

      // Should still render without crashing
      expect(screen.getByTestId('component-card')).toBeInTheDocument();
      expect(screen.queryByText('Sonar')).not.toBeInTheDocument();
    });
  });

  describe('System Information', () => {
    it('should display system information correctly', async () => {
      const mockSystemInfo = {
        buildProperties: {
          version: {
            app: '2.0.0',
            sapui5: '1.110.0'
          }
        }
      };

      mockFetchSystemInformation.mockResolvedValue({
        status: 'success',
        data: mockSystemInfo
      });

      renderWithProviders(<ComponentCard component={mockComponent} />);

      await waitFor(() => {
        expect(screen.getByText('App: 2.0.0')).toBeInTheDocument();
        expect(screen.getByText('UI5: 1.110.0')).toBeInTheDocument();
      });
    });

    it('should handle system information loading and errors', async () => {
      // Test loading state
      mockFetchSystemInformation.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          status: 'success',
          data: { app: '1.0.0' }
        }), 100))
      );

      renderWithProviders(<ComponentCard component={mockComponent} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('App: 1.0.0')).toBeInTheDocument();
      });
    });
  });
});
