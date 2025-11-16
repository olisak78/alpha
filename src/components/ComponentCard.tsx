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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Component } from "@/types/api";
import { useSonarMeasures } from "@/hooks/api/useSonarMeasures";
import { fetchSystemInfo, type SystemInformation } from "@/services/healthApi";

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
}: ComponentCardProps) {
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = useState<SystemInformation | null>(null);
  const [systemInfoUrl, setSystemInfoUrl] = useState<string | null>(null);
  const [loadingSystemInfo, setLoadingSystemInfo] = useState(false);

  // Navigate to component view page
  const handleComponentClick = () => {
    navigate(`/${system}/component/${component.name}`);
  };

  // Handle card click - only navigate if not clicking on buttons
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't navigate if clicking on buttons or interactive elements
    if (!target.closest('button') && !target.closest('a')) {
      handleComponentClick();
    }
  };

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

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border/60 hover:border-border">
      <CardContent className="p-4">
        {/* Header */}
        <div className="space-y-2.5">
          {/* Component Name and Team Badge Row */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-base truncate leading-tight">{component.title || component.name}</h3>
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
              {/* Version badge(s) - only when landscape is selected */}
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

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Quick action buttons */}
              {component.github && component.github.trim() !== '' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs"
                  onClick={(e) => openLink(e, component.github!)}>
                  <Github className="h-3 w-3 mr-1" />
                  GitHub
                </Button>
              )}
              {component.sonar && component.sonar.trim() !== '' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs"
                  onClick={(e) => openLink(e, component.sonar!)}>
                  <Activity className="h-3 w-3 mr-1" />
                  Sonar
                </Button>
              )}
              {/* System Info Link - only when landscape is selected and URL is available */}
              {selectedLandscape && systemInfoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs"
                  onClick={(e) => openLink(e, systemInfoUrl)}
                  title="Open System Information">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Version
                </Button>
              )}
            </div>
          </div>
          <Code className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
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
              <Github className="h-3 w-3 mr-1" />
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