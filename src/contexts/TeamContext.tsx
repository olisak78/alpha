import React, { createContext, useContext, ReactNode } from 'react';
import { useTeamById } from '@/hooks/api/useTeams';
import { useUserManagement } from '@/hooks/team/useUserManagement';
import { useJiraFiltering, type QuickFilterType } from '@/hooks/team/useJiraFiltering';
import { useTeamLinks } from '@/hooks/team/useTeamLinks';
import { useTeamComponents } from '@/hooks/team/useTeamComponents';
import { useTeamAuthorization } from '@/hooks/team/useTeamAuthorization';
import { useScoreboardData } from '@/hooks/team/useScoreboardData';
import { useScheduleData } from '@/hooks/useScheduleData';
import type { Team as ApiTeam, JiraIssue, TeamComponentsListResponse, CreateUserRequest } from '@/types/api';
import type { Member } from '@/hooks/useOnDutyData';
import type { TeamLink } from '@/components/Team/types';
import type { JiraTop3Item, GitTop3Item, DutyTop3Item, CrossTeamRow, ScoreWeights } from '@/types/team';

interface TeamContextValue {
  // Team data
  teamId: string;
  teamName: string;
  currentTeam: ApiTeam | null;
  teamOptions: string[];
  
  // Members management
  members: Member[];
  memberDialogOpen: boolean;
  setMemberDialogOpen: (open: boolean) => void;
  editingMember: Member | null;
  memberForm: Partial<Member>;
  setMemberForm: (form: Partial<Member>) => void;
  openAddMember: () => void;
  openEditMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  moveMember: (member: Member, targetTeam: string) => void;
  createMember: (payload: CreateUserRequest) => void;
  
  // Jira filtering
  jiraFilters: {
    assigneeFilter: string;
    setAssigneeFilter: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    sortBy: string;
    setSortBy: (value: string) => void;
    search: string;
    setSearch: (value: string) => void;
    quickFilter: QuickFilterType;
    setQuickFilter: (value: QuickFilterType) => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    filteredIssues: JiraIssue[];
    isLoading: boolean;
    error: Error | null;
  };
  
  // Team links
  teamLinks: {
    links: TeamLink[];
    linkDialogOpen: boolean;
    onLinkDialogOpenChange: (open: boolean) => void;
    removeLink: (link: TeamLink) => void;
    setLinks: (links: TeamLink[]) => void;
    toggleFavorite: (linkId: string) => void;
  };
  
  // Components
  teamComponents: {
    componentsData: TeamComponentsListResponse | undefined;
    teamComponentsExpanded: Record<string, boolean>;
    toggleComponentExpansion: (componentId: string) => void;
  };
  
  // Schedule data
  scheduleData: {
    todayAssignments: {
      dayMember: Member | null;
      nightMember: Member | null;
    };
  };
  
  // Scoreboard data
  scoreboardData: {
    jiraTop3: JiraTop3Item[];
    gitTop3: GitTop3Item[];
    dutyTop3: DutyTop3Item[];
    crossTeamRows: CrossTeamRow[];
    scoreWeights: ScoreWeights;
  };
  
  // Authorization
  isAdmin: boolean;
  
  // Component navigation
  onOpenComponent?: (project: string, componentId: string) => void;
  
  // Loading states
  isLoading: boolean;
  error: Error | null;
}

export const TeamContext = createContext<TeamContextValue | null>(null);

interface TeamProviderProps {
  children: ReactNode;
  teamId: string;
  teamName: string;
  currentTeam: ApiTeam | null;
  teamOptions: string[];
  onMembersChange?: (members: Member[]) => void;
  onMoveMember?: (member: Member, targetTeam: string) => void;
  teamNameToIdMap?: (teamName: string) => string | undefined;
  onOpenComponent?: (project: string, componentId: string) => void;
}

