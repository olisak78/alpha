import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import QuickFilterButtons, { FilterOption } from '@/components/QuickFilterButtons';
import AlertsPage from '@/pages/AlertsPage';
import { TriggeredAlertsTab } from '@/components/tabs/TriggeredAlertsTab';
import { AlertTriangle, Settings } from 'lucide-react';
import { useAlerts } from '@/hooks/api/useAlerts';


type MonitoringTabType = 'alerts-definitions' | 'active-alerts' | 'alerts-history';

interface MonitoringPageProps {
  projectId: string;
  projectName: string;
  alertsUrl?: string;
}

// Inner component that can access the triggered alerts context
function MonitoringPageContent({ projectId, projectName, alertsUrl }: MonitoringPageProps) {
  const [activeTab, setActiveTab] = useState<MonitoringTabType>('active-alerts');
  const [alertSearchTerm, setAlertSearchTerm] = useState<string>('');

  // Function to switch to alerts definitions tab with search term
  const showAlertDefinition = (alertName: string) => {
    setActiveTab('alerts-definitions');
    setAlertSearchTerm(alertName);
  };

  // Fetch alerts data to get count
  const { data: alertsData } = useAlerts(projectId);


  // Calculate alert counts
  const alertsCount = useMemo(() => {
    if (!alertsData?.files) return 0;
    return alertsData.files.reduce((total, file) => {
      return total + (file.alerts?.length || 0);
    }, 0);
  }, [alertsData]);

  // Filter options for monitoring tabs with counts
  const monitoringFilterOptions: FilterOption<MonitoringTabType>[] = useMemo(() => [
    {
      value: "active-alerts",
      label: `Active Alerts`,
      icon: AlertTriangle
    },
    {
      value: "alerts-history",
      label: `Alerts History`,
      icon: AlertTriangle
    },
    {
      value: "alerts-definitions",
      label: `Alerts Definitions${alertsCount > 0 ? ` (${alertsCount})` : ''}`,
      icon: Settings
    },
  ], [alertsCount]);

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

            {activeTab === 'active-alerts' && (
              <TriggeredAlertsTab
                projectId={projectId}
                onShowAlertDefinition={showAlertDefinition}
                initialStatusFilter={['firing']}
                title="Active Alerts"
              />
            )}
            {activeTab === 'alerts-history' && (
              <TriggeredAlertsTab
                projectId={projectId}
                onShowAlertDefinition={showAlertDefinition}
                initialStatusFilter={['resolved']}
                title="Alerts History"
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

export default function MonitoringPage(props: MonitoringPageProps) {
  return <MonitoringPageContent {...props} />;
}
