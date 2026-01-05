import { useComponentsByTeam } from '@/hooks/api/useComponents';

//   Import expansion state from teamStore
import { useTeamComponentsExpanded, useComponentExpansionActions } from '@/stores/teamStore';

interface UseTeamComponentsProps {
  teamId?: string;
  organizationId?: string;
}

export function useTeamComponents({ 
  teamId, 
  organizationId
}: UseTeamComponentsProps) {
  //   Expansion state from Zustand
  const teamComponentsExpanded = useTeamComponentsExpanded();
  const { toggleComponentExpansion } = useComponentExpansionActions();

  //   Fetch components by team using the API (React Query)
  const {
    data: componentsByTeam,
    isLoading,
    error,
    isError
  } = useComponentsByTeam(
    teamId || '',
    organizationId || '',
    {
      enabled: !!teamId && !!organizationId
    }
  );

  //   Return interface  
  return {
    teamComponentsExpanded,      // From Zustand (via hook)
    toggleComponentExpansion,    // From Zustand (via hook)
    componentsData: componentsByTeam,
    isLoading,
    error
  };
}