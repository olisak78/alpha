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
}

export default function ComponentCard({
  component,
  system,
  expandedComponents,
  onToggleExpanded,
  selectedLandscape,
  selectedLandscapeData,
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
    <Card
      className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/50"
      onClick={handleCardClick}
    >
      {/* Hover effect gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <CardContent className="p-4 relative">
        {/* Component Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
              {component.title || component.name}
            </h3>
            {component.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {component.description}
              </p>
            )}
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