import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  showLandscapeDetails: boolean;
  setShowLandscapeDetails: (show: boolean) => void;
  timelineViewMode: 'table' | 'chart';
  setTimelineViewMode: (mode: 'table' | 'chart') => void;
  meHighlightNotifications: boolean;
  setMeHighlightNotifications: (highlight: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      showLandscapeDetails: false,
      setShowLandscapeDetails: (show) => set({ showLandscapeDetails: show }),
      timelineViewMode: 'table',
      setTimelineViewMode: (mode) => set({ timelineViewMode: mode }),
      meHighlightNotifications: false,
      setMeHighlightNotifications: (highlight) => set({ meHighlightNotifications: highlight }),
    }),
    { name: 'ui-storage' }
  )
);