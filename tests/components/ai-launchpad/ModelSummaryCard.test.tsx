import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../src/test/setup';
import { ModelSummaryCard } from '../../../src/components/AILaunchpad/ModelSummaryCard';
import { FoundationModel } from '../../../src/services/aiPlatformApi';

const mockFoundationModel: FoundationModel = {
  id: 'model-1',
  name: 'test-model',
  displayName: 'Test Model',
  description: 'A test model for AI tasks',
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
  model: mockFoundationModel,
};

describe('ModelSummaryCard', () => {
  it('should render model information with brain icon', () => {
    const { container } = render(<ModelSummaryCard {...mockProps} />);
    
    expect(screen.getByText('Test Model')).toBeInTheDocument();
    expect(screen.getByText('TestProvider')).toBeInTheDocument();
    
    // Check for Brain icon by its SVG elements or class
    const brainIcon = container.querySelector('svg');
    expect(brainIcon).toBeInTheDocument();
  });

  it('should have proper layout and styling', () => {
    const { container } = render(<ModelSummaryCard {...mockProps} />);
    
    // Check layout structure exists
    const flexContainer = screen.getByText('Test Model').closest('.flex.items-center.gap-3');
    expect(flexContainer).toBeInTheDocument();
    
    // Check brain icon exists
    const brainIcon = container.querySelector('svg');
    expect(brainIcon).toBeInTheDocument();
  });

  it('should handle different model data', () => {
    const customModel = {
      ...mockFoundationModel,
      displayName: 'Custom AI Model',
      provider: 'CustomProvider',
    };
    
    render(<ModelSummaryCard model={customModel} />);
    
    expect(screen.getByText('Custom AI Model')).toBeInTheDocument();
    expect(screen.getByText('CustomProvider')).toBeInTheDocument();
  });

  it('should render as compact summary without description or capabilities', () => {
    render(<ModelSummaryCard {...mockProps} />);
    
    // Should not include detailed information like description or capabilities
    expect(screen.queryByText('A test model for AI tasks')).not.toBeInTheDocument();
    expect(screen.queryByText('text-generation')).not.toBeInTheDocument();
    
    // Should have proper heading structure
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Test Model');
  });
});
