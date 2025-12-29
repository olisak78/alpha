import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import QuickFilterButtons, { FilterOption } from '@/components/QuickFilterButtons';
import AlertsPage from '@/pages/AlertsPage';
import { TriggeredAlertsTab } from '@/components/tabs/TriggeredAlertsTab';
import { AlertTriangle, Settings } from 'lucide-react';
import { useAlerts } from '@/hooks/api/useAlerts';
import { useTriggeredAlertsFilters } from '@/hooks/useTriggeredAlertsFilters';

type MonitoringTabType = 'alerts-definitions' | 'triggered-alerts';

interface MonitoringPageProps {
  projectId: string;
  projectName: string;
  alertsUrl?: string;
}

export default function MonitoringPage({ projectId, projectName, alertsUrl }: MonitoringPageProps) {
  const [activeTab, setActiveTab] = useState<MonitoringTabType>('triggered-alerts');
  const [alertSearchTerm, setAlertSearchTerm] = useState<string>('');

  // Function to switch to alerts definitions tab with search term
  const showAlertDefinition = (alertName: string) => {
    setActiveTab('alerts-definitions');
    setAlertSearchTerm(alertName);
  };

  // Fetch alerts data to get count
  const { data: alertsData } = useAlerts(projectId);

  // Fetch triggered alerts data to get count
  const { filteredAlerts } = useTriggeredAlertsFilters(projectId);

  // Calculate alert counts
  const alertsCount = useMemo(() => {
    if (!alertsData?.files) return 0;
    return alertsData.files.reduce((total, file) => {
      return total + (file.alerts?.length || 0);
    }, 0);
  }, [alertsData]);

  const triggeredAlertsCount = filteredAlerts.length;

  // Filter options for monitoring tabs with counts
  const monitoringFilterOptions: FilterOption<MonitoringTabType>[] = [
    {
      value: "triggered-alerts",
      label: `Triggered Alerts${triggeredAlertsCount > 0 ? ` (${triggeredAlertsCount})` : ''}`,
      icon: AlertTriangle
    },
    {
      value: "alerts-definitions",
      label: `Alerts Definitions${alertsCount > 0 ? ` (${alertsCount})` : ''}`,
      icon:  Settings
    },
  ];

  return (
    <div>
      <div>
        {/* Header */}
        <div className="mb-2 h-[40px] flex items-center">
          <h2 className="text-2xl font-bold">Monitoring</h2>
        </div>

        {/* Quick Filter Buttons */}
        <div className="mb-6">
          <QuickFilterButtons
            activeFilter={activeTab}
            onFilterChange={(filter: MonitoringTabType) => setActiveTab(filter)}
            filters={monitoringFilterOptions}
          />
        </div>

        <Card>
          <CardContent className='pt-6'>
            {/* Tab Content */}

            {activeTab === 'triggered-alerts' && (
              <TriggeredAlertsTab
                projectId={projectId}
                onShowAlertDefinition={showAlertDefinition}
              />
            )}
            {activeTab === 'alerts-definitions' && (
              <AlertsPage
                projectId={projectId}
                projectName={projectName}
                alertsUrl={alertsUrl}
                initialSearchTerm={alertSearchTerm}
                onSearchTermChange={setAlertSearchTerm}
              />
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
