import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Code,
  ExternalLink,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Github,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Component } from "@/types/api";
import { useSonarMeasures } from "@/hooks/api/useSonarMeasures";
import { fetchSystemInfo, type SystemInformation } from "@/services/healthApi";
import type { ComponentHealthCheck, HealthStatus } from "@/types/health";
import { GithubIcon } from "./icons/GithubIcon";

interface ComponentCardProps {
  component: Component;
  selectedLandscape: string | null;
  selectedLandscapeName?: string;
  selectedLandscapeData?: any;
  expandedComponents: Record<string, boolean>;
  onToggleExpanded: (componentId: string) => void;
  getComponentHealth: (componentId: string, landscape: string | null) => string;
  getComponentAlerts: (componentId: string, landscape: string | null) => boolean | null;
  system: string;
  teamName?: string;
  teamColor?: string;
  healthCheck?: ComponentHealthCheck;
  isLoadingHealth?: boolean;
  onClick?: () => void;
}

export default function ComponentCard({
  component,
  system,
  expandedComponents,
  onToggleExpanded,
  selectedLandscape,
  selectedLandscapeData,
  teamName,
  teamColor,
  // NEW: Destructure health check props
  healthCheck,
  isLoadingHealth = false,
  onClick,
}: ComponentCardProps) {
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = useState<SystemInformation | null>(null);
  const [loadingSystemInfo, setLoadingSystemInfo] = useState(false);

  // Navigate to component view page
  const handleComponentClick = () => {
    navigate(`/${system}/component/${component.name}`);
  };

  // Handle card click - only navigate if not clicking on buttons
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
   const isHealthUp = !healthCheck || healthCheck.status === 'UP';
    if (!target.closest('button') && !target.closest('a') && onClick && isHealthUp) {
      handleComponentClick();
    }
  };
  const isClickable = onClick && (!healthCheck || healthCheck.status === 'UP');

  // SonarQube integration
  const { data: sonarMetrics, isLoading: sonarLoading } = useSonarMeasures(
    component.sonar || null,
    true
  );

  const formatMetric = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return value.toString();
  };

  const openLink = (url: string) => {
    if (url && url !== "#") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const getHealthStatusBadge = () => {
    // Only show health status when a landscape is selected
    if (!selectedLandscape) return null;

    // Show loading state while fetching health data
    if (isLoadingHealth) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Checking</span>
        </Badge>
      );
    }

    // If no health check data available, don't show badge
    if (!healthCheck) return null;

    const status = healthCheck.status;

    // Render appropriate badge based on health status
    switch (status) {
      case 'UP':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>UP</span>
          </Badge>
        );
      case 'DOWN':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>DOWN</span>
          </Badge>
        );
      case 'UNKNOWN':
      case 'OUT_OF_SERVICE':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span>UNKNOWN</span>
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
            <AlertTriangle className="h-3 w-3" />
            <span>ERROR</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card  style={isClickable ? { cursor: 'pointer' } : undefined}
      onClick={isClickable ? handleCardClick : undefined} className="hover:shadow-lg transition-all duration-200 border-border/60 hover:border-border">
      <CardContent className="p-4">
        {/* Header */}
        <div className="space-y-2.5">
          {/* Component Name and Team Badge Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate leading-tight">{component.title || component.name}</h3>
              {getHealthStatusBadge()}
            </div>
            {teamName && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 flex-shrink-0 text-white border-0"
                style={{ backgroundColor: teamColor || '#6b7280' }}
              >
                {teamName}
              </Badge>
            )}
          </div>

          {/* Version Badges and Action Buttons Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap min-h-[20px]">
              {selectedLandscape && systemInfo && (() => {
                // Check for direct app/sapui5 properties (from /version endpoint)
                if (systemInfo.app || systemInfo.sapui5) {
                  return (
                    <>
                      {systemInfo.app && (
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                          App: {systemInfo.app}
                        </Badge>
                      )}
                      {systemInfo.sapui5 && (
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                          UI5: {systemInfo.sapui5}
                        </Badge>
                      )}
                    </>
                  );
                }

                // Check for version in buildProperties (from /systemInformation/public)
                const version = systemInfo.buildProperties?.version;
                if (!version) return null;

                // Check if version is an object with app/sapui5 properties
                if (typeof version === 'object' && version !== null) {
                  return (
                    <>
                      {version.app && (
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                          App: {version.app}
                        </Badge>
                      )}
                      {version.sapui5 && (
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                          UI5: {version.sapui5}
                        </Badge>
                      )}
                    </>
                  );
                }
                // Simple string version
                return (
                  <Badge variant="outline" className="text-[11px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                    {version}
                  </Badge>
                );
              })()}
              {selectedLandscape && loadingSystemInfo && (
                <span className="text-[11px] text-muted-foreground">Loading...</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pb-6">
          {component.github && component.github.trim() !== '' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                openLink(component.github!);
              }}
            >
              <GithubIcon className="h-3 w-3 mr-1" />
              GitHub
            </Button>
          )}
          {component.sonar && component.sonar.trim() !== '' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                openLink(component.sonar!);
              }}
            >
              <Activity className="h-3 w-3 mr-1" />
              Sonar
            </Button>
          )}
        </div>

        {/* Quality Metrics Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
            <Shield className="h-3.5 w-3.5 mb-1 text-blue-600" />
            <span className="font-semibold text-xs">
              {sonarLoading ? '...' : `${formatMetric(sonarMetrics?.coverage)}%`}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Coverage</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
            <AlertTriangle className="h-3.5 w-3.5 mb-1 text-yellow-600" />
            <span className="font-semibold text-xs">
              {sonarLoading ? '...' : formatMetric(sonarMetrics?.vulnerabilities)}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Vulns</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
            <Activity className="h-3.5 w-3.5 mb-1 text-orange-600" />
            <span className="font-semibold text-xs">
              {sonarLoading ? '...' : formatMetric(sonarMetrics?.codeSmells ?? null)}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Smells</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
            <CheckCircle className={`h-3.5 w-3.5 mb-1 ${sonarMetrics?.qualityGate === 'Passed' ? 'text-green-600' : 'text-red-500'}`} />
            <span className="font-semibold text-xs truncate max-w-full">
              {sonarLoading ? '...' : (sonarMetrics?.qualityGate ?? 'N/A')}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Gate</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}