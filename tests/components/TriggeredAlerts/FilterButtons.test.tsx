import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterButtons } from '../../../src/components/TriggeredAlerts/FilterButtons';
import { TriggeredAlertsProvider } from '../../../src/contexts/TriggeredAlertsContext';

// Mock the useTriggeredAlertsFilters hook
const mockActions = {
  setSearchTerm: vi.fn(),
  setSelectedSeverity: vi.fn(),
  setSelectedLandscape: vi.fn(),
  setSelectedRegion: vi.fn(),
  setSelectedComponent: vi.fn(),
  setStartDate: vi.fn(),
  setEndDate: vi.fn(),
  addExcludedSeverity: vi.fn(),
  addExcludedLandscape: vi.fn(),
  addExcludedRegion: vi.fn(),
  addExcludedComponent: vi.fn(),
  addExcludedAlertname: vi.fn(),
  handleDateRangeSelect: vi.fn(),
  resetFilters: vi.fn(),
  removeSearchTerm: vi.fn(),
  removeSeverity: vi.fn(),
  removeLandscape: vi.fn(),
  removeRegion: vi.fn(),
  removeComponent: vi.fn(),
  removeDateRange: vi.fn(),
  removeExcludedSeverity: vi.fn(),
  removeExcludedLandscape: vi.fn(),
  removeExcludedRegion: vi.fn(),
  removeExcludedComponent: vi.fn(),
  removeExcludedAlertname: vi.fn(),
  clearAllExcludedSeverity: vi.fn(),
  clearAllExcludedLandscape: vi.fn(),
  clearAllExcludedRegion: vi.fn(),
  clearAllExcludedComponent: vi.fn(),
  clearAllExcludedAlertname: vi.fn(),
};

const mockHookReturn = {
  filters: {
    searchTerm: '',
    selectedSeverity: [],
    selectedLandscape: [],
    selectedRegion: [],
    selectedComponent: [],
    startDate: '',
    endDate: '',
    excludedSeverity: [],
    excludedLandscape: [],
    excludedRegion: [],
    excludedComponent: [],
    excludedAlertname: [],
  },
  actions: mockActions,
  options: {
    severities: ['critical', 'warning', 'info'],
    landscapes: ['production', 'staging', 'development'],
    components: ['component-a', 'component-b', 'component-c'],
    regions: ['us-east-1', 'eu-west-1', 'ap-south-1'],
  },
  filteredAlerts: [],
  isLoading: false,
  filtersLoading: false,
  error: null,
  appliedFilters: [],
};

vi.mock('../../../src/hooks/useTriggeredAlertsFilters', () => ({
  useTriggeredAlertsFilters: vi.fn(() => mockHookReturn),
}));

// Helper function to render with provider
function renderWithProvider(component: React.ReactElement) {
  return render(
    <TriggeredAlertsProvider projectId="test-project">
      {component}
    </TriggeredAlertsProvider>
  );
}

