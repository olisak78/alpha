import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeploymentsHeaderProps {
  teams: string[];
  selectedTeam: string;
  hasMultipleTeams: boolean;
  isRefreshing: boolean;
  onTeamChange: (team: string) => void;
  onRefresh: () => void;
  onCreateDeployment: () => void;
}

export const DeploymentsHeader: React.FC<DeploymentsHeaderProps> = ({
  teams,
  selectedTeam,
  hasMultipleTeams,
  isRefreshing,
  onTeamChange,
  onRefresh,
  onCreateDeployment,
}) => {
  return (
    <div className="flex justify-end items-center gap-3">
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>

      <Button
        onClick={onCreateDeployment}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Deploy Model
      </Button>
    </div>
  );
};
