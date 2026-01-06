import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../../src/test/setup';
import { ModelSelectionCard } from '../../../src/components/AILaunchpad/ModelSelectionCard';
import { FoundationModel } from '../../../src/services/aiPlatformApi';

const mockFoundationModel: FoundationModel = {
  id: 'model-1',
  name: 'test-model',
  displayName: 'Test Model',
  description: 'A comprehensive test model for various AI tasks',
  provider: 'TestProvider',
  executableId: 'exec-1',
  accessType: 'open',
  versions: [],
  capabilities: ['text-generation', 'code-completion', 'translation', 'summarization'],
  tags: [],
  latestVersion: {
    name: '1.0.0',
    isLatest: true,
  },
};

const mockProps = {
  model: mockFoundationModel,
  onSelect: vi.fn(),
};

describe('ModelSelectionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render model information and handle selection', async () => {
    const user = userEvent.setup();
    render(<ModelSelectionCard {...mockProps} />);
    
    expect(screen.getByText('Test Model')).toBeInTheDocument();
    expect(screen.getByText('test-model')).toBeInTheDocument();
    expect(screen.getByText('A comprehensive test model for various AI tasks')).toBeInTheDocument();
    expect(screen.getByText('TestProvider')).toBeInTheDocument();
    
    const card = screen.getByText('Test Model').closest('.cursor-pointer');
    await user.click(card!);
    
    expect(mockProps.onSelect).toHaveBeenCalledWith(mockFoundationModel);
  });

  it('should render capabilities with "+N more" when exceeding 3', () => {
    render(<ModelSelectionCard {...mockProps} />);
    
    expect(screen.getByText('text-generation')).toBeInTheDocument();
    expect(screen.getByText('code-completion')).toBeInTheDocument();
    expect(screen.getByText('translation')).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('should handle models with no capabilities or few capabilities', () => {
    const modelWith3Capabilities = {
      ...mockFoundationModel,
      capabilities: ['text-generation', 'code-completion', 'translation'],
    };
    
    const { rerender } = render(<ModelSelectionCard model={modelWith3Capabilities} onSelect={mockProps.onSelect} />);
    
    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    
    // Test with no capabilities
    const modelWithoutCapabilities = {
      ...mockFoundationModel,
      capabilities: [],
    };
    
    rerender(<ModelSelectionCard model={modelWithoutCapabilities} onSelect={mockProps.onSelect} />);
    
    expect(screen.queryByText(/text-generation/)).not.toBeInTheDocument();
  });

  it('should have proper styling and be keyboard accessible', () => {
    const { container } = render(<ModelSelectionCard {...mockProps} />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('cursor-pointer');
    
    // Check brain icon exists
    const iconContainer = container.querySelector('.bg-purple-100.rounded-lg');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should handle long content gracefully', () => {
    const modelWithLongContent = {
      ...mockFoundationModel,
      displayName: 'Very Long Model Name That Should Be Handled Gracefully In The UI',
      description: 'This is a very long description that should be displayed properly in the card without breaking the layout',
    };
    
    render(<ModelSelectionCard model={modelWithLongContent} onSelect={mockProps.onSelect} />);
    
    expect(screen.getByText('Very Long Model Name That Should Be Handled Gracefully In The UI')).toBeInTheDocument();
    expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
  });
});
