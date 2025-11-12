import { useMemo } from "react";
import { useTeamContext } from "@/contexts/TeamContext";
import { TeamMemberDialog } from "@/components/dialogs/TeamMemberDialog";
import { AddLinkDialog } from "@/components/dialogs/AddLinkDialog";
import { ScoreBoards } from "./ScoreBoards";
import { MemberList } from "./MemberList";
import QuickLinksTab from "@/components/tabs/MePageTabs/QuickLinksTab";
import { TeamJiraIssues } from "./TeamJiraIssues";
import { TeamComponents } from "./TeamComponents";
import { OnDutyAndCall } from "./OnDutyAndCall";
import { TeamDocs } from "./TeamDocs";
import { useCurrentUser } from "@/hooks/api/useMembers";
import type { CreateUserRequest, UserMeResponse } from "@/types/api";

interface TeamProps {
  activeCommonTab: string;
}

export default function Team({
  activeCommonTab,
}: TeamProps) {
  const { data: currentUser } = useCurrentUser();

  const {
    // Team data
    teamId,
    teamName,
    currentTeam,
    teamOptions,

    // Members management
    members,
    memberDialogOpen,
    setMemberDialogOpen,
    editingMember,
    memberForm,
    setMemberForm,
    deleteMember,
    moveMember,
    openAddMember,
    createMember,

    // Team links
    teamLinks,

    // Components
    teamComponents,

    // Schedule data
    scheduleData,

    // Scoreboard data
    scoreboardData,

    // Authorization
    isAdmin,
  } = useTeamContext();

  // Memoize the mapped team links to avoid re-computation on every render
  const mappedTeamLinks = useMemo(() => {
    return teamLinks.links.map(link => ({
      id: link.id,
      title: link.name,
      name: link.name,
      url: link.url,
      category_id: link.category_id,
      description: link.description || "",
      tags: Array.isArray(link.tags) ? link.tags : (link.tags ? link.tags.split(',') : []),
      favorite: currentUser?.link?.some(userLink => userLink.id === link.id && userLink.favorite === true) || false,
    }));
  }, [teamLinks.links, currentUser?.link]);

  // Memoize the memberById map to avoid re-computation on every render
  const memberById = useMemo(() => {
    return members.reduce((acc, member) => ({ ...acc, [member.id]: member }), {});
  }, [members]);

  const handleCreateMember = (payload: CreateUserRequest) => {
    createMember(payload);
  };

  const handleTeamLinkAdded = (teamId: string, updatedLinks: import("@/types/api").TeamLink[]) => {
    // Convert API TeamLink format to local TeamLink format
    const localLinks = updatedLinks.map(link => ({
      id: link.id,
      name: link.name,
      title: link.name, // Add title property for QuickLinksTab compatibility
      url: link.url,
      category_id: link.category_id,
      description: link.description || "",
      owner: teamId,
      // Convert tags to string to match local TeamLink type
      tags: Array.isArray(link.tags) ? link.tags.join(',') : (link.tags || ""),
      favorite: currentUser?.link?.some(userLink => userLink.id === link.id) || false,
    }));
    
    // Update the team links hook with the new links from the server
    teamLinks.setLinks(localLinks);
  };

  // optimistic update
  const handleDeleteLink = (linkId: string) => {
    const linkToDelete = teamLinks.links.find(link => link.id === linkId);
    if (linkToDelete) {
      teamLinks.removeLink(linkToDelete);
    }
  };


  return (
    <main className="space-y-6 px-6 pt-4">
      <TeamMemberDialog
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        editingMember={editingMember}
        memberForm={memberForm}
        setMemberForm={setMemberForm}
        onRemove={deleteMember}
        teamName={teamName}
        onCreateMember={handleCreateMember}
      />

      <AddLinkDialog
        open={teamLinks.linkDialogOpen}
        onOpenChange={teamLinks.onLinkDialogOpenChange}
        ownerId={teamId || currentTeam?.id}
        onTeamLinkAdded={handleTeamLinkAdded}
      />

      {/* Tab Content - controlled by header tabs */}
      <div>
        {activeCommonTab === "overview" && (
          <>
            <MemberList
              members={members}
              teamName={teamName}
              teamOptions={teamOptions}
              onRemoveMember={isAdmin ? deleteMember : undefined}
              onMoveMember={isAdmin ? moveMember : undefined}
              onAddMember={isAdmin ? openAddMember : undefined}
              showActions={isAdmin}
            />

            {/* Hidden sections moved to bottom */}
            {false && (
              <div>
                <OnDutyAndCall
                  dayMember={scheduleData.todayAssignments.dayMember}
                  nightMember={scheduleData.todayAssignments.nightMember}
                />
              </div>
            )}

            {false && (
              <div>
                <ScoreBoards
                  jiraTop3={scoreboardData.jiraTop3}
                  gitTop3={scoreboardData.gitTop3}
                  dutyTop3={scoreboardData.dutyTop3}
                  crossTeamRows={scoreboardData.crossTeamRows}
                  scoreWeights={scoreboardData.scoreWeights}
                />
              </div>
            )}

            <div className="mt-4">
              <QuickLinksTab
                userData={{ link: mappedTeamLinks } as UserMeResponse}
                ownerId={teamId || currentTeam?.id}
                onDeleteLink={handleDeleteLink}
                onToggleFavorite={teamLinks.toggleFavorite}
                emptyMessage="No links added yet. Click 'Add Link' to get started."
                title="Team Links"
                alwaysShowDelete={true}
              />
            </div>
          </>
        )}

        {activeCommonTab === "components" && (
          <TeamComponents
            components={teamComponents.componentsData?.components || []}
            teamName={teamName}
            teamComponentsExpanded={teamComponents.teamComponentsExpanded}
            onToggleExpanded={teamComponents.toggleComponentExpansion}
            system="services"
            showProjectGrouping={true}
            compactView={true}
          />
        )}

        {activeCommonTab === "jira" && <TeamJiraIssues />}

        {activeCommonTab === "docs" && (
          teamId ? (
            <TeamDocs teamId={teamId} teamName={teamName} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No team selected
            </div>
          )
        )}
      </div>
    </main>
  );
}
