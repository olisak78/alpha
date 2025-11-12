import { useState } from 'react';
import { useComponentsByTeam } from '@/hooks/api/useComponents';

interface UseTeamComponentsProps {
  teamId?: string;
  organizationId?: string;
}

export function useTeamComponents({ 
  teamId, 
  organizationId
}: UseTeamComponentsProps) {
  const [teamComponentsExpanded, setTeamComponentsExpanded] = useState<Record<string, boolean>>({});

  // Fetch components by team using the API
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


  const toggleComponentExpansion = (componentId: string) => {
    setTeamComponentsExpanded(prev => ({
      ...prev,
      [componentId]: !(prev[componentId] ?? true)
    }));
  };

  return {
    teamComponentsExpanded,
    toggleComponentExpansion,
    componentsData: componentsByTeam,
    isLoading,
    error
  };
}
