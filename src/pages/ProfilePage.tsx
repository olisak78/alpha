import { useMemo, useState } from "react";
import { Card} from "@/components/ui/card";
import {  Users, UserCheck, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Heatmap from "@/components/Heatmap";
import staticTeamData from "@/data/team/my-team.json";
import jiraIssues from "@/data/team/jira-issues.json";
import githubStats from "@/data/team/github-stats.json";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useGetUserDetails } from "@/hooks/useGetUserDetails";
import { useMyJiraIssuesCount } from "@/hooks/api/useJira";
import { useGitHubContributions } from "@/hooks/api/useGitHubContributions";
import { useCurrentUser } from "@/hooks/api/useMembers";
import { useComponentsByTeam } from "@/hooks/api/useComponents";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam, useTeamById } from "@/hooks/api/useTeams";
import { useGitHubHeatmap } from "@/hooks/api/useGitHubHeatmap";


const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

export default function ProfilePage() {
  // Get auth user for member ID
  const { user: authUser } = useAuth();
  const memberId = authUser?.memberId || '';

  // Fetch member data to get team_id and organization_id
  const { data: userData, isLoading: isMemberLoading } = useCurrentUser();
  
  // Fetch team data using team_id from member data
  const { data: teamData, isLoading: isTeamLoading } = useTeamById(
    userData?.team_id || '',
    {
      enabled: !!userData?.team_id
    }
  );


  const members = staticTeamData.members;
  // Force current user to be the first member (mock login) — no selector
  const currentId = members[0].id;

  const me = useMemo(() => members.find((m) => m.id === currentId) || members[0], [currentId]);
  
  // Use actual user info from auth context
  const {displayName, displayEmail, user} = useGetUserDetails(me);

    const userInitials = useMemo(() => {
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name[0]}${userData.last_name[0]}`.toUpperCase();
    }
    return initials(displayName);
  }, [userData?.first_name, userData?.last_name, displayName]);

  // Get Jira resolved issues count from API (same as Home page)
  const { data: jiraResolvedCountData, isLoading: isJiraLoading, error: jiraError } = useMyJiraIssuesCount({
    status: 'Resolved'
  });
  const issuesResolved = jiraResolvedCountData?.count || 0;

  // Get GitHub contributions from API (same as Home page)
  const { 
    data: contributionsData, 
    isLoading: isContributionsLoading, 
    error: contributionsError 
  } = useGitHubContributions();
  const totalContributions = contributionsData?.total_contributions || 0;

  // Fetch team components from API
  const { 
    data: componentsData, 
    isLoading: isComponentsLoading, 
    error: componentsError 
  } = useComponentsByTeam(
    userData?.team_id || '',
   '',
    {
      enabled: !!userData?.team_id 
    }
  );

  // Group components by group_name (category)
  const componentsByCategory = useMemo(() => {
    if (!componentsData?.components) return {};
    
    const grouped: Record<string, typeof componentsData.components> = {};
    
    componentsData.components.forEach(component => {
      const category: any = component.metadata?.system || 'Other';
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(component);
    });
    
    return grouped;
  }, [componentsData]);

  // On Duty context
  const [year] = useState(new Date().getFullYear());
  const onDuty = useScheduleData(members as any, year);

  // Developer metrics
  const resolvedStatuses = new Set(["In Review", "Resolved", "Closed", "Done"]);
  // issuesResolved now comes from API above
  const myLines = (githubStats.find((g) => g.memberId === currentId)?.lines as number | undefined) || 0;

  // Duty days
  const myDutyDays = useMemo(() => onDuty.onDuty.filter((d) => d.assigneeId === currentId).length, [onDuty.onDuty, currentId]);
  const myOnCallDays = useMemo(() => {
    return onDuty.onCall.filter((d) => d.assigneeId === currentId).length;
  }, [onDuty.onCall, currentId]);

  // Team scoring
  const teamScores = useMemo(() => {
    const score: Record<string, number> = {};
    members.forEach((m) => {
      const issues = jiraIssues.filter((j) => j.assigneeId === m.id && resolvedStatuses.has(j.status)).length;
      const lines = (githubStats.find((g) => g.memberId === m.id)?.lines as number | undefined) || 0;
      const totalScore = issues * 5 + (lines / 1000) * 10;
      score[m.id] = Math.min(100, Math.round(totalScore * 10) / 10);
    });
    const ranking = Object.entries(score)
      .map(([id, s]) => ({ id, score: s }))
      .sort((a, b) => b.score - a.score);
    return { score, ranking };
  }, [members]);

  // Rank calculations
  const myRankInfo = useMemo(() => {
    const idx = teamScores.ranking.findIndex((r) => r.id === currentId);
    const rank = idx >= 0 ? idx + 1 : members.length;
    const top = teamScores.ranking[0]?.score || 0;
    const mine = teamScores.score[currentId] || 0;
    const dist = Math.max(0, Math.round((top - mine) * 10) / 10);
    return { rank, top, mine, dist };
  }, [teamScores, currentId, members.length]);

  const { 
    data: heatmapData, 
    isLoading: isHeatmapLoading, 
    error: heatmapError 
  } = useGitHubHeatmap();

  // Transform API heatmap data to the format expected by Heatmap component
  const contributionHeatmapData = useMemo(() => {
    if (!heatmapData?.weeks) return [];
    
    const data: Array<{ week: number; day: number; intensity: number; tooltip: string }> = [];
    
    heatmapData.weeks.forEach((week, weekIndex) => {
      week.contribution_days.forEach((day, dayIndex) => {
        // Map contribution_level to intensity (0-4)
        let intensity = 0;
        switch (day.contribution_level) {
          case 'NONE':
            intensity = 0;
            break;
          case 'FIRST_QUARTILE':
            intensity = 1;
            break;
          case 'SECOND_QUARTILE':
            intensity = 2;
            break;
          case 'THIRD_QUARTILE':
            intensity = 3;
            break;
          case 'FOURTH_QUARTILE':
            intensity = 4;
            break;
          default:
            intensity = 0;
        }
        
        data.push({
          week: weekIndex,
          day: dayIndex,
          intensity,
          tooltip: `${day.contribution_count} contributions on ${day.date}`
        });
      });
    });
    
    return data;
  }, [heatmapData]);


  const kpis = [
    { 
      title: "Jira Issues Resolved", 
      value: (() => {
        if (isJiraLoading) return "Loading...";
        if (jiraError) return "N/A";
        return issuesResolved;
      })(),
      isLoading: isJiraLoading,
      isError: !!jiraError
    },
    { 
      title: "Total Contributions", 
      value: (() => {
        if (isContributionsLoading) return "Loading...";
        if (contributionsError) return "N/A";
        return totalContributions.toLocaleString();
      })(),
      isLoading: isContributionsLoading,
      isError: !!contributionsError
    },
  ];

  // Generate mock heatmap data
  const generateMockHeatmapData = (baseIntensity: number = 2) => {
    const data = [];
    const totalWeeks = 53;
    const maxVisibleWeeks = 48;
    const startWeek = Math.max(0, totalWeeks - maxVisibleWeeks);
    
    for (let week = startWeek; week < totalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        // Create some variation in the data with occasional spikes
        let intensity = Math.floor(Math.random() * 5);
        
        // Add some patterns to make it more realistic
        if (day === 0 || day === 6) { // Weekends - lower activity
          intensity = Math.floor(intensity * 0.3);
        }
        
        // Occasional high activity days
        if (Math.random() < 0.1) {
          intensity = Math.min(4, intensity + 2);
        }
        
        data.push({
          week,
          day,
          intensity,
          tooltip: `${intensity} activities on week ${week}, day ${day}`
        });
      }
    }
    return data;
  };

  // Generate specific mock data for each heatmap type
  const contributionData = useMemo(() => generateMockHeatmapData().map(item => ({
    ...item,
    tooltip: `${item.intensity} contributions`
  })), []);

  const onCallData = useMemo(() => generateMockHeatmapData().map(item => ({
    ...item,
    tooltip: `${item.intensity} on-call days`
  })), []);

  const onDutyData = useMemo(() => generateMockHeatmapData().map(item => ({
    ...item,
    tooltip: `${item.intensity} on-duty days`
  })), []);

  const issuesResolvedData = useMemo(() => generateMockHeatmapData().map(item => ({
    ...item,
    tooltip: `${item.intensity} issues resolved`
  })), []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Profile Info (GitHub style) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Card - GitHub style */}
          <div className="space-y-4">
            {/* Avatar and basic info */}
            <div className="flex flex-col items-center lg:items-start">
              {/* Large Avatar */}
              <Avatar className="w-48 h-48 lg:w-64 lg:h-64 border-2 border-border">
                <AvatarImage 
                  src={user?.picture || me.avatar || undefined} 
                  alt={`${displayName} avatar`} 
                />
                <AvatarFallback className="text-4xl lg:text-6xl font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              
              {/* Name and Username */}
              <div className="mt-4 text-center lg:text-left w-full">
                <h1 className="text-xl lg:text-2xl font-bold">
                  {userData?.first_name && userData?.last_name 
                    ? `${userData.first_name} ${userData.last_name}`
                    : displayName}
                </h1>
              </div>
              
              {/* Separator */}
              <div className="w-full border-t border-border my-4"></div>
              
              {/* Team, Email Info */}
              <div className="w-full space-y-3 text-sm">
                {/* Team */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Team:</span>
                  {isTeamLoading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : teamData?.title ? (
                    <span>{teamData.title}</span>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>
                
                {/* Email */}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span>{userData?.email || displayEmail}</span>
                </div>

                {/* Role (if available) */}
                {userData?.team_role && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Role:</span>
                    <span className="capitalize">{userData.team_role}</span>
                  </div>
                )}
              </div>
            </div>

            {/* HIDDEN: Rank Card - Compact version for sidebar */}
            <div className="hidden">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Team Rank</h3>
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rank</span>
                    <span className="font-bold text-lg">#{myRankInfo.rank}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span className="text-sm">{myRankInfo.mine.toFixed(1)}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">To #1</span>
                    <span className="text-sm">{myRankInfo.dist.toFixed(1)} pts</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Stats Overview Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Statistics Overview</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {kpis.map((kpi) => (
                <Card key={kpi.title} className="p-4 text-center">
                  <div className={`text-2xl font-bold text-primary`}>
                    {kpi.isLoading ? (
                      <div className="animate-pulse bg-muted h-8 w-20 mx-auto rounded"></div>
                    ) : (
                      kpi.value
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{kpi.title}</div>
                </Card>
              ))}
            </div>
          </section>

           {/* GitHub Contributions Heatmap */}
          <section>
            {isHeatmapLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">Loading contribution heatmap...</div>
              </div>
            ) : heatmapError ? (
              <div className="text-center py-8 text-destructive">
                Failed to load contribution heatmap
              </div>
            ) : heatmapData ? (
              <Heatmap
                title="GitHub Contributions"
                data={contributionHeatmapData}
                colors={['bg-gray-200', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-800']}
                totalCount={heatmapData.total_contributions}
                countLabel="contributions"
              />
            ) : null}
          </section>

          {/* My Team Components Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">My Team Components</h2>
            </div>
            
            {isComponentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">Loading components...</div>
              </div>
            ) : componentsError ? (
              <div className="text-center py-8 text-destructive">
                Failed to load components
              </div>
            ) : !componentsData?.components || componentsData.components.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No components found for your team
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(componentsByCategory).map(([category, components]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {components.map((component) => {
                        // Generate color based on category
                        const categoryColors: Record<string, string> = {
                          'unified-services': 'bg-green-500',
                          'cis-2-0': 'bg-blue-500',
                          'cloud-automation': 'bg-purple-500',
                          'platform-engineering': 'bg-orange-500',
                        };
                        const colorClass = categoryColors[category] || 'bg-gray-500';
                        
                        return (
                          <Card key={component.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 ${colorClass} rounded-full`}></div>
                              <h3 className="font-medium text-sm">
                                {component.title || component.title}
                              </h3>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {component.description || 'No description'}
                            </p>
                            {component.name && (
                              <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-muted">
                                {component.name}
                              </span>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
         

          {/* HIDDEN: Heatmaps using the reusable component */}
          <div className="hidden">
            <Heatmap
              title="Contribution Heatmap"
              data={contributionData}
              colors={['bg-gray-200', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-800']}
              totalCount={myLines}
              countLabel="contributions"
            />

            <Heatmap
              title="On Call Heatmap"
              data={onCallData}
              colors={['bg-gray-200', 'bg-red-200', 'bg-red-400', 'bg-red-600', 'bg-red-800']}
              totalCount={myOnCallDays}
              countLabel="on-call days"
            />

            <Heatmap
              title="On Duty Heatmap"
              data={onDutyData}
              colors={['bg-gray-200', 'bg-orange-200', 'bg-orange-400', 'bg-orange-600', 'bg-orange-800']}
              totalCount={myDutyDays}
              countLabel="on-duty days"
            />

            <Heatmap
              title="Issues Resolved Heatmap"
              data={issuesResolvedData}
              colors={['bg-gray-200', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600', 'bg-blue-800']}
              totalCount={issuesResolved}
              countLabel="issues resolved"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
