import { HeaderTab, useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { getBasePath } from "@/utils/developer-portal-helpers";
import { useLocation, useParams } from "react-router-dom";
import { useCallback } from "react";
import { useProjects } from "@/stores/projectsStore";



// Hook to get current tab from URL and sync with header tabs
export function useTabRouting() {
  const projects = useProjects();
  
  const { activeTab, setTabs } = useHeaderNavigation();
  const params = useParams();
  const location = useLocation();

  const currentTabFromUrl = params.tabId;

  // Get project names from imported data
  //const projects: Project[] = projectsData as Project[];
  const projectNames = projects.map(p => p.name);

  // Enhanced sync function that's called when tabs are available - memoized to prevent infinite loops
  const syncTabWithUrl = useCallback((availableTabs: HeaderTab[], defaultTab?: string) => {
    if (availableTabs.length === 0) return;

    const basePath = getBasePath(projectNames, location.pathname);
    if (!basePath) return;

    // Set the tabs first - this will trigger the auto-sync in the context
    setTabs(availableTabs);

    // The context will handle the rest of the synchronization automatically
  }, [setTabs, location.pathname, projectNames]);

  return { currentTabFromUrl, syncTabWithUrl };
}