import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { CreateDeploymentDialogButtons } from '../../../src/components/AILaunchpad/CreateDeploymentDialogButtons';
import { FoundationModel } from '../../../src/services/aiPlatformApi';

const mockFoundationModel: FoundationModel = {
  id: 'model-1',
  name: 'test-model',
  displayName: 'Test Model',
  description: 'A test model',
  provider: 'TestProvider',
  executableId: 'exec-1',
  accessType: 'open',
  versions: [],
  capabilities: ['text-generation'],
  tags: [],
  latestVersion: {
    name: '1.0.0',
    isLatest: true,
  },
};

const mockProps = {
  step: 'select' as const,
  isDeploying: false,
  selectedModel: null,
  onBack: vi.fn(),
  onCancel: vi.fn(),
  onDeploy: vi.fn(),
};

describe('CreateDeploymentDialogButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render appropriate buttons for select step', () => {
    // Select step - only cancel
    render(<CreateDeploymentDialogButtons {...mockProps} />);
    
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Deploy Model/ })).not.toBeInTheDocument();
  });

  it('should render appropriate buttons for configure step', () => {
    // Configure step - back, cancel, deploy
    const configureProps = {
      ...mockProps,
      step: 'configure' as const,
      selectedModel: mockFoundationModel,
    };
    
    render(<CreateDeploymentDialogButtons {...configureProps} />);
    
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deploy Model' })).toBeInTheDocument();
  });

  it('should handle button clicks correctly', async () => {
    const user = userEvent.setup();
    const configureProps = {
      ...mockProps,
      step: 'configure' as const,
      selectedModel: mockFoundationModel,
    };
    
    render(<CreateDeploymentDialogButtons {...configureProps} />);
    
    // Test back button
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(mockProps.onBack).toHaveBeenCalledTimes(1);
    
    // Test cancel button
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
    
    // Test deploy button
    await user.click(screen.getByRole('button', { name: 'Deploy Model' }));
    expect(mockProps.onDeploy).toHaveBeenCalledTimes(1);
  });

  it('should handle loading and disabled states correctly', () => {
    const deployingProps = {
      ...mockProps,
      step: 'configure' as const,
      selectedModel: mockFoundationModel,
      isDeploying: true,
    };
    
    render(<CreateDeploymentDialogButtons {...deployingProps} />);
    
    // All buttons should be disabled when deploying
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Deploying.../ })).toBeDisabled();
    
    // Deploy button should show loading text and spinner
    expect(screen.getByText('Deploying...')).toBeInTheDocument();
    const deployButton = screen.getByRole('button', { name: /Deploying.../ });
    expect(deployButton.querySelector('[class*="animate-spin"]')).toBeInTheDocument();
  });

  it('should disable deploy button when no model is selected', () => {
    const noModelProps = {
      ...mockProps,
      step: 'configure' as const,
      selectedModel: null,
    };
    
    render(<CreateDeploymentDialogButtons {...noModelProps} />);
    
    expect(screen.getByRole('button', { name: 'Deploy Model' })).toBeDisabled();
  });
});
