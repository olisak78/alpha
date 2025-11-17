import type { ComponentHealthCheck } from '@/types/health';
import { StatusBadge } from './StatusBadge';
import { Badge } from '@/components/ui/badge';

interface HealthRowProps {
  healthCheck: ComponentHealthCheck;
  isExpanded: boolean;
  onToggle: () => void;
  teamName?: string;
  componentName?: string;
  onComponentClick?: (componentName: string) => void;
}

export function HealthRow({
  healthCheck,
  isExpanded,
  onToggle,
  teamName,
  componentName,
  onComponentClick,
}: HealthRowProps) {
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

  const handleRowClick = () => {
    if (onComponentClick && componentName && healthCheck.status === 'UP') {
      onComponentClick(componentName);
    }
  };
  const isClickable = onComponentClick && componentName && healthCheck.status === 'UP';
  return (
    <>
      <tr
        className={`hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={isClickable ? handleRowClick : undefined}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {healthCheck.componentName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {healthCheck.componentId}
              </span>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <StatusBadge
            status={healthCheck.status}
            error={healthCheck.error}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {formatResponseTime(healthCheck.responseTime)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {formatLastChecked(healthCheck.lastChecked)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {teamName ? (
            <Badge variant="secondary" className="text-xs">
              {teamName}
            </Badge>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
          )}
        </td>
      </tr>
    </>
  );
}