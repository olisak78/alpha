import { ProjectLayout } from "@/components/ProjectLayout";
import { useProjectsContext } from "@/contexts/ProjectsContext";
import { Project } from "@/types/api";

interface DynamicProjectPageProps {
  projectName: string;
}

export function DynamicProjectPage({ projectName }: DynamicProjectPageProps) {
  const { projects } = useProjectsContext();

// Dynamic project configuration based on metadata or defaults
const getProjectConfig = (project: Project) => {
  const tabs = ['components'];
  
  // Check metadata for additional tabs
  if (project.health) {
    // Add health tab if health metadata exists
      tabs.push('health');
    }
    
    // Add alerts tab if alerts metadata exists
    if (project.alerts && typeof project.alerts === 'string' && project.alerts.trim() !== '') {
      tabs.push('alerts');
    }
  

  const defaultConfig = {
    tabs: tabs,
    system: project.name,
    showLandscapeFilter: true,
    showComponentMetrics: project['components-metrics'] === true,
    alertsUrl: typeof project.alerts === 'string' ? project.alerts : undefined,

  };

  return defaultConfig;
};

  const project = projects.find(p => p.name === projectName);
  
  if (!project) {
    return <div className="text-center text-destructive py-8">Error: Project {projectName} not found</div>;
  }

  const config = getProjectConfig(project);

  return (
    <ProjectLayout
      projectName={project.title}
      projectId={project.name}
      defaultTab="components" // Always default to components tab
      tabs={config.tabs}
      componentsTitle={`${project.title} Components`}
      emptyStateMessage={`No ${project.title} components found for this organization.`}
      system={config.system}
      showLandscapeFilter={config.showLandscapeFilter}
      showComponentsMetrics={config.showComponentMetrics} 
      alertsUrl={config.alertsUrl}
    />
  );
}
