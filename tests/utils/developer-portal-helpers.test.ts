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
  getDeployedVersion
} from '../../src/utils/developer-portal-helpers';

describe('developer-portal-helpers', () => {
  // ============================================================================
  // PATH AND ROUTING HELPERS
  // ============================================================================

  describe('getBasePath', () => {
    const mockProjects = ['cis', 'cloud-automation', 'unified-services'];

    it('should return null for empty path', () => {
      expect(getBasePath(mockProjects, '')).toBeNull();
      expect(getBasePath(mockProjects, '/')).toBeNull();
    });

    it('should return base path for CIS routes', () => {
      expect(getBasePath(mockProjects, '/cis')).toBe('/cis');
      expect(getBasePath(mockProjects, '/cis/service')).toBe('/cis');
      expect(getBasePath(mockProjects, '/cis/service/details')).toBe('/cis');
    });

    it('should return base path for cloud-automation routes', () => {
      expect(getBasePath(mockProjects, '/cloud-automation')).toBe('/cloud-automation');
      expect(getBasePath(mockProjects, '/cloud-automation/workflow')).toBe('/cloud-automation');
    });

    it('should return base path for unified-services routes', () => {
      expect(getBasePath(mockProjects, '/unified-services')).toBe('/unified-services');
      expect(getBasePath(mockProjects, '/unified-services/api')).toBe('/unified-services');
    });

    it('should return base path for teams routes', () => {
      expect(getBasePath(mockProjects, '/teams')).toBe('/teams');
      expect(getBasePath(mockProjects, '/teams/backend-team')).toBe('/teams');
    });

    it('should return null for unknown routes', () => {
      expect(getBasePath(mockProjects, '/unknown')).toBeNull();
      expect(getBasePath(mockProjects, '/settings')).toBeNull();
    });
  });

  describe('shouldNavigateToTab', () => {
    beforeEach(() => {
      // Mock window.location using Object.defineProperty
      delete (window as any).location;
      (window as any).location = { pathname: '/' };
    });

    afterEach(() => {
      // Clean up by resetting to a default state
      delete (window as any).location;
      (window as any).location = { pathname: '/' };
    });

    it('should return true when on base path', () => {
      (window as any).location = { pathname: '/cis' };
      expect(shouldNavigateToTab('/cis')).toBe(true);
    });

    it('should return true when on tab path', () => {
      (window as any).location = { pathname: '/cis/services' };
      expect(shouldNavigateToTab('/cis')).toBe(true);
    });

    it('should return false when on different path', () => {
      (window as any).location = { pathname: '/teams' };
      expect(shouldNavigateToTab('/cis')).toBe(false);
    });

    it('should handle paths with trailing slashes', () => {
      (window as any).location = { pathname: '/cis/' };
      expect(shouldNavigateToTab('/cis')).toBe(true);
    });
  });


  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@company.co.uk')).toBe(true);
      expect(isValidEmail('developer+tag@domain.io')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
    });

    it('should trim whitespace before validation', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
    });

    it('should reject emails without @ symbol', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should reject emails without domain', () => {
      expect(isValidEmail('user@.com')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://sub.domain.com/path?query=value')).toBe(true);
    });

    it('should return true for empty URLs', () => {
      expect(isValidUrl('')).toBe(true);
      expect(isValidUrl('   ')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      // Note: ftp:// is actually a valid URL protocol
      expect(isValidUrl('//example.com')).toBe(false);
      expect(isValidUrl('just text')).toBe(false);
    });

    it('should trim whitespace before validation', () => {
      expect(isValidUrl('  https://example.com  ')).toBe(true);
    });

    it('should handle URLs with ports', () => {
      expect(isValidUrl('http://localhost:8080')).toBe(true);
    });

    it('should handle URLs with paths and queries', () => {
      expect(isValidUrl('https://example.com/path/to/resource?key=value&foo=bar')).toBe(true);
    });
  });

  // ============================================================================
  // LOCALSTORAGE HELPERS
  // ============================================================================

  describe('safeLocalStorageGet', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should retrieve and parse stored JSON data', () => {
      localStorage.setItem('test-key', JSON.stringify({ value: 'data' }));
      expect(safeLocalStorageGet('test-key')).toEqual({ value: 'data' });
    });

    it('should return fallback for non-existent key', () => {
      expect(safeLocalStorageGet('non-existent', 'fallback')).toBe('fallback');
    });

    it('should return default null fallback if not specified', () => {
      expect(safeLocalStorageGet('non-existent')).toBeNull();
    });

    it('should return fallback on parse error', () => {
      localStorage.setItem('invalid-json', 'not valid json');
      expect(safeLocalStorageGet('invalid-json', 'fallback')).toBe('fallback');
    });

    it('should handle stored arrays', () => {
      localStorage.setItem('array-key', JSON.stringify([1, 2, 3]));
      expect(safeLocalStorageGet('array-key')).toEqual([1, 2, 3]);
    });

    it('should handle stored primitives', () => {
      localStorage.setItem('string-key', JSON.stringify('string value'));
      expect(safeLocalStorageGet('string-key')).toBe('string value');
      
      localStorage.setItem('number-key', JSON.stringify(42));
      expect(safeLocalStorageGet('number-key')).toBe(42);
      
      localStorage.setItem('boolean-key', JSON.stringify(true));
      expect(safeLocalStorageGet('boolean-key')).toBe(true);
    });
  });

  describe('safeLocalStorageSet', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should store data as JSON string', () => {
      safeLocalStorageSet('test-key', { value: 'data' });
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify({ value: 'data' }));
    });

    it('should remove item when value is null', () => {
      localStorage.setItem('test-key', 'value');
      safeLocalStorageSet('test-key', null);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should remove item when value is undefined', () => {
      localStorage.setItem('test-key', 'value');
      safeLocalStorageSet('test-key', undefined);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should handle storing arrays', () => {
      safeLocalStorageSet('array-key', [1, 2, 3]);
      expect(localStorage.getItem('array-key')).toBe(JSON.stringify([1, 2, 3]));
    });

    it('should handle storing primitives', () => {
      safeLocalStorageSet('string-key', 'value');
      safeLocalStorageSet('number-key', 42);
      safeLocalStorageSet('boolean-key', false);
      
      expect(localStorage.getItem('string-key')).toBe(JSON.stringify('value'));
      expect(localStorage.getItem('number-key')).toBe(JSON.stringify(42));
      expect(localStorage.getItem('boolean-key')).toBe(JSON.stringify(false));
    });

    it('should not throw when localStorage is unavailable', () => {
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

  describe('generateStableLinkId', () => {
    it('should generate consistent IDs for same inputs', () => {
      const id1 = generateStableLinkId('slack', 'https://slack.com', 'Slack Channel');
      const id2 = generateStableLinkId('slack', 'https://slack.com', 'Slack Channel');
      expect(id1).toBe(id2);
    });

    it('should include key in the generated ID', () => {
      const id = generateStableLinkId('github', 'https://github.com', 'Repository');
      expect(id).toContain('github');
    });

    it('should truncate to 16 characters after key and hyphen', () => {
      const id = generateStableLinkId('key', 'url', 'title');
      const parts = id.split('-');
      expect(parts[0]).toBe('key');
      expect(parts[1].length).toBeLessThanOrEqual(16);
    });

    it('should remove non-alphanumeric characters', () => {
      const id = generateStableLinkId('key', 'url', 'title');
      expect(id).toMatch(/^[a-zA-Z0-9-]+$/);
    });
  });

  describe('buildUserFromMe', () => {
    it('should build user object from complete /users/me payload', () => {
      const me = {
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        team_role: 'developer',
        portal_admin: true,
      };

      const user = buildUserFromMe(me as any);

      expect(user).toEqual({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        provider: 'githubtools',
        team_role: 'developer',
        portal_admin: true,
      });
    });

    it('should fall back to email for name when missing first/last name', () => {
      const me = {
        id: 'abc',
        email: 'no.name@example.com',
      };

      const user = buildUserFromMe(me as any);

      expect(user.name).toBe('no.name@example.com');
    });

    it('should use uuid when id is missing', () => {
      const me = {
        uuid: 'uuid-456',
        email: 'uuid@example.com',
      };

      const user = buildUserFromMe(me as any);

      expect(user.id).toBe('uuid-456');
    });
  });

  describe('CATEGORY_COLOR_SAFELIST', () => {
    it('should contain all expected category colors for Tailwind CSS safelist', () => {
      // Read the source file to verify the safelist exists and contains expected colors
      const fs = require('fs');
      const path = require('path');
      const helpersPath = path.join(__dirname, '../../src/utils/developer-portal-helpers.ts');
      const helpersContent = fs.readFileSync(helpersPath, 'utf8');
      
      // Verify the safelist constant exists
      expect(helpersContent).toContain('CATEGORY_COLOR_SAFELIST');
      
      // Verify it contains all expected colors including bg-pink-500
      const expectedColors = [
        'bg-blue-500',
        'bg-red-500', 
        'bg-green-500',
        'bg-purple-500',
        'bg-amber-500',
        'bg-indigo-500',
        'bg-cyan-500',
        'bg-emerald-500',
        'bg-orange-500',
        'bg-pink-500'
      ];
      
      expectedColors.forEach(color => {
        expect(helpersContent).toContain(`'${color}'`);
      });
    });
  });

  // ============================================================================
  // STATUS AND COLOR HELPERS
  // ============================================================================

  describe('getStatusColor', () => {
    it('should return success colors for positive statuses', () => {
      expect(getStatusColor('healthy')).toBe('bg-success text-white');
      expect(getStatusColor('active')).toBe('bg-success text-white');
      expect(getStatusColor('deployed')).toBe('bg-success text-white');
    });

    it('should return warning colors for warning statuses', () => {
      expect(getStatusColor('warning')).toBe('bg-warning text-white');
      expect(getStatusColor('deploying')).toBe('bg-warning text-white');
    });

    it('should return destructive colors for error statuses', () => {
      expect(getStatusColor('error')).toBe('bg-destructive text-white');
      expect(getStatusColor('inactive')).toBe('bg-destructive text-white');
      expect(getStatusColor('failed')).toBe('bg-destructive text-white');
    });

    it('should return default muted color for unknown statuses', () => {
      expect(getStatusColor('unknown')).toBe('bg-muted text-muted-foreground');
      expect(getStatusColor('pending')).toBe('bg-muted text-muted-foreground');
    });
  });

  describe('getLogLevelColor', () => {
    it('should return correct color for each log level', () => {
      expect(getLogLevelColor('ERROR')).toBe('text-destructive');
      expect(getLogLevelColor('WARN')).toBe('text-yellow-500');
      expect(getLogLevelColor('INFO')).toBe('text-blue-500');
      expect(getLogLevelColor('DEBUG')).toBe('text-purple-500');
      expect(getLogLevelColor('TRACE')).toBe('text-green-500');
    });

    it('should return muted color for unknown log levels', () => {
      expect(getLogLevelColor('UNKNOWN')).toBe('text-muted-foreground');
      expect(getLogLevelColor('CUSTOM')).toBe('text-muted-foreground');
    });
  });

  describe('getLogLevelIcon', () => {
    it('should return correct icon for each log level', () => {
      expect(getLogLevelIcon('ERROR')).toBe('🔴');
      expect(getLogLevelIcon('WARN')).toBe('🟡');
      expect(getLogLevelIcon('INFO')).toBe('🔵');
      expect(getLogLevelIcon('DEBUG')).toBe('🟣');
      expect(getLogLevelIcon('TRACE')).toBe('🟢');
    });

    it('should return white circle for unknown log levels', () => {
      expect(getLogLevelIcon('UNKNOWN')).toBe('⚪');
      expect(getLogLevelIcon('CUSTOM')).toBe('⚪');
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

    it('should return version for valid component and landscape', () => {
      expect(getDeployedVersion('comp-1', 'dev', mockComponentVersions)).toBe('1.0.0');
      expect(getDeployedVersion('comp-1', 'prod', mockComponentVersions)).toBe('1.1.0');
    });

    it('should return null when component ID is null', () => {
      expect(getDeployedVersion(null, 'dev', mockComponentVersions)).toBeNull();
    });

    it('should return null when landscape is null', () => {
      expect(getDeployedVersion('comp-1', null, mockComponentVersions)).toBeNull();
    });

    it('should return null for non-existent component', () => {
      expect(getDeployedVersion('non-existent', 'dev', mockComponentVersions)).toBeNull();
    });

    it('should return null when no matching landscape found', () => {
      expect(getDeployedVersion('comp-1', 'staging', mockComponentVersions)).toBeNull();
    });

    it('should return null when version is missing in buildProperties', () => {
      expect(getDeployedVersion('comp-2', 'dev', mockComponentVersions)).toBeNull();
    });
  });

  // ============================================================================
  // GROUP STATUS HELPERS
  // ============================================================================

  describe('getGroupStatus', () => {
    const mockLandscapeGroups = {
      Development: [
        { id: 'dev-1' },
        { id: 'dev-2' }
      ],
      Production: [
        { id: 'prod-1' },
        { id: 'prod-2' },
        { id: 'prod-3' }
      ]
    };

    it('should return "none" status when no landscapes are enabled', () => {
      const toggle = {
        id: 'test-toggle',
        landscapes: {
          'dev-1': false,
          'dev-2': false
        }
      } as any;

      const result = getGroupStatus(toggle, 'Development', mockLandscapeGroups);
      expect(result.status).toBe('none');
      expect(result.color).toBe('bg-muted');
    });

    it('should return "all" status when all landscapes are enabled', () => {
      const toggle = {
        id: 'test-toggle',
        landscapes: {
          'dev-1': true,
          'dev-2': true
        }
      } as any;

      const result = getGroupStatus(toggle, 'Development', mockLandscapeGroups);
      expect(result.status).toBe('all');
      expect(result.color).toBe('bg-success');
    });

    it('should return "partial" status when some landscapes are enabled', () => {
      const toggle = {
        id: 'test-toggle',
        landscapes: {
          'prod-1': true,
          'prod-2': false,
          'prod-3': true
        }
      } as any;

      const result = getGroupStatus(toggle, 'Production', mockLandscapeGroups);
      expect(result.status).toBe('partial');
      expect(result.color).toBe('bg-warning');
    });
  });
});
