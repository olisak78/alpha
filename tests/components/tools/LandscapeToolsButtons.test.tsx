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
      applicationLogging: 'https://app-logs.example.com',
      kibana: 'https://kibana.example.com',
      platformLogging: 'https://infra-logs.example.com',
      dynatrace: 'https://dynatrace.example.com',
      avs: 'https://avs.example.com',
      cockpit: 'https://cockpit.example.com',
      plutono: 'https://plutono.example.com',
      operationConsole: 'https://ops.example.com',
      controlCenter: 'https://control-center.example.com',
      cam: 'https://cam.example.com',
      gardener: 'https://gardener.example.com',
      vault: 'https://vault.example.com',
      iaasConsole: 'https://iaas.example.com',
      iaasConsoleBS: 'https://iaas-bs.example.com',
    },
    availability: {
      git: true,
      concourse: true,
      applicationLogging: true,
      kibana: true,
      platformLogging: true,
      dynatrace: true,
      avs: true,
      cockpit: true,
      plutono: true,
      operationConsole: true,
      controlCenter: true,
      cam: true,
      gardener: true,
      vault: true,
      iaasConsole: true,
      iaasConsoleBS: true,
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

      // Simply check that we have 15 buttons (all tools are available)
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(15);

      // Verify specific buttons exist
      expect(screen.getByText('Git')).toBeInTheDocument();
      expect(screen.getByText('Vault')).toBeInTheDocument();
      expect(screen.getByText('Concourse')).toBeInTheDocument();
      expect(screen.getByText('App Logs')).toBeInTheDocument();
      expect(screen.getByText('Infra Logs')).toBeInTheDocument();
      expect(screen.getByText('Dynatrace')).toBeInTheDocument();
      expect(screen.getByText('Plutono')).toBeInTheDocument();
      expect(screen.getByText('Gardener')).toBeInTheDocument();
      expect(screen.getByText('IaaS')).toBeInTheDocument();
      expect(screen.getByText('IaaS (BS)')).toBeInTheDocument();
      expect(screen.getByText('AVS')).toBeInTheDocument();
      expect(screen.getByText('CAM')).toBeInTheDocument();
      expect(screen.getByText('Operation Console')).toBeInTheDocument();
      expect(screen.getByText('Cockpit')).toBeInTheDocument();
      expect(screen.getByText('Control Center')).toBeInTheDocument();
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
          applicationLogging: true,
          kibana: true,
          platformLogging: true,
          dynatrace: true,
          avs: true,
          cockpit: true,
          plutono: true,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true,
          vault: true,
          iaasConsole: true,
          iaasConsoleBS: true
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
          applicationLogging: true,
          kibana: true,
          platformLogging: true,
          dynatrace: true,
          avs: true,
          cockpit: true,
          plutono: true,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true,
          vault: true,
          iaasConsole: true,
          iaasConsoleBS: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.queryByRole('button', { name: /concourse/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
    });

    // CHANGED: Button should be hidden (not rendered) instead of disabled
    it('should hide App Logs button when App Logs is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: true,
          applicationLogging: false,
          kibana: true,
          platformLogging: true,
          dynatrace: true,
          avs: true,
          cockpit: true,
          plutono: true,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true,
          vault: true,
          iaasConsole: true,
          iaasConsoleBS: true
        },
      });
      renderLandscapeToolsButtons();

      expect(screen.queryByRole('button', { name: /app logs/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
    });

    // CHANGED: Button should be hidden (not rendered) instead of disabled
    it('should hide Dynatrace button when Dynatrace is not available', () => {
      mockUseLandscapeTools({
        availability: {
          git: true,
          concourse: true,
          applicationLogging: true,
          kibana: true,
          platformLogging: true,
          dynatrace: false,
          avs: true,
          cockpit: true,
          plutono: true,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true,
          vault: true,
          iaasConsole: true,
          iaasConsoleBS: true
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
          applicationLogging: true,
          kibana: true,
          platformLogging: true,
          dynatrace: true,
          avs: true,
          cockpit: false,
          plutono: true,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true,
          vault: true,
          iaasConsole: true,
          iaasConsoleBS: true
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
          applicationLogging: true,
          kibana: true,
          platformLogging: true,
          dynatrace: true,
          avs: true,
          cockpit: true,
          plutono: false,
          operationConsole: true,
          controlCenter: true,
          cam: true,
          gardener: true,
          vault: true,
          iaasConsole: true,
          iaasConsoleBS: true
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
          applicationLogging: false,
          kibana: false,
          platformLogging: false,
          dynatrace: false,
          avs: false,
          cockpit: false,
          plutono: false,
          operationConsole: false,
          controlCenter: false,
          cam: false,
          gardener: false,
          vault: false,
          iaasConsole: false,
          iaasConsoleBS: false
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
        urls: { git: gitUrl, concourse: null, applicationLogging: null, kibana: null, platformLogging: null, dynatrace: null, avs: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: null, gardener: null, vault: null, iaasConsole: null, iaasConsoleBS: null },
        availability: { git: true, concourse: false, applicationLogging: false, kibana: false, platformLogging: false, dynatrace: false, avs: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: false, gardener: false, vault: false, iaasConsole: false, iaasConsoleBS: false },
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
        urls: { git: null, concourse: concourseUrl, applicationLogging: null, kibana: null, platformLogging: null, dynatrace: null, avs: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: null, gardener: null, vault: null, iaasConsole: null, iaasConsoleBS: null },
        availability: { git: false, concourse: true, applicationLogging: false, kibana: false, platformLogging: false, dynatrace: false, avs: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: false, gardener: false, vault: false, iaasConsole: false, iaasConsoleBS: false },
      });
      renderLandscapeToolsButtons();

      const concourseButton = screen.getByRole('button', { name: /concourse/i });
      fireEvent.click(concourseButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(concourseUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open App Logs URL when App Logs button is clicked', () => {
      const appLogsUrl = 'https://app-logs.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, applicationLogging: appLogsUrl, kibana: null, platformLogging: null, dynatrace: null, avs: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: null, gardener: null, vault: null, iaasConsole: null, iaasConsoleBS: null },
        availability: { git: false, concourse: false, applicationLogging: true, kibana: false, platformLogging: false, dynatrace: false, avs: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: false, gardener: false, vault: false, iaasConsole: false, iaasConsoleBS: false },
      });
      renderLandscapeToolsButtons();

      const appLogsButton = screen.getByRole('button', { name: /app logs/i });
      fireEvent.click(appLogsButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(appLogsUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open Dynatrace URL when Dynatrace button is clicked', () => {
      const dynatraceUrl = 'https://dynatrace.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, applicationLogging: null, kibana: null, platformLogging: null, dynatrace: dynatraceUrl, avs: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: null, gardener: null, vault: null, iaasConsole: null, iaasConsoleBS: null },
        availability: { git: false, concourse: false, applicationLogging: false, kibana: false, platformLogging: false, dynatrace: true, avs: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: false, gardener: false, vault: false, iaasConsole: false, iaasConsoleBS: false },
      });
      renderLandscapeToolsButtons();

      const dynatraceButton = screen.getByRole('button', { name: /dynatrace/i });
      fireEvent.click(dynatraceButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(dynatraceUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open Control Center URL when Control Center button is clicked', () => {
      const controlCenterUrl = 'https://control-center.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, applicationLogging: null, kibana: null, platformLogging: null, dynatrace: null, avs: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: controlCenterUrl, cam: null, gardener: null, vault: null, iaasConsole: null, iaasConsoleBS: null },
        availability: { git: false, concourse: false, applicationLogging: false, kibana: false, platformLogging: false, dynatrace: false, avs: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: true, cam: false, gardener: false, vault: false, iaasConsole: false, iaasConsoleBS: false },
      });
      renderLandscapeToolsButtons();

      const controlCenterButton = screen.getByRole('button', { name: /control center/i });
      fireEvent.click(controlCenterButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(controlCenterUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open CAM URL when CAM button is clicked', () => {
      const camUrl = 'https://cam.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, applicationLogging: null, kibana: null, platformLogging: null, dynatrace: null, avs: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: camUrl, gardener: null, vault: null, iaasConsole: null, iaasConsoleBS: null },
        availability: { git: false, concourse: false, applicationLogging: false, kibana: false, platformLogging: false, dynatrace: false, avs: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: true, gardener: false, vault: false, iaasConsole: false, iaasConsoleBS: false },
      });
      renderLandscapeToolsButtons();

      const camButton = screen.getByRole('button', { name: /cam/i });
      fireEvent.click(camButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(camUrl, '_blank', 'noopener,noreferrer');
    });

    it('should open Gardener URL when Gardener button is clicked', () => {
      const gardenerUrl = 'https://gardener.example.com';
      mockUseLandscapeTools({
        urls: { git: null, concourse: null, applicationLogging: null, kibana: null, platformLogging: null, dynatrace: null, avs: null, plutono: null, cockpit: null, operationConsole: null, controlCenter: null, cam: null, gardener: gardenerUrl, vault: null, iaasConsole: null, iaasConsoleBS: null },
        availability: { git: false, concourse: false, applicationLogging: false, kibana: false, platformLogging: false, dynatrace: false, avs: false, plutono: false, cockpit: false, operationConsole: false, controlCenter: false, cam: false, gardener: true, vault: false, iaasConsole: false, iaasConsoleBS: false },
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
        applicationLogging: 'https://custom-app-logs.com',
        kibana: 'https://custom-kibana.com',
        platformLogging: 'https://custom-infra-logs.com',
        dynatrace: 'https://custom-dynatrace.com',
        avs: 'https://custom-avs.com',
        plutono: 'https://custom-plutono.com',
        cockpit: 'https://custom-cockpit.com',
        operationConsole: 'https://custom-ops.com',
        controlCenter: 'https://custom-control-center.com',
        cam: 'https://custom-cam.com',
        gardener: 'https://custom-gardener.com',
        vault: 'https://custom-vault.com',
        iaasConsole: 'https://custom-iaas.com',
        iaasConsoleBS: 'https://custom-iaas-bs.com'
      };
      mockUseLandscapeTools({
        urls: customUrls,
        availability: { git: true, concourse: true, applicationLogging: true, kibana: true, platformLogging: true, dynatrace: true, avs: true, plutono: true, cockpit: true, operationConsole: true, controlCenter: true, cam: true, gardener: true, vault: true, iaasConsole: true, iaasConsoleBS: true },
      });
      renderLandscapeToolsButtons();

      fireEvent.click(screen.getByRole('button', { name: /git/i }));
      expect(mockWindowOpen).toHaveBeenCalledWith(customUrls.git, '_blank', 'noopener,noreferrer');

      fireEvent.click(screen.getByRole('button', { name: /concourse/i }));
      expect(mockWindowOpen).toHaveBeenCalledWith(customUrls.concourse, '_blank', 'noopener,noreferrer');
    });
  });
});
