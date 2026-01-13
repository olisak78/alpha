import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePortalState } from "@/contexts/hooks";
import { DEFAULT_COMMON_TAB, VALID_COMMON_TABS } from "@/constants/developer-portal";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { useAuthWithRole } from "./useAuthWithRole";
import { useTeams } from "@/hooks/api/useTeams";
import type { Team as ApiTeam } from "@/types/api";
import type { Member } from "@/hooks/useOnDutyData";

function getTeamDisplayName(team: ApiTeam): string {
  return team.title || team.name;
}

export function useTeamsPage() {
  const { setActiveTab: setPortalActiveTab, setSelectedComponent } = usePortalState();
  const { setTabs, activeTab, setIsDropdown } = useHeaderNavigation();
  const [selectedTab, setSelectedTab] = useState<string>("");
  const [activeCommonTab, setActiveCommonTab] = useState<string>(DEFAULT_COMMON_TAB);
  const [isSystemTabChange, setIsSystemTabChange] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { memberData: currentUserMember } = useAuthWithRole();

  // Parse URL segments
  const { currentTeamName, currentCommonTab } = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return {
      currentTeamName: pathSegments[1],
      currentCommonTab: pathSegments[2]
    };
  }, [location.pathname]);

  // Fetch all teams using React Query
  const {
    data: teamsResponse,
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams
  } = useTeams({
    page: 1,
    page_size: 100,
  });

  // Get the currently selected team ID for fetching members
  const selectedTeamId = useMemo(() => {
    if (!selectedTab || !teamsResponse?.teams) return null;
    const team = teamsResponse.teams.find(team => getTeamDisplayName(team) === selectedTab);
    return team?.id || null;
  }, [selectedTab, teamsResponse]);

  // Memoized teams data and user's team
  const { teams, userTeam, defaultTeam } = useMemo(() => {
    const teamsData = teamsResponse?.teams || [];

    // Find user's team using their member data (team_id)
    let userTeamData = null;
    if (currentUserMember?.team_id && teamsData.length > 0) {
      userTeamData = teamsData.find(team => team.id === currentUserMember.team_id);
    }
    
    // Determine default team (user's team or first available)
    const defaultTeamData = userTeamData || teamsData[0] || null;
    
    return {
      teams: teamsData,
      userTeam: userTeamData,
      defaultTeam: defaultTeamData
    };
  }, [teamsResponse, currentUserMember?.team_id]);

  // Get current team data
  const currentTeam = useMemo(() => {
    if (!selectedTab || !teamsResponse?.teams) return null;
    return teamsResponse.teams.find(team => getTeamDisplayName(team) === selectedTab);
  }, [selectedTab, teamsResponse?.teams]);

  const handleMembersChange = useCallback((team: string, list: Member[]) => {
    // This callback is kept for compatibility but no longer manages local state
    // Team member data is now managed through context
  }, []);

  const handleMoveMember = useCallback((member: Member, fromTeam: string, toTeam: string) => {
    // This callback is kept for compatibility but no longer manages local state
    // Team member operations are now managed through context
  }, []);

  const onOpenComponent = useCallback((project: string, componentId: string) => {
    window.location.href = `/${project.toLowerCase().replace(/[@\s]/g, '-').replace(/--+/g, '-')}`;
    setPortalActiveTab("components");
    setSelectedComponent(componentId);
  }, [setPortalActiveTab, setSelectedComponent]);

  const handleCommonTabChange = useCallback((newCommonTab: string) => {
    if (VALID_COMMON_TABS.includes(newCommonTab) && currentTeamName) {
      setActiveCommonTab(newCommonTab);
      navigate(`/teams/${currentTeamName}/${newCommonTab}`, { replace: false });
    }
  }, [currentTeamName, navigate]);

  // Create team name to ID mapping function
  const getTeamIdFromName = useCallback((teamName: string): string | undefined => {
    if (!teamsResponse?.teams) return undefined;
    const team = teamsResponse.teams.find(team => getTeamDisplayName(team) === teamName);
    return team?.id;
  }, [teamsResponse?.teams]);

  // Create team ID to API name (slug) mapping function
  const getTeamNameFromId = useCallback((teamId: string): string | undefined => {
    if (!teamsResponse?.teams) return undefined;
    const team = teamsResponse.teams.find(team => team.id === teamId);
    return team?.name; // Return the API name/slug, not display_name
  }, [teamsResponse?.teams]);

  
  useEffect(() => {
    setIsDropdown(true);
    
    return () => {
      setIsDropdown(false);
    };
  }, []);

  // Effect 1: Set header tabs when teams change
  useEffect(() => {
    if (teams.length > 0) {
      // Create header tabs, put user's team first if it exists
      let orderedTeams = [...teams];
      if (userTeam && teams.includes(userTeam)) {
        orderedTeams = orderedTeams.filter(team => team.id !== userTeam.id);
        orderedTeams.unshift(userTeam);
      }
      
      const headerTabs = orderedTeams.map(team => ({
        id: team.name,
        label: getTeamDisplayName(team),
        path: `/teams/${team.name}`
      }));
      
      setTabs(headerTabs);
    }
  }, [teams, userTeam]);

  // Effect 2: Handle URL-based navigation and default team selection
  useEffect(() => {
    if (teams.length === 0) return;

    if (currentTeamName) {
      const team = teams.find(team => team.name === currentTeamName);
      if (team) {
        const teamDisplayName = getTeamDisplayName(team);
        if (selectedTab !== teamDisplayName) {
          setSelectedTab(teamDisplayName);
          setIsSystemTabChange(true);
        }
      } else {
        // Invalid team name, redirect to default team
        if (defaultTeam) {
          const target = `/teams/${defaultTeam.name}/${DEFAULT_COMMON_TAB}`;
          if (location.pathname !== target) {
            navigate(target, { replace: true });
          }
        }
      }
    } else {
      // No team name in URL, redirect to default team
      if (defaultTeam) {
        const target = `/teams/${defaultTeam.name}/${DEFAULT_COMMON_TAB}`;
        if (location.pathname !== target) {
          navigate(target, { replace: true });
        }
      }
    }
  }, [teams, currentTeamName, defaultTeam, location.pathname, selectedTab, navigate]);

  // Effect 3: Handle header tab clicks
  useEffect(() => {
    if (isSystemTabChange) {
      setIsSystemTabChange(false);
      return;
    }
    
    if (activeTab && teams.length > 0) {
      const team = teams.find(team => team.name === activeTab);
      if (team) {
        const teamDisplayName = getTeamDisplayName(team);
        if (teamDisplayName !== selectedTab) {
          setSelectedTab(teamDisplayName);
        }
      }
    }
  }, [activeTab, teams, selectedTab]);

// Effect 4: Handle common tab updates from URL
useEffect(() => {
  if (currentCommonTab && VALID_COMMON_TABS.includes(currentCommonTab)) {
    setActiveCommonTab(currentCommonTab);
  }
}, [currentCommonTab]);

  return {
    // State
    selectedTab,
    activeCommonTab,
    selectedTeamId,
    currentTeam,
    teams,

    // Data fetching
    teamsResponse,
    teamsLoading,
    teamsError,
    refetchTeams,

    // Handlers
    handleMembersChange,
    handleMoveMember,
    onOpenComponent,
    handleCommonTabChange,
    getTeamIdFromName,
    getTeamNameFromId,
  };
}
