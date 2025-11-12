import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import ComponentDetailContent from "@/components/ComponentDetailContent";
import { RateLimitRule } from "@/types/developer-portal";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";

// Import context hooks
import {
  usePortalState,
  useLandscapeManagement,
  useHealthAndAlerts,
} from "@/contexts/hooks";

export default function ComponentDetailPage() {
  const { entityName } = useParams<{ entityName: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get all data from context
  const {
    selectedLandscape,
    setSelectedLandscape,
  } = usePortalState();

  const {
    getCurrentProjectLandscapes,
    getLandscapeGroups,
  } = useLandscapeManagement();

  const {
    getComponentHealth,
    getComponentAlerts,
    getDeployedVersion,
  } = useHealthAndAlerts();


  // State for rate limiting and log levels
  const [logLevels, setLogLevels] = useState<Record<string, string>>({});
  
  // Mock log levels across landscapes for demonstration
  const mockLogLevelsAcrossLandscapes: Record<string, Record<string, string>> = {
    "accounts-service": {
      "cf-eu10": "INFO",
      "cf-us10": "DEBUG",
      "cf-ap10": "WARN"
    },
    "billing-service": {
      "cf-eu10": "ERROR",
      "cf-us10": "INFO",
      "cf-ap10": "DEBUG"
    }
  };

  // Determine the system and project from the URL path
  const getSystemFromPath = (pathname: string) => {
    if (pathname.startsWith('/cis/')) return 'cis';
    if (pathname.startsWith('/unified-services/')) return 'unified-services';
    if (pathname.startsWith('/cloud-automation/')) return 'cloud-automation';
    return 'cis'; // default fallback
  };

  const getProjectFromSystem = (system: string) => {
    switch (system) {
      case 'cis':
        return 'CIS@2.0';
      case 'unified-services':
        return 'Unified Services';
      case 'cloud-automation':
        return 'Cloud Automation';
      default:
        return 'CIS@2.0';
    }
  };

  const currentSystem = getSystemFromPath(location.pathname);
  const activeProject = getProjectFromSystem(currentSystem);
  
  // Get data from context functions
  const currentProjectLandscapes = getCurrentProjectLandscapes(activeProject);
  const landscapeGroups = getLandscapeGroups(activeProject);

  // Get component from navigation state (passed from CisPage)
  const component = location.state?.component;

  // Redirect to appropriate system page if component not found
  useEffect(() => {
    if (!component) {
      navigate(`/${currentSystem}`);
    }
  }, [component, navigate, currentSystem]);

  const handleLandscapeChange = (landscape: string | null) => {
    setSelectedLandscape(landscape);
  };

  const handleRateLimitRulesChange = (rules: RateLimitRule[]) => {
    
  };

  const handleLogLevelsChange = (levels: Record<string, string>) => {
    setLogLevels(levels);
  };

  // Show loading or redirect if component not found
  if (!component) {
    return (
      <BreadcrumbPage>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Component not found</h2>
            <p className="text-muted-foreground">Redirecting to CIS page...</p>
          </div>
        </div>
      </BreadcrumbPage>
    );
  }

  return (
    <BreadcrumbPage>
      <ComponentDetailContent
      component={component}
      selectedLandscape={selectedLandscape}
      landscapes={currentProjectLandscapes}
      landscapeGroups={landscapeGroups}
      activeProject={activeProject}
      rateLimitRules={[]}
      onRateLimitRulesChange={handleRateLimitRulesChange}
      logLevels={logLevels}
      onLogLevelsChange={handleLogLevelsChange}
      mockLogLevelsAcrossLandscapes={mockLogLevelsAcrossLandscapes}
      onLandscapeChange={handleLandscapeChange}
      getDeployedVersion={getDeployedVersion}
    />
    </BreadcrumbPage>
  );
}
