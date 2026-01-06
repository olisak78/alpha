import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HealthDashboard } from '../../../src/components/Health/HealthDashboard';
import type { Landscape } from '../../../src/types/developer-portal';
import { useHealth } from '../../../src/hooks/api/useHealth';
import '@testing-library/jest-dom/vitest';

// Mock the useHealth hook
vi.mock('../../../src/hooks/api/useHealth');
const mockUseHealth = vi.mocked(useHealth);

// Mock child components
vi.mock('../../../src/components/Health/HealthOverview', () => ({
  HealthOverview: () => <div data-testid="health-overview" />,
}));

vi.mock('../../../src/components/Health/HealthTable', () => ({
  HealthTable: () => <div data-testid="health-table" />,
}));

vi.mock('../../../src/components/LandscapeFilter', () => ({
  LandscapeFilter: ({ onLandscapeChange }: any) => (
    <button data-testid="landscape-filter" onClick={() => onLandscapeChange('eu10-canary')}>
      Filter
    </button>
  ),
}));

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button data-testid="refresh-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('HealthDashboard', () => {
  const mockLandscapeGroups: Record<string, Landscape[]> = {
    'EU10': [{
      id: 'eu10-canary',
      name: 'EU10 Canary',
      landscape_url: 'cfapps.sap.hana.ondemand.com',
      isCentral: false,
      status: 'active',
      githubConfig: 'github-config',
      awsAccount: 'aws-account',
      camProfile: 'cam-profile',
      deploymentStatus: 'deployed',
    }],
  };

  const defaultProps = {
    projectId: 'cis20',
    components: [{ id: 'test-service', name: 'Test Service', owner_id: 'team1' }],
    landscapeGroups: mockLandscapeGroups,
    selectedLandscape: 'eu10-canary',
    onLandscapeChange: vi.fn(),
    onShowLandscapeDetails: vi.fn(),
    isLoadingComponents: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHealth.mockReturnValue({
      healthChecks: [],
      isLoading: false,
      summary: { total: 0, up: 0, down: 0, unknown: 0, error: 0, avgResponseTime: 0 },
      refetch: vi.fn(),
      isFetching: false,
      isError: false,
      error: null,
    });
  });

  it('should render loading state when components are loading', () => {
    render(<HealthDashboard {...defaultProps} isLoadingComponents={true} />);
    expect(screen.getByText('Loading components...')).toBeTruthy();
  });

  it('should render landscape selection prompt when no landscape selected', () => {
    render(<HealthDashboard {...defaultProps} selectedLandscape={null} />);
    expect(screen.getByText('Select a landscape to view component health')).toBeTruthy();
  });

  it('should render health dashboard when landscape is selected', () => {
    render(<HealthDashboard {...defaultProps} />);
    expect(screen.getByTestId('health-overview')).toBeTruthy();
    expect(screen.getByTestId('health-table')).toBeTruthy();
  });

  it('should handle refresh button click', () => {
    const mockRefetch = vi.fn();
    mockUseHealth.mockReturnValue({
      healthChecks: [],
      isLoading: false,
      summary: { total: 0, up: 0, down: 0, unknown: 0, error: 0, avgResponseTime: 0 },
      refetch: mockRefetch,
      isFetching: false,
      isError: false,
      error: null,
    });

    render(<HealthDashboard {...defaultProps} />);
    fireEvent.click(screen.getByTestId('refresh-button'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle landscape change', () => {
    const mockOnLandscapeChange = vi.fn();
    render(<HealthDashboard {...defaultProps} onLandscapeChange={mockOnLandscapeChange} />);
    fireEvent.click(screen.getByTestId('landscape-filter'));
    expect(mockOnLandscapeChange).toHaveBeenCalledWith('eu10-canary');
  });
});
