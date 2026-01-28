import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AppliedFilters } from '../../src/components/AppliedFilters';

describe('AppliedFilters', () => {
  const mockProps = {
    searchTerm: '',
    selectedSeverity: '',
    selectedStatus: '',
    selectedLandscape: '',
    selectedRegion: '',
    selectedComponent: '',
    startDate: '',
    endDate: '',
    onRemoveSearchTerm: vi.fn(),
    onRemoveSeverity: vi.fn(),
    onRemoveStatus: vi.fn(),
    onRemoveLandscape: vi.fn(),
    onRemoveRegion: vi.fn(),
    onRemoveComponent: vi.fn(),
    onRemoveDateRange: vi.fn(),
    onClearAllFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering behavior', () => {
    it('should return null when no filters are applied', () => {
      const { container } = render(<AppliedFilters {...mockProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when filter values are "all"', () => {
      const propsWithAll = {
        ...mockProps,
        selectedSeverity: 'all',
        selectedStatus: 'all',
        selectedLandscape: 'all',
        selectedRegion: 'all',
        selectedComponent: 'all',
      };
      const { container } = render(<AppliedFilters {...propsWithAll} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render applied filters container when filters exist', () => {
      const props = { ...mockProps, searchTerm: 'test' };
      render(<AppliedFilters {...props} />);
      
      // The component should render the filter badge
      expect(screen.getByText('Search: "test"')).toBeInTheDocument();
      
      // Check the root container has the correct classes
      const badge = screen.getByText('Search: "test"');
      const container = badge.closest('div')?.parentElement;
      expect(container).toHaveClass('flex', 'flex-wrap', 'items-center', 'gap-2');
    });
  });

  describe('Individual filter rendering', () => {
    it('should render all filter types correctly', () => {
      const props = {
        ...mockProps,
        searchTerm: 'test search',
        selectedSeverity: 'critical',
        selectedLandscape: 'production',
        selectedRegion: 'us-east-1',
        selectedComponent: 'component-a',
      };
      render(<AppliedFilters {...props} />);
      
      expect(screen.getByText('Search: "test search"')).toBeInTheDocument();
      expect(screen.getByText('Severity: critical')).toBeInTheDocument();
      expect(screen.getByText('Landscape: production')).toBeInTheDocument();
      expect(screen.getByText('Region: us-east-1')).toBeInTheDocument();
      expect(screen.getByText('Component: component-a')).toBeInTheDocument();
    });

    it('should not render filters with "all" values', () => {
      const props = {
        ...mockProps,
        selectedSeverity: 'all',
        selectedStatus: 'all',
        searchTerm: 'test', // Only this should render
      };
      render(<AppliedFilters {...props} />);
      
      expect(screen.getByText('Search: "test"')).toBeInTheDocument();
      expect(screen.queryByText('Severity: all')).not.toBeInTheDocument();
      expect(screen.queryByText('Status: all')).not.toBeInTheDocument();
    });
  });

  describe('Date range formatting', () => {
    it('should render date range with both start and end dates', () => {
      const props = {
        ...mockProps,
        startDate: '2023-12-01',
        endDate: '2023-12-31',
      };
      render(<AppliedFilters {...props} />);
      
      expect(screen.getByText('Date: 01/12/2023 - 31/12/2023')).toBeInTheDocument();
      expect(document.querySelector('svg.lucide-calendar')).toBeInTheDocument();
    });

    it('should render date range with only start date', () => {
      const props = { ...mockProps, startDate: '2023-12-01' };
      render(<AppliedFilters {...props} />);
      
      expect(screen.getByText('Date: From 01/12/2023')).toBeInTheDocument();
    });

    it('should render date range with only end date', () => {
      const props = { ...mockProps, endDate: '2023-12-31' };
      render(<AppliedFilters {...props} />);
      
      expect(screen.getByText('Date: Until 31/12/2023')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      const props = {
        ...mockProps,
        startDate: '2023-01-15',
        endDate: '2023-02-28',
      };
      render(<AppliedFilters {...props} />);
      
      expect(screen.getByText('Date: 15/01/2023 - 28/02/2023')).toBeInTheDocument();
    });
  });

  describe('Remove button functionality', () => {
    it('should call appropriate remove functions when buttons are clicked', async () => {
      const user = userEvent.setup();
      const props = {
        ...mockProps,
        searchTerm: 'test',
        selectedSeverity: 'critical',
        startDate: '2023-12-01',
      };
      render(<AppliedFilters {...props} />);
      
      // Test search term removal
      await user.click(screen.getByLabelText('Remove Search: "test" filter'));
      expect(mockProps.onRemoveSearchTerm).toHaveBeenCalledTimes(1);
      
      // Test severity removal
      await user.click(screen.getByLabelText('Remove Severity: critical filter'));
      expect(mockProps.onRemoveSeverity).toHaveBeenCalledTimes(1);
      
      // Test date range removal
      await user.click(screen.getByLabelText('Remove Date: From 01/12/2023 filter'));
      expect(mockProps.onRemoveDateRange).toHaveBeenCalledTimes(1);
    });

    it('should have X icon in remove buttons', () => {
      const props = { ...mockProps, searchTerm: 'test' };
      render(<AppliedFilters {...props} />);
      
      expect(document.querySelector('svg.lucide-x')).toBeInTheDocument();
    });
  });

  describe('Clear all functionality', () => {
    it('should show "Clear all" button when multiple filters are applied', () => {
      const props = {
        ...mockProps,
        searchTerm: 'test',
        selectedSeverity: 'critical',
      };
      render(<AppliedFilters {...props} />);
      
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('should not show "Clear all" button when only one filter is applied', () => {
      const props = { ...mockProps, searchTerm: 'test' };
      render(<AppliedFilters {...props} />);
      
      expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });

    it('should call onClearAllFilters when "Clear all" button is clicked', async () => {
      const user = userEvent.setup();
      const props = {
        ...mockProps,
        searchTerm: 'test',
        selectedSeverity: 'critical',
      };
      render(<AppliedFilters {...props} />);
      
      await user.click(screen.getByText('Clear all'));
      expect(mockProps.onClearAllFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility and interaction', () => {
    it('should have proper aria-labels and button roles', () => {
      const props = {
        ...mockProps,
        searchTerm: 'test search',
        selectedSeverity: 'critical',
      };
      render(<AppliedFilters {...props} />);
      
      expect(screen.getByLabelText('Remove Search: "test search" filter')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Severity: critical filter')).toBeInTheDocument();
      
      const removeButtons = screen.getAllByRole('button', { name: /Remove .* filter/ });
      expect(removeButtons).toHaveLength(2);
      
      const clearAllButton = screen.getByRole('button', { name: 'Clear all' });
      expect(clearAllButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const props = {
        ...mockProps,
        searchTerm: 'test',
        selectedSeverity: 'critical',
      };
      render(<AppliedFilters {...props} />);
      
      const firstRemoveButton = screen.getByLabelText('Remove Search: "test" filter');
      firstRemoveButton.focus();
      await user.keyboard('{Enter}');
      
      expect(mockProps.onRemoveSearchTerm).toHaveBeenCalledTimes(1);
    });
  });

  describe('CSS classes and styling', () => {
    it('should apply correct CSS classes to components', () => {
      const props = {
        ...mockProps,
        searchTerm: 'test',
        selectedSeverity: 'critical',
      };
      render(<AppliedFilters {...props} />);
      
      // Check badge styling - use a more specific selector
      const badge = screen.getByText('Search: "test"').parentElement;
      expect(badge).toHaveClass('flex', 'items-center', 'gap-1', 'pr-1', 'text-xs');
      
      // Check remove button styling
      const removeButton = screen.getByLabelText('Remove Search: "test" filter');
      expect(removeButton).toHaveClass('h-4', 'w-4', 'p-0');
      
      // Check clear all button styling
      const clearAllButton = screen.getByText('Clear all');
      expect(clearAllButton).toHaveClass('h-6', 'px-2', 'text-xs', 'text-muted-foreground');
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace-only search terms', () => {
      const props = { ...mockProps, searchTerm: '   ' };
      render(<AppliedFilters {...props} />);
      
      // Check that the whitespace search term is rendered correctly using regex
      expect(screen.getByLabelText(/Remove Search: ".*" filter/)).toBeInTheDocument();
    });

    it('should handle special characters in filter values', () => {
      const props = {
        ...mockProps,
        searchTerm: 'test & special <chars>',
        selectedSeverity: 'critical/high',
      };
      render(<AppliedFilters {...props} />);
      
      expect(screen.getByText('Search: "test & special <chars>"')).toBeInTheDocument();
      expect(screen.getByText('Severity: critical/high')).toBeInTheDocument();
    });

    it('should handle empty string dates gracefully', () => {
      const props = {
        ...mockProps,
        startDate: '',
        endDate: '',
        searchTerm: 'test',
      };
      render(<AppliedFilters {...props} />);
      
      expect(screen.getByText('Search: "test"')).toBeInTheDocument();
      expect(screen.queryByText(/Date:/)).not.toBeInTheDocument();
    });
  });
});
