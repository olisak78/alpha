import { HeaderTab, useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { getBasePath } from "@/utils/developer-portal-helpers";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";

// Hook to get current tab from URL and sync with header tabs
export function useTabRouting() {
  const { activeTab, setTabs } = useHeaderNavigation();
  const params = useParams();
  const location = useLocation();

  const currentTabFromUrl = params.tabId;

  // Enhanced sync function that's called when tabs are available
  const syncTabWithUrl = (availableTabs: HeaderTab[], defaultTab?: string) => {
    if (availableTabs.length === 0) return;

    const basePath = getBasePath(location.pathname);
    if (!basePath) return;

    const validTabIds = availableTabs.map(tab => tab.id);

    // Set the tabs first - this will trigger the auto-sync in the context
    setTabs(availableTabs);

    // The context will handle the rest of the synchronization automatically
  };

  return { currentTabFromUrl, syncTabWithUrl };
}
