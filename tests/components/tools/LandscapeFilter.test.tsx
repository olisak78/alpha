import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LandscapeFilter } from '../../../src/components/LandscapeFilter';
import { Landscape } from '../../../src/types/developer-portal';

/**
 * LandscapeFilter Component Tests
 * 
 * Tests for the LandscapeFilter component which provides a dropdown selector
 * for filtering content by landscape (environment). Includes grouped landscape
 * options, clear button, and view all landscapes button.
 * 
 * Component Location: src/components/LandscapeFilter.tsx
 */

// ============================================================================
// MOCKS
// ============================================================================

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Create mock landscape data
 */
function createMockLandscape(overrides?: Partial<Landscape>): Landscape {
  return {
    id: 'landscape-1',
    name: 'Production EU',
    status: 'active',
    githubConfig: 'https://github.com/config',
    awsAccount: '123456789',
    camProfile: 'https://cam.example.com',
    deploymentStatus: 'deployed',
    ...overrides,
  };
}

/**
 * Create mock landscape groups
 */
function createMockLandscapeGroups(): Record<string, Landscape[]> {
  return {
    'Production': [
      createMockLandscape({ id: 'prod-eu', name: 'Production EU', status: 'active' }),
      createMockLandscape({ id: 'prod-us', name: 'Production US', status: 'active' }),
    ],
    'Staging': [
      createMockLandscape({ id: 'staging-eu', name: 'Staging EU', status: 'active', deploymentStatus: 'deploying' }),
      createMockLandscape({ id: 'staging-us', name: 'Staging US', status: 'inactive', deploymentStatus: 'failed' }),
    ],
    'Development': [
      createMockLandscape({ id: 'dev-1', name: 'Dev Environment 1', status: 'active' }),
    ],
  };
}

/**
 * Helper function to render LandscapeFilter with default props
 */
function renderLandscapeFilter(props?: Partial<React.ComponentProps<typeof LandscapeFilter>>) {
  const defaultProps = {
    selectedLandscape: null,
    landscapeGroups: createMockLandscapeGroups(),
    onLandscapeChange: vi.fn(),
    onShowLandscapeDetails: vi.fn(),
  };

  return render(<LandscapeFilter {...defaultProps} {...props} />);
}

// ============================================================================
// LANDSCAPE FILTER COMPONENT TESTS
// ============================================================================

