import React, { createContext, useContext } from "react";
import { useFetchProjects } from "@/hooks/api/useProjects";
import { Project } from "@/types/api";



interface ProjectsContextValue {
  projects: Project[];
  isLoading: boolean;
  error: any;
  sidebarItems: string[];
}

const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);

// Define default projects that should always be at the top
const DEFAULT_PROJECT_NAMES = ['cis20', 'ca', 'usrv'];

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading, error } = useFetchProjects();
  const rawProjects = data || [];

  // Sort projects to put default projects at the top
  const projects = React.useMemo(() => {
    const defaultProjects: Project[] = [];
    const otherProjects: Project[] = [];

    rawProjects.forEach((project: Project) => {
      if (DEFAULT_PROJECT_NAMES.includes(project.name)) {
        defaultProjects.push(project);
      } else {
        otherProjects.push(project);
      }
    });

    // Sort default projects in the specified order
    defaultProjects.sort((a, b) => {
      const aIndex = DEFAULT_PROJECT_NAMES.indexOf(a.name);
      const bIndex = DEFAULT_PROJECT_NAMES.indexOf(b.name);
      return aIndex - bIndex;
    });

    return [...defaultProjects, ...otherProjects];
  }, [rawProjects, DEFAULT_PROJECT_NAMES]);

  // Define the static sidebar items
  const sidebarItems: string[] = [
    "Home",
    "Teams",
    ...projects.map((p: Project) => p.title || p.name),
    "Links",
   // "Plugins",
    "Self Service",
    "AI Arena"
  ];

  return (
    <ProjectsContext.Provider value={{ projects, isLoading, error, sidebarItems }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjectsContext = () => {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error("useProjectsContext must be used within a ProjectsProvider");
  return context;
};
