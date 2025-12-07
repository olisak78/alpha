import { useMemo, useEffect, useCallback } from "react";
import { LandscapeFilter } from "@/components/LandscapeFilter";
import { LandscapeToolsButtons } from "@/components/LandscapeToolsButtons";

interface LandscapeGroup {
  id: string;
  name: string;
  landscapes: Array<{
    id: string;
    name: string;
    isCentral: boolean;
  }>;
}

interface LandscapeLinksProps {
  selectedLandscape: string | null;
  selectedLandscapeData?: any;
  landscapeGroups: LandscapeGroup[];
  onLandscapeChange: (landscapeId: string | null) => void;
  onShowLandscapeDetails: () => void;
  projectId?: string;
}

/**
 * Reusable Landscape Links Section
 *
 * Displays a prominent section with landscape tools and selector
 * Used across CisPage, CloudAutomationPage, and UnifiedServicesPage
 */
export function LandscapeLinksSection({
  selectedLandscape,
  selectedLandscapeData,
  landscapeGroups,
  onLandscapeChange,
  onShowLandscapeDetails,
  projectId,
}: LandscapeLinksProps) {

  // localStorage key for saving selected landscapes array
  const LANDSCAPES_STORAGE_KEY = 'selectedLandscapes';

  // Helper function to get saved landscapes from localStorage
  const getSavedLandscapes = useCallback((): Array<{projectId: string, landscapeId: string}> => {
    try {
      const saved = localStorage.getItem(LANDSCAPES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to parse saved landscapes from localStorage:', error);
      return [];
    }
  }, []);

  // Helper function to save landscapes to localStorage
  const saveLandscapes = useCallback((landscapes: Array<{projectId: string, landscapeId: string}>) => {
    try {
      localStorage.setItem(LANDSCAPES_STORAGE_KEY, JSON.stringify(landscapes));
    } catch (error) {
      console.warn('Failed to save landscapes to localStorage:', error);
    }
  }, []);

  // Load saved landscape from localStorage on component mount and when projectId changes
  useEffect(() => {
    // Clean up old localStorage keys on first load
    try {
      const keysToRemove = ['selectedLandscape', 'landscape', 'currentLandscape'];
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to remove old landscape keys from localStorage:', error);
    }

    // Try to restore saved landscape if we have the necessary data
    if (landscapeGroups.length > 0 && projectId) {
      try {
        const savedLandscapes = getSavedLandscapes();
        const projectLandscape = savedLandscapes.find(item => item.projectId === projectId);
        
        if (projectLandscape) {
          // Verify the saved landscape still exists in the available landscapes
          const allLandscapes = landscapeGroups.flatMap(group => group.landscapes);
          const landscapeExists = allLandscapes.some(landscape => landscape.id === projectLandscape.landscapeId);
          
          if (landscapeExists) {
            // Only restore if the current selection is different from the saved one
            if (selectedLandscape !== projectLandscape.landscapeId) {
              console.log('Restoring saved landscape:', projectLandscape.landscapeId, 'for project:', projectId, 'current:', selectedLandscape);
              onLandscapeChange(projectLandscape.landscapeId);
            }
          } else {
            // Remove invalid landscape from saved data
            console.log('Removing invalid saved landscape:', projectLandscape.landscapeId, 'for project:', projectId);
            const updatedLandscapes = savedLandscapes.filter(item => item.projectId !== projectId);
            saveLandscapes(updatedLandscapes);
          }
        }
      } catch (error) {
        console.warn('Failed to load saved landscape from localStorage:', error);
      }
    }
  }, [landscapeGroups, projectId, selectedLandscape, onLandscapeChange, getSavedLandscapes, saveLandscapes]);

  // Wrapper function to save landscape selection to localStorage
  const handleLandscapeChange = (landscapeId: string | null) => {
    if (projectId) {
      try {
        const savedLandscapes = getSavedLandscapes();
        const filteredLandscapes = savedLandscapes.filter(item => item.projectId !== projectId);
        
        if (landscapeId) {
          // Add or update the landscape for this project
          filteredLandscapes.push({ projectId, landscapeId });
        }
        // If landscapeId is null, we just remove the entry (already filtered out above)
        
        saveLandscapes(filteredLandscapes);
      } catch (error) {
        console.warn('Failed to save landscape to localStorage:', error);
      }
    }
    
    onLandscapeChange(landscapeId);
  };

  // Convert LandscapeGroup[] to Record<string, Landscape[]> for LandscapeFilter
  // Memoize to prevent infinite re-renders and API calls
  const landscapeGroupsRecord = useMemo(() => {
    return landscapeGroups.reduce((acc, group) => {
      acc[group.name] = group.landscapes.map(landscape => ({
        id: landscape.id,
        name: landscape.name,
        status: 'active', // Default status since it's not provided in the simplified format
        isCentral: landscape.isCentral || false
      }));
      return acc;
    }, {} as Record<string, any[]>);
  }, [landscapeGroups]);

 
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">Landscape Links</h2>
        <div className="flex items-center gap-2">
          <div className="w-80">
            <LandscapeFilter
              selectedLandscape={selectedLandscape}
              landscapeGroups={landscapeGroupsRecord}
              onLandscapeChange={handleLandscapeChange}
              onShowLandscapeDetails={onShowLandscapeDetails}
              showClearButton={false}
              showViewAllButton={false}
            />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <LandscapeToolsButtons
          selectedLandscape={selectedLandscape}
          landscapeData={selectedLandscapeData}
        />
      </div>
    </div>
  );
}
