import { User } from '@/types/developer-portal';

/**
 * Check if the current user is in the sap-cfs organization
 * @param user - The current user object
 * @returns boolean - true if user is in sap-cfs organization, false otherwise
 */
export const isUserInSapCfsOrganization = (user: User | null): boolean => {
  if (!user || !user.organization) {
    return false;
  }
  
  return user.organization.toLowerCase() === 'sap-cfs';
};

/**
 * Get the allowed sidebar items for non-sap-cfs users
 * @returns string[] - Array of allowed sidebar items
 */
export const getAllowedSidebarItemsForNonSapCfs = (): string[] => {
  return ['Home', 'AI Arena'];
};
