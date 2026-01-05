import { cn } from "@/lib/utils";
import { HeaderTab } from "@/contexts/HeaderNavigationContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderDropdownProps {
  tabs: HeaderTab[];
  activeTab: string | null;
  onTabClick: (tabId: string) => void;
  label?: string;
  placeholder?: string;
  width?: string;
}

export function HeaderDropdown({
  tabs,
  activeTab,
  onTabClick,
  label = "Team:",
  placeholder = "Select a team",
  width = "w-64"
}: HeaderDropdownProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on a Teams page with a selected team
  const isTeamsPage = location.pathname.startsWith('/teams/');
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentCommonTab = pathSegments[2] || 'overview';

  if (tabs.length === 0) {
    return null;
  }

  const handleSelectChange = (value: string) => {
    onTabClick(value);
  };

  const handleCommonTabClick = (tabValue: string) => {
    if (isTeamsPage && pathSegments[1]) {
      // Navigate to the new common tab using React Router
      navigate(`/teams/${pathSegments[1]}/${tabValue}`);
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const activeTabLabel = activeTabData?.label || "";

  // Common tabs for Teams page
  const commonTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'components', label: 'Components' },
    { value: 'jira', label: 'Jira Issues' },
    { value: 'docs', label: 'Docs' },
  ];

  return (
    <>
      {/* Team selector dropdown */}
      <div
        className="bg-secondary px-4 py-3 flex items-center transition-all duration-300"
      >
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <Select value={activeTab || ""} onValueChange={handleSelectChange}>
            <SelectTrigger className={width}>
              <SelectValue placeholder={placeholder}>
                <div className="flex items-center space-x-2">
                  {activeTabData?.icon && (
                    <span className="text-current">
                      {activeTabData.icon}
                    </span>
                  )}
                  <span>{activeTabLabel}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  <div className="flex items-center space-x-2">
                    {tab.icon && <span className="text-current">{tab.icon}</span>}
                    <span>{tab.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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