import { DEFAULT_COMMON_TAB, VALID_COMMON_TABS } from '@/constants/developer-portal';
import { getBasePath, shouldNavigateToTab } from '@/utils/developer-portal-helpers';
import { createContext, useContext, useState, ReactNode, useLayoutEffect, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProjects } from '@/stores/projectsStore';

export interface HeaderTab {
  id: string;
  label: string;
  icon?: ReactNode;
  path?: string;
}

interface HeaderNavigationContextType {
  tabs: HeaderTab[];
  activeTab: string | null;
  setTabs: (tabs: HeaderTab[]) => void;
  setActiveTab: (tabId: string) => void;
  isDropdown: boolean;
  setIsDropdown: (isDropdown: boolean) => void;
}

const HeaderNavigationContext = createContext<HeaderNavigationContextType | undefined>(undefined);

export function HeaderNavigationProvider({ children }: { children: ReactNode }) {
  const projects = useProjects();
  
  const location = useLocation();
  const navigate = useNavigate();

  const [tabs, setTabs] = useState<HeaderTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isDropdown, setIsDropdown] = useState(false);

  // Project names for route matching, recalculated when projects change
  const projectNames = useMemo(() => projects.map(p => p.name), [projects]);

  const previousBasePathRef = useRef<string | null>(null);
  const previousTabsRef = useRef<HeaderTab[]>([]);

  // Extract tabId from URL
  const getTabIdFromUrl = (pathname: string, basePath: string | null) => {
    if (!basePath) return null;
    const pathSegments = pathname.split('/').filter(Boolean);

    if (basePath === '/teams') {
      return pathSegments[1] || null; // /teams/:teamName/:commonTab
    } else {
      const baseSegments = basePath.split('/').filter(Boolean);
      const tabIndex = baseSegments.length;
      return pathSegments[tabIndex] || null;
    }
  };

  // Clear tabs if base path changes
  useLayoutEffect(() => {
    const currentBasePath = getBasePath(projectNames, location.pathname);
    if (previousBasePathRef.current !== currentBasePath) {
      setTabs([]);
      setActiveTab(null);
      previousBasePathRef.current = currentBasePath;
      previousTabsRef.current = [];
    }
  }, [location.pathname, projectNames]);

  // Sync activeTab with URL changes
  useEffect(() => {
    if (tabs.length === 0) return;

    const currentBasePath = getBasePath(projectNames, location.pathname);
    const tabIdFromUrl = getTabIdFromUrl(location.pathname, currentBasePath);
    const validTabIds = tabs.map(tab => tab.id);

    if (tabIdFromUrl && validTabIds.includes(tabIdFromUrl) && tabIdFromUrl !== activeTab) {
      setActiveTab(tabIdFromUrl);
    }
  }, [location.pathname, tabs, activeTab, projectNames]);

  // Update tabs and optionally navigate to default
  const handleSetTabs = (newTabs: HeaderTab[]) => {
    setTabs(newTabs);
    previousTabsRef.current = newTabs;
    if (newTabs.length === 0) return;

    const currentBasePath = getBasePath(projectNames, location.pathname);
    const tabIdFromUrl = getTabIdFromUrl(location.pathname, currentBasePath);
    const validTabIds = newTabs.map(tab => tab.id);

    if (tabIdFromUrl && validTabIds.includes(tabIdFromUrl)) {
      setActiveTab(tabIdFromUrl);
      return;
    }

    // Default to first tab
    const firstTabId = newTabs[0].id;
    setActiveTab(firstTabId);

    if (currentBasePath && shouldNavigateToTab(currentBasePath)) {
      if (currentBasePath === '/teams') {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const currentCommonTab = pathSegments[2];
        const commonTabToUse = (currentCommonTab && VALID_COMMON_TABS.includes(currentCommonTab))
          ? currentCommonTab
          : DEFAULT_COMMON_TAB;

        const targetPath = `${currentBasePath}/${firstTabId}/${commonTabToUse}`;
        if (location.pathname !== targetPath) {
          navigate(targetPath, { replace: true });
        }
      } else {
        const targetPath = `${currentBasePath}/${firstTabId}`;
        if (location.pathname !== targetPath) {
          navigate(targetPath, { replace: true });
        }
      }
    }
  };

  // Set active tab and navigate
  const handleSetActiveTab = (tabId: string) => {
    setActiveTab(tabId);

    const basePath = getBasePath(projectNames, location.pathname);
    if (!basePath || !shouldNavigateToTab(basePath)) return;

    if (basePath === '/teams') {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const currentCommonTab = pathSegments[2];
      const commonTabToUse = (currentCommonTab && VALID_COMMON_TABS.includes(currentCommonTab))
        ? currentCommonTab
        : DEFAULT_COMMON_TAB;

      const targetPath = `${basePath}/${tabId}/${commonTabToUse}`;
      if (location.pathname !== targetPath) navigate(targetPath, { replace: false });
    } else {
      const targetPath = `${basePath}/${tabId}`;
      if (location.pathname !== targetPath) navigate(targetPath, { replace: false });
    }
  };

  return (
    <HeaderNavigationContext.Provider
      value={{
        tabs,
        activeTab,
        setTabs: handleSetTabs,
        setActiveTab: handleSetActiveTab,
        isDropdown,
        setIsDropdown
      }}
    >
      {children}
    </HeaderNavigationContext.Provider>
  );
}

export function useHeaderNavigation() {
  const context = useContext(HeaderNavigationContext);
  if (!context) throw new Error('useHeaderNavigation must be used within a HeaderNavigationProvider');
  return context;
}