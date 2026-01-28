import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getBasePath,
  shouldNavigateToTab,
  isValidEmail,
  isValidUrl,
  safeLocalStorageGet,
  safeLocalStorageSet,
  generateStableLinkId,
  buildUserFromMe,
  getStatusColor,
  getGroupStatus,
  getLogLevelColor,
  getLogLevelIcon,
  getDeployedVersion,
  getAvailableComponents,
  sortLandscapeGroups
} from '@/utils/developer-portal-helpers';

describe('developer-portal-helpers', () => {
  // ============================================================================
  // PATH AND ROUTING HELPERS
  // ============================================================================

  describe('Path and Navigation Helpers', () => {
    const mockProjects = ['cis', 'cloud-automation', 'unified-services'];

    beforeEach(() => {
      delete (window as any).location;
      (window as any).location = { pathname: '/' };
    });

    it('should handle getBasePath correctly', () => {
      // Test null cases
      expect(getBasePath(mockProjects, '')).toBeNull();
      expect(getBasePath(mockProjects, '/')).toBeNull();
      expect(getBasePath(mockProjects, '/unknown')).toBeNull();
      
      // Test valid paths
      expect(getBasePath(mockProjects, '/cis')).toBe('/cis');
      expect(getBasePath(mockProjects, '/cis/service/details')).toBe('/cis');
      expect(getBasePath(mockProjects, '/cloud-automation/workflow')).toBe('/cloud-automation');
      expect(getBasePath(mockProjects, '/unified-services/api')).toBe('/unified-services');
      expect(getBasePath(mockProjects, '/teams/backend-team')).toBe('/teams');
    });

    it('should handle shouldNavigateToTab correctly', () => {
      // Test matching paths
      (window as any).location = { pathname: '/cis' };
      expect(shouldNavigateToTab('/cis')).toBe(true);
      
      (window as any).location = { pathname: '/cis/services' };
      expect(shouldNavigateToTab('/cis')).toBe(true);
      
      (window as any).location = { pathname: '/cis/' };
      expect(shouldNavigateToTab('/cis')).toBe(true);
      
      // Test non-matching path
      (window as any).location = { pathname: '/teams' };
      expect(shouldNavigateToTab('/cis')).toBe(false);
    });
  });


  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  describe('Validation Helpers', () => {
    it('should validate emails correctly', () => {
      // Valid emails
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@company.co.uk')).toBe(true);
      expect(isValidEmail('developer+tag@domain.io')).toBe(true);
      expect(isValidEmail('  user@example.com  ')).toBe(true);
      
      // Invalid emails
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should validate URLs correctly', () => {
      // Valid URLs
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://sub.domain.com/path?query=value')).toBe(true);
      expect(isValidUrl('  https://example.com  ')).toBe(true);
      
      // Empty URLs (allowed)
      expect(isValidUrl('')).toBe(true);
      expect(isValidUrl('   ')).toBe(true);
      
      // Invalid URLs
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('//example.com')).toBe(false);
      expect(isValidUrl('just text')).toBe(false);
    });
  });

  // ============================================================================
  // LOCALSTORAGE HELPERS
  // ============================================================================

  describe('localStorage Helpers', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should handle get operations correctly', () => {
      // Test successful retrieval
      localStorage.setItem('test-key', JSON.stringify({ value: 'data' }));
      expect(safeLocalStorageGet('test-key')).toEqual({ value: 'data' });
      
      // Test fallbacks
      expect(safeLocalStorageGet('non-existent', 'fallback')).toBe('fallback');
      expect(safeLocalStorageGet('non-existent')).toBeNull();
      
      // Test parse error handling
      localStorage.setItem('invalid-json', 'not valid json');
      expect(safeLocalStorageGet('invalid-json', 'fallback')).toBe('fallback');
      
      // Test different data types
      localStorage.setItem('array-key', JSON.stringify([1, 2, 3]));
      expect(safeLocalStorageGet('array-key')).toEqual([1, 2, 3]);
      
      localStorage.setItem('string-key', JSON.stringify('string value'));
      expect(safeLocalStorageGet('string-key')).toBe('string value');
    });

    it('should handle set operations correctly', () => {
      // Test storing data
      safeLocalStorageSet('test-key', { value: 'data' });
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify({ value: 'data' }));
      
      // Test null/undefined removal
      localStorage.setItem('test-key', 'value');
      safeLocalStorageSet('test-key', null);
      expect(localStorage.getItem('test-key')).toBeNull();
      
      safeLocalStorageSet('test-key2', undefined);
      expect(localStorage.getItem('test-key2')).toBeNull();
      
      // Test different data types
      safeLocalStorageSet('array-key', [1, 2, 3]);
      safeLocalStorageSet('string-key', 'value');
      safeLocalStorageSet('number-key', 42);
      
      expect(localStorage.getItem('array-key')).toBe(JSON.stringify([1, 2, 3]));
      expect(localStorage.getItem('string-key')).toBe(JSON.stringify('value'));
      expect(localStorage.getItem('number-key')).toBe(JSON.stringify(42));
    });

    it('should handle localStorage unavailability gracefully', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      expect(() => safeLocalStorageSet('test', 'value')).not.toThrow();
      
      setItemSpy.mockRestore();
    });
  });

  // ============================================================================
  // UTILITY HELPERS
  // ============================================================================

  describe('Utility Helpers', () => {
    it('should handle generateStableLinkId correctly', () => {
      // Test consistency
      const id1 = generateStableLinkId('slack', 'https://slack.com', 'Slack Channel');
      const id2 = generateStableLinkId('slack', 'https://slack.com', 'Slack Channel');
      expect(id1).toBe(id2);
      
      // Test key inclusion and format
      const id = generateStableLinkId('github', 'https://github.com', 'Repository');
      expect(id).toContain('github');
      expect(id).toMatch(/^[a-zA-Z0-9-]+$/);
      
      // Test truncation
      const parts = generateStableLinkId('key', 'url', 'title').split('-');
      expect(parts[0]).toBe('key');
      expect(parts[1].length).toBeLessThanOrEqual(16);
    });

    it('should handle buildUserFromMe correctly', () => {
      // Test complete payload
      const completeUser = buildUserFromMe({
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        team_role: 'developer',
        portal_admin: true,
      } as any);
      
      expect(completeUser).toEqual({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        provider: 'githubtools',
        team_role: 'developer',
        portal_admin: true,
        organization: undefined,
      });
      
      // Test fallbacks
      expect(buildUserFromMe({ id: 'abc', email: 'no.name@example.com' } as any).name).toBe('no.name@example.com');
      expect(buildUserFromMe({ uuid: 'uuid-456', email: 'uuid@example.com' } as any).id).toBe('uuid-456');
    });
  });


  // ============================================================================
  // STATUS AND COLOR HELPERS
  // ============================================================================

  describe('getStatusColor', () => {
    const statusTestCases = [
      { status: 'healthy', expected: 'bg-success text-white' },
      { status: 'active', expected: 'bg-success text-white' },
      { status: 'deployed', expected: 'bg-success text-white' },
      { status: 'warning', expected: 'bg-warning text-white' },
      { status: 'deploying', expected: 'bg-warning text-white' },
      { status: 'error', expected: 'bg-destructive text-white' },
      { status: 'inactive', expected: 'bg-destructive text-white' },
      { status: 'failed', expected: 'bg-destructive text-white' },
      { status: 'unknown', expected: 'bg-muted text-muted-foreground' },
      { status: 'pending', expected: 'bg-muted text-muted-foreground' },
    ];

    it.each(statusTestCases)('should return $expected for $status status', ({ status, expected }) => {
      expect(getStatusColor(status)).toBe(expected);
    });
  });

  describe('Log Level Helpers', () => {
    const logLevelTestCases = [
      { level: 'ERROR', color: 'text-destructive', icon: '🔴' },
      { level: 'WARN', color: 'text-yellow-500', icon: '🟡' },
      { level: 'INFO', color: 'text-blue-500', icon: '🔵' },
      { level: 'DEBUG', color: 'text-purple-500', icon: '🟣' },
      { level: 'TRACE', color: 'text-green-500', icon: '🟢' },
    ];

    it.each(logLevelTestCases)('should return correct color and icon for $level', ({ level, color, icon }) => {
      expect(getLogLevelColor(level)).toBe(color);
      expect(getLogLevelIcon(level)).toBe(icon);
    });

    it('should return defaults for unknown log levels', () => {
      expect(getLogLevelColor('UNKNOWN')).toBe('text-muted-foreground');
      expect(getLogLevelIcon('UNKNOWN')).toBe('⚪');
    });
  });

  // ============================================================================
  // COMPONENT VERSION HELPERS
  // ============================================================================

  describe('getDeployedVersion', () => {
    const mockComponentVersions = {
      'comp-1': [
        { landscape: 'dev', buildProperties: { version: '1.0.0' } },
        { landscape: 'prod', buildProperties: { version: '1.1.0' } }
      ],
      'comp-2': [
        { landscape: 'dev', buildProperties: {} }
      ]
    };

    it('should return correct version for valid inputs', () => {
      expect(getDeployedVersion('comp-1', 'dev', mockComponentVersions)).toBe('1.0.0');
      expect(getDeployedVersion('comp-1', 'prod', mockComponentVersions)).toBe('1.1.0');
    });

    it('should return null for invalid inputs', () => {
      expect(getDeployedVersion(null, 'dev', mockComponentVersions)).toBeNull();
      expect(getDeployedVersion('comp-1', null, mockComponentVersions)).toBeNull();
      expect(getDeployedVersion('non-existent', 'dev', mockComponentVersions)).toBeNull();
      expect(getDeployedVersion('comp-1', 'staging', mockComponentVersions)).toBeNull();
      expect(getDeployedVersion('comp-2', 'dev', mockComponentVersions)).toBeNull();
    });
  });

  // ============================================================================
  // COMPLEX HELPERS
  // ============================================================================

  describe('Complex Helpers', () => {
    it('should handle getGroupStatus correctly', () => {
      const mockLandscapeGroups = {
        Development: [{ id: 'dev-1' }, { id: 'dev-2' }],
        Production: [{ id: 'prod-1' }, { id: 'prod-2' }, { id: 'prod-3' }]
      };

      // Test none status
      const noneToggle = { landscapes: { 'dev-1': false, 'dev-2': false } } as any;
      const noneResult = getGroupStatus(noneToggle, 'Development', mockLandscapeGroups);
      expect(noneResult.status).toBe('none');
      expect(noneResult.color).toBe('bg-muted');

      // Test all status
      const allToggle = { landscapes: { 'dev-1': true, 'dev-2': true } } as any;
      const allResult = getGroupStatus(allToggle, 'Development', mockLandscapeGroups);
      expect(allResult.status).toBe('all');
      expect(allResult.color).toBe('bg-success');

      // Test partial status
      const partialToggle = { landscapes: { 'prod-1': true, 'prod-2': false, 'prod-3': true } } as any;
      const partialResult = getGroupStatus(partialToggle, 'Production', mockLandscapeGroups);
      expect(partialResult.status).toBe('partial');
      expect(partialResult.color).toBe('bg-warning');
    });

    it('should handle getAvailableComponents correctly', () => {
      const mockFeatureToggles = [
        { component: 'account-context-service', id: 'toggle-1' },
        { component: 'accounts-service', id: 'toggle-2' },
        { component: 'cloud-automation-service', id: 'toggle-3' },
        { component: 'non-existent-component', id: 'toggle-4' }
      ] as any[];

      // Test valid project
      const result = getAvailableComponents('CIS@2.0', mockFeatureToggles);
      expect(result).toEqual(['account-context-service', 'accounts-service']);

      // Test edge cases
      expect(getAvailableComponents('unknown-project', mockFeatureToggles)).toEqual([]);
      expect(getAvailableComponents('CIS@2.0', [])).toEqual([]);
    });

    it('should handle sortLandscapeGroups correctly', () => {
      // Test "Frequently Visited" priority
      const groups1 = {
        'Production': [{ id: 'prod-1' }],
        'Frequently Visited': [{ id: 'fav-1' }],
        'Development': [{ id: 'dev-1' }]
      } as any;
      expect(sortLandscapeGroups(groups1)[0][0]).toBe('Frequently Visited');

      // Test predefined order
      const groups2 = {
        'Live': [{ id: 'live-1' }],
        'Staging': [{ id: 'staging-1' }],
        'Integrate': [{ id: 'integrate-1' }]
      } as any;
      const result2 = sortLandscapeGroups(groups2);
      const groupNames = result2.map(([name]) => name);
      expect(groupNames.indexOf('Staging')).toBeLessThan(groupNames.indexOf('Integrate'));
      expect(groupNames.indexOf('Integrate')).toBeLessThan(groupNames.indexOf('Live'));

      // Test alphabetical sorting for unknown groups
      const groups3 = {
        'ZZZ Unknown': [{ id: 'z-1' }],
        'AAA Unknown': [{ id: 'a-1' }],
        'Staging': [{ id: 'staging-1' }]
      } as any;
      const result3 = sortLandscapeGroups(groups3);
      const groupNames3 = result3.map(([name]) => name);
      expect(groupNames3[0]).toBe('Staging');
      expect(groupNames3[1]).toBe('AAA Unknown');
      expect(groupNames3[2]).toBe('ZZZ Unknown');

      // Test empty object
      expect(sortLandscapeGroups({})).toEqual([]);
    });
  });
});
