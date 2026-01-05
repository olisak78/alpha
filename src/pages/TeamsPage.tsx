import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import TeamContainer from "@/components/Team/TeamContainer";
import { useTeamsPage } from "@/hooks/useTeamsPage";

export default function TeamsPage() {
  const {
    // State
    selectedTab,
    activeCommonTab,
    selectedTeamId,
    currentTeam,
    teamNames,

    // Data fetching
    teamsLoading,
    teamsError,
    refetchTeams,

    // Handlers
    handleMembersChange,
    handleMoveMember,
    onOpenComponent,
    getTeamIdFromName,
  } = useTeamsPage();

  if (teamsLoading) {
    return (
      <BreadcrumbPage>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading teams...</p>
          </div>
        </div>
      </BreadcrumbPage>
    );
  }

  if (teamsError) {
    return (
      <BreadcrumbPage>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <p className="text-destructive">Error loading teams: {teamsError.message}</p>
          <button
            onClick={() => refetchTeams()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </BreadcrumbPage>
    );
  }

  if (!teamNames.length) {
    return (
      <BreadcrumbPage>
        <div className="flex items-center justify-center py-8">
          <p>No teams found</p>
        </div>
      </BreadcrumbPage>
    );
  }

  if (!selectedTab) {
    return (
      <BreadcrumbPage>
        <div className="flex items-center justify-center py-8">
          <p>Loading team...</p>
        </div>
      </BreadcrumbPage>
    );
  }

  return (
    <BreadcrumbPage>
      {/* 
        TeamContainer - Simplified Smart Container Component
        This simplified version uses React Context to eliminate prop drilling.
      */}
      <TeamContainer
        teamName={selectedTab}
        selectedTeamId={selectedTeamId}
        currentTeam={currentTeam}
        teamNames={teamNames}
        activeCommonTab={activeCommonTab}
        onMembersChange={handleMembersChange}
        onMoveMember={handleMoveMember}
        onOpenComponent={onOpenComponent}
        getTeamIdFromName={getTeamIdFromName}
      />
    </BreadcrumbPage>
  );
}
