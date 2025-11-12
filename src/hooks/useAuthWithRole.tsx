import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUser } from '@/hooks/api/useMembers';
import { User } from '@/types/developer-portal';
import { useMemo } from 'react';

export function useAuthWithRole() {
  const authContext = useAuth();
  const { user: baseUser, isLoading: authLoading } = authContext;

  // Fetch current user data from /users/me endpoint to get portal_admin
  const { 
    data: currentUserData, 
    isLoading: currentUserLoading,
    error: currentUserError 
  } = useCurrentUser({ 
    // Cache for 5 minutes to avoid excessive refetching
    staleTime: 5 * 60 * 1000,
  });

  // Combine user and current user data efficiently
  const userWithRole = useMemo<User | null>(() => {
    if (!baseUser) return null;
    
    // If we have current user data, add the role and portal_admin
    if (currentUserData) {
      return {
        ...baseUser,
        ...(currentUserData.team_role ? { team_role: currentUserData.team_role } : {}),
        ...(currentUserData.portal_admin ? { 
          portal_admin: currentUserData.portal_admin
        } : {}),
      };
    }
    
    // Return base user without role if no current user data yet
    return baseUser;
  }, [baseUser, currentUserData]);

  const isLoading = authLoading || currentUserLoading;

  return {
    ...authContext,
    user: userWithRole,
    isLoading,
    memberError: currentUserError,
    memberData: currentUserData, // Expose current user data for backward compatibility
  };
}
