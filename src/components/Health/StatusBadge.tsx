/**
 * Status Badge Component
 * Displays health status with appropriate styling
 */

import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import type { ComponentHealthCheck } from '@/types/health';

interface StatusBadgeProps {
  status: ComponentHealthCheck['status'];
  error?: string;
}

export function StatusBadge({ status, error }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'UP':
        return {
          icon: CheckCircle2,
          label: 'UP',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        };
      case 'DOWN':
        return {
          icon: XCircle,
          label: 'DOWN',
          className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        };
      case 'UNKNOWN':
      case 'OUT_OF_SERVICE':
        return {
          icon: HelpCircle,
          label: status,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        };
      case 'LOADING':
        return {
          icon: Loader2,
          label: 'LOADING',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
          animate: true,
        };
      case 'ERROR':
        return {
          icon: AlertCircle,
          label: 'ERROR',
          className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        };
      default:
        return {
          icon: HelpCircle,
          label: 'UNKNOWN',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
      title={error || status}
    >
      <Icon className={`h-3.5 w-3.5 ${config.animate ? 'animate-spin' : ''}`} />
      <span>{config.label}</span>
    </div>
  );
}