describe('FilterButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render with correct structure and styling', () => {
      renderWithProvider(
        <FilterButtons filterType="severity" value="critical" />
      );

      const includeButton = screen.getByTitle('Filter by severity: critical');
      const excludeButton = screen.getByTitle('Exclude severity: critical');

      // Verify both buttons are rendered
      expect(includeButton).toBeInTheDocument();
      expect(excludeButton).toBeInTheDocument();

      // Verify container styling
      const container = includeButton.closest('div');
      expect(container).toHaveClass('flex', 'gap-0.5', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity');

      // Verify button-specific styling
      expect(includeButton).toHaveClass('h-4', 'w-4', 'p-0', 'hover:bg-green-100', 'hover:text-green-700');
      expect(excludeButton).toHaveClass('h-4', 'w-4', 'p-0', 'hover:bg-red-100', 'hover:text-red-700');

      // Verify icons are present
      const plusIcon = includeButton.querySelector('svg');
      const minusIcon = excludeButton.querySelector('svg');
      expect(plusIcon).toBeInTheDocument();
      expect(minusIcon).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      renderWithProvider(
        <FilterButtons filterType="severity" value="critical" className="custom-class" />
      );

      const container = screen.getByTitle('Filter by severity: critical').closest('div');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Filter Functionality', () => {
    const testCases = [
      { type: 'severity', value: 'critical', includeAction: 'setSelectedSeverity', excludeAction: 'addExcludedSeverity' },
      { type: 'landscape', value: 'production', includeAction: 'setSelectedLandscape', excludeAction: 'addExcludedLandscape' },
      { type: 'region', value: 'us-east-1', includeAction: 'setSelectedRegion', excludeAction: 'addExcludedRegion' },
      { type: 'component', value: 'test-component', includeAction: 'setSelectedComponent', excludeAction: 'addExcludedComponent' },
      { type: 'alertname', value: 'Test Alert', includeAction: 'setSearchTerm', excludeAction: 'addExcludedAlertname' },
    ] as const;

    testCases.forEach(({ type, value, includeAction, excludeAction }) => {
      it(`should handle ${type} filter actions correctly`, () => {
        renderWithProvider(
          <FilterButtons filterType={type} value={value} />
        );

        const includeButton = screen.getByTitle(`Filter by ${type}: ${value}`);
        const excludeButton = screen.getByTitle(`Exclude ${type}: ${value}`);

        // Test include functionality
        fireEvent.click(includeButton);
        if (includeAction === 'setSearchTerm') {
          expect(mockActions[includeAction]).toHaveBeenCalledWith(value);
        } else {
          expect(mockActions[includeAction]).toHaveBeenCalledWith([value]);
        }
        expect(mockActions[includeAction]).toHaveBeenCalledTimes(1);

        // Test exclude functionality
        fireEvent.click(excludeButton);
        expect(mockActions[excludeAction]).toHaveBeenCalledWith(value);
        expect(mockActions[excludeAction]).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Edge Cases and Special Values', () => {
    it('should handle empty string values', () => {
      renderWithProvider(
        <FilterButtons filterType="severity" value="" />
      );

      // Use a more flexible approach to find buttons with empty values
      const buttons = screen.getAllByRole('button');
      const includeButton = buttons.find(button => 
        button.getAttribute('title')?.startsWith('Filter by severity:')
      );
      const excludeButton = buttons.find(button => 
        button.getAttribute('title')?.startsWith('Exclude severity:')
      );

      expect(includeButton).toBeInTheDocument();
      expect(excludeButton).toBeInTheDocument();

      fireEvent.click(includeButton!);
      expect(mockActions.setSelectedSeverity).toHaveBeenCalledWith(['']);
    });

    it('should handle special characters and long values', () => {
      const specialValue = 'test-alert@#$%^&*()';
      renderWithProvider(
        <FilterButtons filterType="alertname" value={specialValue} />
      );

      const includeButton = screen.getByTitle(`Filter by alertname: ${specialValue}`);
      fireEvent.click(includeButton);

      expect(mockActions.setSearchTerm).toHaveBeenCalledWith(specialValue);
    });
  });

  describe('Integration and Accessibility', () => {
    it('should render without error when used outside TriggeredAlertsProvider', () => {
      // The component should gracefully handle being used outside the provider
      expect(() => {
        render(<FilterButtons filterType="severity" value="critical" />);
      }).not.toThrow();

      // Verify buttons are still rendered
      const includeButton = screen.getByTitle('Filter by severity: critical');
      const excludeButton = screen.getByTitle('Exclude severity: critical');
      
      expect(includeButton).toBeInTheDocument();
      expect(excludeButton).toBeInTheDocument();
    });

    it('should be accessible with proper attributes', () => {
      renderWithProvider(
        <FilterButtons filterType="severity" value="critical" />
      );

      const buttons = screen.getAllByRole('button');
      const includeButton = screen.getByTitle('Filter by severity: critical');
      const excludeButton = screen.getByTitle('Exclude severity: critical');

      expect(buttons).toHaveLength(2);
      expect(includeButton).toHaveAttribute('title', 'Filter by severity: critical');
      expect(excludeButton).toHaveAttribute('title', 'Exclude severity: critical');

      // Test keyboard accessibility
      includeButton.focus();
      expect(includeButton).toHaveFocus();
    });

    it('should handle multiple interactions correctly', () => {
      renderWithProvider(
        <FilterButtons filterType="severity" value="critical" />
      );

      const includeButton = screen.getByTitle('Filter by severity: critical');
      const excludeButton = screen.getByTitle('Exclude severity: critical');

      // Test multiple clicks on same button
      fireEvent.click(includeButton);
      fireEvent.click(includeButton);
      expect(mockActions.setSelectedSeverity).toHaveBeenCalledTimes(2);
      expect(mockActions.setSelectedSeverity).toHaveBeenCalledWith(['critical']);

      // Test exclude button interaction
      fireEvent.click(excludeButton);
      expect(mockActions.addExcludedSeverity).toHaveBeenCalledWith('critical');
      expect(mockActions.addExcludedSeverity).toHaveBeenCalledTimes(1);
    });
  });
});
