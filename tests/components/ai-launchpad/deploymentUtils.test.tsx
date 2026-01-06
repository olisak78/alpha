import { describe, it, expect } from 'vitest';
import '../../../src/test/setup';
import {
  getModelDisplayName,
  getModelVersion,
  getStatusIcon,
  getStatusColor,
  getCardBorderColor,
} from '../../../src/components/AILaunchpad/deploymentUtils';
import { Deployment } from '../../../src/services/aiPlatformApi';
import { PlayCircle, AlertCircle, Loader2 } from 'lucide-react';

const mockDeployment: Deployment = {
  id: 'test-deployment-123',
  status: 'RUNNING',
  configurationId: 'config-123',
  configurationName: 'Test Configuration',
  createdAt: '2023-01-01T00:00:00Z',
  modifiedAt: '2023-01-01T00:00:00Z',
  details: {
    resources: {
      backendDetails: {
        model: {
          name: 'GPT-4',
          version: '2024.1',
        },
      },
    },
  },
};

describe('deploymentUtils', () => {
  describe('getModelDisplayName', () => {
    it('should return model name from backendDetails', () => {
      const result = getModelDisplayName(mockDeployment);
      expect(result).toBe('GPT-4');
    });

    it('should fallback to configurationName', () => {
      const deployment = { ...mockDeployment, details: undefined };
      const result = getModelDisplayName(deployment);
      expect(result).toBe('Test Configuration');
    });

    it('should fallback to Unknown Model', () => {
      const deployment = { ...mockDeployment, details: undefined, configurationName: undefined };
      const result = getModelDisplayName(deployment);
      expect(result).toBe('Unknown Model');
    });
  });

  describe('getModelVersion', () => {
    it('should return model version from backendDetails', () => {
      const result = getModelVersion(mockDeployment);
      expect(result).toBe('2024.1');
    });

    it('should fallback to "1"', () => {
      const deployment = { ...mockDeployment, details: undefined };
      const result = getModelVersion(deployment);
      expect(result).toBe('1');
    });
  });

  describe('getStatusIcon', () => {
    it('should return correct icons for different statuses', () => {
      expect(getStatusIcon('RUNNING')).toBe(PlayCircle);
      expect(getStatusIcon('PENDING')).toBe(Loader2);
      expect(getStatusIcon('DEAD')).toBe(AlertCircle);
      expect(getStatusIcon('STOPPED')).toBe(AlertCircle);
      expect(getStatusIcon('UNKNOWN')).toBe(AlertCircle);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect(getStatusColor('RUNNING')).toContain('bg-green-100');
      expect(getStatusColor('PENDING')).toContain('bg-yellow-100');
      expect(getStatusColor('DEAD')).toContain('bg-red-100');
      expect(getStatusColor('STOPPED')).toContain('bg-red-100');
      expect(getStatusColor('UNKNOWN')).toContain('bg-muted');
    });
  });

  describe('getCardBorderColor', () => {
    it('should return correct border colors for different statuses', () => {
      expect(getCardBorderColor('RUNNING')).toBe('border-l-green-500');
      expect(getCardBorderColor('PENDING')).toBe('border-l-yellow-500');
      expect(getCardBorderColor('DEAD')).toBe('border-l-red-500');
      expect(getCardBorderColor('STOPPED')).toBe('border-l-red-500');
      expect(getCardBorderColor('UNKNOWN')).toBe('border-l-muted-foreground');
    });
  });
});
