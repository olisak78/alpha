import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTeamContext } from "@/contexts/TeamContext";
import { useProjects } from "@/stores/projectsStore";
import { TeamMemberDialog } from "@/components/dialogs/TeamMemberDialog";
import { AddLinkDialog } from "@/components/dialogs/AddLinkDialog";
import { ScoreBoards } from "./ScoreBoards";
import { MemberList } from "./MemberList";
import QuickLinksTab from "@/components/tabs/MePageTabs/QuickLinksTab";
import { TeamJiraIssues } from "./TeamJiraIssues";
import { ComponentsList } from "@/components/ComponentsList";
import { OnDutyAndCall } from "./OnDutyAndCall";
import { TeamDocs } from "./TeamDocs";
import { useCurrentUser } from "@/hooks/api/useMembers";
import { useUpdateTeamMetadata } from "@/hooks/api/mutations/useTeamMutations";
import { useTeams } from "@/hooks/api/useTeams";
import { useToast } from "@/hooks/use-toast";
import type { CreateUserRequest, UserMeResponse } from "@/types/api";
import { Card } from "@/components/ui/card";
import { ComponentDisplayProvider } from "@/contexts/ComponentDisplayContext";

interface TeamProps {
  activeCommonTab: string;
}

export default function Team({
  activeCommonTab,
}: TeamProps) {
  const navigate = useNavigate();
  const projects = useProjects();
  const { data: currentUser } = useCurrentUser();
  const { data: allTeamsData } = useTeams();
  const { toast } = useToast();

  const {
    // Team data
    teamId,
    teamName,
    currentTeam,
    teamOptions,
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
    teamLinks,
    teamComponents,
    scheduleData,
    scoreboardData,
    isAdmin,
  } = useTeamContext();

  const updateTeamMetadataMutation = useUpdateTeamMetadata({
    onSuccess: () => {
      toast({
        title: "Team color updated",
        description: "The team color has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update team color",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleColorChange = (color: string) => {
    if (!currentTeam) return;

    // Parse metadata if it's a string
    let metadata = currentTeam.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }

    // Update the color in metadata
    const updatedMetadata = {
      ...metadata,
      color,
    };

    updateTeamMetadataMutation.mutate({
      id: currentTeam.id,
      metadata: updatedMetadata,
    });
  };

  // Get current color from team metadata
  let currentColor = "#6b7280"; // default gray
  if (currentTeam?.metadata) {
    let metadata = currentTeam.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        // ignore
      }
    }
    if (metadata?.color) {
      currentColor = metadata.color;
    }
  }

  // Get colors used by other teams (excluding current team)
  const usedColors = useMemo(() => {
    if (!allTeamsData?.teams || !currentTeam) return [];

    return allTeamsData.teams
      .filter(team => team.id !== currentTeam.id) // Exclude current team
      .map(team => {
        let metadata = team.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            return null;
          }
        }
        return metadata?.color?.toLowerCase();
      })
      .filter((color): color is string => color != null);
  }, [allTeamsData, currentTeam]);

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

  const handleComponentClick = (componentName: string) => {
    // Navigate to component view page - find the correct project name
    const component = teamComponents.componentsData?.components.find(c => c.name === componentName);
    
    if (!component) {
      return;
    }

    // Look up the project by project_id to get the correct project.name
    const project = projects.find(p => p.id === component.project_id);
    
    if (!project) {
      toast({
        title: "Navigation failed",
        description: "Project not found for this component.",
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/${project.name}/component/${componentName}`);
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
              showActions={isAdmin}
              colorPickerProps={{
                currentColor,
                onColorChange: handleColorChange,
                disabled: updateTeamMetadataMutation.isPending,
                usedColors,
              }}
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
              <Card className="border-slate-200 dark:border-slate-700">
                <QuickLinksTab
                  userData={{ link: mappedTeamLinks } as UserMeResponse}
                  ownerId={teamId || currentTeam?.id}
                  onDeleteLink={handleDeleteLink}
                  onToggleFavorite={teamLinks.toggleFavorite}
                  emptyMessage="No links added yet. Click 'Add Link' to get started."
                  title="Team Links"
                  alwaysShowDelete={true}
                />
              </Card>
            </div>
          </>
        )}

        {activeCommonTab === "components" && (
          <ComponentDisplayProvider
            selectedLandscape={null}
            selectedLandscapeData={null}
            isCentralLandscape={false}
            noCentralLandscapes={true}
            teamNamesMap={{}}
            teamColorsMap={{}}
            componentHealthMap={{}}
            isLoadingHealth={false}
            expandedComponents={teamComponents.teamComponentsExpanded}
            onToggleExpanded={teamComponents.toggleComponentExpansion}
            system="services"
            components={teamComponents.componentsData?.components || []}
          >
            <ComponentsList
              components={teamComponents.componentsData?.components || []}
              showProjectGrouping={true}
              compactView={true}
              onComponentClick={handleComponentClick}
            />
          </ComponentDisplayProvider>
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