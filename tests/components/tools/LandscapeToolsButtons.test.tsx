import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LandscapeToolsButtons } from '../../../src/components/LandscapeToolsButtons';
import { useLandscapeTools } from '../../../src/hooks/useLandscapeTools';

/**
 * LandscapeToolsButtons Component Tests
 * 
 * Tests for the LandscapeToolsButtons component which displays a set of tool buttons
 * (Git, Concourse, Kibana, Dynatrace, Cockpit, Plutono, Operation Console, Control Center, CAM, Gardener) 
 * that open external URLs based on the selected landscape.
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
      git: 'https://github.com',
      concourse: 'https://concourse.example.com',
      kibana: 'https://kibana.example.com',
      dynatrace: 'https://dynatrace.example.com',
      cockpit: 'https://cockpit.example.com',
      plutono: 'https://plutono.example.com',
      operationConsole: 'https://ops.example.com',
      controlCenter: 'https://control-center.example.com',
      cam: 'https://cam.example.com',
      gardener: 'https://gardener.example.com',
    },
    availability: {
      git: true,
      concourse: true,
      kibana: true,
      dynatrace: true,
      cockpit: true,
      plutono: true,
      operationConsole: true,
      controlCenter: true,
      cam: true,
      gardener: true,
    },
  };

  vi.mocked(useLandscapeTools).mockReturnValue({
    ...defaultReturn,
    ...overrides,
  });
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('LandscapeToolsButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // BASIC RENDERING TESTS
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render all tool buttons when all tools are available', () => {
      mockUseLandscapeTools();
      renderLandscapeToolsButtons();

      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /concourse/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /kibana/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dynatrace/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cockpit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /plutono/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /operation console/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /control center/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cam/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /gardener/i })).toBeInTheDocument();
    });

    it('should not render when no landscape is selected', () => {
      mockUseLandscapeTools();
      const { container } = renderLandscapeToolsButtons({ selectedLandscape: null });

      expect(container.firstChild).toBeNull();
    });

    // CHANGED: Button should be hidden (not rendered) instead of disabled
    it('should hide Git button when Git is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: false,
          concourse: true,
          kibana: true,
          dynatrace: true,
          cockpit: true,
          plutono: true,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.queryByRole('button', { name: /git/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /concourse/i })).toBeInTheDocument();
    });

    // CHANGED: Button should be hidden (not rendered) instead of disabled
    it('should hide Concourse button when Concourse is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: false,
          kibana: true,
          dynatrace: true,
          cockpit: true,
          plutono: true,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.queryByRole('button', { name: /concourse/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
    });

    // CHANGED: Button should be hidden (not rendered) instead of disabled
    it('should hide Kibana button when Kibana is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: true,
          kibana: false,
          dynatrace: true,
          cockpit: true,
          plutono: true,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.queryByRole('button', { name: /kibana/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
    });

    // CHANGED: Button should be hidden (not rendered) instead of disabled
    it('should hide Dynatrace button when Dynatrace is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: true,
          kibana: true,
          dynatrace: false,
          cockpit: true,
          plutono: true,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.queryByRole('button', { name: /dynatrace/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
    });

    // CHANGED: Button should be hidden (not rendered) instead of disabled
    it('should hide Cockpit button when Cockpit is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: true,
          kibana: true,
          dynatrace: true,
          cockpit: false,
          plutono: true,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.queryByRole('button', { name: /cockpit/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
    });

    // CHANGED: Button should be hidden (not rendered) instead of disabled
    it('should hide Plutono button when Plutono is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: true,
          kibana: true,
          dynatrace: true,
          cockpit: true,
          plutono: false,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.queryByRole('button', { name: /plutono/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
    });

    // CHANGED: All buttons should be hidden when none are available
    it('should hide all buttons when no tools are available', () => {
      mockUseLandscapeTools({
        availability: {
          git: false,
          concourse: false,
          kibana: false,
          dynatrace: false,
          cockpit: false,
          plutono: false,
          operationConsole: false,
          controlCenter: false,
          cam: false,
          gardener: false
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render buttons in a horizontal layout', () => {
      mockUseLandscapeTools();
      const { container } = renderLandscapeToolsButtons();

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'gap-2');
    });
  });

  // ==========================================================================
  // BUTTON CLICK TESTS
  // ==========================================================================

  describe('Button Clicks', () => {
    it('should open Git URL when Git button is clicked', () => {
      const gitUrl = 'https://github.com';
      mockUseLandscapeTools({
        urls: { git: gitUrl, concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: null, gardener: null },
        availability: { git: true, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: false, gardener: false },
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
        urls: { git: null, concourse: concourseUrl, kibana: null, dynatrace: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: null, gardener: null },
        availability: { git: false, concourse: true, kibana: false, dynatrace: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: false, gardener: false },
      });
      renderLandscapeToolsButtons();

      const concourseButton = screen.getByRole('button', { name: /concourse/i });
      fireEvent.click(concourseButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(concourseUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open Kibana URL when Kibana button is clicked', () => {
      const kibanaUrl = 'https://kibana.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, kibana: kibanaUrl, dynatrace: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: null, gardener: null },
        availability: { git: false, concourse: false, kibana: true, dynatrace: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: false, gardener: false },
      });
      renderLandscapeToolsButtons();

      const kibanaButton = screen.getByRole('button', { name: /kibana/i });
      fireEvent.click(kibanaButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(kibanaUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open Dynatrace URL when Dynatrace button is clicked', () => {
      const dynatraceUrl = 'https://dynatrace.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, kibana: null, dynatrace: dynatraceUrl, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: null, gardener: null },
        availability: { git: false, concourse: false, kibana: false, dynatrace: true, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: false, gardener: false },
      });
      renderLandscapeToolsButtons();

      const dynatraceButton = screen.getByRole('button', { name: /dynatrace/i });
      fireEvent.click(dynatraceButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(dynatraceUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open Control Center URL when Control Center button is clicked', () => {
      const controlCenterUrl = 'https://control-center.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: controlCenterUrl, cam: null, gardener: null },
        availability: { git: false, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: true, cam: false, gardener: false },
      });
      renderLandscapeToolsButtons();

      const controlCenterButton = screen.getByRole('button', { name: /control center/i });
      fireEvent.click(controlCenterButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(controlCenterUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open CAM URL when CAM button is clicked', () => {
      const camUrl = 'https://cam.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: camUrl, gardener: null },
        availability: { git: false, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: true, gardener: false },
      });
      renderLandscapeToolsButtons();

      const camButton = screen.getByRole('button', { name: /cam/i });
      fireEvent.click(camButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(camUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open Gardener URL when Gardener button is clicked', () => {
      const gardenerUrl = 'https://gardener.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, kibana: null, dynatrace: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: null, gardener: gardenerUrl },
        availability: { git: false, concourse: false, kibana: false, dynatrace: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: false, gardener: true },
      });
      renderLandscapeToolsButtons();

      const gardenerButton = screen.getByRole('button', { name: /gardener/i });
      fireEvent.click(gardenerButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(gardenerUrl, '_blank', 'noopener,noreferrer');
    });
  });

  // ==========================================================================
  // INTEGRATION WITH useLandscapeTools
  // ==========================================================================

  describe('Integration with useLandscapeTools', () => {
    it('should call useLandscapeTools with correct parameters', () => {
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
        cockpit: 'https://custom-cockpit.com',
        operationConsole: 'https://custom-ops.com',
        controlCenter: 'https://custom-control-center.com',
        cam: 'https://custom-cam.com',
        gardener: 'https://custom-gardener.com'
      };
      mockUseLandscapeTools({
        urls: customUrls,
        availability: { git: true, concourse: true, kibana: true, dynatrace: true, plutono: true, cockpit: true, operationConsole: true, controlCenter: true, cam: true, gardener: true },
      });
      renderLandscapeToolsButtons();

      fireEvent.click(screen.getByRole('button', { name: /git/i }));
      expect(mockWindowOpen).toHaveBeenCalledWith(customUrls.git, '_blank', 'noopener,noreferrer');

      fireEvent.click(screen.getByRole('button', { name: /concourse/i }));
      expect(mockWindowOpen).toHaveBeenCalledWith(customUrls.concourse, '_blank', 'noopener,noreferrer');
    });
  });
});
