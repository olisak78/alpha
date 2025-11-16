import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HeaderNavigationProvider } from "@/contexts/HeaderNavigationContext";
import { PortalContainer } from "./components/PortalContainer";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import TeamsPage from "./pages/TeamsPage";
import NotFound from "./pages/NotFound";
import CisPage from "./pages/CisPage";
import ComponentDetailPage from "./pages/ComponentDetailPage";
import ComponentViewPage from "./pages/ComponentViewPage";
import UnifiedServicesPage from "./pages/UnifiedServicesPage";
import CloudAutomationPage from "./pages/CloudAutomationPage";
import SelfServicePage from "./pages/SelfServicePage";
import HomePage from "./pages/HomePage";
import LinksPage from "./pages/LinksPage";
import AIArenaPage from "./pages/AIArenaPage";
import { QueryProvider } from './providers/QueryProvider';
import { SidebarProvider } from "./contexts/SidebarContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <QueryProvider>
        <AuthProvider>
          <BrowserRouter>
            <SidebarProvider>
              <HeaderNavigationProvider>
                <Routes>
                  {/* Public route for login */}
                  <Route path="/login" element={<LoginPage />} />
                  {/* Redirect /me to home page */}
                  <Route path="/me" element={<Navigate to="/" replace />} />

                  {/* Protected routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <PortalContainer />
                    </ProtectedRoute>
                  }>
                    <Route path="/" element={<HomePage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="teams" element={<TeamsPage />} />
                    <Route path="teams/:tabId" element={<TeamsPage />} />
                    <Route path="teams/:tabId/*" element={<TeamsPage />} />
                    <Route path="cis" element={<CisPage />} />
                    <Route path="cis/component/:componentId" element={<ComponentViewPage />} />
                    <Route path="cis/component/:componentId/:tabId" element={<ComponentViewPage />} />
                    {/* <Route path="cis/components/:entityName" element={<ComponentDetailPage />} /> */}
                    <Route path="cis/:tabId" element={<CisPage />} />
                    <Route path="unified-services" element={<UnifiedServicesPage />} />
                    <Route path="unified-services/component/:componentId" element={<ComponentViewPage />} />
                    <Route path="unified-services/component/:componentId/:tabId" element={<ComponentViewPage />} />
                    <Route path="unified-services/components/:entityName" element={<ComponentDetailPage />} />
                    <Route path="unified-services/:tabId" element={<UnifiedServicesPage />} />
                    <Route path="cloud-automation" element={<CloudAutomationPage />} />
                    <Route path="cloud-automation/component/:componentId" element={<ComponentViewPage />} />
                    <Route path="cloud-automation/component/:componentId/:tabId" element={<ComponentViewPage />} />
                    <Route path="cloud-automation/components/:entityName" element={<ComponentDetailPage />} />
                    <Route path="cloud-automation/:tabId" element={<CloudAutomationPage />} />
                    <Route path="self-service" element={<SelfServicePage />} />
                    <Route path="links" element={<LinksPage />} />
                    <Route path="ai-arena" element={<AIArenaPage />} />
                    <Route path="ai-arena/:tabId" element={<AIArenaPage />} />
                  </Route>

                  {/* 404 route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </HeaderNavigationProvider>
            </SidebarProvider>
          </BrowserRouter>
        </AuthProvider>
      </QueryProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;