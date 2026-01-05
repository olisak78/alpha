import { ProjectLayout } from "@/components/ProjectLayout";
import { useProjects } from "@/stores/projectsStore";
import { Project } from "@/types/api";

interface DynamicProjectPageProps {
  projectName: string;
}

export function DynamicProjectPage({ projectName }: DynamicProjectPageProps) {
  const projects = useProjects();

// Dynamic project configuration based on metadata or defaults
const getProjectConfig = (project: Project) => {
  const tabs = ['components'];

  // Check metadata for additional tabs
  if (project.health) {
  // Add health tab if health metadata exists
    tabs.push('health');
  }

  if (project.monitoring) {
    tabs.push('monitoring');
  }

  // Add Deployment tab for CIS2 project (or any project with deployment metadata)
  if (project.name === 'cis20' || (project.metadata && 'concourse' in project.metadata)) {
    tabs.push('deployment');
  }


  const defaultConfig = {
    tabs: tabs,
    system: project.name,
    showLandscapeFilter: true,
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
      alertsUrl={config.alertsUrl}
    />
  );
}