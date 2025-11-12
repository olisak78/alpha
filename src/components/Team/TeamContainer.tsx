import React, { useCallback } from 'react';
import { TeamProvider } from "@/contexts/TeamContext";
import Team from "./Team";
import type { Team as ApiTeam } from "@/types/api";
import type { Member } from "@/hooks/useOnDutyData";

/**
 * TeamContainer - Simplified Smart Container Component
 * 
 * This simplified version uses React Context to eliminate prop drilling.
 * It wraps the Team component with a TeamProvider that manages all team-related state.
 */

interface TeamContainerProps {
  teamName: string;
  selectedTeamId: string | null;
  currentTeam: ApiTeam | null;
  teamNames: string[];
  activeCommonTab: string;
  onMembersChange: (team: string, list: Member[]) => void;
  onMoveMember: (member: Member, fromTeam: string, toTeam: string) => void;
  onOpenComponent: (project: string, componentId: string) => void;
  getTeamIdFromName: (teamName: string) => string | undefined;
}

export default function TeamContainer({
  teamName,
  selectedTeamId,
  currentTeam,
  teamNames,
  activeCommonTab,
  onMembersChange,
  onMoveMember,
  onOpenComponent,
  getTeamIdFromName,
}: TeamContainerProps) {
  // Memoized handlers to prevent recreation on every render
  // These must be defined before any early returns to follow Rules of Hooks
  const handleMembersChange = useCallback((members: Member[]) => {
    onMembersChange(teamName, members);
  }, [onMembersChange, teamName]);

  const handleMoveMember = useCallback((member: Member, targetTeam: string) => {
    onMoveMember(member, teamName, targetTeam);
  }, [onMoveMember, teamName]);

  // Early return if no team is selected
  if (!selectedTeamId) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p>No team selected</p>
        </div>
      </div>
    );
  }

  return (
    <TeamProvider
      teamId={selectedTeamId}
      teamName={teamName}
      currentTeam={currentTeam}
      teamOptions={teamNames}
      onMembersChange={handleMembersChange}
      onMoveMember={handleMoveMember}
      teamNameToIdMap={getTeamIdFromName}
      onOpenComponent={onOpenComponent}
    >
      <Team
        activeCommonTab={activeCommonTab}
      />
    </TeamProvider>
  );
}
