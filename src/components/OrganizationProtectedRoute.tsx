import React, { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isUserInSapCfsOrganization } from '@/utils/organization-utils';

interface OrganizationProtectedRouteProps {
  children?: ReactNode;
}

const OrganizationProtectedRoute: React.FC<OrganizationProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

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

  // If user is not authenticated or not in sap-cfs organization, redirect
  if (!user || !isUserInSapCfsOrganization(user)) {
    return <Navigate to="/" replace />;
  }

  return <>{children || <Outlet />}</>;
};

export default OrganizationProtectedRoute;
