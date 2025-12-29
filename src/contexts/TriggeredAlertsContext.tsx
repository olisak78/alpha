import React, { createContext, useContext, ReactNode } from 'react';
import { useTriggeredAlertsFilters, FilterState, FilterActions, FilterOptions } from '@/hooks/useTriggeredAlertsFilters';
import type { TriggeredAlert } from '@/types/api';

interface TriggeredAlertsContextValue {
  // Project ID
  projectId: string;
  // Filter state
  filters: FilterState;
  // Filter actions
  actions: FilterActions;
  // Filter options
  options: FilterOptions;
  // Filtered data
  filteredAlerts: TriggeredAlert[];
  // Loading states
  isLoading: boolean;
  filtersLoading: boolean;
  // Error state
  error: Error | null;
  // Applied filters logic
  appliedFilters: AppliedFilter[];
  // Function to show alert definition
  onShowAlertDefinition?: (alertName: string) => void;
}

export interface AppliedFilter {
  key: string;
  label: string;
  onRemove: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  isExclusion?: boolean;
}

const TriggeredAlertsContext = createContext<TriggeredAlertsContextValue | undefined>(undefined);

interface TriggeredAlertsProviderProps {
  children: ReactNode;
  projectId: string;
  onShowAlertDefinition?: (alertName: string) => void;
}

