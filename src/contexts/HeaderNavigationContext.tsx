import { DEFAULT_COMMON_TAB, VALID_COMMON_TABS } from '@/constants/developer-portal';
import { getBasePath, shouldNavigateToTab } from '@/utils/developer-portal-helpers';
import { createContext, useContext, useState, ReactNode, useLayoutEffect, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const [tabs, setTabs] = useState<HeaderTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isDropdown, setIsDropdown] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Keep track of the previous base path to detect actual route changes vs tab changes
  const previousBasePathRef = useRef<string | null>(null);
  const previousTabsRef = useRef<HeaderTab[]>([]);

  // Function to extract tab ID from current URL
  const getTabIdFromUrl = (pathname: string, basePath: string | null) => {
    if (!basePath) return null;

    const pathSegments = pathname.split('/').filter(Boolean);

    if (basePath === '/teams') {
      // For teams page: /teams/:tabId or /teams/:tabId/:commonTab
      return pathSegments[1] || null; // teams/[tabId]/commonTab
    } else {
      // For other pages, find the segment after the base path
      const baseSegments = basePath.split('/').filter(Boolean);
      const tabIndex = baseSegments.length;
      return pathSegments[tabIndex] || null;
    }
  };

  // Clear tabs on route change using useLayoutEffect to run before page useEffect
  // But only clear if the base path has actually changed (not just tab navigation)
  useLayoutEffect(() => {
    const currentBasePath = getBasePath(location.pathname);

    // Only clear when base path actually changed
    if (previousBasePathRef.current === null || previousBasePathRef.current !== currentBasePath) {
      setTabs([]);
      setActiveTab(null); // reset active tab so consumers don't react to stale activeTab
      previousBasePathRef.current = currentBasePath;
      previousTabsRef.current = [];
    }
  }, [location.pathname]);

  // Effect to sync activeTab with URL changes (for browser navigation like back/forward)
  useEffect(() => {
    if (tabs.length > 0) {
      const currentBasePath = getBasePath(location.pathname);
      const tabIdFromUrl = getTabIdFromUrl(location.pathname, currentBasePath);
      const validTabIds = tabs.map(tab => tab.id);

      // Only update if URL has a valid tab that differs from current activeTab
      if (tabIdFromUrl && validTabIds.includes(tabIdFromUrl) && tabIdFromUrl !== activeTab) {
        setActiveTab(tabIdFromUrl);
      }
    }
  }, [location.pathname, tabs, activeTab]);

  // Enhanced setTabs function that also syncs with URL
  const handleSetTabs = (newTabs: HeaderTab[]) => {
    setTabs(newTabs);
    previousTabsRef.current = newTabs;

    if (newTabs.length === 0) return;

    const currentBasePath = getBasePath(location.pathname);
    const tabIdFromUrl = getTabIdFromUrl(location.pathname, currentBasePath);
    const validTabIds = newTabs.map(tab => tab.id);

    if (tabIdFromUrl && validTabIds.includes(tabIdFromUrl)) {
      setActiveTab(tabIdFromUrl);
      return;
    }

    // URL doesn't have a valid tab — prefer the first tab
    const firstTabId = newTabs[0].id;
    setActiveTab(firstTabId);

    // Build intended path and only navigate if different
    if (currentBasePath && shouldNavigateToTab(currentBasePath)) {
      if (currentBasePath === '/teams') {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const currentCommonTab = pathSegments[2];
        const commonTabToUse = (currentCommonTab && VALID_COMMON_TABS.includes(currentCommonTab))
          ? currentCommonTab
          : DEFAULT_COMMON_TAB;

        const targetPath = `${currentBasePath}/${firstTabId}/${commonTabToUse}`;
        if (location.pathname !== targetPath) {
          // This is an automatic defaulting navigation; use replace to avoid history churn
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

  const handleSetActiveTab = (tabId: string) => {
    setActiveTab(tabId);

    const basePath = getBasePath(location.pathname);
    if (!basePath || !shouldNavigateToTab(basePath)) return;

    if (basePath === '/teams') {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const currentCommonTab = pathSegments[2];
      const commonTabToUse = (currentCommonTab && VALID_COMMON_TABS.includes(currentCommonTab))
        ? currentCommonTab
        : DEFAULT_COMMON_TAB;
      const targetPath = `${basePath}/${tabId}/${commonTabToUse}`;
      if (location.pathname !== targetPath) {
        navigate(targetPath, { replace: false });
      }
    } else {
      const targetPath = `${basePath}/${tabId}`;
      if (location.pathname !== targetPath) {
        navigate(targetPath, { replace: false });
      }
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
  if (context === undefined) {
    throw new Error('useHeaderNavigation must be used within a HeaderNavigationProvider');
  }
  return context;
}
