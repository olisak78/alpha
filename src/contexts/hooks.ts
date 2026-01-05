import { getComponentHealth, getComponentAlerts, getDeployedVersion, getStatusColor } from '@/stores/dataStore';
import { usePortalState } from '@/stores/appStateStore';

export { usePortalState };

export function useHealthAndAlerts() {
  return {
    getComponentHealth,
    getComponentAlerts,
    getDeployedVersion,
    getStatusColor,
  };
}
