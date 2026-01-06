import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLandscapeTools } from '@/hooks/useLandscapeTools';

describe('useLandscapeTools', () => {
  const mockLandscapeData = {
    id: 'landscape-1',
    name: 'Production',
    title: 'Production Landscape',
    description: 'Main production environment',
    domain: 'prod.example.com',
    environment: 'production',
    git: 'https://git.example.com',
    concourse: 'https://concourse.example.com',
    'application-logging': 'https://logging.example.com',
    'platform-logging': 'https://platform-logging.example.com',
    dynatrace: 'https://dynatrace.example.com',
    'avs-aggregated-monitor': 'https://avs.example.com',
    cockpit: 'https://cockpit.example.com',
    plutono: 'https://plutono.example.com',
    'operation-console': 'https://operations.example.com',
    'control-center': 'https://control.example.com',
    cam: 'https://cam.example.com',
    gardener: 'https://gardener.example.com',
    vault: 'https://vault.example.com',
    'iaas-console': 'https://iaas.example.com',
    'iaas-console-backing-service': 'https://iaas-bs.example.com',
  };

  describe('Empty State', () => {
    it('should return empty state when no landscape selected', () => {
      const { result } = renderHook(() =>
        useLandscapeTools(null, mockLandscapeData)
      );

      expect(result.current.urls.git).toBe(null);
      expect(result.current.urls.concourse).toBe(null);
      expect(result.current.urls.applicationLogging).toBe(null);
      expect(result.current.availability.git).toBe(false);
      expect(result.current.availability.concourse).toBe(false);
      expect(result.current.availability.applicationLogging).toBe(false);
    });

    it('should return empty state when landscape data is null', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', null)
      );

      expect(result.current.urls.git).toBe(null);
      expect(result.current.urls.concourse).toBe(null);
      expect(result.current.availability.git).toBe(false);
      expect(result.current.availability.concourse).toBe(false);
    });

    it('should return empty state when landscape data is undefined', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', undefined)
      );

      expect(result.current.urls.git).toBe(null);
      expect(result.current.urls.concourse).toBe(null);
      expect(result.current.availability.git).toBe(false);
      expect(result.current.availability.concourse).toBe(false);
    });

    it('should return empty state when both parameters are null', () => {
      const { result } = renderHook(() =>
        useLandscapeTools(null, null)
      );

      expect(result.current.urls.git).toBe(null);
      expect(result.current.availability.git).toBe(false);
    });

    it('should have all URL fields as null in empty state', () => {
      const { result } = renderHook(() =>
        useLandscapeTools(null, null)
      );

      expect(result.current.urls).toEqual({
        git: null,
        concourse: null,
        applicationLogging: null,
        kibana: null,
        platformLogging: null,
        dynatrace: null,
        avs: null,
        cockpit: null,
        plutono: null,
        operationConsole: null,
        controlCenter: null,
        cam: null,
        gardener: null,
        vault: null,
        iaasConsole: null,
        iaasConsoleBS: null,
      });
    });

    it('should have all availability fields as false in empty state', () => {
      const { result } = renderHook(() =>
        useLandscapeTools(null, null)
      );

      expect(result.current.availability).toEqual({
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
        iaasConsoleBS: false,
      });
    });
  });

  describe('URL Extraction', () => {
    it('should extract git URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.git).toBe('https://git.example.com');
      expect(result.current.availability.git).toBe(true);
    });

    it('should extract concourse URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.concourse).toBe('https://concourse.example.com');
      expect(result.current.availability.concourse).toBe(true);
    });

    it('should extract application logging URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.applicationLogging).toBe('https://logging.example.com');
      expect(result.current.availability.applicationLogging).toBe(true);
    });

    it('should extract platform logging URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.platformLogging).toBe('https://platform-logging.example.com');
      expect(result.current.availability.platformLogging).toBe(true);
    });

    it('should extract dynatrace URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.dynatrace).toBe('https://dynatrace.example.com');
      expect(result.current.availability.dynatrace).toBe(true);
    });

    it('should extract AVS URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.avs).toBe('https://avs.example.com');
      expect(result.current.availability.avs).toBe(true);
    });

    it('should extract cockpit URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.cockpit).toBe('https://cockpit.example.com');
      expect(result.current.availability.cockpit).toBe(true);
    });

    it('should extract plutono URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.plutono).toBe('https://plutono.example.com');
      expect(result.current.availability.plutono).toBe(true);
    });

    it('should extract operation console URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.operationConsole).toBe('https://operations.example.com');
      expect(result.current.availability.operationConsole).toBe(true);
    });

    it('should extract control center URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.controlCenter).toBe('https://control.example.com');
      expect(result.current.availability.controlCenter).toBe(true);
    });

    it('should extract CAM URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.cam).toBe('https://cam.example.com');
      expect(result.current.availability.cam).toBe(true);
    });

    it('should extract gardener URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.gardener).toBe('https://gardener.example.com');
      expect(result.current.availability.gardener).toBe(true);
    });

    it('should extract vault URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.vault).toBe('https://vault.example.com');
      expect(result.current.availability.vault).toBe(true);
    });

    it('should extract IaaS console URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.iaasConsole).toBe('https://iaas.example.com');
      expect(result.current.availability.iaasConsole).toBe(true);
    });

    it('should extract IaaS console backing service URL', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls.iaasConsoleBS).toBe('https://iaas-bs.example.com');
      expect(result.current.availability.iaasConsoleBS).toBe(true);
    });

    it('should extract all URLs correctly', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.urls).toEqual({
        git: 'https://git.example.com',
        concourse: 'https://concourse.example.com',
        applicationLogging: 'https://logging.example.com',
        kibana: null,
        platformLogging: 'https://platform-logging.example.com',
        dynatrace: 'https://dynatrace.example.com',
        avs: 'https://avs.example.com',
        cockpit: 'https://cockpit.example.com',
        plutono: 'https://plutono.example.com',
        operationConsole: 'https://operations.example.com',
        controlCenter: 'https://control.example.com',
        cam: 'https://cam.example.com',
        gardener: 'https://gardener.example.com',
        vault: 'https://vault.example.com',
        iaasConsole: 'https://iaas.example.com',
        iaasConsoleBS: 'https://iaas-bs.example.com',
      });
    });
  });

  describe('Availability Flags', () => {
    it('should set availability to false when URL is missing', () => {
      const minimalData = {
        id: 'landscape-1',
        git: 'https://git.example.com',
        // All other fields missing
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', minimalData)
      );

      expect(result.current.availability.git).toBe(true);
      expect(result.current.availability.concourse).toBe(false);
      expect(result.current.availability.dynatrace).toBe(false);
      expect(result.current.availability.applicationLogging).toBe(false);
    });

    it('should set availability to false when URL is empty string', () => {
      const dataWithEmptyStrings = {
        id: 'landscape-1',
        git: '',
        concourse: '',
        dynatrace: '',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithEmptyStrings)
      );

      expect(result.current.availability.git).toBe(false);
      expect(result.current.availability.concourse).toBe(false);
      expect(result.current.availability.dynatrace).toBe(false);
    });

    it('should set availability to true when URL is present', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current.availability).toEqual({
        git: true,
        concourse: true,
        applicationLogging: true,
        kibana: false, // Not present in mockLandscapeData
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
      });
    });

    it('should handle mixed availability correctly', () => {
      const partialData = {
        id: 'landscape-1',
        git: 'https://git.example.com',
        concourse: 'https://concourse.example.com',
        // dynatrace missing
        'application-logging': 'https://logging.example.com',
        // Other fields missing
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', partialData)
      );

      expect(result.current.availability.git).toBe(true);
      expect(result.current.availability.concourse).toBe(true);
      expect(result.current.availability.applicationLogging).toBe(true);
      expect(result.current.availability.dynatrace).toBe(false);
      expect(result.current.availability.avs).toBe(false);
    });
  });

  describe('Deprecated Kibana Field', () => {
    it('should use application-logging when both are present', () => {
      const dataWithBoth = {
        id: 'landscape-1',
        'application-logging': 'https://new-logging.example.com',
        kibana: 'https://old-kibana.example.com',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithBoth)
      );

      expect(result.current.urls.applicationLogging).toBe('https://new-logging.example.com');
      expect(result.current.urls.kibana).toBe('https://old-kibana.example.com');
      expect(result.current.availability.applicationLogging).toBe(true);
      expect(result.current.availability.kibana).toBe(true);
    });

    it('should fallback to kibana when application-logging is missing', () => {
      const dataWithKibanaOnly = {
        id: 'landscape-1',
        kibana: 'https://kibana.example.com',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithKibanaOnly)
      );

      expect(result.current.urls.applicationLogging).toBe('https://kibana.example.com');
      expect(result.current.urls.kibana).toBe('https://kibana.example.com');
      expect(result.current.availability.applicationLogging).toBe(true);
      expect(result.current.availability.kibana).toBe(true);
    });

    it('should have null when neither application-logging nor kibana present', () => {
      const dataWithoutLogging = {
        id: 'landscape-1',
        git: 'https://git.example.com',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithoutLogging)
      );

      expect(result.current.urls.applicationLogging).toBe(null);
      expect(result.current.urls.kibana).toBe(null);
      expect(result.current.availability.applicationLogging).toBe(false);
      expect(result.current.availability.kibana).toBe(false);
    });

    it('should ignore empty string kibana when application-logging is present', () => {
      const dataWithEmptyKibana = {
        id: 'landscape-1',
        'application-logging': 'https://logging.example.com',
        kibana: '',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithEmptyKibana)
      );

      expect(result.current.urls.applicationLogging).toBe('https://logging.example.com');
      expect(result.current.urls.kibana).toBe(null);
      expect(result.current.availability.applicationLogging).toBe(true);
      expect(result.current.availability.kibana).toBe(false);
    });

    it('should use empty application-logging over kibana', () => {
      const dataWithEmptyAppLogging = {
        id: 'landscape-1',
        'application-logging': '',
        kibana: 'https://kibana.example.com',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithEmptyAppLogging)
      );

      // Empty string is falsy, so it falls back to kibana
      expect(result.current.urls.applicationLogging).toBe('https://kibana.example.com');
      expect(result.current.availability.applicationLogging).toBe(true);
    });
  });

  describe('URL Handling Edge Cases', () => {
    it('should handle undefined URLs as null', () => {
      const dataWithUndefined = {
        id: 'landscape-1',
        git: undefined,
        concourse: undefined,
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithUndefined)
      );

      expect(result.current.urls.git).toBe(null);
      expect(result.current.urls.concourse).toBe(null);
      expect(result.current.availability.git).toBe(false);
      expect(result.current.availability.concourse).toBe(false);
    });

    it('should handle empty string URLs as null', () => {
      const dataWithEmptyStrings = {
        id: 'landscape-1',
        git: '',
        concourse: '',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithEmptyStrings)
      );

      expect(result.current.urls.git).toBe(null);
      expect(result.current.urls.concourse).toBe(null);
      expect(result.current.availability.git).toBe(false);
      expect(result.current.availability.concourse).toBe(false);
    });

    it('should handle whitespace-only URLs', () => {
      const dataWithWhitespace = {
        id: 'landscape-1',
        git: '   ',
        concourse: '\t\n',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithWhitespace)
      );

      // Whitespace strings are truthy, so they're returned as-is
      expect(result.current.urls.git).toBe('   ');
      expect(result.current.urls.concourse).toBe('\t\n');
      expect(result.current.availability.git).toBe(true);
      expect(result.current.availability.concourse).toBe(true);
    });

    it('should handle special characters in URLs', () => {
      const dataWithSpecialChars = {
        id: 'landscape-1',
        git: 'https://git.example.com/path?query=value&param=123',
        concourse: 'https://concourse.example.com/#/section',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithSpecialChars)
      );

      expect(result.current.urls.git).toBe('https://git.example.com/path?query=value&param=123');
      expect(result.current.urls.concourse).toBe('https://concourse.example.com/#/section');
      expect(result.current.availability.git).toBe(true);
      expect(result.current.availability.concourse).toBe(true);
    });

    it('should handle minimal landscape data object', () => {
      const minimalData = {
        id: 'landscape-1',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', minimalData)
      );

      // All URLs should be null
      Object.values(result.current.urls).forEach((url) => {
        expect(url).toBe(null);
      });

      // All availability should be false
      Object.values(result.current.availability).forEach((available) => {
        expect(available).toBe(false);
      });
    });
  });

  describe('useMemo Optimization', () => {
    it('should return same reference when dependencies do not change', () => {
      const { result, rerender } = renderHook(
        ({ landscapeId, data }) => useLandscapeTools(landscapeId, data),
        {
          initialProps: {
            landscapeId: 'landscape-1',
            data: mockLandscapeData,
          },
        }
      );

      const firstResult = result.current;

      rerender({
        landscapeId: 'landscape-1',
        data: mockLandscapeData,
      });

      const secondResult = result.current;

      expect(firstResult).toBe(secondResult); // Same reference
      expect(firstResult.urls).toBe(secondResult.urls);
      expect(firstResult.availability).toBe(secondResult.availability);
    });

    it('should return new reference when landscape ID changes', () => {
      const { result, rerender } = renderHook(
        ({ landscapeId, data }) => useLandscapeTools(landscapeId, data),
        {
          initialProps: {
            landscapeId: 'landscape-1',
            data: mockLandscapeData,
          },
        }
      );

      const firstResult = result.current;

      rerender({
        landscapeId: 'landscape-2',
        data: mockLandscapeData,
      });

      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult); // Different reference
    });

    it('should return new reference when landscape data changes', () => {
      const alternativeData = {
        ...mockLandscapeData,
        git: 'https://different-git.example.com',
      };

      const { result, rerender } = renderHook(
        ({ landscapeId, data }) => useLandscapeTools(landscapeId, data),
        {
          initialProps: {
            landscapeId: 'landscape-1',
            data: mockLandscapeData,
          },
        }
      );

      const firstResult = result.current;

      rerender({
        landscapeId: 'landscape-1',
        data: alternativeData,
      });

      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult); // Different reference
      expect(firstResult.urls.git).toBe('https://git.example.com');
      expect(secondResult.urls.git).toBe('https://different-git.example.com');
    });

    it('should return new reference when transitioning to empty state', () => {
      const { result, rerender } = renderHook(
        ({ landscapeId, data }) => useLandscapeTools(landscapeId, data),
        {
          initialProps: {
            landscapeId: 'landscape-1',
            data: mockLandscapeData,
          },
        }
      );

      const firstResult = result.current;
      expect(firstResult.urls.git).toBe('https://git.example.com');

      rerender({
        landscapeId: null,
        data: mockLandscapeData,
      });

      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult);
      expect(secondResult.urls.git).toBe(null);
    });

    it('should return new reference when transitioning from empty state', () => {
      const { result, rerender } = renderHook(
        ({ landscapeId, data }) => useLandscapeTools(landscapeId, data),
        {
          initialProps: {
            landscapeId: null,
            data: null,
          },
        }
      );

      const firstResult = result.current;
      expect(firstResult.urls.git).toBe(null);

      rerender({
        landscapeId: 'landscape-1',
        data: mockLandscapeData,
      });

      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult);
      expect(secondResult.urls.git).toBe('https://git.example.com');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle landscape with only subset of tools', () => {
      const limitedToolsData = {
        id: 'landscape-dev',
        git: 'https://git.dev.example.com',
        concourse: 'https://concourse.dev.example.com',
        'application-logging': 'https://logging.dev.example.com',
        // All other tools missing
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-dev', limitedToolsData)
      );

      expect(result.current.urls.git).toBe('https://git.dev.example.com');
      expect(result.current.urls.concourse).toBe('https://concourse.dev.example.com');
      expect(result.current.urls.applicationLogging).toBe('https://logging.dev.example.com');

      expect(result.current.availability.git).toBe(true);
      expect(result.current.availability.concourse).toBe(true);
      expect(result.current.availability.applicationLogging).toBe(true);

      expect(result.current.urls.dynatrace).toBe(null);
      expect(result.current.urls.avs).toBe(null);
      expect(result.current.availability.dynatrace).toBe(false);
      expect(result.current.availability.avs).toBe(false);
    });

    it('should handle landscape with all tools available', () => {
      const fullToolsData = {
        ...mockLandscapeData,
        kibana: 'https://kibana.example.com', // Add kibana for full coverage
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', fullToolsData)
      );

      // All tools should be available
      const allAvailable = Object.values(result.current.availability).every(
        (available) => available === true
      );
      expect(allAvailable).toBe(true);

      // All URLs should be present
      const allUrlsPresent = Object.values(result.current.urls).every(
        (url) => url !== null && typeof url === 'string'
      );
      expect(allUrlsPresent).toBe(true);
    });

    it('should preserve other landscape metadata fields', () => {
      const dataWithMetadata = {
        id: 'landscape-1',
        name: 'Production',
        title: 'Production Environment',
        description: 'Main production landscape',
        domain: 'prod.example.com',
        environment: 'production',
        type: 'main',
        git: 'https://git.example.com',
      };

      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', dataWithMetadata)
      );

      // Hook should work fine with additional metadata fields
      expect(result.current.urls.git).toBe('https://git.example.com');
      expect(result.current.availability.git).toBe(true);
    });
  });

  describe('Return Value Structure', () => {
    it('should always return urls and availability objects', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      expect(result.current).toHaveProperty('urls');
      expect(result.current).toHaveProperty('availability');
      expect(typeof result.current.urls).toBe('object');
      expect(typeof result.current.availability).toBe('object');
    });

    it('should have consistent keys in urls and availability', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      const urlKeys = Object.keys(result.current.urls).sort();
      const availabilityKeys = Object.keys(result.current.availability).sort();

      expect(urlKeys).toEqual(availabilityKeys);
    });

    it('should have correct types for all URL values', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      Object.values(result.current.urls).forEach((url) => {
        expect(url === null || typeof url === 'string').toBe(true);
      });
    });

    it('should have correct types for all availability values', () => {
      const { result } = renderHook(() =>
        useLandscapeTools('landscape-1', mockLandscapeData)
      );

      Object.values(result.current.availability).forEach((available) => {
        expect(typeof available).toBe('boolean');
      });
    });
  });
});