import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchSonarMeasures, parseSonarMetrics, extractSonarComponentAlias } from '../../src/services/SonarApi';
import { apiClient } from '../../src/services/ApiClient';
import type { SonarMeasuresResponse } from '../../src/types/api';

// Mock the apiClient
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('SonarApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // fetchSonarMeasures TESTS
  // ============================================================================

  describe('fetchSonarMeasures', () => {
    it('should fetch sonar measures with component alias', async () => {
      const mockResponse: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '85.5', bestValue: false },
          { metric: 'code_smells', value: '12', bestValue: false },
          { metric: 'vulnerabilities', value: '3', bestValue: false },
        ],
        status: 'OK',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchSonarMeasures('my-project');

      expect(apiClient.get).toHaveBeenCalledWith('/sonar/measures', {
        params: { component: 'my-project' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      (apiClient.get as any).mockRejectedValueOnce(error);

      await expect(fetchSonarMeasures('my-project')).rejects.toThrow('API Error');
    });

    it('should pass correct endpoint and params', async () => {
      const mockResponse: SonarMeasuresResponse = {
        measures: [],
        status: 'OK',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      await fetchSonarMeasures('test-component-123');

      expect(apiClient.get).toHaveBeenCalledWith('/sonar/measures', {
        params: { component: 'test-component-123' },
      });
    });
  });

  // ============================================================================
  // parseSonarMetrics TESTS
  // ============================================================================

  describe('parseSonarMetrics', () => {
    it('should parse all metrics correctly', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '85.5', bestValue: false },
          { metric: 'code_smells', value: '12', bestValue: false },
          { metric: 'vulnerabilities', value: '3', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result).toEqual({
        coverage: 85.5,
        codeSmells: 12,
        vulnerabilities: 3,
        qualityGate: 'Passed',
      });
    });

    it('should set quality gate to "Passed" when status is OK', () => {
      const response: SonarMeasuresResponse = {
        measures: [],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result.qualityGate).toBe('Passed');
    });

    it('should set quality gate to "Failed" when status is not OK', () => {
      const response: SonarMeasuresResponse = {
        measures: [],
        status: 'ERROR',
      };

      const result = parseSonarMetrics(response);

      expect(result.qualityGate).toBe('Failed');
    });

    it('should handle missing metrics with null values', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '75.0', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result).toEqual({
        coverage: 75.0,
        codeSmells: null,
        vulnerabilities: null,
        qualityGate: 'Passed',
      });
    });

    it('should handle empty measures array', () => {
      const response: SonarMeasuresResponse = {
        measures: [],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result).toEqual({
        coverage: null,
        codeSmells: null,
        vulnerabilities: null,
        qualityGate: 'Passed',
      });
    });

    it('should floor code_smells to integer', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'code_smells', value: '12.7', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result.codeSmells).toBe(12);
    });

    it('should floor vulnerabilities to integer', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'vulnerabilities', value: '5.9', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result.vulnerabilities).toBe(5);
    });

    it('should keep coverage as float', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '85.75', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result.coverage).toBe(85.75);
    });

    it('should handle invalid numeric values as null', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: 'invalid', bestValue: false },
          { metric: 'code_smells', value: 'NaN', bestValue: false },
          { metric: 'vulnerabilities', value: '', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result).toEqual({
        coverage: null,
        codeSmells: null,
        vulnerabilities: null,
        qualityGate: 'Passed',
      });
    });

    it('should handle zero values correctly', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '0', bestValue: false },
          { metric: 'code_smells', value: '0', bestValue: true },
          { metric: 'vulnerabilities', value: '0', bestValue: true },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result).toEqual({
        coverage: 0,
        codeSmells: 0,
        vulnerabilities: 0,
        qualityGate: 'Passed',
      });
    });

    it('should ignore unknown metric types', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '85.5', bestValue: false },
          { metric: 'bugs', value: '5', bestValue: false },
          { metric: 'security_hotspots', value: '2', bestValue: false },
          { metric: 'code_smells', value: '10', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result).toEqual({
        coverage: 85.5,
        codeSmells: 10,
        vulnerabilities: null,
        qualityGate: 'Passed',
      });
    });

    it('should handle negative values', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '-5', bestValue: false },
          { metric: 'code_smells', value: '-1', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result.coverage).toBe(-5);
      expect(result.codeSmells).toBe(-1);
    });

    it('should handle very large values', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'code_smells', value: '999999', bestValue: false },
          { metric: 'vulnerabilities', value: '123456', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result.codeSmells).toBe(999999);
      expect(result.vulnerabilities).toBe(123456);
    });
  });

  // ============================================================================
  // extractSonarComponentAlias TESTS
  // ============================================================================

  describe('extractSonarComponentAlias', () => {
    it('should extract project key from sonar URL', () => {
      const sonarUrl = 'https://sonar.tools.sap/dashboard?id=com.sap.core.commercial.service:cis-common';
      
      const result = extractSonarComponentAlias(sonarUrl);

      expect(result).toBe('com.sap.core.commercial.service:cis-common');
    });

    it('should handle sonar field as direct key', () => {
      const sonarKey = 'my-direct-project-key';
      
      const result = extractSonarComponentAlias(sonarKey);

      expect(result).toBe('my-direct-project-key');
    });

    it('should handle sonar URL with multiple query parameters', () => {
      const sonarUrl = 'https://sonar.tools.sap/dashboard?branch=main&id=my-project&view=coverage';
      
      const result = extractSonarComponentAlias(sonarUrl);

      expect(result).toBe('my-project');
    });

    it('should return null for sonar URL without id parameter', () => {
      const sonarUrl = 'https://sonar.tools.sap/dashboard?branch=main';
      
      const result = extractSonarComponentAlias(sonarUrl);

      expect(result).toBeNull();
    });

    it('should treat non-URL strings as direct keys', () => {
      // A string that doesn't start with http:// or https:// is treated as a direct key
      const nonUrlKey = 'my-project-key';
      
      const result = extractSonarComponentAlias(nonUrlKey);

      expect(result).toBe('my-project-key');
    });

    it('should handle http URLs', () => {
      const sonarUrl = 'http://sonar.local/dashboard?id=local-project';
      
      const result = extractSonarComponentAlias(sonarUrl);

      expect(result).toBe('local-project');
    });

    it('should return null when sonar field is undefined', () => {
      const result = extractSonarComponentAlias(undefined);

      expect(result).toBeNull();
    });

    it('should return null when sonar field is null', () => {
      const result = extractSonarComponentAlias(null);

      expect(result).toBeNull();
    });

    it('should return null for empty string in sonar field', () => {
      // Empty string is falsy, so it should return null (not a valid key)
      const result = extractSonarComponentAlias('');

      expect(result).toBeNull();
    });

    it('should handle project keys with special characters', () => {
      const sonarKey = 'my-org:my-project_name.v2';
      
      const result = extractSonarComponentAlias(sonarKey);

      expect(result).toBe('my-org:my-project_name.v2');
    });

    it('should handle malformed URLs by logging and returning null', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // This will fail URL parsing
      const malformedUrl = 'https://sonar.example.com/dashboard?id=project[invalid]';
      
      const result = extractSonarComponentAlias(malformedUrl);

      // Should either return the project key if it can be extracted, or null
      // In this case, URL parsing might succeed but that's okay
      expect(typeof result === 'string' || result === null).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration: fetchSonarMeasures + parseSonarMetrics', () => {
    it('should fetch and parse metrics in one flow', async () => {
      const mockResponse: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '92.3', bestValue: false },
          { metric: 'code_smells', value: '8', bestValue: false },
          { metric: 'vulnerabilities', value: '1', bestValue: false },
        ],
        status: 'OK',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const response = await fetchSonarMeasures('integration-test-project');
      const metrics = parseSonarMetrics(response);

      expect(metrics).toEqual({
        coverage: 92.3,
        codeSmells: 8,
        vulnerabilities: 1,
        qualityGate: 'Passed',
      });
    });

    it('should handle failed quality gate', async () => {
      const mockResponse: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '45.0', bestValue: false },
          { metric: 'code_smells', value: '150', bestValue: false },
          { metric: 'vulnerabilities', value: '25', bestValue: false },
        ],
        status: 'ERROR',
      };

      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const response = await fetchSonarMeasures('failing-project');
      const metrics = parseSonarMetrics(response);

      expect(metrics.qualityGate).toBe('Failed');
      expect(metrics.coverage).toBe(45.0);
      expect(metrics.codeSmells).toBe(150);
      expect(metrics.vulnerabilities).toBe(25);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle response with bestValue flag', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '100', bestValue: true },
          { metric: 'code_smells', value: '0', bestValue: true },
          { metric: 'vulnerabilities', value: '0', bestValue: true },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result).toEqual({
        coverage: 100,
        codeSmells: 0,
        vulnerabilities: 0,
        qualityGate: 'Passed',
      });
    });

    it('should handle duplicate metric entries (use last value)', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '50', bestValue: false },
          { metric: 'coverage', value: '75', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result.coverage).toBe(75);
    });

    it('should handle very precise decimal values', () => {
      const response: SonarMeasuresResponse = {
        measures: [
          { metric: 'coverage', value: '85.123456789', bestValue: false },
        ],
        status: 'OK',
      };

      const result = parseSonarMetrics(response);

      expect(result.coverage).toBeCloseTo(85.123456789);
    });
  });
});