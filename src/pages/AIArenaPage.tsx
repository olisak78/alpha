import React, { useState, useMemo, useEffect } from 'react';
import { BreadcrumbPage } from '@/components/BreadcrumbPage';
import { useHeaderNavigation } from '@/contexts/HeaderNavigationContext';
import { useTabRouting } from '@/hooks/useTabRouting';
import { DeploymentsManager } from '@/components/AILaunchpad/DeploymentsManager';
import { TeamSelectorBar } from '@/components/TeamSelectorBar';
import AIPage from '@/features/ai-arena/AIPage';

const AIArenaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [deploymentTeams, setDeploymentTeams] = useState<string[]>([]);
  const [hasMultipleTeams, setHasMultipleTeams] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const { setTabs, activeTab: headerActiveTab, setActiveTab: setHeaderActiveTab } = useHeaderNavigation();
  const { currentTabFromUrl, syncTabWithUrl } = useTabRouting();

  const handleTeamsLoaded = (teams: string[], hasMultiple: boolean) => {
    setDeploymentTeams(teams);
    setHasMultipleTeams(hasMultiple);
  };

  // Memoize header tabs with Chat and Deployments
  const headerTabs = useMemo(() => [
    {
      id: 'chat',
      label: 'Chat'
    },
    {
      id: 'deployments',
      label: 'Deployments'
    }
  ], []);

  // Set up header tabs and sync with URL
  useEffect(() => {
    setTabs(headerTabs);
    syncTabWithUrl(headerTabs, 'ai-arena');
  }, [setTabs, headerTabs, syncTabWithUrl]);

  // Update local activeTab when URL tab changes
  useEffect(() => {
    if (currentTabFromUrl && currentTabFromUrl !== activeTab) {
      setActiveTab(currentTabFromUrl);
    }
  }, [currentTabFromUrl]);

  // Sync local activeTab with header activeTab when header tab is clicked
  useEffect(() => {
    if (headerActiveTab && headerActiveTab !== activeTab) {
      setActiveTab(headerActiveTab);
    }
  }, [headerActiveTab, activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return <AIPage />;
      case 'deployments':
        return (
           <DeploymentsManager
             onTeamsLoaded={handleTeamsLoaded}
             externalSelectedTeam={selectedTeam}
             onExternalTeamChange={setSelectedTeam}
           />
        );
      default:
        return <AIPage />;
    }
  };

  return (
    <>
      {activeTab === 'chat' ? (
        // Full height chat - takes all available space in the main content area
        <div className="h-full flex flex-col overflow-hidden" data-testid="breadcrumb-page">
          <AIPage />
        </div>
      ) : (
        <>
          {/* Team selector bar - only show on deployments tab */}
          {activeTab === 'deployments' && deploymentTeams.length > 0 && (
            <TeamSelectorBar
              teams={deploymentTeams}
              selectedTeam={selectedTeam}
              hasMultipleTeams={hasMultipleTeams}
              onTeamChange={setSelectedTeam}
            />
          )}
          <BreadcrumbPage>
            {/* Tab Content */}
            {renderTabContent()}
          </BreadcrumbPage>
        </>
      )}
    </>
  );
};

export default AIArenaPage;
