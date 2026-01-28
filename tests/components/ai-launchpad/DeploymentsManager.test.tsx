import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DeploymentsManager } from '../../../src/components/AILaunchpad/DeploymentsManager';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('../../../src/services/aiPlatformApi', () => ({
  useDeployments: vi.fn(),
  useAIAuth: vi.fn(),
}));

vi.mock('../../../src/components/AILaunchpad/DeploymentCard', () => ({
  DeploymentCard: ({ deployment }: any) => (
    <div data-testid="deployment-card">{deployment.id}</div>
  ),
}));

vi.mock('../../../src/components/AILaunchpad/DeploymentsHeader', () => ({
  DeploymentsHeader: ({ onRefresh, onCreateDeployment }: any) => (
    <div data-testid="deployments-header">
      <button onClick={onRefresh}>Refresh</button>
      <button onClick={onCreateDeployment}>Create</button>
    </div>
  ),
}));

vi.mock('../../../src/components/AILaunchpad/CreateDeploymentDialog', () => ({
  CreateDeploymentDialog: ({ open }: any) => 
    open ? <div data-testid="create-dialog">Create Dialog</div> : null,
}));

vi.mock('../../../src/components/AILaunchpad/DeploymentsLoadingSkeleton', () => ({
  DeploymentsLoadingSkeleton: () => <div data-testid="deployments-loading-skeleton">Loading skeleton</div>,
}));

describe('DeploymentsManager', () => {
  const mockToast = vi.fn();
  const mockRefetch = vi.fn();

  const mockDeploymentsData = {
    deployments: [
      {
        team: 'team-a',
        deployments: [
          { id: 'deploy-1', status: 'RUNNING', team: 'team-a' },
          { id: 'deploy-2', status: 'STOPPED', team: 'team-a' },
        ],
      },
      {
        team: 'team-b',
        deployments: [
          { id: 'deploy-3', status: 'PENDING', team: 'team-b' },
        ],
      },
    ],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { useToast } = await import('../../../src/hooks/use-toast');
    const { useDeployments, useAIAuth } = await import('../../../src/services/aiPlatformApi');
    
    (useToast as any).mockReturnValue({ toast: mockToast });
    (useAIAuth as any).mockReturnValue({ data: { tenantId: 'test-tenant' } });
    (useDeployments as any).mockReturnValue({
      data: mockDeploymentsData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('should render deployments with all components', () => {
    render(<DeploymentsManager />);

    expect(screen.getByTestId('deployments-header')).toBeInTheDocument();
    // Stats are now inline badges, not a separate component
    expect(screen.getByText(/Running/)).toBeInTheDocument();
    expect(screen.getByText(/Total/)).toBeInTheDocument();
    expect(screen.getByText(/Model Types/)).toBeInTheDocument();
    expect(screen.getAllByTestId('deployment-card')).toHaveLength(3);
  });

  it('should handle refresh and create actions', () => {
    render(<DeploymentsManager />);
    
    // Test refresh
    fireEvent.click(screen.getByText('Refresh'));
    expect(mockRefetch).toHaveBeenCalled();
    
    // Test create dialog
    fireEvent.click(screen.getByText('Create'));
    expect(screen.getByTestId('create-dialog')).toBeInTheDocument();
  });

  it('should handle different loading states', async () => {
    const { useDeployments } = await import('../../../src/services/aiPlatformApi');
    
    // Loading state
    (useDeployments as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });
    
    render(<DeploymentsManager />);
    expect(screen.getByTestId('deployments-loading-skeleton')).toBeInTheDocument();
    
    // Error state
    (useDeployments as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: mockRefetch,
    });
    
    render(<DeploymentsManager />);
    expect(screen.getByText(/Error loading deployments/)).toBeInTheDocument();
    
    // Empty state
    (useDeployments as any).mockReturnValue({
      data: { deployments: [] },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    
    render(<DeploymentsManager />);
    expect(screen.getByText('No AI Models Deployed')).toBeInTheDocument();
  });
});
