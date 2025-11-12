import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Deployment, 
  useStopDeployment,
  useDeleteDeployment
} from '@/services/aiPlatformApi';
import { DeploymentCardHeader } from './DeploymentCardHeader';
import { ModelConfigurationSection } from './ModelConfigurationSection';
import { TimelineSection } from './TimelineSection';
import { EndpointSection } from './EndpointSection';
import { DeploymentCardActions } from './DeploymentCardActions';
import { getModelDisplayName, getCardBorderColor } from './deploymentUtils';

interface DeploymentCardProps {
  deployment: Deployment;
}

export const DeploymentCard: React.FC<DeploymentCardProps> = ({ deployment }) => {
  const { toast } = useToast();
  const stopDeployment = useStopDeployment();
  const deleteDeployment = useDeleteDeployment();

  const copyEndpoint = () => {
    if (deployment.deploymentUrl) {
      navigator.clipboard.writeText(deployment.deploymentUrl);
      toast({
        title: "Copied",
        description: "Endpoint URL copied to clipboard",
      });
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({
      title: "Copied",
      description: "Deployment ID copied to clipboard",
    });
  };

  const handleStopDeployment = async () => {
    try {
      await stopDeployment.mutateAsync(deployment.id);
      toast({
        title: "Deployment Stopped",
        description: `${getModelDisplayName(deployment)} deployment is being stopped`,
      });
    } catch (error) {
      toast({
        title: "Stop Failed",
        description: error instanceof Error ? error.message : "Failed to stop deployment",
        variant: "destructive",
      });
    }
  };


  const handleDeleteDeployment = async () => {
    try {
      await deleteDeployment.mutateAsync(deployment.id);
      toast({
        title: "Deployment Deleted",
        description: `${getModelDisplayName(deployment)} deployment has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete deployment",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`deployment-card border-l-4 ${getCardBorderColor(deployment.status)} hover:shadow-lg transition-shadow flex flex-col w-full`}>
      <CardHeader className="pb-5">
        <DeploymentCardHeader 
          deployment={deployment} 
          onCopyId={handleCopyId}
        />
      </CardHeader>

      <CardContent className="space-y-6 flex-1">
        <ModelConfigurationSection 
          deployment={deployment} 
          onCopyId={handleCopyId}
        />
        <TimelineSection deployment={deployment} />
        <EndpointSection 
          deployment={deployment} 
          onCopyEndpoint={copyEndpoint}
        />
      </CardContent>

      {/* Actions - Fixed to bottom */}
      <div className="p-6 pt-0 mt-auto">
        <DeploymentCardActions
          deployment={deployment}
          isStopPending={stopDeployment.isPending}
          isDeletePending={deleteDeployment.isPending}
          onStop={handleStopDeployment}
          onDelete={handleDeleteDeployment}
        />
      </div>
    </Card>
  );
};
