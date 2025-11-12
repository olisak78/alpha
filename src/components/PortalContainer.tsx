import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PortalProviders } from "@/contexts/PortalProviders";
import { PortalContent } from "./PortalContent";

const routeToProjectMap: Record<string, string> = {
  "/": "Home",
  "/cis": "CIS@2.0",
  "/teams": "Teams",
  "/cloud-automation": "Cloud Automation",
  "/unified-services": "Unified Services",
   "/links": "Links",
  "/self-service": "Self Service",
  "/ai-arena": "AI Arena",
};

// Function to determine project from route path
const getProjectFromPath = (pathname: string): string => {
  // Handle component detail routes and tab routes for all projects
  if (pathname.startsWith("/cis/") || pathname.startsWith("/cis")) {
    return "CIS@2.0";
  }
  
  if (pathname.startsWith("/teams/") || pathname.startsWith("/teams")) {
    return "Teams";
  }

  if (pathname.startsWith("/cloud-automation/") || pathname.startsWith("/cloud-automation")) {
    return "Cloud Automation";
  }

  if (pathname.startsWith("/unified-services/") || pathname.startsWith("/unified-services")) {
    return "Unified Services";
  }

  if (pathname.startsWith("/links/") || pathname.startsWith("/links")) {
    return "Links";
  }

  if (pathname.startsWith("/self-service/") || pathname.startsWith("/self-service")) {
    return "Self Service";
  }

    if (pathname.startsWith("/ai-arena/") || pathname.startsWith("/ai-arena")) {
        return "AI Arena";
    }

  // Exact match for root
  if (pathname === "/") {
    return "Home";
  }

  // Fallback to exact match in map
  return routeToProjectMap[pathname] || "";
};

const projectToRouteMap: Record<string, string> = {
  "Home": "/",
  "CIS@2.0": "/cis",
  "Teams": "/teams",
  "Cloud Automation": "/cloud-automation",
  "Unified Services": "/unified-services",
  "Self Service": "/self-service",
  "Links": "/links",
  "AI Arena": "/ai-arena",
};

export const PortalContainer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeProject, setActiveProject] = useState("");
  const projects = ["Home","Teams", "CIS@2.0", "Cloud Automation", "Unified Services", "Links", "Self Service", "AI Arena"];

  // Update activeProject based on current route
  useEffect(() => {
    const project = getProjectFromPath(location.pathname);
    setActiveProject(project);
  }, [location.pathname]);

  const handleProjectChange = (project: string) => {
    const route = projectToRouteMap[project] || "/";
    navigate(route);
    setActiveProject(project);
  };

  return (
   <PortalProviders activeProject={activeProject}>
      <PortalContent
        activeProject={activeProject}
        projects={projects}
        onProjectChange={handleProjectChange}
      />
    </PortalProviders>
  );
}
