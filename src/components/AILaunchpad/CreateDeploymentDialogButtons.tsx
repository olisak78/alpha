import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoundationModel } from '@/services/aiPlatformApi';

interface CreateDeploymentDialogButtonsProps {
  step: 'select' | 'configure';
  isDeploying: boolean;
  selectedModel: FoundationModel | null;
  onBack: () => void;
  onCancel: () => void;
  onDeploy: () => void;
}

export const CreateDeploymentDialogButtons: React.FC<CreateDeploymentDialogButtonsProps> = ({
  step,
  isDeploying,
  selectedModel,
  onBack,
  onCancel,
  onDeploy,
}) => {
  return (
    <>
      <div>
        {step === 'configure' && (
          <Button variant="outline" onClick={onBack} disabled={isDeploying}>
            Back
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isDeploying}
        >
          Cancel
        </Button>
        {step === 'configure' && (
          <Button
            onClick={onDeploy}
            disabled={isDeploying || !selectedModel}
            className="flex items-center gap-2"
          >
            {isDeploying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                Deploy Model
              </>
            )}
          </Button>
        )}
      </div>
    </>
  );
};
