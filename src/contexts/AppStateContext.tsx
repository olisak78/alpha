import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import teamData from '@/data/team/my-team.json';
import { useLocation } from 'react-router-dom';
import { STORAGE_KEYS } from '@/constants/developer-portal';
import { usePersistedState } from '@/hooks/usePersistedState';

interface AppStateContextType {
  // User State
  currentDevId: string;
  setCurrentDevId: (id: string) => void;
  
  // Navigation & UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  timelineViewMode: "table" | "chart";
  setTimelineViewMode: (mode: "table" | "chart") => void;
  showLandscapeDetails: boolean;
  setShowLandscapeDetails: (show: boolean) => void;
  
  // Selection State
  selectedComponent: string | null;
  setSelectedComponent: (component: string | null) => void;
  selectedLandscape: string | null;
  setSelectedLandscape: (landscape: string | null) => void;
  
  // Notifications
  meHighlightNotifications: boolean;
  setMeHighlightNotifications: (highlight: boolean) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

interface AppStateProviderProps {
  children: ReactNode;
}

// Helper hook to safely use router
function useSafeLocation() {
  try {
    return useLocation();
  } catch {
    // Return a mock location object if router is not available
    return { pathname: '/', search: '', hash: '', state: null, key: 'default' };
  }
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const location = useSafeLocation();
 // Persisted state using the custom hook
  const [currentDevId, setCurrentDevId] = usePersistedState(
    STORAGE_KEYS.CURRENT_DEV, 
    teamData.members?.[0]?.id || "u1"
  );
  
  const [timelineViewMode, setTimelineViewMode] = usePersistedState<"table" | "chart">(
    STORAGE_KEYS.TIMELINE_VIEW_MODE, 
    "table"
  );
  
  const [selectedLandscape, setSelectedLandscape] = usePersistedState<string | null>(
    STORAGE_KEYS.SELECTED_LANDSCAPE, 
    null
  );

  // Non-persisted state (session-only)
  const [activeTab, setActiveTab] = useState("components");
  const [showLandscapeDetails, setShowLandscapeDetails] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [meHighlightNotifications, setMeHighlightNotifications] = useState(false);

  const value: AppStateContextType = {
    currentDevId,
    setCurrentDevId,
    activeTab,
    setActiveTab,
    timelineViewMode,
    setTimelineViewMode,
    showLandscapeDetails,
    setShowLandscapeDetails,
    selectedComponent,
    setSelectedComponent,
    selectedLandscape,
    setSelectedLandscape,
    meHighlightNotifications,
    setMeHighlightNotifications,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
