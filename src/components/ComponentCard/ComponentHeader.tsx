import { Badge } from "@/components/ui/badge";
import { Component } from "@/types/api";
import { HealthStatusBadge } from "./HealthStatusBadge";
import { SystemInfoBadges } from "./SystemInfoBadges";
import { type SystemInformation } from "@/services/healthApi";
import { PinButton } from "@/components/PinButton";

interface ComponentHeaderProps {
  component: Component;
  teamNames?: string[];
  teamColors?: string[];
  systemInfo: SystemInformation | null;
  loadingSystemInfo: boolean;
  isDisabled: boolean;
}

export function ComponentHeader({
  component,
  teamNames = [],
  teamColors = [],
  systemInfo,
  loadingSystemInfo,
  isDisabled,
}: ComponentHeaderProps) {
  return (
    <div className="group">
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
          {teamNames.length > 0 && teamNames.map((teamName, index) => (
            <Badge
              key={`${teamName}-${index}`}
              variant="outline"
              className={`flex items-center gap-1 text-xs px-2 py-0.5 flex-shrink-0 text-white border-0 min-h-[24px] ${
                isDisabled ? 'bg-gray-500' : ''
              }`}
              {...(!isDisabled && teamColors[index] ? { style: { backgroundColor: teamColors[index] } } : {})}
            >
              <span>{teamName}</span>
            </Badge>
          ))}
          <div className={`overflow-hidden transition-all duration-200 ${
            component.isPinned 
              ? 'w-4' 
              : 'w-0 group-hover:w-4'
          }`}>
            <PinButton 
              component={component} 
              size={16} 
              showOnHover={false}
            />
          </div>
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
