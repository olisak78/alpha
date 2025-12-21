import { useMemo } from "react";
import { LandscapeFilter } from "@/components/LandscapeFilter";
import { LandscapeToolsButtons } from "@/components/LandscapeToolsButtons";
import { Ops2goLandscapeInfo } from "@/components/Ops2goLandscapeInfo";

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
        <h2 className="text-2xl font-semibold text-foreground">Landscape Links</h2>
        <div className="flex items-center gap-2">
          <div className="w-80">
            <LandscapeFilter
              selectedLandscape={selectedLandscape}
              landscapeGroups={landscapeGroupsRecord}
              onLandscapeChange={onLandscapeChange}
              onShowLandscapeDetails={onShowLandscapeDetails}
              showClearButton={false}
              showViewAllButton={false}
              projectId={projectId}
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

      {/* Ops2go Landscape Information */}
      {selectedLandscapeData && (
        <Ops2goLandscapeInfo landscapeName={selectedLandscapeData.technical_name} />
      )}
    </div>
  );
}
