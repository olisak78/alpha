import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PortalContainer } from "./components/PortalContainer";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import TeamsPage from "./pages/TeamsPage";
import NotFound from "./pages/NotFound";
import SelfServicePage from "./pages/SelfServicePage";
import HomePage from "./pages/HomePage";
import LinksPage from "./pages/LinksPage";
import AIArenaPage from "./pages/AIArenaPage";
import { DynamicProjectPage } from "./pages/DynamicProjectPage";
import { QueryProvider } from './providers/QueryProvider';
import ComponentViewPage from "./pages/ComponentViewPage";
import PluginMarketplacePage from '@/pages/PluginMarketplacePage';
import PluginViewPage from '@/pages/PluginViewPage';
import { useProjects, useProjectsLoading, useProjectsError } from '@/stores/projectsStore';
import { useProjectsSync } from "./hooks/useProjectSync";

// --- Wrapper components for dynamic projects ---
const DynamicProjectPageWrapper = () => {
  const { projectName } = useParams<{ projectName: string }>();
  
  const projects = useProjects();
  const isLoading = useProjectsLoading();
  const error = useProjectsError();

  if (isLoading) return <div className="p-4">Loading project...</div>;
  if (error) return <div className="p-4">Error loading projects</div>;

  const project = projects.find(p => p.name === projectName);
  if (!project) return <div className="p-4">Project not found</div>;

  return <DynamicProjectPage projectName={project.name} />;
};

const ComponentViewPageWrapper = () => {
  const { projectName } = useParams<{ projectName: string }>();
  
  const projects = useProjects();
  const isLoading = useProjectsLoading();
  const error = useProjectsError();

  if (isLoading) return <div className="p-4">Loading project...</div>;
  if (error) return <div className="p-4">Error loading projects</div>;

  const project = projects.find(p => p.name === projectName);
  if (!project) return <div className="p-4">Project not found</div>;

  return <ComponentViewPage />;
};

function PluginViewPageWrapper() {
  const location = useLocation();
  return <PluginViewPage key={location.pathname} />
}

// --- AppContent Component (calls useProjectsSync) ---
const AppContent = () => {
  useProjectsSync();

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
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
            <Route path="teams" element={<TeamsPage />} />
            <Route path="teams/:teamName/:tabId" element={<TeamsPage />} />
            <Route path="self-service" element={<SelfServicePage />} />
            <Route path="links" element={<LinksPage />} />
            <Route path="ai-arena" element={<AIArenaPage />} />
            <Route path="ai-arena/:tabId" element={<AIArenaPage />} />
            <Route path="plugins/:pluginSlug" element={<PluginViewPageWrapper />} />
            <Route path="plugin-marketplace" element={<PluginMarketplacePage />} />

            {/* Dynamic projects */}
            <Route path=":projectName">
              <Route index element={<DynamicProjectPageWrapper />} />
              <Route path="component/:componentName" element={<ComponentViewPageWrapper />} />
              <Route path="component/:componentName/:tabId" element={<ComponentViewPageWrapper />} />
              <Route path=":tabId" element={<DynamicProjectPageWrapper />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  );
};

// --- Main App ---
const App = () => {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryProvider>
  );
};

export default App;