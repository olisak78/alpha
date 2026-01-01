import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getTriggeredAlerts,
  getTriggeredAlert,
  getAlertProjects,
  getTriggeredAlertsFilters,
  updateTriggeredAlertLabel
} from '../../src/services/triggeredAlertsApi';
import { apiClient } from '../../src/services/ApiClient';

// Mock the ApiClient
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockTriggeredAlert = (overrides?: any) => ({
  fingerprint: 'alert-fingerprint-123',
  alertname: 'TestAlert',
  status: 'firing',
  severity: 'warning',
  landscape: 'production',
  region: 'us-east-1',
  startsAt: '2025-01-01T10:00:00Z',
  endsAt: '2025-01-01T11:00:00Z',
  labels: {
    service: 'test-service',
    environment: 'prod'
  },
  annotations: {
    summary: 'Test alert summary',
    description: 'Test alert description'
  },
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:30:00Z',
  ...overrides,
});

const createMockTriggeredAlertsResponse = (overrides?: any) => ({
  alerts: [
    createMockTriggeredAlert(),
    createMockTriggeredAlert({ 
      fingerprint: 'alert-fingerprint-456', 
      alertname: 'AnotherAlert',
      severity: 'critical'
    })
  ],
  ...overrides,
});

const createMockAlertProjects = () => [
  'project-alpha',
  'project-beta',
  'project-gamma'
];

const createMockLabelUpdatePayload = (overrides?: any) => ({
  fingerprint: 'alert-fingerprint-123',
  label: {
    key: 'status',
    value: 'resolved'
  },
  message: 'Alert resolved by user',
  project: 'test-project',
  ...overrides,
});

const createMockTriggeredAlertsFiltersResponse = (overrides?: any) => ({
  severity: ['critical', 'warning', 'info'],
  status: ['firing', 'resolved'],
  landscape: ['production', 'staging', 'development'],
  region: ['us-east-1', 'eu-west-1', 'ap-south-1'],
  ...overrides,
});

// ============================================================================
// TRIGGERED ALERTS API TESTS
// ============================================================================

