import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModelSummaryCard } from './ModelSummaryCard';
import { FoundationModel } from '@/services/aiPlatformApi';

interface DeploymentConfigurationStepProps {
  selectedModel: FoundationModel;
  selectedVersion: string;
  onVersionChange: (value: string) => void;
}

// Helper function to sort versions with latest versions first, then by semantic version
const sortVersions = (a: { name: string; isLatest?: boolean }, b: { name: string; isLatest?: boolean }) => {
  // Sort by isLatest first (latest versions first), then by version name
  if (a.isLatest && !b.isLatest) return -1;
  if (!a.isLatest && b.isLatest) return 1;
  return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
};

export const DeploymentConfigurationStep: React.FC<DeploymentConfigurationStepProps> = ({
  selectedModel,
  selectedVersion,
  onVersionChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Model Summary */}
      <ModelSummaryCard model={selectedModel} />

      {/* Configuration */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="scenarioId">Scenario ID</Label>
          <Input
            id="scenarioId"
            type="text"
            value="foundation-models"
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="executableId">Executable ID</Label>
          <Input
            id="executableId"
            type="text"
            value={selectedModel.executableId}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">Model Version</Label>
          <Select
            value={selectedVersion}
            onValueChange={onVersionChange}
          >
            <SelectTrigger id="version">
              <SelectValue placeholder="Select a version" />
            </SelectTrigger>
            <SelectContent>
              {selectedModel.versions
                .sort(sortVersions)
                .map((version) => (
                <SelectItem
                  key={version.name}
                  value={version.name}
                >
                  {version.name} {version.isLatest ? '(Latest)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Note:</strong> The deployment will take a few minutes to become available. 
            You'll be able to monitor its progress in the deployments list.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
