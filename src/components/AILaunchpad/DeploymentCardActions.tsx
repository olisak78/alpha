import React from 'react';
import { Square, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Deployment } from '@/services/aiPlatformApi';

interface DeploymentCardActionsProps {
  deployment: Deployment;
  isStopPending: boolean;
  isDeletePending: boolean;
  onStop: () => void;
  onDelete: () => void;
}

export const DeploymentCardActions: React.FC<DeploymentCardActionsProps> = ({
  deployment,
  isStopPending,
  isDeletePending,
  onStop,
  onDelete,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Always show Stop button, enable only when status and targetStatus are both RUNNING */}
      <Button
        variant="outline"
        size="sm"
        onClick={onStop}
        disabled={!(deployment.status === 'RUNNING' && deployment.targetStatus === 'RUNNING') || isStopPending}
        className="flex items-center gap-2 flex-1"
      >
        {isStopPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        Stop
      </Button>
      
      
      {/* Always show Delete button, enable when status and targetStatus are both STOPPED */}
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={!(deployment.status === 'STOPPED' && deployment.targetStatus === 'STOPPED') || isDeletePending}
        className="flex items-center gap-2 flex-1"
      >
        {isDeletePending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Delete
      </Button>
    </div>
  );
};
