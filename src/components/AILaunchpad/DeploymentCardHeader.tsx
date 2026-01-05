import React from 'react';
import { Settings, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Deployment } from '@/services/aiPlatformApi';
import { getModelDisplayName, getStatusIcon, getStatusColor } from './deploymentUtils';

interface DeploymentCardHeaderProps {
  deployment: Deployment;
  onCopyId: (id: string) => void;
}

export const DeploymentCardHeader: React.FC<DeploymentCardHeaderProps> = ({
  deployment,
  onCopyId,
}) => {
  const StatusIcon = getStatusIcon(deployment.status);

  // Determine display status and color based on status and targetStatus
  const getDisplayStatus = () => {
    if (deployment.status === 'UNKNOWN' && deployment.targetStatus === 'RUNNING') {
      return 'PENDING';
    }
    if (deployment.status === 'RUNNING' && deployment.targetStatus === 'STOPPED') {
      return 'STOPPING';
    }
    if (deployment.status === 'STOPPED' && deployment.targetStatus === 'DELETED') {
      return 'DELETING';
    }
    return deployment.status;
  };

  const getDisplayStatusColor = () => {
    const displayStatus = getDisplayStatus();
    
    if (displayStatus === 'STOPPING') {
      return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20';
    }
    if (displayStatus === 'DELETING') {
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20';
    }
    
    // Use the original status color for other cases with matching hover colors
    const originalColor = getStatusColor(deployment.status);
    // Add hover state that matches the background color by extracting and reapplying bg classes
    return originalColor.replace(/bg-(\w+)-(\d+)/g, 'bg-$1-$2 hover:bg-$1-$2').replace(/dark:bg-(\w+)-(\d+)\/(\d+)/g, 'dark:bg-$1-$2/$3 dark:hover:bg-$1-$2/$3');
  };

  const displayStatus = getDisplayStatus();

  return (
    <div className="flex flex-col gap-2">
      {/* Status badge row - aligned to the right */}
      <div className="flex justify-end">
        <Badge className={`flex items-center gap-1 flex-shrink-0 ${getDisplayStatusColor()}`}>
          <StatusIcon className={`h-3 w-3 ${displayStatus === 'PENDING' ? 'animate-spin' : ''}`} />
          {displayStatus}
        </Badge>
      </div>
      
      {/* Title row with icon, title, and copy button - aligned to the left */}
      <div className="flex items-start gap-2">
        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
          <Settings className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 
              className="font-semibold text-xl text-foreground leading-tight min-w-0 truncate"
              title={getModelDisplayName(deployment)}
            >
              {getModelDisplayName(deployment)}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyId(getModelDisplayName(deployment))}
              className="flex-shrink-0 h-8 w-8 p-0"
              title="Copy model name"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
    </div>
  );
};
