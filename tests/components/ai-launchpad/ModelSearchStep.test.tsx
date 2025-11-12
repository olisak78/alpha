import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../../src/test/setup';
import { ModelSearchStep } from '../../../src/components/AILaunchpad/ModelSearchStep';
import { FoundationModel } from '../../../src/services/aiPlatformApi';

// Mock the ModelSelectionCard component
vi.mock('../../../src/components/AILaunchpad/ModelSelectionCard', () => ({
  ModelSelectionCard: ({ model, onSelect }: { model: FoundationModel; onSelect: (model: FoundationModel) => void }) => (
    <div data-testid="model-selection-card" onClick={() => onSelect(model)}>
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
  versions: [],
  capabilities: ['text-generation'],
  tags: [],
  latestVersion: {
    name: '1.0.0',
    isLatest: true,
  },
  scenarioId: 'scenario-1',
};

const mockSecondModel: FoundationModel = {
  id: 'model-2',
  model: 'another-model',
  displayName: 'Another Model',
  description: 'Another test model',
  provider: 'AnotherProvider',
  executableId: 'exec-2',
  accessType: 'open',
  versions: [],
  capabilities: ['text-generation'],
  tags: [],
  latestVersion: {
    name: '2.0.0',
    isLatest: true,
  },
  scenarioId: 'scenario-2',
};

const mockProps = {
  searchTerm: '',
  onSearchChange: vi.fn(),
  models: [mockFoundationModel, mockSecondModel],
  filteredModels: [mockFoundationModel, mockSecondModel],
  isLoading: false,
  onModelSelect: vi.fn(),
};

describe('ModelSearchStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input and filtered models', () => {
    render(<ModelSearchStep {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search models by name or provider...');
    expect(searchInput).toBeInTheDocument();
    
    expect(screen.getByText('Model: Test Model')).toBeInTheDocument();
    expect(screen.getByText('Model: Another Model')).toBeInTheDocument();
  });

  it('should handle search input changes and model selection', async () => {
    const user = userEvent.setup();
    render(<ModelSearchStep {...mockProps} />);
    
    // Test search input - userEvent.type triggers onChange for each character
    const searchInput = screen.getByPlaceholderText('Search models by name or provider...');
    await user.clear(searchInput);
    await user.type(searchInput, 'test');
    
    // Check that onSearchChange was called with 't', 'e', 's', 't' (each character)
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('t');
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('e'); 
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('s');
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('t');
    
    // Test model selection
    const modelCard = screen.getByText('Model: Test Model');
    await user.click(modelCard);
    
    expect(mockProps.onModelSelect).toHaveBeenCalledWith(mockFoundationModel);
  });

  it('should show loading state when isLoading is true', () => {
    const loadingProps = {
      ...mockProps,
      isLoading: true,
    };
    
    render(<ModelSearchStep {...loadingProps} />);
    
    // Check for loading spinner
    const spinner = screen.getByText('', { selector: '.animate-spin' });
    expect(spinner).toBeInTheDocument();
  });

  it('should handle empty states correctly', () => {
    // No search results
    const noResultsProps = {
      ...mockProps,
      searchTerm: 'nonexistent model',
      filteredModels: [],
    };
    
    render(<ModelSearchStep {...noResultsProps} />);
    expect(screen.getByText('No models found matching your search')).toBeInTheDocument();
    
    // No models available
    const noModelsProps = {
      ...mockProps,
      searchTerm: '',
      filteredModels: [],
    };
    
    render(<ModelSearchStep {...noModelsProps} />);
    expect(screen.getByText('No models available')).toBeInTheDocument();
  });

  it('should display current search term', () => {
    const propsWithSearchTerm = {
      ...mockProps,
      searchTerm: 'test search',
    };
    
    render(<ModelSearchStep {...propsWithSearchTerm} />);
    
    const searchInput = screen.getByPlaceholderText('Search models by name or provider...') as HTMLInputElement;
    expect(searchInput.value).toBe('test search');
  });
});
