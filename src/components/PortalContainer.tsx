import { useState, useEffect } from "react";
import { useNavigate, useLocation} from "react-router-dom";
import { PortalProviders } from "@/contexts/PortalProviders";
import { PortalContent } from "./PortalContent";
import { useProjects, useSidebarItems } from "@/stores/projectsStore";

// Mapping from project/page to routes
const staticRouteToProjectMap: Record<string, string> = {
  "/": "Home",
  "/teams": "Teams",
  "/links": "Links",
  "/self-service": "Self Service",
  "/ai-arena": "AI Arena",
  "/plugin-marketplace": "Plugin Marketplace",  
};

const staticProjectToRouteMap: Record<string, string> = {
  "Home": "/",
  "Teams": "/teams",
  "Self Service": "/self-service",
  "Links": "/links",
  "AI Arena": "/ai-arena",
  "Plugin Marketplace": "/plugin-marketplace",
};

export const PortalContainer: React.FC = () => {
  const projects = useProjects();
  const sidebarItems = useSidebarItems();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [activeProject, setActiveProject] = useState("");

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
    // Check for pinned plugin routes first (e.g., /plugins/some-plugin-slug)
    if (pathname.startsWith('/plugins/') && pathname !== '/plugins') {
      // Return the full path as the active project so sidebar can highlight it
      return pathname;
    }

    // Dynamic projects - check first for exact matches and sub-routes
    for (const project of projects) {
      const route = `/${project.name}`;
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
    // Handle pinned plugin navigation (format: "plugins/{slug}")
    if (project.startsWith('plugins/')) {
      navigate(`/${project}`);
      setActiveProject(`/${project}`);
      return;
    }

    // Handle regular project navigation
    const route = projectToRouteMap[project] || "/";
    navigate(route);
    setActiveProject(project);
  };

  return (
    <PortalProviders>
      <PortalContent
        activeProject={activeProject}
        projects={sidebarItems}
        onProjectChange={handleProjectChange}
      />
    </PortalProviders>
  );
};