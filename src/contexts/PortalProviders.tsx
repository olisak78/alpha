// MODIFY src/contexts/PortalProviders.tsx

import { ReactNode } from "react";
import { HeaderNavigationProvider } from "./HeaderNavigationContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "./AuthContext";
import { BusinessLogicProvider } from "./BusinessLogicContext";
import { DataProvider } from "./DataContext";
import { AppStateProvider } from "./AppStateContext";
import { GlobalAuthErrorHandler } from "@/components/GlobalAuthErrorHandler";

interface PortalProvidersProps {
  children: ReactNode;
  activeProject: string; // ← ADD THIS LINE
}

// ↓ ADD activeProject PARAMETER
export function PortalProviders({ children, activeProject }: PortalProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HeaderNavigationProvider>
          <BusinessLogicProvider activeProject={activeProject}>
            <DataProvider>
              <AppStateProvider>
                {children}
                <GlobalAuthErrorHandler />
              </AppStateProvider>
            </DataProvider>
          </BusinessLogicProvider>
        </HeaderNavigationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