export function TriggeredAlertsProvider({ children, projectId, onShowAlertDefinition }: TriggeredAlertsProviderProps) {
  const alertsFiltersData = useTriggeredAlertsFilters(projectId);
  
  // Centralized applied filters logic
  const appliedFilters: AppliedFilter[] = React.useMemo(() => {
    const filters: AppliedFilter[] = [];

    // Search term filter
    if (alertsFiltersData.filters.searchTerm) {
      filters.push({
        key: 'search',
        label: `Search: "${alertsFiltersData.filters.searchTerm}"`,
        onRemove: alertsFiltersData.actions.removeSearchTerm,
      });
    }

    // Severity filter
    if (Array.isArray(alertsFiltersData.filters.selectedSeverity) && alertsFiltersData.filters.selectedSeverity.length > 0) {
      alertsFiltersData.filters.selectedSeverity.forEach((severity, index) => {
        filters.push({
          key: `severity-${index}`,
          label: `Severity: ${severity}`,
          onRemove: () => alertsFiltersData.actions.setSelectedSeverity(
            alertsFiltersData.filters.selectedSeverity.filter(s => s !== severity)
          ),
        });
      });
    }

    // Status filter
    if (Array.isArray(alertsFiltersData.filters.selectedStatus) && alertsFiltersData.filters.selectedStatus.length > 0) {
      alertsFiltersData.filters.selectedStatus.forEach((status, index) => {
        filters.push({
          key: `status-${index}`,
          label: `Status: ${status}`,
          onRemove: () => alertsFiltersData.actions.setSelectedStatus(
            alertsFiltersData.filters.selectedStatus.filter(s => s !== status)
          ),
        });
      });
    }

    // Landscape filter
    if (Array.isArray(alertsFiltersData.filters.selectedLandscape) && alertsFiltersData.filters.selectedLandscape.length > 0) {
      alertsFiltersData.filters.selectedLandscape.forEach((landscape, index) => {
        filters.push({
          key: `landscape-${index}`,
          label: `Landscape: ${landscape}`,
          onRemove: () => alertsFiltersData.actions.setSelectedLandscape(
            alertsFiltersData.filters.selectedLandscape.filter(l => l !== landscape)
          ),
        });
      });
    }

    // Region filter
    if (Array.isArray(alertsFiltersData.filters.selectedRegion) && alertsFiltersData.filters.selectedRegion.length > 0) {
      alertsFiltersData.filters.selectedRegion.forEach((region, index) => {
        filters.push({
          key: `region-${index}`,
          label: `Region: ${region}`,
          onRemove: () => alertsFiltersData.actions.setSelectedRegion(
            alertsFiltersData.filters.selectedRegion.filter(r => r !== region)
          ),
        });
      });
    }

    // Component filter
    if (Array.isArray(alertsFiltersData.filters.selectedComponent) && alertsFiltersData.filters.selectedComponent.length > 0) {
      alertsFiltersData.filters.selectedComponent.forEach((component, index) => {
        filters.push({
          key: `component-${index}`,
          label: `Component: ${component}`,
          onRemove: () => alertsFiltersData.actions.setSelectedComponent(
            alertsFiltersData.filters.selectedComponent.filter(c => c !== component)
          ),
        });
      });
    }

    // Date range filter
    if (alertsFiltersData.filters.startDate || alertsFiltersData.filters.endDate) {
      let dateLabel = 'Date: ';
      if (alertsFiltersData.filters.startDate && alertsFiltersData.filters.endDate) {
        const startDate = new Date(alertsFiltersData.filters.startDate);
        const endDate = new Date(alertsFiltersData.filters.endDate);
        dateLabel += `${startDate.toLocaleDateString('en-GB')} - ${endDate.toLocaleDateString('en-GB')}`;
      } else if (alertsFiltersData.filters.startDate) {
        const startDate = new Date(alertsFiltersData.filters.startDate);
        dateLabel += `From ${startDate.toLocaleDateString('en-GB')}`;
      } else if (alertsFiltersData.filters.endDate) {
        const endDate = new Date(alertsFiltersData.filters.endDate);
        dateLabel += `Until ${endDate.toLocaleDateString('en-GB')}`;
      }

      filters.push({
        key: 'dateRange',
        label: dateLabel,
        onRemove: alertsFiltersData.actions.removeDateRange,
      });
    }

    // Exclusion filters - handle arrays with null checks
    if (Array.isArray(alertsFiltersData.filters.excludedSeverity)) {
      alertsFiltersData.filters.excludedSeverity.forEach((value, index) => {
        filters.push({
          key: `excludedSeverity-${index}`,
          label: `Not: ${value}`,
          onRemove: () => alertsFiltersData.actions.removeExcludedSeverity(value),
          isExclusion: true,
        });
      });
    }

    if (Array.isArray(alertsFiltersData.filters.excludedStatus)) {
      alertsFiltersData.filters.excludedStatus.forEach((value, index) => {
        filters.push({
          key: `excludedStatus-${index}`,
          label: `Not: ${value}`,
          onRemove: () => alertsFiltersData.actions.removeExcludedStatus(value),
          isExclusion: true,
        });
      });
    }

    if (Array.isArray(alertsFiltersData.filters.excludedLandscape)) {
      alertsFiltersData.filters.excludedLandscape.forEach((value, index) => {
        filters.push({
          key: `excludedLandscape-${index}`,
          label: `Not: ${value}`,
          onRemove: () => alertsFiltersData.actions.removeExcludedLandscape(value),
          isExclusion: true,
        });
      });
    }

    if (Array.isArray(alertsFiltersData.filters.excludedRegion)) {
      alertsFiltersData.filters.excludedRegion.forEach((value, index) => {
        filters.push({
          key: `excludedRegion-${index}`,
          label: `Not: ${value}`,
          onRemove: () => alertsFiltersData.actions.removeExcludedRegion(value),
          isExclusion: true,
        });
      });
    }

    if (Array.isArray(alertsFiltersData.filters.excludedComponent)) {
      alertsFiltersData.filters.excludedComponent.forEach((value, index) => {
        filters.push({
          key: `excludedComponent-${index}`,
          label: `Not: ${value}`,
          onRemove: () => alertsFiltersData.actions.removeExcludedComponent(value),
          isExclusion: true,
        });
      });
    }

    if (Array.isArray(alertsFiltersData.filters.excludedAlertname)) {
      alertsFiltersData.filters.excludedAlertname.forEach((value, index) => {
        filters.push({
          key: `excludedAlertname-${index}`,
          label: `Not: ${value}`,
          onRemove: () => alertsFiltersData.actions.removeExcludedAlertname(value),
          isExclusion: true,
        });
      });
    }

    return filters;
  }, [alertsFiltersData.filters, alertsFiltersData.actions]);

  const contextValue: TriggeredAlertsContextValue = {
    projectId,
    ...alertsFiltersData,
    appliedFilters,
    onShowAlertDefinition,
  };

  return (
    <TriggeredAlertsContext.Provider value={contextValue}>
      {children}
    </TriggeredAlertsContext.Provider>
  );
}

export function useTriggeredAlertsContext() {
  const context = useContext(TriggeredAlertsContext);
  if (context === undefined) {
    throw new Error('useTriggeredAlertsContext must be used within a TriggeredAlertsProvider');
  }
  return context;
}