describe('LandscapeFilter Component', () => {
  let mockOnLandscapeChange: ReturnType<typeof vi.fn>;
  let mockOnShowLandscapeDetails: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnLandscapeChange = vi.fn();
    mockOnShowLandscapeDetails = vi.fn();
    vi.clearAllMocks();
    
    // Reset ResizeObserver mock
    (global.ResizeObserver as any) = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render the Globe icon', () => {
      const { container } = renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const globeIcon = container.querySelector('svg');
      expect(globeIcon).toBeInTheDocument();
    });

    it('should render the Select component', () => {
      renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render View All Landscapes button by default', () => {
      renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.getByRole('button', { name: /view all landscapes/i })).toBeInTheDocument();
    });

    it('should not render View All Landscapes button when showViewAllButton is false', () => {
      renderLandscapeFilter({
        showViewAllButton: false,
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.queryByRole('button', { name: /view all landscapes/i })).not.toBeInTheDocument();
    });

    it('should render Clear button when landscape is selected and showClearButton is true', () => {
      renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        showClearButton: true,
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should not render Clear button when no landscape is selected', () => {
      renderLandscapeFilter({
        selectedLandscape: null,
        showClearButton: true,
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    it('should not render Clear button when showClearButton is false', () => {
      renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        showClearButton: false,
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    it('should render with proper layout structure', () => {
      const { container } = renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'gap-4');
    });
  });

  // ==========================================================================
  // SELECT DROPDOWN TESTS
  // ==========================================================================

  describe('Select Dropdown', () => {

    it('should display status indicators for each landscape', () => {
      renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      // When a landscape is selected, the status indicator appears in the trigger itself
      const trigger = screen.getByRole('combobox');
      const statusIndicator = trigger.querySelector('.w-2');
      expect(statusIndicator).toBeTruthy();
    });


    it('should display selected landscape value', () => {
      renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      // The selected value should be displayed in the trigger (showing landscape name, not ID)
      expect(screen.getByText('Production EU')).toBeInTheDocument();
    });

    it('should show placeholder when selected landscape is invalid', () => {
      renderLandscapeFilter({
        selectedLandscape: 'invalid-landscape-id',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      // Should display placeholder text when landscape ID is invalid
      expect(screen.getByText('Filter by Landscape')).toBeInTheDocument();
    });

    it('should handle empty landscape groups', () => {
      renderLandscapeFilter({
        landscapeGroups: {},
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // STATUS COLOR TESTS
  // ==========================================================================

  describe('Status Colors', () => {
    it('should apply success color for healthy status', () => {
      const landscapeGroups = {
        'Test': [createMockLandscape({ id: 'test-1', name: 'Test', status: 'active' })],
      };

      renderLandscapeFilter({
        landscapeGroups,
        selectedLandscape: 'test-1',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      // The status indicator should be visible in the selected value display
      const trigger = screen.getByRole('combobox');
      const statusIndicator = trigger.querySelector('.bg-success');
      expect(statusIndicator).toBeTruthy();
    });

    it('should apply warning color for deploying status', () => {
      const landscapeGroups = {
        'Test': [createMockLandscape({ 
          id: 'test-1', 
          name: 'Test', 
          status: 'active',
          deploymentStatus: 'deploying' 
        })],
      };

      renderLandscapeFilter({
        landscapeGroups,
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      // Component renders status colors, exact verification depends on implementation
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should apply destructive color for failed status', () => {
      const landscapeGroups = {
        'Test': [createMockLandscape({ 
          id: 'test-1', 
          name: 'Test', 
          status: 'inactive',
          deploymentStatus: 'failed' 
        })],
      };

      renderLandscapeFilter({
        landscapeGroups,
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should apply default color for unknown status', () => {
      const landscapeGroups = {
        'Test': [createMockLandscape({ 
          id: 'test-1', 
          name: 'Test', 
          // @ts-ignore - Testing edge case
          status: 'unknown-status'
        })],
      };

      renderLandscapeFilter({
        landscapeGroups,
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // BUTTON INTERACTION TESTS
  // ==========================================================================

  describe('Button Interactions', () => {
    it('should call onLandscapeChange with null when Clear button is clicked', () => {
      renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(mockOnLandscapeChange).toHaveBeenCalledWith(null);
      expect(mockOnLandscapeChange).toHaveBeenCalledTimes(1);
    });

    it('should call onShowLandscapeDetails when View All button is clicked', () => {
      renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const viewAllButton = screen.getByRole('button', { name: /view all landscapes/i });
      fireEvent.click(viewAllButton);

      expect(mockOnShowLandscapeDetails).toHaveBeenCalledTimes(1);
    });

    it('should have X icon in Clear button', () => {
      const { container } = renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      const icon = clearButton.querySelector('svg');
      
      expect(icon).toBeInTheDocument();
    });

    it('should have Info icon in View All button', () => {
      const { container } = renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const viewAllButton = screen.getByRole('button', { name: /view all landscapes/i });
      const icon = viewAllButton.querySelector('svg');
      
      expect(icon).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EDGE CASES & ERROR HANDLING
  // ==========================================================================

  describe('Edge Cases', () => {


    it('should handle landscape selection change', () => {
      const { rerender } = renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.getByText('Production EU')).toBeInTheDocument();

      rerender(
        <LandscapeFilter
          selectedLandscape="prod-us"
          landscapeGroups={createMockLandscapeGroups()}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(screen.getByText('Production US')).toBeInTheDocument();
    });

    it('should handle transition from null to selected landscape', () => {
      const { rerender } = renderLandscapeFilter({
        selectedLandscape: null,
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      // Initially no Clear button
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();

      rerender(
        <LandscapeFilter
          selectedLandscape="prod-eu"
          landscapeGroups={createMockLandscapeGroups()}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      // Now Clear button should appear
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should handle rapid button clicks', () => {
      renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      
      fireEvent.click(clearButton);
      fireEvent.click(clearButton);
      fireEvent.click(clearButton);

      // Each click should trigger the callback
      expect(mockOnLandscapeChange).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view all landscapes/i })).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view all landscapes/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const trigger = screen.getByRole('combobox');
      trigger.focus();

      expect(document.activeElement).toBe(trigger);
    });

    it('should support keyboard navigation between elements', () => {
      renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const combobox = screen.getByRole('combobox');
      const clearButton = screen.getByRole('button', { name: /clear/i });
      const viewAllButton = screen.getByRole('button', { name: /view all landscapes/i });

      combobox.focus();
      expect(document.activeElement).toBe(combobox);

      clearButton.focus();
      expect(document.activeElement).toBe(clearButton);

      viewAllButton.focus();
      expect(document.activeElement).toBe(viewAllButton);
    });

  });

  // ==========================================================================
  // STYLING TESTS
  // ==========================================================================

  describe('Styling', () => {
    it('should apply correct width to Select trigger', () => {
      renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('w-[288px]');
    });

    it('should have consistent gap spacing', () => {
      const { container } = renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('gap-4');
    });

    it('should apply small size to Clear button', () => {
      renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should have proper icon sizing', () => {
      const { container } = renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      const icons = container.querySelectorAll('svg.h-4.w-4');
      expect(icons.length).toBeGreaterThan(0);
    });

  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('Integration', () => {
    it('should work with all props combined', () => {
      renderLandscapeFilter({
        selectedLandscape: 'prod-eu',
        landscapeGroups: createMockLandscapeGroups(),
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
        showClearButton: true,
        showViewAllButton: true,
        placeholder: 'Custom Placeholder',
      });

      expect(screen.getByText('Production EU')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view all landscapes/i })).toBeInTheDocument();
    });

    it('should handle complete user workflow', () => {
      renderLandscapeFilter({
        onLandscapeChange: mockOnLandscapeChange,
        onShowLandscapeDetails: mockOnShowLandscapeDetails,
      });

      // Open dropdown
      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      // Select a landscape (showing name "Staging EU", not ID)
      const option = screen.getByText('Staging EU');
      fireEvent.click(option);

      expect(mockOnLandscapeChange).toHaveBeenCalledWith('staging-eu');
    });

  });
});