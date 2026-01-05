import React, { useState } from 'react';
import { Link as LinkIcon, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Deployment } from '@/services/aiPlatformApi';

interface EndpointSectionProps {
  deployment: Deployment;
  onCopyEndpoint: () => void;
}

export const EndpointSection: React.FC<EndpointSectionProps> = ({
  deployment,
  onCopyEndpoint,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-3">
      <h4 className={`flex items-center gap-2 font-medium ${deployment.deploymentUrl ? 'text-foreground' : 'text-transparent'}`}>
        <LinkIcon className="h-4 w-4" />
        Endpoint
      </h4>
      <div className={`flex items-center gap-2 rounded-lg ${deployment.deploymentUrl ? 'bg-muted' : ''}`}>
        <code 
          className={`px-3 py-2 rounded text-xs font-mono flex-1 min-w-0 ${
            deployment.deploymentUrl ? 'bg-muted ' + (isExpanded ? 'break-all' : 'truncate') + ' cursor-pointer select-text' : ''
          }`}
          onClick={deployment.deploymentUrl ? toggleExpanded : undefined}
          title={deployment.deploymentUrl ? (isExpanded ? "Click to collapse" : "Click to expand") : undefined}
        >
          {deployment.deploymentUrl || '\u00A0'} {/* Non-breaking space if no URL */}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={deployment.deploymentUrl ? onCopyEndpoint : undefined}
          className={`flex-shrink-0 ${deployment.deploymentUrl ? '' : 'invisible'}`}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