describe('triggeredAlertsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // getTriggeredAlerts TESTS
  // ============================================================================

  describe('getTriggeredAlerts', () => {
    it('should fetch triggered alerts for a project successfully', async () => {
      const projectname = 'test-project';
      const mockResponse = createMockTriggeredAlertsResponse();

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getTriggeredAlerts(projectname);

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}`);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle project names with special characters', async () => {
      const projectname = 'test-project-with-dashes_and_underscores';
      const mockResponse = createMockTriggeredAlertsResponse();

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getTriggeredAlerts(projectname);

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}`);
    });

    it('should handle empty project name', async () => {
      const projectname = '';
      const mockResponse = createMockTriggeredAlertsResponse({ alerts: [] });

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getTriggeredAlerts(projectname);

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/alert-storage/alerts/');
    });

    it('should handle API errors', async () => {
      const projectname = 'test-project';
      const error = new Error('Failed to fetch triggered alerts');

      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getTriggeredAlerts(projectname)).rejects.toThrow('Failed to fetch triggered alerts');
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}`);
    });

    it('should handle 404 errors for non-existent projects', async () => {
      const projectname = 'non-existent-project';
      const error = new Error('Project not found');

      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getTriggeredAlerts(projectname)).rejects.toThrow('Project not found');
    });

    it('should return empty alerts array when no alerts exist', async () => {
      const projectname = 'project-with-no-alerts';
      const mockResponse = createMockTriggeredAlertsResponse({ alerts: [] });

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getTriggeredAlerts(projectname);

      expect(result.alerts).toHaveLength(0);
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}`);
    });
  });

  // ============================================================================
  // getTriggeredAlert TESTS
  // ============================================================================

  describe('getTriggeredAlert', () => {
    it('should fetch a specific triggered alert successfully', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-123';
      const mockAlert = createMockTriggeredAlert();

      vi.mocked(apiClient.get).mockResolvedValue(mockAlert);

      const result = await getTriggeredAlert(projectname, fingerprint);

      expect(result).toEqual(mockAlert);
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}/${fingerprint}`);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle fingerprints with special characters', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-with-special-chars_123';
      const mockAlert = createMockTriggeredAlert({ fingerprint });

      vi.mocked(apiClient.get).mockResolvedValue(mockAlert);

      const result = await getTriggeredAlert(projectname, fingerprint);

      expect(result).toEqual(mockAlert);
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}/${fingerprint}`);
    });

    it('should handle long fingerprints', async () => {
      const projectname = 'test-project';
      const fingerprint = 'very-long-alert-fingerprint-with-many-characters-and-hashes-1234567890abcdef';
      const mockAlert = createMockTriggeredAlert({ fingerprint });

      vi.mocked(apiClient.get).mockResolvedValue(mockAlert);

      const result = await getTriggeredAlert(projectname, fingerprint);

      expect(result).toEqual(mockAlert);
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}/${fingerprint}`);
    });

    it('should handle API errors', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-123';
      const error = new Error('Alert not found');

      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getTriggeredAlert(projectname, fingerprint)).rejects.toThrow('Alert not found');
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}/${fingerprint}`);
    });

    it('should handle 404 errors for non-existent alerts', async () => {
      const projectname = 'test-project';
      const fingerprint = 'non-existent-fingerprint';
      const error = new Error('Alert not found');

      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getTriggeredAlert(projectname, fingerprint)).rejects.toThrow('Alert not found');
    });

    it('should handle empty parameters', async () => {
      const projectname = '';
      const fingerprint = '';
      const mockAlert = createMockTriggeredAlert();

      vi.mocked(apiClient.get).mockResolvedValue(mockAlert);

      const result = await getTriggeredAlert(projectname, fingerprint);

      expect(result).toEqual(mockAlert);
      expect(apiClient.get).toHaveBeenCalledWith('/alert-storage/alerts//');
    });
  });

  // ============================================================================
  // getAlertProjects TESTS
  // ============================================================================

  describe('getAlertProjects', () => {
    it('should fetch alert projects successfully', async () => {
      const mockProjects = createMockAlertProjects();

      vi.mocked(apiClient.get).mockResolvedValue(mockProjects);

      const result = await getAlertProjects();

      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(3);
      expect(apiClient.get).toHaveBeenCalledWith('/alert-storage/alerts/project');
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle empty projects list', async () => {
      const mockProjects: string[] = [];

      vi.mocked(apiClient.get).mockResolvedValue(mockProjects);

      const result = await getAlertProjects();

      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(0);
      expect(apiClient.get).toHaveBeenCalledWith('/alert-storage/alerts/project');
    });

    it('should handle single project', async () => {
      const mockProjects = ['single-project'];

      vi.mocked(apiClient.get).mockResolvedValue(mockProjects);

      const result = await getAlertProjects();

      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('single-project');
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch alert projects');

      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getAlertProjects()).rejects.toThrow('Failed to fetch alert projects');
      expect(apiClient.get).toHaveBeenCalledWith('/alert-storage/alerts/project');
    });

    it('should handle server errors', async () => {
      const error = new Error('Internal server error');

      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getAlertProjects()).rejects.toThrow('Internal server error');
    });

    it('should handle projects with special characters', async () => {
      const mockProjects = [
        'project-with-dashes',
        'project_with_underscores',
        'project.with.dots',
        'project123'
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockProjects);

      const result = await getAlertProjects();

      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(4);
    });
  });

  // ============================================================================
  // getTriggeredAlertsFilters TESTS
  // ============================================================================

  describe('getTriggeredAlertsFilters', () => {
    it('should fetch alert filters for a project successfully', async () => {
      const projectname = 'test-project';
      const mockFilters = createMockTriggeredAlertsFiltersResponse();

      vi.mocked(apiClient.get).mockResolvedValue(mockFilters);

      const result = await getTriggeredAlertsFilters(projectname);

      expect(result).toEqual(mockFilters);
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}/filters`);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle empty filters response', async () => {
      const projectname = 'test-project';
      const mockFilters = {};

      vi.mocked(apiClient.get).mockResolvedValue(mockFilters);

      const result = await getTriggeredAlertsFilters(projectname);

      expect(result).toEqual(mockFilters);
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle partial filters response', async () => {
      const projectname = 'test-project';
      const mockFilters = createMockTriggeredAlertsFiltersResponse({
        severity: ['critical'],
        status: ['firing']
      });
      delete mockFilters.landscape;
      delete mockFilters.region;

      vi.mocked(apiClient.get).mockResolvedValue(mockFilters);

      const result = await getTriggeredAlertsFilters(projectname);

      expect(result).toEqual(mockFilters);
      expect(result.severity).toEqual(['critical']);
      expect(result.status).toEqual(['firing']);
      expect(result.landscape).toBeUndefined();
    });

    it('should handle API errors', async () => {
      const projectname = 'test-project';
      const error = new Error('Failed to fetch filters');

      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getTriggeredAlertsFilters(projectname)).rejects.toThrow('Failed to fetch filters');
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}/filters`);
    });

    it('should handle 404 errors for non-existent projects', async () => {
      const projectname = 'non-existent-project';
      const error = new Error('Project not found');

      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getTriggeredAlertsFilters(projectname)).rejects.toThrow('Project not found');
    });

    it('should handle project names with special characters', async () => {
      const projectname = 'project-with-special_chars.123';
      const mockFilters = createMockTriggeredAlertsFiltersResponse();

      vi.mocked(apiClient.get).mockResolvedValue(mockFilters);

      const result = await getTriggeredAlertsFilters(projectname);

      expect(result).toEqual(mockFilters);
      expect(apiClient.get).toHaveBeenCalledWith(`/alert-storage/alerts/${projectname}/filters`);
    });

    it('should handle filters with many values', async () => {
      const projectname = 'test-project';
      const mockFilters = createMockTriggeredAlertsFiltersResponse({
        severity: Array.from({ length: 20 }, (_, i) => `severity-${i}`),
        landscape: Array.from({ length: 50 }, (_, i) => `landscape-${i}`)
      });

      vi.mocked(apiClient.get).mockResolvedValue(mockFilters);

      const result = await getTriggeredAlertsFilters(projectname);

      expect(result.severity).toHaveLength(20);
      expect(result.landscape).toHaveLength(50);
    });

    it('should handle server errors', async () => {
      const projectname = 'test-project';
      const error = new Error('Internal server error');

      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getTriggeredAlertsFilters(projectname)).rejects.toThrow('Internal server error');
    });
  });

  // ============================================================================
  // updateTriggeredAlertLabel TESTS
  // ============================================================================

  describe('updateTriggeredAlertLabel', () => {
    it('should update triggered alert label successfully', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-123';
      const payload = createMockLabelUpdatePayload();

      vi.mocked(apiClient.put).mockResolvedValue(undefined);

      const result = await updateTriggeredAlertLabel(projectname, fingerprint, payload);

      expect(result).toBeUndefined(); // PUT request returns void
      expect(apiClient.put).toHaveBeenCalledWith(
        `/alert-storage/alerts/${projectname}/${fingerprint}/label`,
        payload
      );
      expect(apiClient.put).toHaveBeenCalledTimes(1);
    });

    it('should handle different label types', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-123';
      const payload = createMockLabelUpdatePayload({
        label: { key: 'priority', value: 'high' }
      });

      vi.mocked(apiClient.put).mockResolvedValue(undefined);

      const result = await updateTriggeredAlertLabel(projectname, fingerprint, payload);

      expect(result).toBeUndefined();
      expect(apiClient.put).toHaveBeenCalledWith(
        `/alert-storage/alerts/${projectname}/${fingerprint}/label`,
        payload
      );
    });

    it('should handle payload without message', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-123';
      const payload = createMockLabelUpdatePayload({
        message: undefined
      });

      vi.mocked(apiClient.put).mockResolvedValue(undefined);

      const result = await updateTriggeredAlertLabel(projectname, fingerprint, payload);

      expect(result).toBeUndefined();
      expect(apiClient.put).toHaveBeenCalledWith(
        `/alert-storage/alerts/${projectname}/${fingerprint}/label`,
        payload
      );
    });

    it('should handle API errors', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-123';
      const payload = createMockLabelUpdatePayload();
      const error = new Error('Failed to update alert label');

      vi.mocked(apiClient.put).mockRejectedValue(error);

      await expect(updateTriggeredAlertLabel(projectname, fingerprint, payload))
        .rejects.toThrow('Failed to update alert label');
      expect(apiClient.put).toHaveBeenCalledWith(
        `/alert-storage/alerts/${projectname}/${fingerprint}/label`,
        payload
      );
    });

    it('should handle 404 errors for non-existent alerts', async () => {
      const projectname = 'test-project';
      const fingerprint = 'non-existent-fingerprint';
      const payload = createMockLabelUpdatePayload();
      const error = new Error('Alert not found');

      vi.mocked(apiClient.put).mockRejectedValue(error);

      await expect(updateTriggeredAlertLabel(projectname, fingerprint, payload))
        .rejects.toThrow('Alert not found');
    });

    it('should handle validation errors', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-123';
      const payload = createMockLabelUpdatePayload({
        label: { key: '', value: '' } // Invalid label
      });
      const error = new Error('Invalid label data');

      vi.mocked(apiClient.put).mockRejectedValue(error);

      await expect(updateTriggeredAlertLabel(projectname, fingerprint, payload))
        .rejects.toThrow('Invalid label data');
    });

    it('should handle complex label values', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-123';
      const payload = createMockLabelUpdatePayload({
        label: { 
          key: 'custom_status', 
          value: 'resolved_by_automation_with_special_chars_@#$%' 
        },
        message: 'Complex update with special characters and long text that might cause issues'
      });

      vi.mocked(apiClient.put).mockResolvedValue(undefined);

      const result = await updateTriggeredAlertLabel(projectname, fingerprint, payload);

      expect(result).toBeUndefined();
      expect(apiClient.put).toHaveBeenCalledWith(
        `/alert-storage/alerts/${projectname}/${fingerprint}/label`,
        payload
      );
    });

  it('should handle empty parameters', async () => {
    const projectname = '';
    const fingerprint = '';
    const payload = createMockLabelUpdatePayload();

    vi.mocked(apiClient.put).mockResolvedValue(undefined);

    const result = await updateTriggeredAlertLabel(projectname, fingerprint, payload);

    expect(result).toBeUndefined();
    expect(apiClient.put).toHaveBeenCalledWith('/alert-storage/alerts///label', payload);
  });

    it('should handle network errors', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-123';
      const payload = createMockLabelUpdatePayload();
      const error = new Error('Network error');

      vi.mocked(apiClient.put).mockRejectedValue(error);

      await expect(updateTriggeredAlertLabel(projectname, fingerprint, payload))
        .rejects.toThrow('Network error');
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration scenarios', () => {
    it('should handle multiple API calls in sequence', async () => {
      const projectname = 'test-project';
      const mockProjects = createMockAlertProjects();
      const mockAlertsResponse = createMockTriggeredAlertsResponse();

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockProjects)
        .mockResolvedValueOnce(mockAlertsResponse);

      // First call: get projects
      const projects = await getAlertProjects();
      expect(projects).toEqual(mockProjects);

      // Second call: get alerts for a project
      const alerts = await getTriggeredAlerts(projectname);
      expect(alerts).toEqual(mockAlertsResponse);

      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(apiClient.get).toHaveBeenNthCalledWith(1, '/alert-storage/alerts/project');
      expect(apiClient.get).toHaveBeenNthCalledWith(2, `/alert-storage/alerts/${projectname}`);
    });

    it('should handle mixed success and error scenarios', async () => {
      const projectname = 'test-project';
      const fingerprint = 'alert-fingerprint-123';
      const mockAlertsResponse = createMockTriggeredAlertsResponse();
      const error = new Error('Alert not found');

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockAlertsResponse)
        .mockRejectedValueOnce(error);

      // First call succeeds
      const alerts = await getTriggeredAlerts(projectname);
      expect(alerts).toEqual(mockAlertsResponse);

      // Second call fails
      await expect(getTriggeredAlert(projectname, fingerprint))
        .rejects.toThrow('Alert not found');

      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });
});
