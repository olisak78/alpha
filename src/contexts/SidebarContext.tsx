import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  sidebarWidth: number;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
const SIDEBAR_STORAGE_KEY = 'sidebar:expanded';

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage, default to true (expanded)
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });
  
  // Persist state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isExpanded));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [isExpanded]);
  
  // Width values matching your sidebar (collapsed: 64px, expanded: 208px)
  const sidebarWidth = isExpanded ? 208 : 64;

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarState must be used within SidebarProvider');
  }
  return context;
}