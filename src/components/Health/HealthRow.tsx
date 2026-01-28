import React, { useMemo } from 'react';
import type { ComponentHealthCheck } from '@/types/health';
import type { Component } from '@/types/api';
import { HealthStatusBadge } from '../ComponentCard/HealthStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PinButton } from '@/components/PinButton';
import { Activity } from 'lucide-react';
import { GithubIcon } from '../icons/GithubIcon';
import { cn } from '@/lib/utils';
import { useComponentDisplay } from '@/contexts/ComponentDisplayContext';
import { useComponentOwner } from '@/hooks/useComponentOwner';

interface HealthRowProps {
  healthCheck: ComponentHealthCheck;
  isExpanded: boolean;
  onToggle: () => void;
  onComponentClick?: (componentName: string) => void;
  isUnsupported?: boolean;
  component: Component;
}

export function HealthRow({
  healthCheck,
  onComponentClick,
  component,
}: HealthRowProps) {
  const { 
    isCentralLandscape, 
    noCentralLandscapes,
    componentSystemInfoMap, 
    isLoadingSystemInfo,
    teamNamesMap,
    teamColorsMap
  } = useComponentDisplay();
  
  // Get team info from context - same as ComponentCard
  const { teamNames, teamColors, displayName } = useComponentOwner(component);
  
  // Get URLs from component data - same as ComponentCard
  const githubUrl = component.github;
  const sonarUrl = component.sonar;
  
  // Calculate disabled state - same logic as ComponentCard
  const isDisabled = component['central-service'] === true && !isCentralLandscape && !noCentralLandscapes;
  
  // Memoized version badges to avoid IIFE overhead on every render
  const versionBadges = useMemo(() => {
    if (!component) return null;
    
    const systemInfo = componentSystemInfoMap[component.id];
    
    if (!systemInfo) return null;
    
    // Check for direct app/sapui5 properties (from /version endpoint)
    if (systemInfo.app || systemInfo.sapui5) {
      return (
        <>
          {systemInfo.app && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-muted-foreground">
              App: {systemInfo.app}
            </Badge>
          )}
          {systemInfo.sapui5 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-muted-foreground">
              UI5: {systemInfo.sapui5}
            </Badge>
          )}
        </>
      );
    }
    
    // Check for version in buildProperties (from /systemInformation/public)
    const version = systemInfo.buildProperties?.version;
    if (version) {
      // Check if version is an object with app/sapui5 properties
      if (typeof version === 'object' && version !== null) {
        return (
          <>
            {version.app && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-muted-foreground">
                App: {version.app}
              </Badge>
            )}
            {version.sapui5 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-muted-foreground">
                UI5: {version.sapui5}
              </Badge>
            )}
          </>
        );
      }
      
      // Simple string version
      if (typeof version === 'string') {
        return (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-muted-foreground">
            {version}
          </Badge>
        );
      }
    }
    
    return null;
  }, [component, componentSystemInfoMap]);

  const formatResponseTime = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatLastChecked = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString();
  };

  const handleRowClick = () => {
    // Make all components clickable when health is enabled - same as ComponentCard
    if (onComponentClick && component.name) {
      onComponentClick(component.name);
    }
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (url && url.trim() !== '' && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const isClickable = onComponentClick && component.health === true; // Same logic as ComponentCard

  return (
    <>
      <tr
        className={cn(
          "transition-colors group",
          isDisabled && "opacity-50 bg-muted/50",
          !isDisabled && "hover:bg-gray-50 dark:hover:bg-gray-900/50",
          isClickable ? 'cursor-pointer' : ''
        )}
        onClick={isClickable ? handleRowClick : undefined}
      >
        {/* Pin Column */}
        <td className="px-3 py-4 whitespace-nowrap pointer-events-auto">
          <PinButton 
            component={component} 
            size={16} 
            showOnHover={true}
          />
        </td>

        <td className={cn(
          "px-6 py-4 whitespace-nowrap",
          isClickable ? 'cursor-pointer' : ''
        )}>
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {healthCheck.componentName}
                </span>
                {/* Version badges for all components (central and non-central) */}
                {component && (
                  <>
                    {isLoadingSystemInfo ? (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-muted-foreground">
                        Loading...
                      </Badge>
                    ) : (
                      versionBadges
                    )}
                  </>
                )}
                {/* Central Service Badge */}
                {component?.['central-service'] && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-muted-foreground">
                    Central Service
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {healthCheck.componentId}
              </span>
            </div>
          </div>
        </td>
        <td className={cn(
          "px-6 py-4 whitespace-nowrap",
          isClickable ? 'cursor-pointer' : ''
        )}>
          <HealthStatusBadge
            component={component}
            isDisabled={isDisabled}
          />
        </td>
        <td className={cn(
          "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400",
          isClickable ? 'cursor-pointer' : ''
        )}>
          {formatResponseTime(healthCheck.responseTime)}
        </td>
        <td className={cn(
          "px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400",
          isClickable ? 'cursor-pointer' : ''
        )}>
          {formatLastChecked(healthCheck.lastChecked)}
        </td>
        <td className={cn(
          "px-6 py-4 whitespace-nowrap",
          isClickable ? 'cursor-pointer' : ''
        )}>
          {teamNames && teamNames.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {teamNames.map((teamName, index) => (
                <Badge
                  key={teamName}
                  variant="outline"
                  className={`text-xs px-1.5 py-0.5 flex-shrink-0 text-white border-0 min-h-[24px] ${
                    isDisabled ? 'bg-gray-500' : ''
                  }`}
                  {...(!isDisabled && teamColors[index] ? { style: { backgroundColor: teamColors[index] } } : {})}
                >
                  {teamName}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap pointer-events-auto">
          {githubUrl && githubUrl.trim() !== '' && githubUrl !== '#' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleLinkClick(githubUrl, e)}
              className="h-8 px-2"
            >
              <GithubIcon className="h-4 w-4" />
            </Button>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap pointer-events-auto">
          {sonarUrl && sonarUrl.trim() !== '' && sonarUrl !== '#' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleLinkClick(sonarUrl, e)}
              className="h-8 px-2"
            >
              <Activity className="h-4 w-4" />
            </Button>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
          )}
        </td>
      </tr>
    </>
  );
}
