import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { DeploymentCardHeader } from '../../../src/components/AILaunchpad/DeploymentCardHeader';
import { Deployment } from '../../../src/services/aiPlatformApi';

// Mock the utility functions
vi.mock('../../../src/components/AILaunchpad/deploymentUtils', () => ({
  getModelDisplayName: vi.fn(),
  getStatusIcon: vi.fn(),
  getStatusColor: vi.fn(),
}));

const mockDeployment: Deployment = {
  id: 'test-deployment-123',
  status: 'RUNNING',
  configurationId: 'config-123',
  deploymentUrl: 'https://api.example.com/deploy/123',
  createdAt: '2023-01-01T00:00:00Z',
  modifiedAt: '2023-01-01T00:00:00Z',
  configurationName: 'Test Model Configuration',
};

const mockProps = {
  deployment: mockDeployment,
  onCopyId: vi.fn(),
};

describe('DeploymentCardHeader', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { getModelDisplayName, getStatusIcon, getStatusColor } = await import('../../../src/components/AILaunchpad/deploymentUtils');
    (getModelDisplayName as any).mockReturnValue('Test Model');
    (getStatusIcon as any).mockReturnValue(() => null); // Mock Lucide icon component
    (getStatusColor as any).mockReturnValue('bg-green-100 text-green-800');
  });

  it('should render model name and status', () => {
    render(<DeploymentCardHeader {...mockProps} />);
    
    expect(screen.getByText('Test Model')).toBeInTheDocument();
    expect(screen.getByText('RUNNING')).toBeInTheDocument();
  });

  it('should handle copy button click and status styling', async () => {
    const user = userEvent.setup();
    render(<DeploymentCardHeader {...mockProps} />);
    
    // Test copy functionality
    const copyButton = screen.getByRole('button');
    await user.click(copyButton);
    expect(mockProps.onCopyId).toHaveBeenCalledWith('Test Model');
  });

  it('should handle different deployment statuses', async () => {
    const { getStatusColor } = await import('../../../src/components/AILaunchpad/deploymentUtils');
    (getStatusColor as any).mockReturnValue('bg-red-100 text-red-800');
    
    const stoppedDeployment = {
      ...mockDeployment,
      status: 'STOPPED' as const,
    };
    
    render(<DeploymentCardHeader deployment={stoppedDeployment} onCopyId={mockProps.onCopyId} />);
    
    expect(screen.getByText('STOPPED')).toBeInTheDocument();
  });

  it('should display PENDING when status is UNKNOWN and targetStatus is RUNNING', () => {
    const pendingDeployment = {
      ...mockDeployment,
      status: 'UNKNOWN' as const,
      targetStatus: 'RUNNING',
    };
    
    render(<DeploymentCardHeader deployment={pendingDeployment} onCopyId={mockProps.onCopyId} />);
    
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('should display STOPPING when status is RUNNING and targetStatus is STOPPED', () => {
    const stoppingDeployment = {
      ...mockDeployment,
      status: 'RUNNING' as const,
      targetStatus: 'STOPPED',
    };
    
    render(<DeploymentCardHeader deployment={stoppingDeployment} onCopyId={mockProps.onCopyId} />);
    
    expect(screen.getByText('STOPPING')).toBeInTheDocument();
  });

  it('should display DELETING when status is STOPPED and targetStatus is DELETED', () => {
    const deletingDeployment = {
      ...mockDeployment,
      status: 'STOPPED' as const,
      targetStatus: 'DELETED',
    };
    
    render(<DeploymentCardHeader deployment={deletingDeployment} onCopyId={mockProps.onCopyId} />);
    
    expect(screen.getByText('DELETING')).toBeInTheDocument();
  });

  it('should call utility functions correctly', async () => {
    const { getModelDisplayName, getStatusIcon, getStatusColor } = await import('../../../src/components/AILaunchpad/deploymentUtils');
    
    render(<DeploymentCardHeader {...mockProps} />);
    
    expect(getModelDisplayName).toHaveBeenCalledWith(mockDeployment);
    expect(getStatusIcon).toHaveBeenCalledWith(mockDeployment.status);
    expect(getStatusColor).toHaveBeenCalledWith(mockDeployment.status);
  });
});
