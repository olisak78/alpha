import React from 'react';
import { Clock } from 'lucide-react';
import { Deployment } from '@/services/aiPlatformApi';

interface TimelineSectionProps {
  deployment: Deployment;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  deployment,
}) => {
  return (
    <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-muted-foreground">Created:</span>
          <span className="font-medium text-foreground">
            {new Date(deployment.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

  );
};
