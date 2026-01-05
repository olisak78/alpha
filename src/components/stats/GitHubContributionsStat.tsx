import { GitBranch, HelpCircle, Info } from 'lucide-react';
import { GitHubContributionsResponse } from '@/types/api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GitHubContributionsStatProps {
  data: GitHubContributionsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}

export const GitHubContributionsStat: React.FC<GitHubContributionsStatProps> = ({
  data,
  isLoading,
  isError,
}) => {
  // Extract provider-specific contributions
  const toolsContributions = data?.Providers?.find(
    (p) => p.provider_name === 'githubtools'
  )?.total_contributions ?? 0;

  const wdfContributions = data?.Providers?.find(
    (p) => p.provider_name === 'githubwdf'
  )?.total_contributions ?? 0;

  const totalContributions = data?.total_contributions ?? 0;

  const getValue = () => {
    if (isLoading) return 'Loading...';
    if (isError) return 'N/A';
    return totalContributions.toLocaleString();
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      {/* Header with Title, Tooltip, and Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            GitHub Contributions
          </h3>
          
          {/* Tooltip with breakdown */}
          {!isLoading && !isError && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center justify-center cursor-help">
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">Breakdown by Provider</p>
                    <div className="flex justify-between gap-4 text-xs">
                      <span>GitHub Tools:</span>
                      <span className="font-medium">{toolsContributions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                      <span>GitHub WDF:</span>
                      <span className="font-medium">{wdfContributions.toLocaleString()}</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
          <GitBranch className="h-4 w-4 text-blue-500" />
        </div>
      </div>

      {/* Value */}
      <div className="text-2xl font-bold">{getValue()}</div>
      
      {/* Description */}
      <p className="text-xs text-muted-foreground mt-1">
        Total number of commits
      </p>
    </div>
  );
};