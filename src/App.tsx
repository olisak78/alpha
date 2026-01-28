import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PortalContainer } from "./components/PortalContainer";
import ProtectedRoute from "./components/ProtectedRoute";
import OrganizationProtectedRoute from "./components/OrganizationProtectedRoute";
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
import { useAuth } from "@/contexts/AuthContext";
import { isUserInSapCfsOrganization } from "@/utils/organization-utils";
import { useEffect } from "react";
import { trackPageView } from "./utils/analytics";
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

// --- Default route wrapper that redirects based on organization ---
const DefaultRouteWrapper = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is in sap-cfs organization, show HomePage, otherwise redirect to AI Arena
  if (isUserInSapCfsOrganization(user)) {
    return <HomePage />;
  } else {
    return <Navigate to="/ai-arena" replace />;
  }
};

const AnalyticsTracker = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only track page views for authenticated users
    if (isAuthenticated) {
      // Track the page view with the full pathname (including query params if needed)
      const pageUrl = location.pathname + location.search;
      trackPageView(pageUrl);
    }
  }, [location.pathname, location.search, isAuthenticated]);

  return null; // This component renders nothing
};

// --- AppContent Component (calls useProjectsSync) ---
const AppContent = () => {
  useProjectsSync();

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AnalyticsTracker />
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
            <Route index element={<DefaultRouteWrapper />} />
            <Route path="ai-arena" element={<AIArenaPage />} />
            <Route path="ai-arena/:tabId" element={<AIArenaPage />} />

            {/* Organization Protected Routes */}
            <Route element={<OrganizationProtectedRoute />}>
              <Route path="teams" element={<TeamsPage />} />
              <Route path="teams/:teamName/:tabId" element={<TeamsPage />} />
              <Route path="self-service" element={<SelfServicePage />} />
              <Route path="links" element={<LinksPage />} />
              <Route path="plugins/:pluginSlug" element={<PluginViewPageWrapper />} />
              <Route path="plugin-marketplace" element={<PluginMarketplacePage />} />

              {/* Dynamic projects */}
              <Route path=":projectName">
                <Route index element={<DynamicProjectPageWrapper />} />
                <Route path="component/:componentName" element={<ComponentViewPageWrapper />} />
                <Route path="component/:componentName/:tabId" element={<ComponentViewPageWrapper />} />
                <Route path=":tabId" element={<DynamicProjectPageWrapper />} />
              </Route>
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
