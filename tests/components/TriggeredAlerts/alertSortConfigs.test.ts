import { describe, it, expect } from 'vitest';
import { sortAlerts } from '../../../src/components/TriggeredAlerts/alertSortConfigs';
import type { TriggeredAlert } from '../../../src/types/api';

describe('sortAlerts', () => {
  const mockAlerts: TriggeredAlert[] = [
    {
      fingerprint: '1',
      alertname: 'Database Connection',
      severity: 'critical',
      status: 'firing',
      landscape: 'production',
      region: 'us-east-1',
      startsAt: '2023-12-01T10:00:00Z',
      endsAt: '2023-12-01T11:00:00Z',
      labels: {},
      annotations: {},
      createdAt: '2023-12-01T10:00:00Z',
      updatedAt: '2023-12-01T10:00:00Z'
    },
    {
      fingerprint: '2',
      alertname: 'API Response Time',
      severity: 'warning',
      status: 'resolved',
      landscape: 'staging',
      region: 'eu-west-1',
      startsAt: '2023-12-01T09:00:00Z',
      endsAt: '2023-12-01T09:30:00Z',
      labels: {},
      annotations: {},
      createdAt: '2023-12-01T09:00:00Z',
      updatedAt: '2023-12-01T09:30:00Z'
    },
    {
      fingerprint: '3',
      alertname: 'CPU Usage High',
      severity: 'info',
      status: 'firing',
      landscape: 'development',
      region: 'ap-south-1',
      startsAt: '2023-12-01T11:00:00Z',
      labels: {},
      annotations: {},
      createdAt: '2023-12-01T11:00:00Z',
      updatedAt: '2023-12-01T11:00:00Z'
    }
  ];

  it('should sort by string fields alphabetically (alertname)', () => {
    const result = sortAlerts(mockAlerts, 'alertname', 'asc');
    expect(result.map(a => a.alertname)).toEqual([
      'API Response Time',
      'CPU Usage High', 
      'Database Connection'
    ]);

    const resultDesc = sortAlerts(mockAlerts, 'alertname', 'desc');
    expect(resultDesc.map(a => a.alertname)).toEqual([
      'Database Connection',
      'CPU Usage High',
      'API Response Time'
    ]);
  });

  it('should sort by severity with correct priority order (critical > warning > info)', () => {
    const result = sortAlerts(mockAlerts, 'severity', 'asc');
    expect(result.map(a => a.severity)).toEqual(['info', 'warning', 'critical']);

    const resultDesc = sortAlerts(mockAlerts, 'severity', 'desc');
    expect(resultDesc.map(a => a.severity)).toEqual(['critical', 'warning', 'info']);
  });

  it('should sort by startsAt chronologically', () => {
    const result = sortAlerts(mockAlerts, 'startsAt', 'asc');
    expect(result.map(a => a.alertname)).toEqual([
      'API Response Time',    // 09:00
      'Database Connection',  // 10:00
      'CPU Usage High'        // 11:00
    ]);

    const resultDesc = sortAlerts(mockAlerts, 'startsAt', 'desc');
    expect(resultDesc.map(a => a.alertname)).toEqual([
      'CPU Usage High',       // 11:00
      'Database Connection',  // 10:00
      'API Response Time'     // 09:00
    ]);
  });

  it('should sort by endsAt with proper handling of undefined values', () => {
    const result = sortAlerts(mockAlerts, 'endsAt', 'asc');
    // Alert without endsAt should be treated as current time (Date.now())
    // So it should come after alerts with actual end times
    expect(result[0].alertname).toBe('API Response Time'); // 09:30
    expect(result[1].alertname).toBe('Database Connection'); // 11:00
    expect(result[2].alertname).toBe('CPU Usage High'); // undefined -> Date.now()
  });


  it('should handle unknown severity levels gracefully', () => {
    const alertsWithUnknownSeverity: TriggeredAlert[] = [
      { ...mockAlerts[0], severity: 'unknown' as any },
      { ...mockAlerts[1], severity: 'critical' },
      { ...mockAlerts[2], severity: 'custom' as any }
    ];

    const result = sortAlerts(alertsWithUnknownSeverity, 'severity', 'asc');
    // Unknown severities should get value 0 and come first
    expect(result[0].severity).toBe('unknown');
    expect(result[1].severity).toBe('custom');
    expect(result[2].severity).toBe('critical');
  });

  it('should handle case insensitive sorting for string fields', () => {
    const alertsWithMixedCase: TriggeredAlert[] = [
      { ...mockAlerts[0], alertname: 'ZEBRA Alert', status: 'FIRING' },
      { ...mockAlerts[1], alertname: 'alpha Alert', status: 'RESOLVED' },
      { ...mockAlerts[2], alertname: 'Beta Alert', status: 'firing' }
    ];

    const resultByName = sortAlerts(alertsWithMixedCase, 'alertname', 'asc');
    expect(resultByName.map(a => a.alertname)).toEqual([
      'alpha Alert',
      'Beta Alert', 
      'ZEBRA Alert'
    ]);

    const resultByStatus = sortAlerts(alertsWithMixedCase, 'status', 'asc');
    expect(resultByStatus.map(a => a.status.toLowerCase())).toEqual([
      'firing',
      'firing',
      'resolved'
    ]);
  });

  it('should return original order for unknown fields', () => {
    const result = sortAlerts(mockAlerts, 'unknownField', 'asc');
    expect(result).toEqual(mockAlerts);
  });

  it('should not mutate the original array', () => {
    const originalAlerts = [...mockAlerts];
    const result = sortAlerts(mockAlerts, 'alertname', 'asc');
    
    expect(mockAlerts).toEqual(originalAlerts);
    expect(result).not.toBe(mockAlerts);
  });


  it('should handle edge cases (empty array, single alert, identical values)', () => {
    // Empty array
    const emptyResult = sortAlerts([], 'alertname', 'asc');
    expect(emptyResult).toEqual([]);

    // Single alert
    const singleAlert = [mockAlerts[0]];
    const singleResult = sortAlerts(singleAlert, 'alertname', 'asc');
    expect(singleResult).toEqual(singleAlert);
    expect(singleResult).not.toBe(singleAlert);

    // Identical values
    const identicalAlerts: TriggeredAlert[] = [
      { ...mockAlerts[0], alertname: 'Same Alert' },
      { ...mockAlerts[1], alertname: 'Same Alert' },
      { ...mockAlerts[2], alertname: 'Same Alert' }
    ];
    const identicalResult = sortAlerts(identicalAlerts, 'alertname', 'asc');
    expect(identicalResult).toHaveLength(3);
    expect(identicalResult.every(a => a.alertname === 'Same Alert')).toBe(true);
  });
});
