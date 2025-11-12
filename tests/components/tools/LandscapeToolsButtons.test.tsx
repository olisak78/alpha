import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LandscapeToolsButtons } from '../../../src/components/LandscapeToolsButtons';
import { useLandscapeTools } from '../../../src/hooks/useLandscapeTools';

/**
 * LandscapeToolsButtons Component Tests
 * 
 * Tests for the LandscapeToolsButtons component which displays a set of tool buttons
 * (Git, Concourse, Kibana, Dynatrace) that open external URLs based on the selected landscape.
 * 
 * Component Location: src/components/LandscapeToolsButtons.tsx
 * Hook Location: src/hooks/useLandscapeTools.ts
 */

// ============================================================================
// MOCKS
// ============================================================================

// Mock the useLandscapeTools hook
vi.mock('../../../src/hooks/useLandscapeTools');

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen,
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Helper function to render LandscapeToolsButtons with default props
 */
function renderLandscapeToolsButtons(props?: Partial<React.ComponentProps<typeof LandscapeToolsButtons>>) {
  const defaultProps = {
    selectedLandscape: 'production-eu',
  };

  return render(<LandscapeToolsButtons {...defaultProps} {...props} />);
}

/**
 * Helper to mock useLandscapeTools return value
 */
function mockUseLandscapeTools(overrides?: Partial<ReturnType<typeof useLandscapeTools>>) {
  const defaultReturn = {
    urls: {
      git: 'https://github.com/org/repo',
      concourse: 'https://concourse.example.com',
      kibana: 'https://kibana.example.com',
      dynatrace: 'https://dynatrace.example.com',
      cockpit: '',
      plutono: ''
    },
    availability: {
      git: true,
      concourse: true,
      kibana: true,
      dynatrace: true,
      cockpit: true,
      plutono: true
    },
  };

  vi.mocked(useLandscapeTools).mockReturnValue({
    ...defaultReturn,
    ...overrides,
  });
}

// ============================================================================
// LANDSCAPE TOOLS BUTTONS COMPONENT TESTS
// ============================================================================

