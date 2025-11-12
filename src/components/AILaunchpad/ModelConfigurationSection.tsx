import React from 'react';
import { Settings, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Deployment } from '@/services/aiPlatformApi';
import { getModelVersion } from './deploymentUtils';

interface ModelConfigurationSectionProps {
  deployment: Deployment;
  onCopyId: (id: string) => void;
}

export const ModelConfigurationSection: React.FC<ModelConfigurationSectionProps> = ({
  deployment,
  onCopyId,
}) => {
  const { toast } = useToast();

  const handleCopyConfigurationId = (configId: string) => {
    navigator.clipboard.writeText(configId);
    toast({
      title: "Copied",
      description: "Configuration ID copied to clipboard",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">ID:</span>
        <code className="bg-muted px-3 py-2 rounded text-xs font-mono flex-1 min-w-0 break-all">
          {deployment.id}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopyId(deployment.id)}
          className="flex-shrink-0 h-8 w-8 p-0"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">Config ID:</span>
        <code className="bg-muted px-3 py-2 rounded text-xs font-mono flex-1 min-w-0 break-all">
          {deployment.configurationId}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopyConfigurationId(deployment.configurationId)}
          className="flex-shrink-0 h-8 w-8 p-0"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
