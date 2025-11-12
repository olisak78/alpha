import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { DeploymentConfigurationStep } from '../../../src/components/AILaunchpad/DeploymentConfigurationStep';
import { FoundationModel } from '../../../src/services/aiPlatformApi';

// Mock the ModelSummaryCard component
vi.mock('../../../src/components/AILaunchpad/ModelSummaryCard', () => ({
  ModelSummaryCard: ({ model }: { model: FoundationModel }) => (
    <div data-testid="model-summary-card">
      Model: {model.displayName}
    </div>
  ),
}));

const mockFoundationModel: FoundationModel = {
  id: 'model-1',
  model: 'test-model',
  displayName: 'Test Model',
  description: 'A test model',
  provider: 'TestProvider',
  executableId: 'exec-1',
  accessType: 'open',
  versions: [
    {
      name: '1.0.0',
      isLatest: true,
    }
  ],
  capabilities: ['text-generation'],
  tags: [],
  scenarioId: 'foundation-models',
};

const mockProps = {
  selectedModel: mockFoundationModel,
  selectedVersion: '1.0.0',
  onVersionChange: vi.fn(),
};

describe('DeploymentConfigurationStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render model summary and configuration fields', () => {
    render(<DeploymentConfigurationStep {...mockProps} />);
    
    expect(screen.getByTestId('model-summary-card')).toBeInTheDocument();
    expect(screen.getByText('Model: Test Model')).toBeInTheDocument();
    
    // Check for configuration fields
    expect(screen.getByLabelText(/Scenario ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Executable ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Model Version/i)).toBeInTheDocument();
  });

  it('should handle version selection changes', async () => {
    const user = userEvent.setup();
    render(<DeploymentConfigurationStep {...mockProps} />);
    
    const versionSelect = screen.getByLabelText(/Model Version/i);
    expect(versionSelect).toBeInTheDocument();
    
    // The select should show the current version with "(Latest)" text
    const selectButton = screen.getByRole('combobox');
    expect(selectButton).toHaveTextContent('1.0.0');
    expect(selectButton).toHaveTextContent('(Latest)');
  });

  it('should display deployment note', () => {
    render(<DeploymentConfigurationStep {...mockProps} />);
    
    expect(screen.getByText('Note:')).toBeInTheDocument();
    expect(screen.getByText(/The deployment will take a few minutes to become available/i)).toBeInTheDocument();
  });

  it('should show disabled configuration fields', () => {
    render(<DeploymentConfigurationStep {...mockProps} />);
    
    const scenarioInput = screen.getByLabelText(/Scenario ID/i) as HTMLInputElement;
    const executableInput = screen.getByLabelText(/Executable ID/i) as HTMLInputElement;
    
    expect(scenarioInput).toBeDisabled();
    expect(executableInput).toBeDisabled();
    expect(scenarioInput.value).toBe('foundation-models');
    expect(executableInput.value).toBe('exec-1');
  });
});
