import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentViewOverview } from '../../src/components/ComponentViewOverview';
import type { Component } from '../../src/types/api';
import type { HealthResponse } from '../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ExternalLink: ({ className }: { className?: string }) => <div data-testid="external-link-icon" className={className} />,
  Activity: ({ className }: { className?: string }) => <div data-testid="activity-icon" className={className} />,
  Database: ({ className }: { className?: string }) => <div data-testid="database-icon" className={className} />,
  AlertCircle: ({ className }: { className?: string }) => <div data-testid="alert-circle-icon" className={className} />,
  CheckCircle: ({ className }: { className?: string }) => <div data-testid="check-circle-icon" className={className} />,
  XCircle: ({ className }: { className?: string }) => <div data-testid="x-circle-icon" className={className} />,
  Clock: ({ className }: { className?: string }) => <div data-testid="clock-icon" className={className} />,
  Shield: ({ className }: { className?: string }) => <div data-testid="shield-icon" className={className} />,
  Zap: ({ className }: { className?: string }) => <div data-testid="zap-icon" className={className} />,
  Server: ({ className }: { className?: string }) => <div data-testid="server-icon" className={className} />,
  HardDrive: ({ className }: { className?: string }) => <div data-testid="hard-drive-icon" className={className} />,
  Info: ({ className }: { className?: string }) => <div data-testid="info-icon" className={className} />,
  ChevronDown: ({ className }: { className?: string }) => <div data-testid="chevron-down-icon" className={className} />,
  ChevronRight: ({ className }: { className?: string }) => <div data-testid="chevron-right-icon" className={className} />,
  Heart: ({ className }: { className?: string }) => <div data-testid="heart-icon" className={className} />,
}));

// Mock UI components
vi.mock('../../src/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>{children}</div>
  ),
}));

vi.mock('../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

vi.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    variant?: string; 
    size?: string; 
    className?: string;
  }) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size} 
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../src/components/ui/collapsible', () => ({
  Collapsible: ({ children, open, onOpenChange }: { 
    children: React.ReactNode; 
    open?: boolean; 
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="collapsible" data-open={open}>
      {children}
    </div>
  ),
  CollapsibleContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="collapsible-content" className={className}>{children}</div>
  ),
  CollapsibleTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="collapsible-trigger" className={className}>{children}</div>
  ),
}));

// Mock CircuitBreakerSection
vi.mock('../../src/components/CircuitBreakerSection', () => ({
  CircuitBreakerSection: ({ circuitBreakers }: { circuitBreakers: any }) => (
    <div data-testid="circuit-breaker-section">
      Circuit Breaker Section - Status: {circuitBreakers?.status}
    </div>
  ),
}));

