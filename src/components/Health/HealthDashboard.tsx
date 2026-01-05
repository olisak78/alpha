import { useMemo } from 'react';
import { useHealth } from '@/hooks/api/useHealth';
import { HealthOverview } from './HealthOverview';
import { HealthTable } from './HealthTable';
import { LandscapeFilter } from '@/components/LandscapeFilter';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { LandscapeConfig } from '@/types/health';
import type { Landscape } from '@/types/developer-portal';

interface HealthDashboardProps {
  projectId: string;
  // Pass components and landscapes from parent
  components: any[];
  landscapeGroups: Record<string, Landscape[]>;
  selectedLandscape: string | null;
  onLandscapeChange: (landscapeId: string | null) => void;
  onShowLandscapeDetails: () => void;
  isLoadingComponents: boolean;
}

export function HealthDashboard({
  projectId,
  components,
  landscapeGroups,
  selectedLandscape,
  onLandscapeChange,
  onShowLandscapeDetails,
  isLoadingComponents
}: HealthDashboardProps) {
  // Find the selected landscape from landscape groups - memoized
  const selectedLandscapeObj = useMemo(() => {
    const allLandscapes = Object.values(landscapeGroups).flat();
    return allLandscapes.find(l => l.id === selectedLandscape);
  }, [landscapeGroups, selectedLandscape]);

  // Build landscape config for health checks - memoized
  const landscapeConfig: LandscapeConfig | null = useMemo(() => {
    if (!selectedLandscapeObj) return null;

    return {
      name: selectedLandscapeObj.name,
      route: selectedLandscapeObj.landscape_url || 'cfapps.sap.hana.ondemand.com',
    };
  }, [selectedLandscapeObj]);

   const isCentralLandscape = useMemo(() => {
    return selectedLandscapeObj?.isCentral ?? false;
  }, [selectedLandscapeObj]);

  // Components are NOT landscape-specific in the database
  // All components exist in all landscapes - we just check their health in the selected landscape

  // Fetch health statuses with React Query (1-minute cache)
  const {
    healthChecks,
    isLoading: isLoadingHealth,
    summary,
    refetch,
    isFetching,
  } = useHealth({
    components: components || [],
    landscape: landscapeConfig || { name: '', route: '' },
    enabled: !isLoadingComponents && !!selectedLandscape && !!landscapeConfig,
    isCentralLandscape
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoadingComponents) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading components...</p>
      </div>
    );
  }

  if (!selectedLandscape) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Component Health</h2>
            <p className="text-muted-foreground mt-1">
              Monitor the health status of all components in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Landscape Filter */}
            <LandscapeFilter
              landscapeGroups={landscapeGroups}
              selectedLandscape={selectedLandscape}
              onLandscapeChange={onLandscapeChange}
              onShowLandscapeDetails={onShowLandscapeDetails}
              showViewAllButton={false}
              showClearButton={false}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-lg font-medium">Select a landscape to view component health</p>
          <p className="text-sm text-muted-foreground mt-2">
            Choose from the landscape groups above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with landscape filter and refresh button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Component Health</h2>
          <p className="text-muted-foreground mt-1">
            Monitor the health status of all components in real-time
            {isFetching && ' • Refreshing...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Landscape Filter */}
          <LandscapeFilter
            landscapeGroups={landscapeGroups}
            selectedLandscape={selectedLandscape}
            onLandscapeChange={onLandscapeChange}
            onShowLandscapeDetails={onShowLandscapeDetails}
            showViewAllButton={false}
            showClearButton={false}
          />

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingHealth || isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(isLoadingHealth || isFetching) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <HealthOverview
        summary={summary}
        isLoading={isLoadingHealth}
      />

      {/* Health Table */}
      <HealthTable
        healthChecks={healthChecks}
        isLoading={isLoadingHealth}
        landscape={selectedLandscapeObj?.name || ''}
        components={components}
      />
    </div>
  );
}
