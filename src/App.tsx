// App.tsx
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { HeaderNavigationProvider } from "@/contexts/HeaderNavigationContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProjectsProvider, useProjectsContext } from "@/contexts/ProjectsContext";

import { PortalContainer } from "./components/PortalContainer";
import ProtectedRoute from "./components/ProtectedRoute";
import { SideBar } from "./components/Sidebar/SideBar";

import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import TeamsPage from "./pages/TeamsPage";
import NotFound from "./pages/NotFound";
import ComponentDetailPage from "./pages/ComponentDetailPage";
import SelfServicePage from "./pages/SelfServicePage";
import HomePage from "./pages/HomePage";
import LinksPage from "./pages/LinksPage";
import AIArenaPage from "./pages/AIArenaPage";
import { DynamicProjectPage } from "./pages/DynamicProjectPage";
import CisPage from "./pages/CisPage";

import { QueryProvider } from './providers/QueryProvider';
import ComponentViewPage from "./pages/ComponentViewPage";

const queryClient = new QueryClient();

// --- Wrapper components for dynamic projects ---
const DynamicProjectPageWrapper = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const { projects, isLoading, error } = useProjectsContext();

  if (isLoading) return <div className="p-4">Loading project...</div>;
  if (error) return <div className="p-4">Error loading projects</div>;

  const project = projects.find(p => p.name === projectName);
  if (!project) return <div className="p-4">Project not found</div>;

  return <DynamicProjectPage projectName={project.name} />;
};

const ComponentDetailPageWrapper = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const { projects, isLoading, error } = useProjectsContext();

  if (isLoading) return <div className="p-4">Loading project...</div>;
  if (error) return <div className="p-4">Error loading projects</div>;

  const project = projects.find(p => p.name === projectName);
  if (!project) return <div className="p-4">Project not found</div>;

  return <ComponentDetailPage />;
};

// --- Main App ---
// App.tsx
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProjectsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <QueryProvider>
              <AuthProvider>
                <SidebarProvider>
                  <HeaderNavigationProvider>
                    <Routes>
                      {/* Public */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/me" element={<Navigate to="/" replace />} />

                      {/* Protected */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <PortalContainer />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<HomePage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="teams" element={<TeamsPage />} />
                        <Route path="teams/:teamName/:tabId" element={<TeamsPage />} />
                        <Route path="self-service" element={<SelfServicePage />} />
                        <Route path="links" element={<LinksPage />} />
                        <Route path="ai-arena" element={<AIArenaPage />} />
                        <Route path="ai-arena/:tabId" element={<AIArenaPage />} />

                        {/* CIS specific routes - MUST come before dynamic projects */}
                        <Route path="cis">
                          <Route index element={<CisPage />} />
                          <Route path=":tabId" element={<CisPage />} /> 
                          <Route path="component/:componentId" element={<ComponentViewPage />} />
                          <Route path="component/:componentId/:tabId" element={<ComponentViewPage />} />
                        </Route>

                        {/* Dynamic projects */}
                        <Route path=":projectName">
                          <Route index element={<DynamicProjectPageWrapper />} />
                          <Route path="components/:entityName" element={<ComponentDetailPageWrapper />} />
                          <Route path=":tabId" element={<DynamicProjectPageWrapper />} />
                        </Route>

                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </HeaderNavigationProvider>
                </SidebarProvider>
              </AuthProvider>
            </QueryProvider>
          </TooltipProvider>
        </ProjectsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;