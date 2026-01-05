import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TeamSelectorBarProps {
  teams: string[];
  selectedTeam: string;
  hasMultipleTeams: boolean;
  onTeamChange: (team: string) => void;
  label?: string;
}

export const TeamSelectorBar: React.FC<TeamSelectorBarProps> = ({
  teams,
  selectedTeam,
  hasMultipleTeams,
  onTeamChange,
  label = "Team:"
}) => {
  if (teams.length === 0) {
    return null;
  }

  return (
    <div className="bg-secondary px-4 py-3 flex items-center transition-all duration-300">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Select
          value={hasMultipleTeams ? selectedTeam : teams[0]}
          onValueChange={onTeamChange}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            {/* Only show "All Teams" if there are multiple teams */}
            {hasMultipleTeams && (
              <SelectItem value="all">All Teams</SelectItem>
            )}
            {teams.map((team) => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