// Mock healthApi functions
vi.mock('../../src/services/healthApi', () => ({
  buildHealthEndpoint: vi.fn(),
  buildHealthEndpointWithSubdomain: vi.fn(),
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('ComponentViewOverview', () => {
  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service for unit testing',
    github: 'https://github.com/example/test-service',
    sonar: 'https://sonar.example.com/dashboard?id=test-service',
    project_id: 'proj-1',
    owner_id: 'team-1',
    'is-library': false,
  };

  const mockLibraryComponent: Component = {
    id: 'lib-1',
    name: 'test-library',
    title: 'Test Library',
    description: 'A test library for unit testing',
    project_id: 'proj-1',
    owner_id: 'team-1',
    'is-library': true,
  };

  const mockSelectedLandscape = 'production';
  const mockSelectedApiLandscape = {
    name: 'Production Environment',
    route: 'production',
  };

  const mockHealthData: HealthResponse = {
    status: 'UP',
    components: {
      ping: {
        status: 'UP',
      },
      db: {
        status: 'UP',
        details: {
          database: 'PostgreSQL',
          validationQuery: 'isValid()',
        },
      },
      redis: {
        status: 'UP',
        details: {
          version: '6.2.0',
          mode: 'standalone',
        },
      },
      kafka: {
        status: 'UP',
        components: {
          'kafka-cluster-1': {
            status: 'UP',
          },
        },
      },
      circuitBreakers: {
        status: 'UP',
        details: {
          'test-circuit-breaker': {
            status: 'UP',
            details: {
              state: 'CLOSED',
              bufferedCalls: 10,
              failedCalls: 0,
            },
          },
        },
      },
      FetchAndRunJobsScheduler: {
        status: 'UP',
      },
      startup: {
        status: 'UP',
      },
      discoveryComposite: {
        status: 'UP',
        components: {
          'discovery-client-1': {
            status: 'UP',
          },
        },
      },
      reactiveDiscoveryClients: {
        status: 'UP',
        components: {
          'reactive-client-1': {
            status: 'UP',
          },
        },
      },
    },
  };

  const mockSonarData = {
    coverage: 85.5,
    vulnerabilities: 2,
    codeSmells: 15,
    qualityGate: 'Passed' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component not found when component is undefined', () => {
    render(
      <ComponentViewOverview
        component={undefined}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={null}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Component not found')).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('should render landscape selection message when no landscape is selected', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={null}
        selectedApiLandscape={null}
        healthData={null}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Please select a landscape to view component health data')).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('should render component header with title and description', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('A test service for unit testing')).toBeInTheDocument();
  });

  it('should display API Service badge for non-library components', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('API Service')).toBeInTheDocument();
  });

  it('should display Library badge for library components', () => {
    render(
      <ComponentViewOverview
        component={mockLibraryComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('should render GitHub and SonarQube buttons when URLs are provided', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('SonarQube')).toBeInTheDocument();
  });

  it('should not render GitHub button when URL is not provided or is #', () => {
    const componentWithoutGithub = { ...mockComponent, github: '#' };
    
    render(
      <ComponentViewOverview
        component={componentWithoutGithub}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
  });

  it('should open GitHub URL when GitHub button is clicked', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    const githubButton = screen.getByText('GitHub').closest('button');
    fireEvent.click(githubButton!);

    expect(mockWindowOpen).toHaveBeenCalledWith('https://github.com/example/test-service', '_blank');
  });

  it('should display landscape badge', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Production Environment')).toBeInTheDocument();
  });

  it('should display health badge when health data is available', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    // Look for all Health text elements and find the one inside a badge
    const healthElements = screen.getAllByText('Health');
    const healthBadge = healthElements.find(element => 
      element.closest('[data-testid="badge"]')
    );
    expect(healthBadge).toBeInTheDocument();
  });

  it('should display loading badge when health is loading', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={null}
        healthLoading={true}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('should display response time badge when available', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={125.5}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Response: 125.50ms')).toBeInTheDocument();
  });

  it('should display status code badge when available', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={200}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Status Code: 200')).toBeInTheDocument();
  });

  it('should display health error when health fetch fails', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={null}
        healthLoading={false}
        healthError="Failed to fetch health data"
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Failed to fetch health data: Failed to fetch health data')).toBeInTheDocument();
    expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
  });

  it('should render component health section with ping status', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Component Health')).toBeInTheDocument();
    expect(screen.getByText('Ping')).toBeInTheDocument();
  });

  it('should render infrastructure section with database', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByTestId('database-icon')).toBeInTheDocument();
  });

  it('should render Redis with version information', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Redis')).toBeInTheDocument();
    expect(screen.getByText('v6.2.0')).toBeInTheDocument();
    expect(screen.getByTestId('hard-drive-icon')).toBeInTheDocument();
  });

  it('should render code quality section when sonar data is available', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={mockSonarData}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Code Quality')).toBeInTheDocument();
    expect(screen.getByText('Coverage')).toBeInTheDocument();
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('Vulnerabilities')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Code Smells')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Quality Gate')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });

  it('should not render code quality section when sonar data is not available', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.queryByText('Code Quality')).not.toBeInTheDocument();
  });

  it('should render scheduler components when available', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        sonarData={null}
        sonarLoading={false}
      />
    );

    expect(screen.getByText('Jobs Scheduler')).toBeInTheDocument();
    expect(screen.getByText('Startup')).toBeInTheDocument();
  });

  describe('Health Button', () => {
    it('should render Health button when selectedApiLandscape is available', () => {
      render(
        <ComponentViewOverview
          component={mockComponent}
          selectedLandscape={mockSelectedLandscape}
          selectedApiLandscape={mockSelectedApiLandscape}
          healthData={mockHealthData}
          healthLoading={false}
          healthError={null}
          responseTime={null}
          statusCode={null}
          sonarData={null}
          sonarLoading={false}
        />
      );

      // Look for the Health button specifically (contains heart icon)
      const healthButton = screen.getByRole('button', { name: /health/i });
      expect(healthButton).toBeInTheDocument();
      expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    });

    it('should open health URL when Health button is clicked', async () => {
      const { buildHealthEndpoint } = await import('../../src/services/healthApi');
      const mockHealthUrl = 'https://test-service.cfapps.production/health';
      vi.mocked(buildHealthEndpoint).mockReturnValue(mockHealthUrl);

      render(
        <ComponentViewOverview
          component={mockComponent}
          selectedLandscape={mockSelectedLandscape}
          selectedApiLandscape={mockSelectedApiLandscape}
          healthData={mockHealthData}
          healthLoading={false}
          healthError={null}
          responseTime={null}
          statusCode={null}
          sonarData={null}
          sonarLoading={false}
        />
      );

      const healthButton = screen.getByRole('button', { name: /health/i });
      fireEvent.click(healthButton);

      expect(buildHealthEndpoint).toHaveBeenCalledWith(
        mockComponent,
        {
          name: 'Production Environment',
          route: 'production'
        }
      );
      expect(mockWindowOpen).toHaveBeenCalledWith(mockHealthUrl, '_blank');
    });

    it('should use subdomain when component has subdomain metadata', async () => {
      const { buildHealthEndpointWithSubdomain } = await import('../../src/services/healthApi');
      const componentWithSubdomain = {
        ...mockComponent,
        metadata: { subdomain: 'sap-provisioning' }
      };
      const mockHealthUrl = 'https://sap-provisioning.test-service.cfapps.production/health';
      vi.mocked(buildHealthEndpointWithSubdomain).mockReturnValue(mockHealthUrl);

      render(
        <ComponentViewOverview
          component={componentWithSubdomain}
          selectedLandscape={mockSelectedLandscape}
          selectedApiLandscape={mockSelectedApiLandscape}
          healthData={mockHealthData}
          healthLoading={false}
          healthError={null}
          responseTime={null}
          statusCode={null}
          sonarData={null}
          sonarLoading={false}
        />
      );

      const healthButton = screen.getByRole('button', { name: /health/i });
      fireEvent.click(healthButton);

      expect(buildHealthEndpointWithSubdomain).toHaveBeenCalledWith(
        componentWithSubdomain,
        {
          name: 'Production Environment',
          route: 'production'
        },
        'sap-provisioning'
      );
      expect(mockWindowOpen).toHaveBeenCalledWith(mockHealthUrl, '_blank');
    });

    it('should use domain property when route is not available in landscape', async () => {
      const { buildHealthEndpoint } = await import('../../src/services/healthApi');
      const landscapeWithDomain = {
        name: 'Production Environment',
        domain: 'sap.hana.ondemand.com'
      };
      const mockHealthUrl = 'https://test-service.cfapps.sap.hana.ondemand.com/health';
      vi.mocked(buildHealthEndpoint).mockReturnValue(mockHealthUrl);

      render(
        <ComponentViewOverview
          component={mockComponent}
          selectedLandscape={mockSelectedLandscape}
          selectedApiLandscape={landscapeWithDomain}
          healthData={mockHealthData}
          healthLoading={false}
          healthError={null}
          responseTime={null}
          statusCode={null}
          sonarData={null}
          sonarLoading={false}
        />
      );

      const healthButton = screen.getByRole('button', { name: /health/i });
      fireEvent.click(healthButton);

      expect(buildHealthEndpoint).toHaveBeenCalledWith(
        mockComponent,
        {
          name: 'Production Environment',
          route: 'sap.hana.ondemand.com'
        }
      );
      expect(mockWindowOpen).toHaveBeenCalledWith(mockHealthUrl, '_blank');
    });

    it('should not render Health button when selectedApiLandscape is not available', () => {
      render(
        <ComponentViewOverview
          component={mockComponent}
          selectedLandscape={mockSelectedLandscape}
          selectedApiLandscape={null}
          healthData={mockHealthData}
          healthLoading={false}
          healthError={null}
          responseTime={null}
          statusCode={null}
          sonarData={null}
          sonarLoading={false}
        />
      );

      // Should not find a Health button (with heart icon)
      expect(screen.queryByRole('button', { name: /health/i })).not.toBeInTheDocument();
      expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
    });
  });
});
