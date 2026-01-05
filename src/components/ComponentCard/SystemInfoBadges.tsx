import { Badge } from "@/components/ui/badge";
import { Component } from "@/types/api";
import { type SystemInformation } from "@/services/healthApi";
import { useComponentDisplay } from "@/contexts/ComponentDisplayContext";

interface SystemInfoBadgesProps {
  component: Component;
  systemInfo: SystemInformation | null;
  loadingSystemInfo: boolean;
  isDisabled: boolean;
}

export function SystemInfoBadges({ 
  component, 
  systemInfo, 
  loadingSystemInfo, 
  isDisabled 
}: SystemInfoBadgesProps) {
  const { selectedLandscape } = useComponentDisplay();
  if (isDisabled) {
    return (
      <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
        Not Available in this Landscape
      </Badge>
    );
  }

  if (!selectedLandscape) {
    return null;
  }

  if (loadingSystemInfo) {
    return (
      <span className="text-xs text-muted-foreground">Loading...</span>
    );
  }

  if (!systemInfo) {
    return null;
  }

  // Check for direct app/sapui5 properties (from /version endpoint)
  if (systemInfo.app || systemInfo.sapui5) {
    return (
      <>
        {systemInfo.app && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
            App: {systemInfo.app}
          </Badge>
        )}
        {systemInfo.sapui5 && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
            UI5: {systemInfo.sapui5}
          </Badge>
        )}
      </>
    );
  }

  // Check for version in buildProperties (from /systemInformation/public)
  const version = systemInfo.buildProperties?.version;
  if (!version) {
    return null;
  }

  // Check if version is an object with app/sapui5 properties
  if (typeof version === 'object' && version !== null) {
    return (
      <>
        {version.app && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
            App: {version.app}
          </Badge>
        )}
        {version.sapui5 && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
            UI5: {version.sapui5}
          </Badge>
        )}
      </>
    );
  }

  // Simple string version
  if (typeof version === 'string') {
    return (
      <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
        {version}
      </Badge>
    );
  }
  
  return null;
}
