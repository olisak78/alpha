import { ReactNode } from "react";
import { HeaderNavigationProvider } from "./HeaderNavigationContext";
import { GlobalAuthErrorHandler } from "@/components/GlobalAuthErrorHandler";

interface PortalProvidersProps {
  children: ReactNode;
}

export function PortalProviders({ children }: PortalProvidersProps) {
  return (
    <HeaderNavigationProvider>
          {children}
          <GlobalAuthErrorHandler />
    </HeaderNavigationProvider>
  );
}
