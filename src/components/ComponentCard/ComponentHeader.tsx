import { Badge } from "@/components/ui/badge";
import { Component } from "@/types/api";
import { HealthStatusBadge } from "./HealthStatusBadge";
import { SystemInfoBadges } from "./SystemInfoBadges";
import { type SystemInformation } from "@/services/healthApi";
import { PinButton } from "@/components/PinButton";

interface ComponentHeaderProps {
  component: Component;
  teamName?: string;
  teamColor?: string;
  systemInfo: SystemInformation | null;
  loadingSystemInfo: boolean;
  isDisabled: boolean;
}

export function ComponentHeader({
  component,
  teamName,
  teamColor,
  systemInfo,
  loadingSystemInfo,
  isDisabled,
}: ComponentHeaderProps) {
  return (
    <div>
      {/* Component Name and Team Badge Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate leading-tight">
            {component.title || component.name}
          </h3>
          {/* Only show health badge if not disabled */}
          {!isDisabled && (
            <HealthStatusBadge
              component={component}
              isDisabled={isDisabled}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {teamName && (
            <Badge
              variant="outline"
              className={`flex items-center gap-1 text-xs px-2 py-0.5 flex-shrink-0 text-white border-0 min-h-[24px] ${
                isDisabled ? 'bg-gray-500' : ''
              }`}
              {...(!isDisabled && teamColor ? { style: { backgroundColor: teamColor } } : {})}
            >
              <span>{teamName}</span>
            </Badge>
          )}
          <PinButton 
            component={component} 
            size={16} 
            showOnHover={true}
          />
        </div>
      </div>

      {/* Version and Central Service Badges Row */}
      <div className="flex items-center justify-between gap-2 py-3">
        <div className="flex items-center gap-1.5 flex-wrap min-h-[20px]">
          <SystemInfoBadges
            component={component}
            systemInfo={systemInfo}
            loadingSystemInfo={loadingSystemInfo}
            isDisabled={isDisabled}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {component['central-service'] && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              Central Service
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
