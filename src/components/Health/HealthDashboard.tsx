/**
 * Health Dashboard Component
 * Main container for component health monitoring
 */

import React, { useMemo } from 'react';
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

  // Components are NOT landscape-specific in the database
  // All components exist in all landscapes - we just check their health in the selected landscape
  const landscapeComponents = useMemo(() => {
    return components;
  }, [components, selectedLandscapeObj]);

  // Fetch health statuses (NO CACHE)
  const {
    components: healthChecks,
    isLoading: isLoadingHealth,
    summary,
    progress,
    refetch,
  } = useHealth({
    components: landscapeComponents || [],
    landscape: landscapeConfig || { name: '', route: '' },
    enabled: !!landscapeConfig && landscapeComponents.length > 0,
  });

  const handleRefresh = () => {
    refetch();
  };

  const isLoading = isLoadingComponents || isLoadingHealth;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Component Health Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time health status of all components
            {selectedLandscapeObj && ` in ${selectedLandscapeObj.name}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Landscape Filter - Same as Components tab */}
          <LandscapeFilter
            selectedLandscape={selectedLandscape}
            landscapeGroups={landscapeGroups}
            onLandscapeChange={onLandscapeChange}
            onShowLandscapeDetails={onShowLandscapeDetails}
            showClearButton={false}
            showViewAllButton={false}
          />

          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            disabled={isLoading || landscapeComponents.length === 0}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading Progress */}
      {isLoading && progress.total > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Checking component health...
            </span>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {progress.completed} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingComponents && landscapeComponents.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No components found in {selectedLandscapeObj?.name || 'this landscape'}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      {landscapeComponents.length > 0 && (
        <>
          <HealthOverview summary={summary} isLoading={isLoading} />

          {/* Health Table */}
          <HealthTable
            healthChecks={healthChecks}
            isLoading={isLoading}
            landscape={selectedLandscapeObj?.name || ''}
          />
        </>
      )}
    </div>
  );
}
