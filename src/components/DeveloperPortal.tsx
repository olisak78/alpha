import { Outlet } from "react-router-dom";

// Import extracted components
import ComponentDetailView from "@/components/ComponentDetailView";
import LandscapeDetailsDialog from "@/components/dialogs/LandscapeDetailsDialog";

// Import context and hooks
import { 
  usePortalState, 
  useLandscapeManagement, 
  useHealthAndAlerts,
  useRateLimiting,
  useLogLevels,
  useComponentManagement,
  useFeatureToggles
} from "@/contexts/hooks";
import { projectComponents } from "@/constants/developer-portal";
import { mockLogLevelsAcrossLandscapes } from "@/types/developer-portal";

interface DeveloperPortalProps {
  activeProject: string;
  onProjectChange: (project: string) => void;
}

export default function DeveloperPortal({ activeProject }: DeveloperPortalProps) {
  // Use context hooks instead of local state
  const {
    selectedComponent,
    setSelectedComponent,
    selectedLandscape,
    setSelectedLandscape,
    showLandscapeDetails,
    setShowLandscapeDetails,
  } = usePortalState();

  const {
    getCurrentProjectLandscapes,
    getLandscapeGroups,
  } = useLandscapeManagement();

  const {
    getDeployedVersion,
    getStatusColor,
  } = useHealthAndAlerts();

  const {
    rateLimitRules,
    setRateLimitRules,
  } = useRateLimiting();

  const {
    logLevels,
    setLogLevels,
  } = useLogLevels();

  const {
    getAvailableComponents,
  } = useComponentManagement();

  const {
    featureToggles,
  } = useFeatureToggles();

  // Get helper functions and data from context
  const currentProjectLandscapes = getCurrentProjectLandscapes(activeProject);
  const landscapeGroups = getLandscapeGroups(activeProject);
  
  if (selectedComponent) {
    const allComponents = Object.values(projectComponents).flat();
    const component = allComponents.find(c => c.id === selectedComponent);
    
    return (
        <ComponentDetailView
        component={component}
        selectedLandscape={selectedLandscape}
        landscapes={currentProjectLandscapes.map(l => ({
          ...l,
          status: l.status === "active" ? "active" : "inactive",
          deploymentStatus: (["deployed", "deploying", "failed"].includes(l.deploymentStatus)
            ? l.deploymentStatus
            : "deployed") as "deployed" | "deploying" | "failed"
        }))}
        landscapeGroups={landscapeGroups}
        activeProject={activeProject}
        rateLimitRules={rateLimitRules}
        onRateLimitRulesChange={(rules) => setRateLimitRules(rules)}
        logLevels={logLevels}
        onLogLevelsChange={(levels) => setLogLevels(levels)}
        mockLogLevelsAcrossLandscapes={mockLogLevelsAcrossLandscapes}
        onBack={() => setSelectedComponent(null)}
        onLandscapeChange={setSelectedLandscape}
        getDeployedVersion={getDeployedVersion}
      />
    );
  }

  return (
    <div>
      {/* Content */}
      <div className="p-6">
        <Outlet />
      </div>

      {/* Landscape Details Dialog */}
      <LandscapeDetailsDialog
        open={showLandscapeDetails}
        onOpenChange={setShowLandscapeDetails}
        landscapeGroups={landscapeGroups}
        onSelectLandscape={(landscapeId) => {
          setSelectedLandscape(landscapeId);
          setShowLandscapeDetails(false);
        }}
        getStatusColor={getStatusColor}
      />
    </div>
  );
}
