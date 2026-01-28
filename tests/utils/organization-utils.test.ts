import { describe, it, expect } from 'vitest';
import { isUserInSapCfsOrganization, getAllowedSidebarItemsForNonSapCfs } from '@/utils/organization-utils';
import { User } from '@/types/developer-portal';

describe('organization-utils', () => {
  describe('isUserInSapCfsOrganization', () => {
    it('should return true for users in sap-cfs organization', () => {
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@sap.com',
        provider: 'githubtools',
        organization: 'sap-cfs'
      };

      expect(isUserInSapCfsOrganization(user)).toBe(true);
    });

    it('should return true for users in SAP-CFS organization (case insensitive)', () => {
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@sap.com',
        provider: 'githubtools',
        organization: 'SAP-CFS'
      };

      expect(isUserInSapCfsOrganization(user)).toBe(true);
    });

    it('should return false for users in other organizations', () => {
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        provider: 'githubtools',
        organization: 'other-org'
      };

      expect(isUserInSapCfsOrganization(user)).toBe(false);
    });

    it('should return false for users with no organization', () => {
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        provider: 'githubtools'
      };

      expect(isUserInSapCfsOrganization(user)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isUserInSapCfsOrganization(null)).toBe(false);
    });

    it('should return false for user with empty organization', () => {
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        provider: 'githubtools',
        organization: ''
      };

      expect(isUserInSapCfsOrganization(user)).toBe(false);
    });
  });

  describe('getAllowedSidebarItemsForNonSapCfs', () => {
    it('should return only Home and AI Arena for non-sap-cfs users', () => {
      const allowedItems = getAllowedSidebarItemsForNonSapCfs();
      expect(allowedItems).toEqual(['Home', 'AI Arena']);
    });
  });
});
