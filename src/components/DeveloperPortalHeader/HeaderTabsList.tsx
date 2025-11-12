import { cn } from "@/lib/utils";
import { HeaderTab } from "@/contexts/HeaderNavigationContext";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useLocation, useNavigate } from "react-router-dom";
import { VALID_COMMON_TABS } from "@/constants/developer-portal";

interface HeaderTabsListProps {
  tabs: HeaderTab[];
  activeTab: string | null;
  onTabClick: (tabId: string) => void;
}

export function HeaderTabsList({ tabs, activeTab, onTabClick }: HeaderTabsListProps) {
  const { isExpanded } = useSidebarState();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on a Teams page with a selected team
  const isTeamsPage = location.pathname.startsWith('/teams/');
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentCommonTab = pathSegments[2] || 'overview';

  if (tabs.length === 0) {
    return null;
  }

  const handleTabClick = (tab: HeaderTab) => {
    onTabClick(tab.id);
  };

  const handleCommonTabClick = (tabValue: string) => {
    if (isTeamsPage && pathSegments[1]) {
      // Navigate to the new common tab using React Router
      navigate(`/teams/${pathSegments[1]}/${tabValue}`);
    }
  };

  // Common tabs for Teams page
  const commonTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'components', label: 'Components' },
    { value: 'jira', label: 'Jira Issues' },
    { value: 'docs', label: 'Docs' },
  ];

  return (
    <>
      {/* Team selector tabs */}
      <div
        className="bg-secondary px-4 transition-all duration-300 h-12"
      >
        <div className="flex items-center space-x-6 h-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium transition-colors relative h-full",

                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon && <span className="text-current">{tab.icon}</span>}
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Common tabs - only show when on a Teams page with a selected team */}
      {isTeamsPage && pathSegments[1] && (
        <div className="bg-secondary px-4 transition-all duration-300 h-12">
          <div className="flex items-center space-x-6 h-full">
            {commonTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleCommonTabClick(tab.value)}
                className={cn(
                  "flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium transition-colors relative h-full",
                  currentCommonTab === tab.value
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                {currentCommonTab === tab.value && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
