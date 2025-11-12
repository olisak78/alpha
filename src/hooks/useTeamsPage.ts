import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePortalState } from "@/contexts/hooks";
import { DEFAULT_COMMON_TAB, VALID_COMMON_TABS } from "@/constants/developer-portal";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { createTeamSlug, getTeamNameFromSlug } from "@/utils/developer-portal-helpers";
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
  const { currentTabSlug, currentCommonTab } = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return {
      currentTabSlug: pathSegments[1],
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

  // Memoized team names and user's team
  const { teamNames, userTeam } = useMemo(() => {
    const names = teamsResponse?.teams ? 
      teamsResponse.teams.map(team => getTeamDisplayName(team)).sort() : 
      [];

    // Find user's team using their member data (team_id)
    let userTeamName = null;
    if (currentUserMember?.team_id && teamsResponse?.teams) {
      const userTeamData = teamsResponse.teams.find(team => team.id === currentUserMember.team_id);
      if (userTeamData) {
        userTeamName = getTeamDisplayName(userTeamData);
      }
    }
    
    return {
      teamNames: names,
      userTeam: userTeamName
    };
  }, [teamsResponse, currentUserMember?.team_id]);

  // Determine default team (user's team or first available)
  const defaultTeam = useMemo(() => {
    return userTeam || teamNames[0] || null;
  }, [userTeam, teamNames]);

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
    if (VALID_COMMON_TABS.includes(newCommonTab) && currentTabSlug) {
      setActiveCommonTab(newCommonTab);
      navigate(`/teams/${currentTabSlug}/${newCommonTab}`, { replace: false });
    }
  }, [currentTabSlug, navigate]);

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

  // Effect 1: Set header tabs when team names change
useEffect(() => {
  if (teamNames.length > 0) {
    // Create header tabs, but put user's team first if it exists
    let orderedTeamNames = [...teamNames];
    if (userTeam && teamNames.includes(userTeam)) {
      // Remove user's team from its current position and put it first
      orderedTeamNames = orderedTeamNames.filter(name => name !== userTeam);
      orderedTeamNames.unshift(userTeam);
    }
    
    const headerTabs = orderedTeamNames.map(teamName => ({
      id: createTeamSlug(teamName),
      label: teamName,
      path: `/teams/${createTeamSlug(teamName)}`
    }));
    
    setTabs(headerTabs);
  }
}, [teamNames, userTeam]);  

// Effect 2: Handle URL-based navigation and default team selection
useEffect(() => {
  if (teamNames.length === 0) return;

  if (currentTabSlug) {
    const teamName = getTeamNameFromSlug(currentTabSlug, teamNames);
    if (teamName) {
      if (selectedTab !== teamName) {
        setSelectedTab(teamName);
        setIsSystemTabChange(true);
      }
    } else {
      // Invalid team slug, redirect to default team
      if (defaultTeam) {
        const defaultSlug = createTeamSlug(defaultTeam);
        const target = `/teams/${defaultSlug}/${DEFAULT_COMMON_TAB}`;
        if (location.pathname !== target) {
          navigate(target, { replace: true });
        }
      }
    }
  } else {
    // No team slug in URL, redirect to default team (only on initial load)
    if (defaultTeam) {
      const defaultSlug = createTeamSlug(defaultTeam);
      const target = `/teams/${defaultSlug}/${DEFAULT_COMMON_TAB}`;
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
    }
  }
}, [teamNames, currentTabSlug, defaultTeam, location.pathname]);

// Effect 3: Handle header tab clicks - Let HeaderNavigationContext handle the navigation
useEffect(() => {
  if (isSystemTabChange) {
    setIsSystemTabChange(false);
    return;
  }
  
  if (activeTab && teamNames.length > 0) {
    const teamName = getTeamNameFromSlug(activeTab, teamNames);
    if (teamName && teamName !== selectedTab) {
      setSelectedTab(teamName);
    }
  }
}, [activeTab, teamNames, currentCommonTab]);

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
    teamNames,

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
