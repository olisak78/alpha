import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandscapeFilter } from "@/components/LandscapeFilter";
import { LandscapeToolsButtons } from "@/components/LandscapeToolsButtons";
import { DEFAULT_LANDSCAPE } from "@/types/developer-portal";

interface LandscapeGroup {
  id: string;
  name: string;
  landscapes: Array<{
    id: string;
    name: string;
  }>;
}

interface LandscapeLinksProps {
  selectedLandscape: string | null;
  selectedLandscapeData?: any;
  landscapeGroups: LandscapeGroup[];
  onLandscapeChange: (landscapeId: string | null) => void;
  onShowLandscapeDetails: () => void;
  hiddenButtons?: Array<'git' | 'concourse' | 'kibana' | 'dynatrace' | 'cockpit' | 'plutono'>;
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
  hiddenButtons = []
}: LandscapeLinksProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">Landscape Links</h2>
        <div className="flex items-center gap-2">
          {selectedLandscape && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLandscapeChange(null)}
              className="h-9 px-2.5 text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear selection
            </Button>
          )}
          <div className="w-80">
            <LandscapeFilter
              selectedLandscape={selectedLandscape}
              landscapeGroups={landscapeGroups}
              onLandscapeChange={onLandscapeChange}
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
          hiddenButtons={hiddenButtons}
        />
      </div>
    </div>
  );
}
