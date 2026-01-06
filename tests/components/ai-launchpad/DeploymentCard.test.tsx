import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DeploymentCard } from '../../../src/components/AILaunchpad/DeploymentCard';
import { Deployment } from '../../../src/services/aiPlatformApi';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/services/aiPlatformApi', () => ({
  useStopDeployment: vi.fn(),
  useDeleteDeployment: vi.fn(),
}));

vi.mock('../../../src/components/AILaunchpad/DeploymentCardHeader', () => ({
  DeploymentCardHeader: ({ deployment, onCopyId }: any) => (
    <div data-testid="deployment-header" onClick={() => onCopyId(deployment.id)}>
      {deployment.id}
    </div>
  ),
}));

vi.mock('../../../src/components/AILaunchpad/ModelConfigurationSection', () => ({
  ModelConfigurationSection: () => <div data-testid="model-config">Model Config</div>,
}));

vi.mock('../../../src/components/AILaunchpad/TimelineSection', () => ({
  TimelineSection: () => <div data-testid="timeline">Timeline</div>,
}));

vi.mock('../../../src/components/AILaunchpad/EndpointSection', () => ({
  EndpointSection: ({ onCopyEndpoint }: any) => (
    <div data-testid="endpoint" onClick={onCopyEndpoint}>Endpoint</div>
  ),
}));

vi.mock('../../../src/components/AILaunchpad/DeploymentCardActions', () => ({
  DeploymentCardActions: ({ onStop, onDelete }: any) => (
    <div data-testid="card-actions">
      <button onClick={onStop}>Stop</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}));

const mockDeployment: Deployment = {
  id: 'test-deployment-123',
  status: 'RUNNING',
  configurationId: 'config-123',
  deploymentUrl: 'https://api.example.com/deploy/123',
  createdAt: '2023-01-01T00:00:00Z',
  modifiedAt: '2023-01-01T00:00:00Z',
};

describe('DeploymentCard', () => {
  const mockToast = vi.fn();
  const mockStopMutation = { mutateAsync: vi.fn(), isPending: false };
  const mockDeleteMutation = { mutateAsync: vi.fn(), isPending: false };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { useToast } = await import('../../../src/hooks/use-toast');
    const { useStopDeployment, useDeleteDeployment } = await import('../../../src/services/aiPlatformApi');
    
    (useToast as any).mockReturnValue({ toast: mockToast });
    (useStopDeployment as any).mockReturnValue(mockStopMutation);
    (useDeleteDeployment as any).mockReturnValue(mockDeleteMutation);
  });

  it('should render all card sections', () => {
    render(<DeploymentCard deployment={mockDeployment} />);
    
    expect(screen.getByTestId('deployment-header')).toBeInTheDocument();
    expect(screen.getByTestId('model-config')).toBeInTheDocument();
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
    expect(screen.getByTestId('endpoint')).toBeInTheDocument();
    expect(screen.getByTestId('card-actions')).toBeInTheDocument();
  });

  it('should handle copy functionality', () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn() },
    });

    render(<DeploymentCard deployment={mockDeployment} />);
    
    // Test copy endpoint
    fireEvent.click(screen.getByTestId('endpoint'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockDeployment.deploymentUrl);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Copied",
      description: "Endpoint URL copied to clipboard",
    });
    
    // Test copy deployment ID
    fireEvent.click(screen.getByTestId('deployment-header'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockDeployment.id);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Copied",
      description: "Deployment ID copied to clipboard",
    });
  });

  it('should handle deployment actions', () => {
    render(<DeploymentCard deployment={mockDeployment} />);
    
    fireEvent.click(screen.getByText('Stop'));
    expect(mockStopMutation.mutateAsync).toHaveBeenCalledWith(mockDeployment.id);
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockDeleteMutation.mutateAsync).toHaveBeenCalledWith(mockDeployment.id);
  });
});
