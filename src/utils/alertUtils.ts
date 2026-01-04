import type { TriggeredAlert } from '@/types/api';

export const getAlertComponent = (alert: TriggeredAlert): string => {
  return alert.component || 'N/A';
};

export const getSeverityColor = (severity: string): string => {
  const sev = severity.toLowerCase();
  if (sev === "critical") return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
  if (sev === "warning") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  if (sev === "info") return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
};

export const getStatusColor = (status: string): string => {
  if (status === 'firing') return "bg-red-500/10 text-red-600 dark:text-red-400";
  if (status === 'resolved') return "bg-green-500/10 text-green-600 dark:text-green-400";
  return "bg-slate-500/10 text-slate-700 dark:text-slate-300";
};
