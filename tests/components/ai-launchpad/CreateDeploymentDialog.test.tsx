import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CreateDeploymentDialog } from '../../../src/components/AILaunchpad/CreateDeploymentDialog';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/services/aiPlatformApi', () => ({
  useFoundationModels: vi.fn(),
  useCreateConfiguration: vi.fn(),
  useCreateDeployment: vi.fn(),
}));

vi.mock('../../../src/components/AILaunchpad/ModelSearchStep', () => ({
  ModelSearchStep: ({ onModelSelect }: any) => (
    <div data-testid="model-search">
      <button onClick={() => onModelSelect({ id: 'model-1', displayName: 'Test Model' })}>
        Select Model
      </button>
    </div>
  ),
}));

vi.mock('../../../src/components/AILaunchpad/DeploymentConfigurationStep', () => ({
  DeploymentConfigurationStep: () => <div data-testid="deployment-config">Configuration</div>,
}));

vi.mock('../../../src/components/AILaunchpad/CreateDeploymentDialogButtons', () => ({
  CreateDeploymentDialogButtons: ({ onDeploy, onCancel }: any) => (
    <div data-testid="dialog-buttons">
      <button onClick={onCancel}>Cancel</button>
      <button onClick={onDeploy}>Deploy</button>
    </div>
  ),
}));

describe('CreateDeploymentDialog', () => {
  const mockToast = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockCreateConfiguration = { mutateAsync: vi.fn(), isPending: false };
  const mockCreateDeployment = { mutateAsync: vi.fn(), isPending: false };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { useToast } = await import('../../../src/hooks/use-toast');
    const { useFoundationModels, useCreateConfiguration, useCreateDeployment } = await import('../../../src/services/aiPlatformApi');
    
    (useToast as any).mockReturnValue({ toast: mockToast });
    (useFoundationModels as any).mockReturnValue({
      data: { resources: [] },
      isLoading: false,
    });
    (useCreateConfiguration as any).mockReturnValue(mockCreateConfiguration);
    (useCreateDeployment as any).mockReturnValue(mockCreateDeployment);
  });

  it('should render model search step and progress to configuration', () => {
    render(<CreateDeploymentDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.getByText('Deploy AI Model')).toBeInTheDocument();
    expect(screen.getByTestId('model-search')).toBeInTheDocument();
    
    // Progress to configuration step
    fireEvent.click(screen.getByText('Select Model'));
    
    expect(screen.getByText('Deploy Test Model')).toBeInTheDocument();
    expect(screen.getByTestId('deployment-config')).toBeInTheDocument();
  });

  it('should handle deployment flow and cancel action', async () => {
    mockCreateConfiguration.mutateAsync.mockResolvedValue({ id: 'config-123' });
    mockCreateDeployment.mutateAsync.mockResolvedValue({});

    render(<CreateDeploymentDialog open={true} onOpenChange={mockOnOpenChange} />);
    
    // Select model and deploy
    fireEvent.click(screen.getByText('Select Model'));
    fireEvent.click(screen.getByText('Deploy'));
    
    expect(mockCreateDeployment.mutateAsync).toHaveBeenCalled();
    
    // Test cancel
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not render when closed', () => {
    render(<CreateDeploymentDialog open={false} onOpenChange={mockOnOpenChange} />);
    
    expect(screen.queryByText('Deploy AI Model')).not.toBeInTheDocument();
  });
});
