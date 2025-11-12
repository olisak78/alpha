import React, { useState, useMemo, useEffect } from 'react';
import { Brain, AlertTriangle, Plus, Play, Cloud, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useDeployments, useAIAuth, Deployment } from '@/services/aiPlatformApi';
import { DeploymentStats } from './DeploymentStats';
import { DeploymentCard } from './DeploymentCard';
import { DeploymentsHeader } from './DeploymentsHeader';
import { CreateDeploymentDialog } from './CreateDeploymentDialog';
import { DeploymentsLoadingSkeleton } from './DeploymentsLoadingSkeleton';
import { useToast } from '@/hooks/use-toast';

interface DeploymentsManagerProps {
  onTeamsLoaded?: (teams: string[], hasMultiple: boolean) => void;
  externalSelectedTeam?: string;
  onExternalTeamChange?: (team: string) => void;
}

export const DeploymentsManager: React.FC<DeploymentsManagerProps> = ({
  onTeamsLoaded,
  externalSelectedTeam,
  onExternalTeamChange
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [internalSelectedTeam, setInternalSelectedTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Use external team selection if provided, otherwise use internal state
  const selectedTeam = externalSelectedTeam ?? internalSelectedTeam;
  const setSelectedTeam = onExternalTeamChange ?? setInternalSelectedTeam;
  
  const { data: authData } = useAIAuth();
  const { tenantId } = authData || { tenantId: null };
  const { 
    data: deploymentsData, 
    isLoading, 
    error, 
    refetch 
  } = useDeployments();

  // Extract all teams and deployments from the new API structure
  const { teams, allDeployments, filteredDeployments, hasMultipleTeams } = useMemo(() => {
    if (!deploymentsData?.deployments) {
      return { teams: [], allDeployments: [], filteredDeployments: [], hasMultipleTeams: false };
    }

    const teams = deploymentsData.deployments.map(teamData => teamData.team);
    const allDeployments = deploymentsData.deployments.flatMap(teamData =>
      teamData.deployments.map(deployment => ({
        ...deployment,
        team: teamData.team
      }))
    );

    const hasMultipleTeams = teams.length > 1;

    // If there's only one team, automatically select it
    const effectiveSelectedTeam = hasMultipleTeams ? selectedTeam : (teams[0] || 'all');

    // Filter by team
    let deploymentsList = effectiveSelectedTeam === 'all'
      ? allDeployments
      : allDeployments.filter(deployment => deployment.team === effectiveSelectedTeam);

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      deploymentsList = deploymentsList.filter(deployment => {
        const modelName = deployment.details?.resources?.backendDetails?.model?.name ||
                         deployment.details?.resources?.backend_details?.model?.name ||
                         deployment.configurationName ||
                         'Unknown Model';
        return (
          modelName.toLowerCase().includes(query) ||
          deployment.id.toLowerCase().includes(query) ||
          deployment.configurationName?.toLowerCase().includes(query) ||
          deployment.team?.toLowerCase().includes(query)
        );
      });
    }

    // Sort alphabetically by model name
    deploymentsList.sort((a, b) => {
      const getModelName = (d: typeof a) =>
        d.details?.resources?.backendDetails?.model?.name ||
        d.details?.resources?.backend_details?.model?.name ||
        d.configurationName ||
        'Unknown Model';

      return getModelName(a).localeCompare(getModelName(b));
    });

    return { teams, allDeployments, filteredDeployments: deploymentsList, hasMultipleTeams };
  }, [deploymentsData, selectedTeam, searchQuery]);

  // Notify parent component when teams are loaded
  useEffect(() => {
    if (onTeamsLoaded && teams.length > 0) {
      onTeamsLoaded(teams, hasMultipleTeams);
    }
  }, [teams, hasMultipleTeams, onTeamsLoaded]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Refreshed",
        description: "Deployment list has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh deployments",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateDeployment = () => {
    setShowCreateDialog(true);
  };

  return (
    <div className="deployments-container max-w-none ml-0 bg-background min-h-screen">
      {/* Header - Combined Actions and Stats */}
      <div className="header mb-8 px-4">
        <div className="flex justify-between items-center gap-3">
          {/* Stats on the left */}
          {!error && allDeployments.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {(() => {
                const runningDeployments = allDeployments.filter(d => d.status === 'RUNNING').length;
                const totalDeployments = allDeployments.length;
                const uniqueModels = new Set<string>();
                allDeployments.forEach(deployment => {
                  const modelName = deployment.details?.resources?.backendDetails?.model?.name ||
                                   deployment.details?.resources?.backend_details?.model?.name ||
                                   deployment.configurationName ||
                                   'Unknown Model';
                  uniqueModels.add(modelName);
                });

                return (
                  <>
                    <div className="rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-green-100 text-green-800 border-green-200 px-3 py-2 text-sm font-medium flex items-center gap-2 border">
                      <Play className="h-4 w-4" />
                      <span className="font-semibold">{runningDeployments}</span>
                      <span className="font-normal">Running</span>
                    </div>
                    <div className="rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-blue-100 text-blue-800 border-blue-200 px-3 py-2 text-sm font-medium flex items-center gap-2 border">
                      <Cloud className="h-4 w-4" />
                      <span className="font-semibold">{totalDeployments}</span>
                      <span className="font-normal">Total</span>
                    </div>
                    <div className="rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-purple-100 text-purple-800 border-purple-200 px-3 py-2 text-sm font-medium flex items-center gap-2 border">
                      <Brain className="h-4 w-4" />
                      <span className="font-semibold">{uniqueModels.size}</span>
                      <span className="font-normal">Model Types</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Actions on the right */}
          <DeploymentsHeader
            teams={teams}
            selectedTeam={selectedTeam}
            hasMultipleTeams={hasMultipleTeams}
            isRefreshing={isRefreshing}
            onTeamChange={setSelectedTeam}
            onRefresh={handleRefresh}
            onCreateDeployment={handleCreateDeployment}
          />
        </div>

        {/* Search Box */}
        {!error && allDeployments.length > 0 && (
          <div className="mt-4 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by model name, ID, or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content with padding */}
      <div className="px-4">

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error loading deployments:</strong> {error.message}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <DeploymentsLoadingSkeleton />
        )}

        {/* Deployment Cards */}
        {!isLoading && !error && (
          <div className="deployments-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5 items-start">
            {filteredDeployments.map((deployment) => (
              <DeploymentCard key={deployment.id} deployment={deployment} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredDeployments.length === 0 && (
          <div className="empty-state flex justify-center py-16">
            <Card className="max-w-md text-center p-8">
              <CardContent className="pt-6">
                <Brain className="h-20 w-20 text-primary mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  {selectedTeam === 'all' ? 'No AI Models Deployed' : `No AI Models Deployed for ${selectedTeam}`}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {selectedTeam === 'all'
                    ? 'Deploy your first AI model to start generating intelligent responses'
                    : `No deployments found for the ${selectedTeam} team. Try selecting a different team or deploy a new model.`
                  }
                </p>
                <Button onClick={handleCreateDeployment} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Deploy Your First Model
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateDeploymentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};
