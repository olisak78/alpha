import { useState, useEffect } from "react";
import { useNavigate, useLocation} from "react-router-dom";
import { PortalProviders } from "@/contexts/PortalProviders";
import { PortalContent } from "./PortalContent";
import { useProjectsContext } from "@/contexts/ProjectsContext";

// Mapping from project/page to routes
const staticRouteToProjectMap: Record<string, string> = {
  "/": "Home",
  "/teams": "Teams",
  "/links": "Links",
  "/self-service": "Self Service",
  "/ai-arena": "AI Arena",
};

const staticProjectToRouteMap: Record<string, string> = {
  "Home": "/",
  "Teams": "/teams",
  "Self Service": "/self-service",
  "Links": "/links",
  "AI Arena": "/ai-arena",
};

export const PortalContainer: React.FC = () => {
  const { projects } = useProjectsContext(); 
  const navigate = useNavigate();
  const location = useLocation();
  const [activeProject, setActiveProject] = useState("");

  // Combine static pages with dynamic projects
  const sidebarItems = [
    "Home",
    "Teams",
    ...projects.map(project => project.title || project.name),
    "Links",
    "Self Service",
    "AI Arena",
  ];

  // Build dynamic route maps including projects
  const routeToProjectMap: Record<string, string> = { ...staticRouteToProjectMap };
  const projectToRouteMap: Record<string, string> = { ...staticProjectToRouteMap };

  projects.forEach(project => {
    const route = `/${project.name}`;
    routeToProjectMap[route] = project.title || project.name;
    projectToRouteMap[project.title || project.name] = route;
  });

  // Determine which project/page is active based on current URL
  const getProjectFromPath = (pathname: string): string => {
    // Dynamic projects - check first for exact matches and sub-routes
    for (const project of projects) {
      const route = project.name === 'cis20' ? '/cis' : `/${project.name}`;
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        return project.title || project.name;
      }
    }

    // Static pages - check for exact matches and sub-routes, but handle "/" specially
    if (pathname === "/") {
      return "Home";
    }

    // Check other static routes
    for (const route in staticRouteToProjectMap) {
      if (route !== "/" && (pathname === route || pathname.startsWith(`${route}/`))) {
        return staticRouteToProjectMap[route];
      }
    }

    return ""; // fallback
  };

  // Update activeProject whenever the location changes
  useEffect(() => {
    const project = getProjectFromPath(location.pathname);
    setActiveProject(project);
  }, [location.pathname, projects]);

  const handleProjectChange = (project: string) => {
    const route = projectToRouteMap[project] || "/";
    navigate(route);
    setActiveProject(project);
  };

  return (
    <PortalProviders activeProject={activeProject}>
      <PortalContent
        activeProject={activeProject}
        projects={sidebarItems}
        onProjectChange={handleProjectChange}
      />
    </PortalProviders>
  );
};
