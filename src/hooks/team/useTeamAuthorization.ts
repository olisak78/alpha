import { useAuthWithRole } from '@/hooks/useAuthWithRole';

export function useTeamAuthorization() {
  // Get user from auth context and check if they are a manager
  const { user } = useAuthWithRole();
  const isManager = user?.team_role?.toLowerCase() === 'manager';
  const isPortalDeveloperAdmin = user?.portal_admin;
  const isAdmin = isManager || isPortalDeveloperAdmin;

  return {
    user,
    isManager,
    isPortalDeveloperAdmin,
    isAdmin
  };
}