export function TeamProvider({
  children,
  teamId,
  teamName,
  currentTeam,
  teamOptions,
  onMembersChange,
  onMoveMember,
  teamNameToIdMap,
  onOpenComponent,
}: TeamProviderProps) {
  const year = new Date().getFullYear();
  
  // Fetch team data
  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError
  } = useTeamById(teamId, {
    enabled: !!teamId,
  });

  // Convert team members to the expected format
  const initialMembers = React.useMemo(() => {
    // Always return empty array if no team data or if team is loading
    if (!teamData?.members || teamLoading) return [];
    
    const members = teamData.members.map((teamMember) => ({
      id: teamMember.id,
      fullName: `${teamMember.first_name} ${teamMember.last_name}`.trim() || teamMember.email || "Unknown",
      email: teamMember.email || "",
      role: teamMember.team_role || "Member",
      iuser: (teamMember as any).iuser || "",
      team: teamName,
      uuid: teamMember.uuid, // Preserve the UUID for API operations
      mobile: teamMember.mobile || "", // Include mobile if available
    }));

    // Sort members by role priority: manager first, SCM second, then others
    return members.sort((a, b) => {
      // Define role priority: manager = 1, SCM = 2, others = 3
      const getRolePriority = (role: string | undefined) => {
        if (role === 'manager') return 1;
        if (role === 'scm') return 2;
        return 3;
      };
      
      const priorityA = getRolePriority(a.role);
      const priorityB = getRolePriority(b.role);
      
      // Sort by priority (ascending), then by name for same priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same priority, sort alphabetically by full name
      return a.fullName.localeCompare(b.fullName);
    });
  }, [teamData?.members, teamName, teamLoading]);

  // Initialize hooks with team-specific data
  const userManagement = useUserManagement({
    initialMembers,
    onMembersChange,
    onMoveMember,
    teamNameToIdMap,
  });

  const jiraFiltering = useJiraFiltering({ teamName: currentTeam?.name });

  const teamLinksHook = useTeamLinks({
    teamId,
    initialLinks: teamData?.links ? teamData.links.map(link => ({
      id: link.id,
      category_id: link.category_id || 'general',
      description: link.description || '',
      name: link.name || 'Untitled',
      owner: teamData?.name || '',
      tags: Array.isArray(link.tags) ? link.tags.join(',') : (link.tags || ''),
      url: link.url || '',
      favorite: link.favorite || false,
      isExpanded: false
    })) : [],
    teamOwner: currentTeam?.owner || ""
  });

  const teamComponentsHook = useTeamComponents({
    teamId,
    organizationId: teamData?.organization_id || currentTeam?.organization_id
  });

  const { isAdmin } = useTeamAuthorization();
  
  const scheduleData = useScheduleData(userManagement.members, year);

  const memberById = React.useMemo(
    () => userManagement.members.reduce<Record<string, Member>>(
      (acc, mem) => { acc[mem.id] = mem; return acc; }, {}
    ),
    [userManagement.members]
  );

  const { jiraTop3, gitTop3, dutyTop3, crossTeamRows, SCORE_WEIGHTS } = useScoreboardData({
    jiraIssues: jiraFiltering.filteredIssues || [],
    githubStats: [], // You might want to load this from somewhere
    onDutyData: scheduleData,
    memberById: memberById,
    members: userManagement.members,
    allTeams: [] // You might want to load this from somewhere
  });

  const contextValue: TeamContextValue = {
    // Team data
    teamId,
    teamName,
    currentTeam: teamData ?? currentTeam,
    teamOptions,
    
    // Members management
    members: userManagement.members,
    memberDialogOpen: userManagement.memberDialogOpen,
    setMemberDialogOpen: userManagement.setMemberDialogOpen,
    editingMember: userManagement.editingMember,
    memberForm: userManagement.memberForm,
    setMemberForm: userManagement.setMemberForm,
    openAddMember: userManagement.openAddMember,
    openEditMember: userManagement.openEditMember,
    deleteMember: userManagement.deleteMember,
    moveMember: userManagement.moveMember,
    createMember: userManagement.createMember,
    
    // Jira filtering
    jiraFilters: {
      assigneeFilter: jiraFiltering.assigneeFilter,
      setAssigneeFilter: jiraFiltering.setAssigneeFilter,
      statusFilter: jiraFiltering.statusFilter,
      setStatusFilter: jiraFiltering.setStatusFilter,
      sortBy: jiraFiltering.sortBy,
      setSortBy: jiraFiltering.setSortBy,
      search: jiraFiltering.search,
      setSearch: jiraFiltering.setSearch,
      quickFilter: jiraFiltering.quickFilter,
      setQuickFilter: jiraFiltering.setQuickFilter,
      currentPage: jiraFiltering.currentPage,
      setCurrentPage: jiraFiltering.setCurrentPage,
      totalPages: jiraFiltering.totalPages,
      totalItems: jiraFiltering.totalItems,
      itemsPerPage: jiraFiltering.itemsPerPage,
      filteredIssues: jiraFiltering.filteredIssues,
      isLoading: jiraFiltering.isLoading,
      error: jiraFiltering.error,
    },
    
    // Team links
    teamLinks: {
      links: teamLinksHook.links,
      linkDialogOpen: teamLinksHook.linkDialogOpen,
      onLinkDialogOpenChange: teamLinksHook.onLinkDialogOpenChange,
      removeLink: teamLinksHook.removeLink,
      setLinks: teamLinksHook.setLinks,
      toggleFavorite: teamLinksHook.toggleFavorite,
    },
    
    // Components
    teamComponents: {
      componentsData: teamComponentsHook.componentsData,
      teamComponentsExpanded: teamComponentsHook.teamComponentsExpanded,
      toggleComponentExpansion: teamComponentsHook.toggleComponentExpansion,
    },
    
    // Schedule data
    scheduleData: {
      todayAssignments: scheduleData.todayAssignments,
    },
    
    // Scoreboard data
    scoreboardData: {
      jiraTop3,
      gitTop3,
      dutyTop3,
      crossTeamRows,
      scoreWeights: SCORE_WEIGHTS,
    },
    
    // Authorization
    isAdmin,
    
    // Component navigation
    onOpenComponent,
    
    // Loading states
    isLoading: teamLoading,
    error: teamError,
  };

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading team data...</p>
        </div>
      </div>
    );
  }

  if (teamError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-destructive">Error loading team data: {teamError?.message ?? "Unknown error"}</p>
      </div>
    );
  }

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
}
