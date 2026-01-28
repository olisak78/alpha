import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../../src/test/setup';
import { DeploymentCardActions } from '../../../src/components/AILaunchpad/DeploymentCardActions';
import { Deployment } from '../../../src/services/aiPlatformApi';

const mockDeployment: Deployment = {
  id: 'test-deployment-123',
  status: 'RUNNING',
  configurationId: 'config-123',
  createdAt: '2023-01-01T00:00:00Z',
  modifiedAt: '2023-01-01T00:00:00Z',
};

describe('DeploymentCardActions', () => {
  const mockOnStop = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show stop and delete buttons', () => {
    render(
      <DeploymentCardActions
        deployment={mockDeployment}
        isStopPending={false}
        isDeletePending={false}
        onStop={mockOnStop}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Stop')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should handle action clicks and loading states', () => {
    // Test Stop action with RUNNING/RUNNING deployment
    const runningDeployment = { 
      ...mockDeployment, 
      status: 'RUNNING' as const,
      targetStatus: 'RUNNING'
    };
    
    const { rerender } = render(
      <DeploymentCardActions
        deployment={runningDeployment}
        isStopPending={false}
        isDeletePending={false}
        onStop={mockOnStop}
        onDelete={mockOnDelete}
      />
    );
    
    // Test stop action (should be enabled)
    fireEvent.click(screen.getByText('Stop'));
    expect(mockOnStop).toHaveBeenCalled();
    
    // Test Delete action with STOPPED/STOPPED deployment
    const stoppedDeployment = { 
      ...mockDeployment, 
      status: 'STOPPED' as const,
      targetStatus: 'STOPPED'
    };
    
    rerender(
      <DeploymentCardActions
        deployment={stoppedDeployment}
        isStopPending={false}
        isDeletePending={false}
        onStop={mockOnStop}
        onDelete={mockOnDelete}
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnDelete).toHaveBeenCalled();
    
    // Test loading states
    rerender(
      <DeploymentCardActions
        deployment={runningDeployment}
        isStopPending={true}
        isDeletePending={true}
        onStop={mockOnStop}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Stop')).toBeDisabled();
    expect(screen.getByText('Delete')).toBeDisabled();
  });

  it('should enable stop button only when status and targetStatus are both RUNNING', () => {
    const runningDeployment = { 
      ...mockDeployment, 
      status: 'RUNNING' as const,
      targetStatus: 'RUNNING'
    };
    
    render(
      <DeploymentCardActions
        deployment={runningDeployment}
        isStopPending={false}
        isDeletePending={false}
        onStop={mockOnStop}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Stop')).not.toBeDisabled();
  });

  it('should enable delete button only when status and targetStatus are both STOPPED', () => {
    const stoppedDeployment = { 
      ...mockDeployment, 
      status: 'STOPPED' as const,
      targetStatus: 'STOPPED'
    };
    
    render(
      <DeploymentCardActions
        deployment={stoppedDeployment}
        isStopPending={false}
        isDeletePending={false}
        onStop={mockOnStop}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Delete')).not.toBeDisabled();
  });
});
