import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2 } from 'lucide-react';
import { TriggeredAlertsFilters } from '../TriggeredAlerts/TriggeredAlertsFilters';
import { TriggeredAlertsTable } from '../TriggeredAlerts/TriggeredAlertsTable';
import { TriggeredAlertsProvider, useTriggeredAlertsContext } from '@/contexts/TriggeredAlertsContext';

interface TriggeredAlertsTabProps {
  projectId: string;
  onShowAlertDefinition?: (alertName: string) => void;
}

// Inner component that uses the context
function TriggeredAlertsContent({ onShowAlertDefinition }: { onShowAlertDefinition?: (alertName: string) => void }) {
  const { isLoading, filtersLoading, error, options } = useTriggeredAlertsContext();

  // Show error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Triggered Alerts</h2>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <span>Failed to load triggered alerts: {error.message}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Show loading indicator in header but keep filters visible */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Triggered Alerts</h2>
          {(isLoading || filtersLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </div>

      {/* Filters Section - Always visible */}
      <TriggeredAlertsFilters />

      {/* Alerts Table or Loading State */}
      {(isLoading || filtersLoading) ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading triggered alerts...</span>
          </div>
        </div>
      ) : (
        <TriggeredAlertsTable showRegion={options.regions.length > 0} onShowAlertDefinition={onShowAlertDefinition} />
      )}
    </div>
  );
}

export function TriggeredAlertsTab({ projectId, onShowAlertDefinition }: TriggeredAlertsTabProps) {
  // The provider is now handled by the parent MonitoringPage
  // We need to pass the callback to the content component
  return <TriggeredAlertsContent onShowAlertDefinition={onShowAlertDefinition} />;
}
