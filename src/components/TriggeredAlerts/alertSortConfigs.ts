import type { TriggeredAlert } from '@/types/api';
import type { SortDirection } from '@/hooks/useTableSort';

export function sortAlerts(alerts: TriggeredAlert[], field: string, direction: SortDirection): TriggeredAlert[] {
  return [...alerts].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (field) {
      case 'alertname':
        aValue = a.alertname.toLowerCase();
        bValue = b.alertname.toLowerCase();
        break;
      case 'severity': {
        // Define severity order: critical > warning > info
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        aValue = severityOrder[a.severity.toLowerCase() as keyof typeof severityOrder] || 0;
        bValue = severityOrder[b.severity.toLowerCase() as keyof typeof severityOrder] || 0;
        break;
      }
      case 'startsAt':
        aValue = new Date(a.startsAt).getTime();
        bValue = new Date(b.startsAt).getTime();
        break;
      case 'endsAt':
        aValue = a.endsAt ? new Date(a.endsAt).getTime() : Date.now();
        bValue = b.endsAt ? new Date(b.endsAt).getTime() : Date.now();
        break;
      case 'status':
        aValue = a.status?.toLowerCase();
        bValue = b.status?.toLowerCase();
        break;
      case 'landscape':
        aValue = a.landscape?.toLowerCase();
        bValue = b.landscape?.toLowerCase();
        break;
      case 'region':
        aValue = a.region?.toLowerCase();
        bValue = b.region?.toLowerCase();
        break;
      default:
        return 0;
    }

    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    else if (aValue > bValue) comparison = 1;

    return direction === 'asc' ? comparison : -comparison;
  });
}
