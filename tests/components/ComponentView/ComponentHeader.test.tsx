import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentHeader } from '../../../src/components/ComponentView/ComponentHeader';
import type { Component } from '../../../src/types/api';
import type { HealthResponse } from '../../../src/types/health';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Heart: ({ className }: { className?: string }) => <div data-testid="heart-icon" className={className} />,
  Shield: ({ className }: { className?: string }) => <div data-testid="shield-icon" className={className} />,
  Clock: ({ className }: { className?: string }) => <div data-testid="clock-icon" className={className} />,
}));

// Mock UI components
vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

vi.mock('../../../src/components/ui/button', () => ({
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

// Mock GithubIcon and StatusDot
vi.mock('../../../src/components/icons/GithubIcon', () => ({
  GithubIcon: ({ className }: { className?: string }) => <div data-testid="github-icon" className={className} />,
}));

vi.mock('../../../src/components/ComponentView/StatusDot', () => ({
  StatusDot: ({ status }: { status?: string | boolean }) => (
    <div data-testid="status-dot" data-status={status?.toString()} />
  ),
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('ComponentHeader', () => {
  const mockComponent: Component = {
    id: 'comp-1',
    name: 'test-service',
    title: 'Test Service',
    description: 'A test service for unit testing',
    github: 'https://github.com/example/test-service',
    sonar: 'https://sonar.example.com/dashboard?id=test-service',
    owner_ids: ['team-1'],
    'is-library': false,
  };

  const mockSelectedApiLandscape = {
    name: 'Production Environment',
    route: 'production',
  };

  const mockHealthData: HealthResponse = {
    status: 'UP',
    healthy: true,
    healthURL: 'https://test-service.cfapps.production/health',
    details: { components: {} },
  };

  const mockOnHealthButtonClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component type badges correctly', () => {
    // Test API Service badge
    render(
      <ComponentHeader
        component={mockComponent}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        onHealthButtonClick={mockOnHealthButtonClick}
      />
    );
    expect(screen.getByText('API Service')).toBeInTheDocument();

    // Test Library badge
    const libraryComponent = { ...mockComponent, 'is-library': true };
    render(
      <ComponentHeader
        component={libraryComponent}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        onHealthButtonClick={mockOnHealthButtonClick}
      />
    );
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('should render and handle action buttons correctly', () => {
    render(
      <ComponentHeader
        component={mockComponent}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        onHealthButtonClick={mockOnHealthButtonClick}
      />
    );

    // Health button (find by role to avoid multiple "Health" text matches)
    const healthButton = screen.getByRole('button', { name: /health/i });
    expect(healthButton).toBeInTheDocument();
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    fireEvent.click(healthButton);
    expect(mockOnHealthButtonClick).toHaveBeenCalledTimes(1);

    // GitHub button
    const githubButton = screen.getByText('GitHub').closest('button');
    expect(githubButton).toBeInTheDocument();
    expect(screen.getByTestId('github-icon')).toBeInTheDocument();
    fireEvent.click(githubButton!);
    expect(mockWindowOpen).toHaveBeenCalledWith('https://github.com/example/test-service', '_blank');

    // SonarQube button
    const sonarButton = screen.getByText('SonarQube').closest('button');
    expect(sonarButton).toBeInTheDocument();
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    fireEvent.click(sonarButton!);
    expect(mockWindowOpen).toHaveBeenCalledWith('https://sonar.example.com/dashboard?id=test-service', '_blank');
  });

  it('should not render buttons when URLs are invalid', () => {
    const componentWithoutUrls = { ...mockComponent, github: '#', sonar: '#' };
    
    render(
      <ComponentHeader
        component={componentWithoutUrls}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        onHealthButtonClick={mockOnHealthButtonClick}
      />
    );

    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    expect(screen.queryByText('SonarQube')).not.toBeInTheDocument();
  });

  it('should display landscape and health status badges', () => {
    render(
      <ComponentHeader
        component={mockComponent}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={null}
        onHealthButtonClick={mockOnHealthButtonClick}
      />
    );

    expect(screen.getByText('Production Environment')).toBeInTheDocument();
    // Check for health badge specifically (not button)
    const healthBadges = screen.getAllByText('Health');
    expect(healthBadges.length).toBeGreaterThan(0);
    expect(screen.getByTestId('status-dot')).toBeInTheDocument();
  });

  it('should display different health states correctly', () => {
    // Loading state
    render(
      <ComponentHeader
        component={mockComponent}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={null}
        healthLoading={true}
        healthError={null}
        responseTime={null}
        statusCode={null}
        onHealthButtonClick={mockOnHealthButtonClick}
      />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();

    // Error state
    render(
      <ComponentHeader
        component={mockComponent}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={null}
        healthLoading={false}
        healthError="Connection failed"
        responseTime={null}
        statusCode={null}
        onHealthButtonClick={mockOnHealthButtonClick}
      />
    );
    expect(screen.getByText('Health Error')).toBeInTheDocument();
  });

  it('should display response time and status code badges when available', () => {
    render(
      <ComponentHeader
        component={mockComponent}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={125.5}
        statusCode={200}
        onHealthButtonClick={mockOnHealthButtonClick}
      />
    );

    expect(screen.getByText('Response: 125.50ms')).toBeInTheDocument();
    expect(screen.getByText('Status Code: 200')).toBeInTheDocument();
  });

  it('should apply correct styling for status codes', () => {
    // Success status code
    render(
      <ComponentHeader
        component={mockComponent}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={200}
        onHealthButtonClick={mockOnHealthButtonClick}
      />
    );
    const successBadge = screen.getByText('Status Code: 200');
    expect(successBadge).toHaveClass('bg-green-50', 'text-green-600');

    // Error status code
    render(
      <ComponentHeader
        component={mockComponent}
        selectedApiLandscape={mockSelectedApiLandscape}
        healthData={mockHealthData}
        healthLoading={false}
        healthError={null}
        responseTime={null}
        statusCode={500}
        onHealthButtonClick={mockOnHealthButtonClick}
      />
    );
    const errorBadge = screen.getByText('Status Code: 500');
    expect(errorBadge).toHaveClass('bg-red-50', 'text-red-600');
  });
});
