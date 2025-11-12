import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { usePortalState } from "@/contexts/hooks";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { DeveloperPortalHeader } from "./DeveloperPortalHeader/DeveloperPortalHeader";
import { HeaderNavigation } from "./DeveloperPortalHeader/HeaderNavigation";
import { SideBar } from "./Sidebar/SideBar";
import { NotificationPopup } from "./NotificationPopup";
import { Outlet, useLocation } from "react-router-dom";

export const PortalContent: React.FC<{
  activeProject: string;
  projects: string[];
  onProjectChange: (project: string) => void;
}> = ({ activeProject, projects, onProjectChange }) => {
  const { currentDevId, setMeHighlightNotifications } = usePortalState();
  const { notifications, unreadCount, markAllRead } = useNotifications(currentDevId);
  const { tabs, activeTab, setActiveTab, isDropdown } = useHeaderNavigation();
  const { sidebarWidth } = useSidebarState();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);

  // Check if we're on the AI Arena chat page
  const isAIArenaChat = location.pathname.startsWith('/ai-arena') &&
                        (!location.pathname.includes('/deployments') || activeTab === 'chat');

  const handleNotificationClick = () => {
    setIsNotificationPopupOpen(true);
    // Clear the highlight notifications state since we're showing the modal
    setMeHighlightNotifications(false);
  };

  const handleCloseNotificationPopup = () => {
    setIsNotificationPopupOpen(false);
  };

  return (
    <div
      className="flex flex-col bg-background h-screen overflow-hidden"
    >
      <div
        className="top-0 left-0 right-0 z-30 bg-background border-b border-border transition-all duration-300 flex-shrink-0"
        style={{
          paddingLeft: isMobile ? undefined : `${sidebarWidth}px`
        }}
      >
        <DeveloperPortalHeader
          unreadCount={unreadCount}
          onNotificationClick={handleNotificationClick}
        />
        <HeaderNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabClick={setActiveTab}
          isDropdown={isDropdown}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SideBar
          activeProject={activeProject}
          projects={projects}
          onProjectChange={onProjectChange}
        />

        {/* Main content - takes remaining width */}
        <main className={`flex-1 bg-background ${isAIArenaChat ? 'overflow-hidden' : 'overflow-auto'}`}>
          <Outlet />
        </main>
      </div>

      <NotificationPopup
        isOpen={isNotificationPopupOpen}
        onClose={handleCloseNotificationPopup}
        notifications={notifications}
        currentId={currentDevId}
        markAllRead={markAllRead}
        unreadCount={unreadCount}
      />
    </div>
  );
};
