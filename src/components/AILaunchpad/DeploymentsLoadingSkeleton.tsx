import React from 'react';
import { DeploymentCardSkeleton } from './DeploymentCardSkeleton';

interface DeploymentsLoadingSkeletonProps {
  count?: number;
}

export const DeploymentsLoadingSkeleton: React.FC<DeploymentsLoadingSkeletonProps> = ({ 
  count = 8 
}) => {
  return (
    <div className="deployments-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 items-start">
      {Array.from({ length: count }).map((_, index) => (
        <DeploymentCardSkeleton key={index} />
      ))}
    </div>
  );
};
