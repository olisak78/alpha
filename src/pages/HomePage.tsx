
import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import {
  CheckCircle,
  GitBranch,
  MessageSquare,
  Info,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import teamData from "@/data/team/my-team.json";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { useAuth } from "@/contexts/AuthContext";
import { Announcements } from "@/components/Announcements";
import CamProfilesTab from "@/components/tabs/MePageTabs/CamProfilesTab";
import camProfilesData from "@/data/profiles/cam_profiles.json";
import QuickLinksTab from "@/components/tabs/MePageTabs/QuickLinksTab";
import JiraIssuesTab from "@/components/tabs/MePageTabs/JiraIssuesTab";
import GithubPrsTab from "@/components/tabs/MePageTabs/GithubPrsTab";
import { useMyJiraIssuesCount, useMyJiraIssues } from "@/hooks/api/useJira";
import { useCurrentUser } from "@/hooks/api/useMembers";
import { useGitHubPRs } from "@/hooks/api/useGitHubPRs";
import { useGitHubContributions } from "@/hooks/api/useGitHubContributions";
import { useGitHubPRReviewComments } from "@/hooks/api/useGitHubPRReviewComments";
import { StatItem } from '@/types/api';
import { Area, AreaChart, ResponsiveContainer} from 'recharts';
import { useGitHubAveragePRTime } from '@/hooks/api/useGitHubAveragePRtime';
import { QUICK_ACCESS_TAB_KEY } from '@/constants/developer-portal';
import { useHeaderNavigation } from '@/contexts/HeaderNavigationContext';


export default function HomePage() {
  const { user } = useAuth();
  const { setTabs } = useHeaderNavigation();
  
  // Clear header tabs on mount since HomePage doesn't use them
  useEffect(() => {
    setTabs([]);
  }, [setTabs]);

  const members = teamData.members;
  const currentId = user?.name || members[0].id;

  // Use new /users/me endpoint instead of /members/:id
  const { data: userData, isLoading: isMemberLoading } = useCurrentUser();

  // Reference to measure grid container width
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate exact widths based on 4-column grid with gap-6 (24px)
  const gap = 24; // gap-6 in pixels
  const oneColumnWidth = containerWidth > 0 ? (containerWidth - 3 * gap) / 4 : 0;
  const twoColumnWidth = containerWidth > 0 ? (containerWidth - 3 * gap) / 4 * 2 + gap : 0;
  const threeColumnWidth = containerWidth > 0 ? (containerWidth - 3 * gap) / 4 * 3 + 2 * gap : 0;

  // Get Jira resolved issues count from new API
  const { data: jiraResolvedCountData, isLoading: isJiraLoading, error: jiraError } = useMyJiraIssuesCount({
    status: 'Resolved'
  });
  const issuesResolved = jiraResolvedCountData?.count || 0;

  // Get all Jira issues to calculate total count for completion rate
  const { data: allIssuesData, isLoading: isAllIssuesLoading, error: allIssuesError } = useMyJiraIssues({
    limit: 100 // Get a large number to ensure we get all issues
  });

  // Get GitHub contributions from API
  const {
    data: contributionsData,
    isLoading: isContributionsLoading,
    error: contributionsError
  } = useGitHubContributions();
  const totalContributions = contributionsData?.total_contributions || 0;

   // Get GitHub average PR time from API
  const {
    data: avgPRTimeData,
    isLoading: isAvgPRTimeLoading,
    error: avgPRTimeError
  } = useGitHubAveragePRTime('365d');
  const prCount = avgPRTimeData?.pr_count || 0;
  const chartData = avgPRTimeData?.time_series?.map(item => ({ value: item.pr_count })).reverse() || [];

  // Get GitHub PR review comments from API
  const {
    data: prReviewCommentsData,
    isLoading: isPRReviewCommentsLoading,
    error: prReviewCommentsError
  } = useGitHubPRReviewComments('365d');
  const reviewCommentsCount = prReviewCommentsData?.total_comments || 0;

  // GitHub PRs state and data fetching
  const [prStatus, setPrStatus] = useState<'open' | 'closed' | 'all'>('open');
  const [prPage, setPrPage] = useState(1);
  const perPage = 10;

  // Announcements expand/collapse state
  const [isAnnouncementsExpanded, setIsAnnouncementsExpanded] = useState(false);

    // Persistent tab selection state
  const [activeQuickAccessTab, setActiveQuickAccessTab] = useState<string>(() => {
    return sessionStorage.getItem(QUICK_ACCESS_TAB_KEY) || 'links';
  });
   // Persist tab selection to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(QUICK_ACCESS_TAB_KEY, activeQuickAccessTab);
  }, [activeQuickAccessTab]);

  const { data: prData, isLoading: isPrLoading, error: prError } = useGitHubPRs({
    state: prStatus,
    page: prPage,
    per_page: perPage,
    sort: 'updated',
    direction: 'desc',
  });

  // Stats for the top section
  const displayName = useMemo(() => {
    if (userData?.first_name) {
      return userData.first_name;
    }
    if (user?.name && user.name !== currentId) {
      return user.name;
    }
    return 'User';
  }, [userData, user, currentId]);

  // Stats for the top section
  const stats: StatItem[] = [
    {
      id: 1,
      title: 'GitHub Contributions',
      value: (() => {
        if (isContributionsLoading) return "Loading...";
        if (contributionsError) return "N/A";
        return totalContributions.toLocaleString();
      })(),
      description: "GitHub Tools only",
      tooltip: "Total GitHub contributions in the last year",
      icon: <GitBranch className="h-6 w-6" />,
      color: 'text-blue-500',
      isLoading: isContributionsLoading,
      isError: !!contributionsError
    },
    {
      id: 2,
      title: 'Jira Issues Resolved',
      value: (() => {
        if (isJiraLoading) return "Loading...";
        if (jiraError) return "N/A";
        return issuesResolved;
      })(),
      description: "From the last year",
      tooltip: "Your resolved Jira issues from the last year",
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-green-500',
      isLoading: isJiraLoading,
      isError: !!jiraError
    },
    {
      id: 3,
      title: 'Average PR time',
      value: (() => {
        if (isAvgPRTimeLoading) return "Loading...";
        if (avgPRTimeError) return "N/A";
        return `${prCount} min`;
      })(),
      description: "Over last year",
      tooltip: "Average time for PRs to be merged over the last year",
      isLoading: isAvgPRTimeLoading,
      isError: !!avgPRTimeError,
      chartData: chartData
    },
    {
      id: 4,
      title: 'Review Hero',
      value: (() => {
        if (isPRReviewCommentsLoading) return "Loading...";
        if (prReviewCommentsError) return "N/A";
        return reviewCommentsCount;
      })(),
      description: "PRs you reviewed last year",
      tooltip: "Number of pull requests you reviewed in the last year",
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'text-purple-500',
      isLoading: isPRReviewCommentsLoading,
      isError: !!prReviewCommentsError
    }
  ];

  return (
    <BreadcrumbPage>
      <main className="space-y-6 pb-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            Welcome {isMemberLoading ? '...' : displayName}!
          </h1>
        </div>

        {/* Stats Grid - 4 columns */}
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.id} className="border-slate-200 dark:border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {stat.title}
                  </CardTitle>
                  {stat.tooltip && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{stat.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {stat.icon && (
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-2">
                {stat.chartData && stat.chartData.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {stat.value}
                      </div>
                      {stat.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {stat.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-[2] h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stat.chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="url(#colorValue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>

                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stat.value}
                    </div>
                    {stat.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {stat.description}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid - Aligned with stats: Announcements (1/4 or 2/4) + Quick Access (3/4 or 2/4) */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Announcements Section - dynamically expands/collapses */}
          <div
            className="w-full"
            style={{
              width: containerWidth > 0 ? (isAnnouncementsExpanded ? `${twoColumnWidth}px` : `${oneColumnWidth}px`) : '100%',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Card className="border-slate-200 dark:border-slate-700 h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Announcements
                  </CardTitle>
                  <CardDescription>
                    Latest updates and important information
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAnnouncementsExpanded(!isAnnouncementsExpanded)}
                  className="shrink-0 h-8 w-8 transition-transform duration-300 ease-in-out hover:scale-110"
                >
                  {isAnnouncementsExpanded ? (
                    <ChevronLeft className="h-4 w-4 transition-transform duration-300" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform duration-300" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <Announcements className="max-h-68" title="" />
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Section - dynamically expands/collapses */}
          <div
            className="w-full flex-1"
            style={{
              width: containerWidth > 0 ? (isAnnouncementsExpanded ? `${twoColumnWidth}px` : `${threeColumnWidth}px`) : '100%',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Card className="border-slate-200 dark:border-slate-700 h-full overflow-hidden">
              <CardContent className="p-0">
                <Tabs value={activeQuickAccessTab} onValueChange={setActiveQuickAccessTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 gap-0 !bg-white dark:!bg-slate-800 p-0 h-auto border-b border-slate-200 dark:border-slate-700">
                    <TabsTrigger
                      value="links"
                      className="!bg-white dark:!bg-slate-800 data-[state=active]:!bg-blue-50 dark:data-[state=active]:!bg-blue-950/50 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:!bg-slate-50 dark:hover:!bg-slate-700/50 transition-all rounded-t-md border-b-2 border-transparent pb-3 pt-4 px-4"
                    >
                      Quick Links
                    </TabsTrigger>
                    <TabsTrigger
                      value="github-prs"
                      className="!bg-white dark:!bg-slate-800 data-[state=active]:!bg-blue-50 dark:data-[state=active]:!bg-blue-950/50 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:!bg-slate-50 dark:hover:!bg-slate-700/50 transition-all rounded-t-md border-b-2 border-transparent pb-3 pt-4 px-4"
                    >
                      GitHub PRs
                    </TabsTrigger>
                    <TabsTrigger
                      value="jira"
                      className="!bg-white dark:!bg-slate-800 data-[state=active]:!bg-blue-50 dark:data-[state=active]:!bg-blue-950/50 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:!bg-slate-50 dark:hover:!bg-slate-700/50 transition-all rounded-t-md border-b-2 border-transparent pb-3 pt-4 px-4"
                    >
                      Jira Issues
                    </TabsTrigger>
                    <TabsTrigger
                      value="cam"
                      className="!bg-white dark:!bg-slate-800 data-[state=active]:!bg-blue-50 dark:data-[state=active]:!bg-blue-950/50 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:!bg-slate-50 dark:hover:!bg-slate-700/50 transition-all rounded-t-md border-b-2 border-transparent pb-3 pt-4 px-4"
                    >
                      CAM Profiles
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="links" className="mt-0 tab-content-height overflow-y-auto">
                    <QuickLinksTab
                      userData={userData}
                      emptyMessage="No quick links yet. Add Links to Favorites or click 'Add Link' to get started."
                      title="Quick Links"
                    />
                  </TabsContent>

                  <TabsContent value="github-prs" className="mt-0 tab-content-height overflow-y-auto">
                    <GithubPrsTab
                      data={prData}
                      isLoading={isPrLoading}
                      error={prError}
                      prStatus={prStatus}
                      setPrStatus={setPrStatus}
                      prPage={prPage}
                      setPrPage={setPrPage}
                      perPage={perPage}
                    />
                  </TabsContent>

                  <TabsContent value="jira" className="mt-0 tab-content-height overflow-y-auto">
                    <JiraIssuesTab />
                  </TabsContent>

                  <TabsContent value="cam" className="mt-0 tab-content-height overflow-y-auto">
                    <CamProfilesTab
                      camGroups={camProfilesData}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </BreadcrumbPage>
  );
}
