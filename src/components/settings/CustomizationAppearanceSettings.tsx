import React from 'react';
import { Separator } from "@/components/ui/separator";
import ProjectVisibilitySection from './ProjectVisibilitySection';
import ThemeSection from './ThemeSection';

interface CustomizationAppearanceSettingsProps {
  visibilityState: { [projectId: string]: boolean };
  onVisibilityChange: (projectId: string, visible: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function CustomizationAppearanceSettings({
  visibilityState,
  onVisibilityChange,
  onSelectAll,
  onDeselectAll
}: CustomizationAppearanceSettingsProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-2">
        {/* Main Title Section */}
        <div className="mb-6 flex-shrink-0">
          <h3 className="text-lg font-semibold mb-2">Customization/Appearance</h3>
          <Separator className="mt-4" />
        </div>
        
        {/* Customization Section */}
        <div className="mb-6 flex-shrink-0">
          <h4 className="text-md font-medium mb-4">Customization</h4>
          
          <ProjectVisibilitySection
            visibilityState={visibilityState}
            onVisibilityChange={onVisibilityChange}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
          />
        </div>

        {/* Appearance Section */}
        <div className="flex-shrink-0">
          <h4 className="text-md font-medium mb-4">Appearance</h4>
          <ThemeSection />
        </div>
      </div>
    </div>
  );
}
