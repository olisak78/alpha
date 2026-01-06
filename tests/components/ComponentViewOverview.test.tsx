import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentViewOverview } from '../../src/components/ComponentViewOverview';
import type { Component } from '../../src/types/api';
import type { HealthResponse } from '../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  AlertCircle: ({ className }: { className?: string }) => <div data-testid="alert-circle-icon" className={className} />,
}));

// Mock CircuitBreakerSection
vi.mock('../../src/components/CircuitBreakerSection', () => ({
  CircuitBreakerSection: ({ circuitBreakers }: { circuitBreakers: any }) => (
    <div data-testid="circuit-breaker-section">
      Circuit Breaker Section - Status: {circuitBreakers?.status}
    </div>
  ),
}));

// Mock ComponentView sub-components
vi.mock('../../src/components/ComponentView/ComponentHeader', () => ({
  ComponentHeader: ({ component }: { component: any }) => (
    <div data-testid="component-header">Component Header - {component?.name}</div>
  ),
}));

vi.mock('../../src/components/ComponentView/HealthErrorDisplay', () => ({
  HealthErrorDisplay: ({ healthError }: { healthError: string }) => (
    <div data-testid="health-error-display">Health Error: {healthError}</div>
  ),
}));

vi.mock('../../src/components/ComponentView/ComponentHealthCard', () => ({
  ComponentHealthCard: ({ healthData }: { healthData: any }) => (
    <div data-testid="component-health-card">Component Health Card - {healthData?.status}</div>
  ),
}));

vi.mock('../../src/components/ComponentView/InfrastructureCard', () => ({
  InfrastructureCard: ({ healthData }: { healthData: any }) => (
    <div data-testid="infrastructure-card">Infrastructure Card - {healthData?.status}</div>
  ),
}));

vi.mock('../../src/components/ComponentView/CodeQualityCard', () => ({
  CodeQualityCard: ({ sonarData }: { sonarData: any }) => (
    <div data-testid="code-quality-card">Code Quality Card - {sonarData?.qualityGate}</div>
  ),
}));

describe('ComponentViewOverview', () => {
  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service for unit testing',
    github: 'https://github.com/example/test-service',
    sonar: 'https://sonar.example.com/dashboard?id=test-service',
    owner_id: 'team-1',
    'is-library': false,
  };

  const mockSelectedLandscape = 'production';
  const mockSelectedApiLandscape = {
    name: 'Production Environment',
    route: 'production',
  };

  const mockHealthData: HealthResponse = {
    status: 'UP',
    healthy: true,
    healthURL: 'https://test-service.cfapps.production/health',
    details: {
      components: {
        ping: { status: 'UP' },
        db: { status: 'UP', details: { database: 'PostgreSQL' } },
        circuitBreakers: {
          status: 'UP',
          details: { 'test-circuit-breaker': { status: 'UP' } },
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
        noCentralLandscapes={false}
        projectName="cis20"
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
        noCentralLandscapes={false}
        projectName="cis20"
      />
    );

    expect(screen.getByText('Please select a landscape to view component health data')).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('should render all sub-components when data is available', () => {
    render(
      <ComponentViewOverview
        component={mockComponent}
        selectedLandscape={mockSelectedLandscape}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={125.5}
        statusCode={200}
        sonarData={mockSonarData}
        sonarLoading={false}
        noCentralLandscapes={false}
        projectName="cis20"
      />
    );

    // Should render ComponentHeader
    expect(screen.getByTestId('component-header')).toBeInTheDocument();
    expect(screen.getByText('Component Header - test-service')).toBeInTheDocument();

    // Should render ComponentHealthCard for cis20 project
    expect(screen.getByTestId('component-health-card')).toBeInTheDocument();
    expect(screen.getByText('Component Health Card - UP')).toBeInTheDocument();

    // Should render InfrastructureCard for cis20 project
    expect(screen.getByTestId('infrastructure-card')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure Card - UP')).toBeInTheDocument();

    // Should render CodeQualityCard when sonar data is available
    expect(screen.getByTestId('code-quality-card')).toBeInTheDocument();
    expect(screen.getByText('Code Quality Card - Passed')).toBeInTheDocument();
  });

  it('should render health error display when health error occurs', () => {
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
        noCentralLandscapes={false}
        projectName="cis20"
      />
    );

    expect(screen.getByTestId('health-error-display')).toBeInTheDocument();
    expect(screen.getByText('Health Error: Failed to fetch health data')).toBeInTheDocument();
  });

  it('should render circuit breaker section when available', () => {
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
        noCentralLandscapes={false}
        projectName="cis20"
      />
    );

    expect(screen.getByTestId('circuit-breaker-section')).toBeInTheDocument();
    expect(screen.getByText('Circuit Breaker Section - Status: UP')).toBeInTheDocument();
  });

  it('should not render health and infrastructure cards for non-cis20 projects', () => {
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
        noCentralLandscapes={false}
        projectName="other-project"
      />
    );

    // Should still render ComponentHeader
    expect(screen.getByTestId('component-header')).toBeInTheDocument();

    // Should still render CodeQualityCard
    expect(screen.getByTestId('code-quality-card')).toBeInTheDocument();

    // Should NOT render ComponentHealthCard and InfrastructureCard for non-cis20 projects
    expect(screen.queryByTestId('component-health-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('infrastructure-card')).not.toBeInTheDocument();
  });

  it('should not render code quality card when sonar data is not available', () => {
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
        noCentralLandscapes={false}
        projectName="cis20"
      />
    );

    expect(screen.queryByTestId('code-quality-card')).not.toBeInTheDocument();
  });
});
