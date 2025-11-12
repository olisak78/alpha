/**
 * Health Row Component
 * Displays a single component's health status in table format
 */

import React from 'react';
import type { ComponentHealthCheck } from '@/types/health';
import { StatusBadge } from './StatusBadge';
import { HealthDetails } from './HealthDetails';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

interface HealthRowProps {
  healthCheck: ComponentHealthCheck;
  isExpanded: boolean;
  onToggle: () => void;
}

export function HealthRow({ healthCheck, isExpanded, onToggle }: HealthRowProps) {
  const formatResponseTime = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatLastChecked = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString();
  };

  const hasDetails = healthCheck.response && healthCheck.response.components;

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {hasDetails ? (
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-4" /> /* Spacer for alignment */
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {healthCheck.componentName}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <StatusBadge status={healthCheck.status} error={healthCheck.error} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatResponseTime(healthCheck.responseTime)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatLastChecked(healthCheck.lastChecked)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(healthCheck.healthUrl, '_blank', 'noopener,noreferrer')}
            title="Open health endpoint"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </td>
      </tr>

      {isExpanded && hasDetails && (
        <tr>
          <td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
            <HealthDetails response={healthCheck.response!} />
          </td>
        </tr>
      )}
    </>
  );
}
