import { 
  PlayCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Deployment } from '../../services/aiPlatformApi';

export const getModelDisplayName = (deployment: Deployment): string => {
  return deployment.details?.resources?.backendDetails?.model?.name ||
         deployment.details?.resources?.backend_details?.model?.name ||
         deployment.configurationName ||
         'Unknown Model';
};

export const getModelVersion = (deployment: Deployment): string => {
  return deployment.details?.resources?.backendDetails?.model?.version ||
         deployment.details?.resources?.backend_details?.model?.version ||
         '1';
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'RUNNING': return PlayCircle;
    case 'PENDING': return Loader2;
    case 'DEAD': 
    case 'STOPPED': return AlertCircle;
    default: return AlertCircle;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'RUNNING': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800';
    case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800';
    case 'DEAD': 
    case 'STOPPED': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export const getCardBorderColor = (status: string) => {
  switch (status) {
    case 'RUNNING': return 'border-l-green-500';
    case 'PENDING': return 'border-l-yellow-500';
    case 'DEAD': 
    case 'STOPPED': return 'border-l-red-500';
    default: return 'border-l-muted-foreground';
  }
};
