import { Component } from '@/types/api';
import { useComponentDisplay } from '@/contexts/ComponentDisplayContext';

/**
 * Hook to get component owner information (team names, colors, etc.)
 * Centralizes the logic for resolving owner_ids to team details
 */
export function useComponentOwner(component: Component) {
  const { teamNamesMap, teamColorsMap } = useComponentDisplay();
  
  // Handle multiple owners
  const owner_ids = component.owner_ids || [];
  
  // Get team information for all owners
  const teamNames = owner_ids.map(id => teamNamesMap[id]).filter(Boolean);
  const teamColors = owner_ids.map(id => teamColorsMap[id]).filter(Boolean);
  
  // Combined display name for multiple owners
  const displayName = teamNames.length > 0 ? teamNames.join(', ') : 'Unassigned';
  
  // Sort key based on first team name (for consistent sorting only)
  const sortKey = teamNames[0]?.toLowerCase() || '';
  
  return {
    // Multiple owners properties
    teamNames,
    teamColors,
    owner_ids,
    
    // Display properties
    displayName,
    sortKey,
  };
}
