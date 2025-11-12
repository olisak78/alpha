import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const DeploymentCardSkeleton: React.FC = () => {
  return (
    <Card className="deployment-card border-l-4 border-l-muted hover:shadow-lg transition-shadow flex flex-col w-full">
      <CardHeader className="pb-4">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 flex-1">
        {/* Model Configuration Section */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>

        {/* Endpoint Section */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>

      {/* Actions - Fixed to bottom */}
      <div className="p-6 pt-0 mt-auto">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </Card>
  );
};