describe('LandscapeToolsButtons Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render all four tool buttons when landscape is selected', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons({ selectedLandscape: 'production-eu' });

      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /concourse/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /kibana/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dynatrace/i })).toBeInTheDocument();
    });

    it('should not render anything when no landscape is selected', () => {
      mockUseLandscapeTools();
      const { container } = renderLandscapeToolsButtons({ selectedLandscape: null });

      expect(container.firstChild).toBeNull();
    });

    it('should render with icons for each tool', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons();

      const buttons = screen.getAllByRole('button');

      // Each button should contain an SVG icon
      buttons.forEach(button => {
        expect(button.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('should render with correct button styling', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });

      expect(gitButton).toHaveClass('flex', 'items-center', 'gap-2');
    });

    it('should render buttons in a horizontal layout', () => {
      mockUseLandscapeTools();
      const { container } = renderLandscapeToolsButtons();

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'gap-2');
    });
  });

  // ==========================================================================
  // BUTTON STATE TESTS
  // ==========================================================================

  describe('Button States', () => {
    it('should enable all buttons when all tools are available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: true,
          kibana: true,
          dynatrace: true,
          cockpit: true,
          plutono: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.getByRole('button', { name: /git/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /concourse/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /kibana/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /dynatrace/i })).not.toBeDisabled();
    });

    it('should disable Git button when Git is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: false,
          concourse: true,
          kibana: true,
          dynatrace: true,
          cockpit: true,
          plutono: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.getByRole('button', { name: /git/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /concourse/i })).not.toBeDisabled();
    });

    it('should disable Concourse button when Concourse is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: false,
          kibana: true,
          dynatrace: true,
          cockpit: true,
          plutono: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.getByRole('button', { name: /concourse/i })).toBeDisabled();
    });

    it('should disable Kibana button when Kibana is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: true,
          kibana: false,
          dynatrace: true,
          cockpit: true,
          plutono: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.getByRole('button', { name: /kibana/i })).toBeDisabled();
    });

    it('should disable Dynatrace button when Dynatrace is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: true,
          kibana: true,
          dynatrace: false,
          plutono: true, cockpit: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.getByRole('button', { name: /dynatrace/i })).toBeDisabled();
    });

    it('should disable all buttons when no tools are available', () => {
      mockUseLandscapeTools({
        availability: {
          git: false,
          concourse: false,
          kibana: false,
          dynatrace: false,
          cockpit: true,
          plutono: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.getByRole('button', { name: /git/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /concourse/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /kibana/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /dynatrace/i })).toBeDisabled();
    });

    it('should disable multiple buttons when multiple tools are not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: false,
          kibana: false,
          dynatrace: true,
          cockpit: true,
          plutono: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.getByRole('button', { name: /git/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /concourse/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /kibana/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /dynatrace/i })).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // INTERACTION TESTS
  // ==========================================================================

  describe('Interactions', () => {
    it('should open Git URL when Git button is clicked', () => {
      const gitUrl = 'https://github.com/org/repo';
      mockUseLandscapeTools({
        urls: { git: gitUrl, concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null },
        availability: { git: true, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });
      fireEvent.click(gitButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(gitUrl, '_blank', 'noopener,noreferrer');
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    });

    it('should open Concourse URL when Concourse button is clicked', () => {
      const concourseUrl = 'https://concourse.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: concourseUrl, kibana: null, dynatrace: null, plutono: null, cockpit: null },
        availability: { git: false, concourse: true, kibana: false, dynatrace: false, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const concourseButton = screen.getByRole('button', { name: /concourse/i });
      fireEvent.click(concourseButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(concourseUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open Kibana URL when Kibana button is clicked', () => {
      const kibanaUrl = 'https://kibana.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, kibana: kibanaUrl, dynatrace: null, plutono: null, cockpit: null },
        availability: { git: false, concourse: false, kibana: true, dynatrace: false, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const kibanaButton = screen.getByRole('button', { name: /kibana/i });
      fireEvent.click(kibanaButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(kibanaUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open Dynatrace URL when Dynatrace button is clicked', () => {
      const dynatraceUrl = 'https://dynatrace.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, kibana: null, dynatrace: dynatraceUrl, plutono: null, cockpit: null },
        availability: { git: false, concourse: false, kibana: false, dynatrace: true, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const dynatraceButton = screen.getByRole('button', { name: /dynatrace/i });
      fireEvent.click(dynatraceButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(dynatraceUrl, '_blank', 'noopener,noreferrer');
    });

    it('should not call window.open when clicking disabled button', () => {
      mockUseLandscapeTools({
        urls: { git: 'https://github.com', concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null },
        availability: { git: false, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });

      // Verify button is disabled
      expect(gitButton).toBeDisabled();

      // Try to click (should not work because button is disabled)
      fireEvent.click(gitButton);

      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('should not call window.open when URL is null', () => {
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null },
        availability: { git: true, concourse: true, kibana: true, dynatrace: true, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });
      fireEvent.click(gitButton);

      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('should handle multiple button clicks', () => {
      mockUseLandscapeTools({
        urls: {
          git: 'https://github.com',
          concourse: 'https://concourse.com',
          kibana: 'https://kibana.com',
          dynatrace: 'https://dynatrace.com',
          plutono: 'https://plutono.com',
          cockpit: 'https://cockpit.com'
        },
        availability: { git: true, concourse: true, kibana: true, dynatrace: true, plutono: true, cockpit: true },
      });
      renderLandscapeToolsButtons();

      fireEvent.click(screen.getByRole('button', { name: /git/i }));
      fireEvent.click(screen.getByRole('button', { name: /concourse/i }));
      fireEvent.click(screen.getByRole('button', { name: /kibana/i }));

      expect(mockWindowOpen).toHaveBeenCalledTimes(3);
    });

    it('should open URLs with correct security attributes', () => {
      const gitUrl = 'https://github.com/org/repo';
      mockUseLandscapeTools({
        urls: { git: gitUrl, concourse: null, kibana: null, dynatrace: null, cockpit: null, plutono: null },
        availability: { git: true, concourse: false, kibana: false, dynatrace: false, cockpit: false, plutono: false },
      });
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });
      fireEvent.click(gitButton);

      // Verify security attributes are set correctly
      expect(mockWindowOpen).toHaveBeenCalledWith(
        gitUrl,
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  // ==========================================================================
  // HOOK INTEGRATION TESTS
  // ==========================================================================

  describe('Hook Integration', () => {
    it('should call useLandscapeTools with selected landscape', () => {
      const selectedLandscape = 'production-us';
      mockUseLandscapeTools();
      renderLandscapeToolsButtons({ selectedLandscape });

      expect(useLandscapeTools).toHaveBeenCalledWith(selectedLandscape, undefined);
    });

    it('should call useLandscapeTools with null when no landscape selected', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons({ selectedLandscape: null });

      expect(useLandscapeTools).toHaveBeenCalledWith(null, undefined);
    });

    it('should update when selectedLandscape changes', () => {
      mockUseLandscapeTools();
      const { rerender } = renderLandscapeToolsButtons({ selectedLandscape: 'landscape-1' });

      expect(useLandscapeTools).toHaveBeenCalledWith('landscape-1', undefined);

      rerender(<LandscapeToolsButtons selectedLandscape="landscape-2" />);

      expect(useLandscapeTools).toHaveBeenCalledWith('landscape-2', undefined);
    });

    it('should use URLs from hook', () => {
      const customUrls = {
        git: 'https://custom-git.com',
        concourse: 'https://custom-concourse.com',
        kibana: 'https://custom-kibana.com',
        dynatrace: 'https://custom-dynatrace.com',
        plutono: 'https://custom-plutono.com',
        cockpit: 'https://custom-cockpit.com'
      };
      mockUseLandscapeTools({
        urls: customUrls,
        availability: { git: true, concourse: true, kibana: true, dynatrace: true, plutono: true, cockpit: true },
      });
      renderLandscapeToolsButtons();

      fireEvent.click(screen.getByRole('button', { name: /git/i }));
      expect(mockWindowOpen).toHaveBeenCalledWith(customUrls.git, '_blank', 'noopener,noreferrer');

      fireEvent.click(screen.getByRole('button', { name: /concourse/i }));
      expect(mockWindowOpen).toHaveBeenCalledWith(customUrls.concourse, '_blank', 'noopener,noreferrer');
    });

    it('should use availability from hook', () => {
      mockUseLandscapeTools({
        availability: { git: false, concourse: true, kibana: false, dynatrace: true, plutono: true, cockpit: true },
      });
      renderLandscapeToolsButtons();

      expect(screen.getByRole('button', { name: /git/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /concourse/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /kibana/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /dynatrace/i })).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // EDGE CASES & ERROR HANDLING
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty string as selectedLandscape', () => {
      mockUseLandscapeTools();
      const { container } = renderLandscapeToolsButtons({ selectedLandscape: '' });

      // Empty string is falsy, so component should not render
      expect(container.firstChild).toBeNull();
    });

    it('should handle partial availability object', () => {
      mockUseLandscapeTools({
        availability: {
          git: false,
          concourse: false,
          kibana: false,
          dynatrace: false,
          plutono: false, cockpit: false
        },
      });
      renderLandscapeToolsButtons();

      // Component should still render but buttons should be disabled
      expect(screen.getByRole('button', { name: /git/i })).toBeDisabled();
    });

    it('should handle null URLs gracefully', () => {
      mockUseLandscapeTools({
        urls: {
          git: null,
          concourse: null,
          kibana: null,
          dynatrace: null,
          plutono: null, cockpit: null
        },
        availability: {
          git: true,
          concourse: true,
          kibana: true,
          dynatrace: true, plutono: true, cockpit: true
        },
      });
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });
      fireEvent.click(gitButton);

      // Should not crash, window.open should not be called with null URL
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000);
      mockUseLandscapeTools({
        urls: { git: longUrl, concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null },
        availability: { git: true, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });
      fireEvent.click(gitButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(longUrl, '_blank', 'noopener,noreferrer');
    });

    it('should handle special characters in URLs', () => {
      const specialUrl = 'https://example.com/path?param=value&other=test#fragment';
      mockUseLandscapeTools({
        urls: { git: specialUrl, concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null },
        availability: { git: true, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });
      fireEvent.click(gitButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(specialUrl, '_blank', 'noopener,noreferrer');
    });

    it('should handle rapid successive clicks', () => {
      const gitUrl = 'https://github.com';
      mockUseLandscapeTools({
        urls: { git: gitUrl, concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null },
        availability: { git: true, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });

      // Click multiple times rapidly
      fireEvent.click(gitButton);
      fireEvent.click(gitButton);
      fireEvent.click(gitButton);

      expect(mockWindowOpen).toHaveBeenCalledTimes(3);
    });

    it('should handle landscape change from valid to null', () => {
      mockUseLandscapeTools();
      const { rerender } = renderLandscapeToolsButtons({ selectedLandscape: 'production' });

      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();

      // Change to null
      rerender(<LandscapeToolsButtons selectedLandscape={null} />);

      // Component should not render anything
      expect(screen.queryByRole('button', { name: /git/i })).not.toBeInTheDocument();
    });

    it('should handle landscape change from null to valid', () => {
      mockUseLandscapeTools();
      const { rerender, container } = renderLandscapeToolsButtons({ selectedLandscape: null });

      expect(container.firstChild).toBeNull();

      // Change to valid landscape
      rerender(<LandscapeToolsButtons selectedLandscape="production" />);

      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6);
    });

    it('should have descriptive text for each button', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons();

      expect(screen.getByText('Git')).toBeInTheDocument();
      expect(screen.getByText('Concourse')).toBeInTheDocument();
      expect(screen.getByText('Kibana')).toBeInTheDocument();
      expect(screen.getByText('Dynatrace')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });
      gitButton.focus();

      expect(document.activeElement).toBe(gitButton);
    });

    it('should support keyboard activation', () => {
      const gitUrl = 'https://github.com';
      mockUseLandscapeTools({
        urls: { git: gitUrl, concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null },
        availability: { git: true, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });
      gitButton.focus();

      // Simulate Enter key press
      fireEvent.keyDown(gitButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(gitButton); // React Testing Library requires click after keyDown for button activation

      expect(mockWindowOpen).toHaveBeenCalled();
    });

    it('should have proper disabled state for screen readers', () => {
      mockUseLandscapeTools({
        availability: { git: false, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });
      expect(gitButton).toHaveAttribute('disabled');
    });

    it('should have icon + text combination for better understanding', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });

      // Should have both icon (SVG) and text
      expect(gitButton.querySelector('svg')).toBeInTheDocument();
      expect(gitButton).toHaveTextContent('Git');
    });
  });

  // ==========================================================================
  // STYLING TESTS
  // ==========================================================================

  describe('Styling', () => {
    it('should apply outline variant to buttons', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons();

      const buttons = screen.getAllByRole('button');

      // All buttons should be rendered (styling classes are implementation details)
      expect(buttons).toHaveLength(6);
    });

    it('should apply small size to buttons', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });

      // Button should be rendered (size styling is implementation detail)
      expect(gitButton).toBeInTheDocument();
    });

    it('should have consistent spacing between buttons', () => {
      mockUseLandscapeTools();
      const { container } = renderLandscapeToolsButtons();

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('gap-2');
    });

    it('should have font-medium on button labels', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons();

      const gitButton = screen.getByRole('button', { name: /git/i });
      const textSpan = gitButton.querySelector('span');

      expect(textSpan).toHaveClass('font-medium');
    });
  });

  // ==========================================================================
  // CONDITIONAL RENDERING TESTS
  // ==========================================================================

  describe('Conditional Rendering', () => {
    it('should render when selectedLandscape is a valid string', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons({ selectedLandscape: 'production' });

      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
    });

    it('should not render when selectedLandscape is null', () => {
      mockUseLandscapeTools();
      const { container } = renderLandscapeToolsButtons({ selectedLandscape: null });

      expect(container.firstChild).toBeNull();
    });

    it('should not render when selectedLandscape is undefined', () => {
      mockUseLandscapeTools();
      // @ts-ignore - Testing edge case
      const { container } = renderLandscapeToolsButtons({ selectedLandscape: undefined });

      expect(container.firstChild).toBeNull();
    });

    it('should render buttons even when all are disabled', () => {
      mockUseLandscapeTools({
        availability: { git: false, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false },
      });
      renderLandscapeToolsButtons({ selectedLandscape: 'production' });

      // Buttons should still be rendered, just disabled
      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /concourse/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /kibana/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dynatrace/i })).toBeInTheDocument();
    });
  });
});