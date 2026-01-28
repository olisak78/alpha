import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CustomizationAppearanceSettings from '@/components/settings/CustomizationAppearanceSettings';

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      organization: 'sap-cfs',
      provider: 'githubtools',
      team_role: 'developer',
      portal_admin: false
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshAuth: vi.fn()
  }))
}));

// Mock the organization utils
vi.mock('@/utils/organization-utils', () => ({
  isUserInSapCfsOrganization: vi.fn(() => true)
}));

// Mock the sub-components
vi.mock('@/components/settings/ProjectVisibilitySection', () => ({
  default: ({ visibilityState, onVisibilityChange, onSelectAll, onDeselectAll }: any) => (
    <div data-testid="project-visibility-section">
      <div data-testid="visibility-state">{JSON.stringify(visibilityState)}</div>
      <button onClick={() => onVisibilityChange('1', false)} data-testid="mock-visibility-change">
        Change Visibility
      </button>
      <button onClick={onSelectAll} data-testid="mock-select-all">
        Select All
      </button>
      <button onClick={onDeselectAll} data-testid="mock-deselect-all">
        Deselect All
      </button>
    </div>
  )
}));

vi.mock('@/components/settings/ThemeSection', () => ({
  default: () => (
    <div data-testid="theme-section">
      <button data-testid="light-theme-button">Light</button>
      <button data-testid="dark-theme-button">Dark</button>
    </div>
  )
}));

/**
 * CustomizationAppearanceSettings Component Tests
 * 
 * Tests for the CustomizationAppearanceSettings component which acts as a layout
 * container for ProjectVisibilitySection and ThemeSection sub-components.
 * This component provides the main structure for customization and appearance settings.
 * 
 * Component Location: src/components/CustomizationAppearanceSettings.tsx
 * Sub-components: ProjectVisibilitySection, ThemeSection
 */

// ============================================================================
// TEST UTILITIES
// ============================================================================

const defaultProps = {
  visibilityState: {
    '1': true,
    '2': false,
    '3': true,
    '4': false
  } as { [projectId: string]: boolean },
  onVisibilityChange: vi.fn(),
  onSelectAll: vi.fn(),
  onDeselectAll: vi.fn()
};

/**
 * Helper function to render CustomizationAppearanceSettings with default props
 */
function renderCustomizationAppearanceSettings(props?: Partial<typeof defaultProps>) {
  const finalProps = { ...defaultProps, ...props };
  return render(<CustomizationAppearanceSettings {...finalProps} />);
}

// ============================================================================
// COMPONENT TESTS
// ============================================================================

describe('CustomizationAppearanceSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render main layout structure with headings and sections', () => {
      renderCustomizationAppearanceSettings();
      
      // Check main UI elements
      expect(screen.getByText('Customization/Appearance')).toBeInTheDocument();
      expect(screen.getByText('Customization')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });

    it('should render both sub-components', () => {
      renderCustomizationAppearanceSettings();
      
      // Check that both sub-components are rendered
      expect(screen.getByTestId('project-visibility-section')).toBeInTheDocument();
      expect(screen.getByTestId('theme-section')).toBeInTheDocument();
    });

    it('should have proper layout structure with scrollable content', () => {
      renderCustomizationAppearanceSettings();
      
      // Check for layout classes that indicate proper structure - look for the main container
      const mainContainer = screen.getByText('Customization/Appearance').closest('.flex.flex-col.h-full.overflow-hidden');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // PROP PASSING TESTS
  // ==========================================================================

  describe('Prop Passing', () => {
    it('should pass correct props to ProjectVisibilitySection', () => {
      const mockOnVisibilityChange = vi.fn();
      const mockOnSelectAll = vi.fn();
      const mockOnDeselectAll = vi.fn();
      const mockVisibilityState = { '1': true, '2': false };

      renderCustomizationAppearanceSettings({
        visibilityState: mockVisibilityState,
        onVisibilityChange: mockOnVisibilityChange,
        onSelectAll: mockOnSelectAll,
        onDeselectAll: mockOnDeselectAll
      });

      // Check that visibility state is passed correctly
      const visibilityStateElement = screen.getByTestId('visibility-state');
      expect(visibilityStateElement).toHaveTextContent(JSON.stringify(mockVisibilityState));

      // Test that callbacks are passed through correctly
      const changeButton = screen.getByTestId('mock-visibility-change');
      fireEvent.click(changeButton);
      expect(mockOnVisibilityChange).toHaveBeenCalledWith('1', false);

      const selectAllButton = screen.getByTestId('mock-select-all');
      fireEvent.click(selectAllButton);
      expect(mockOnSelectAll).toHaveBeenCalledTimes(1);

      const deselectAllButton = screen.getByTestId('mock-deselect-all');
      fireEvent.click(deselectAllButton);
      expect(mockOnDeselectAll).toHaveBeenCalledTimes(1);
    });

    it('should render ThemeSection without any props', () => {
      renderCustomizationAppearanceSettings();
      
      // ThemeSection should be rendered and functional
      expect(screen.getByTestId('theme-section')).toBeInTheDocument();
      expect(screen.getByTestId('light-theme-button')).toBeInTheDocument();
      expect(screen.getByTestId('dark-theme-button')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // COMPONENT STRUCTURE TESTS
  // ==========================================================================

  describe('Component Structure', () => {
    it('should maintain proper component hierarchy', () => {
      renderCustomizationAppearanceSettings();
      
      // Check that the main container has the expected structure
      const mainContainer = screen.getByText('Customization/Appearance').closest('div');
      expect(mainContainer).toBeInTheDocument();
      
      // Check that both sections are present
      const customizationSection = screen.getByText('Customization');
      const appearanceSection = screen.getByText('Appearance');
      
      expect(customizationSection).toBeInTheDocument();
      expect(appearanceSection).toBeInTheDocument();
    });

    it('should handle prop updates correctly', () => {
      const { rerender } = renderCustomizationAppearanceSettings();
      
      // Initial state
      let visibilityStateElement = screen.getByTestId('visibility-state');
      expect(visibilityStateElement).toHaveTextContent(JSON.stringify(defaultProps.visibilityState));
      
      // Update props
      const newVisibilityState = { '1': false, '2': true, '3': false, '4': true };
      rerender(
        <CustomizationAppearanceSettings
          {...defaultProps}
          visibilityState={newVisibilityState}
        />
      );
      
      visibilityStateElement = screen.getByTestId('visibility-state');
      expect(visibilityStateElement).toHaveTextContent(JSON.stringify(newVisibilityState));
    });
  });

  // ==========================================================================
  // EDGE CASES TESTS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle missing callback props gracefully', () => {
      // Render without some callback props
      const { container } = render(
        <CustomizationAppearanceSettings
          visibilityState={defaultProps.visibilityState}
          onVisibilityChange={vi.fn()}
          onSelectAll={undefined as any}
          onDeselectAll={undefined as any}
        />
      );
      
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('project-visibility-section')).toBeInTheDocument();
      expect(screen.getByTestId('theme-section')).toBeInTheDocument();
    });

    it('should handle empty visibility state', () => {
      renderCustomizationAppearanceSettings({ visibilityState: {} });
      
      const visibilityStateElement = screen.getByTestId('visibility-state');
      expect(visibilityStateElement).toHaveTextContent('{}');
    });
  });
});
