import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import type { HealthSummary } from '@/types/health';

interface HealthOverviewProps {
  summary: HealthSummary;
  isLoading: boolean;
}

// Helper function to calculate percentage based on label
export const calculateHealthPercentage = (label: string, summary: HealthSummary): string => {
  if (summary.total <= 0) return '0';
  
  switch (label) {
    case 'Healthy':
      return (((summary.up || 0) / summary.total) * 100).toFixed(1);
    case 'Down':
      const downCount = (summary.down || 0);
      return ((downCount / summary.total) * 100).toFixed(1);
    default:
      return '0';
  }
};

export function HealthOverview({ summary, isLoading }: HealthOverviewProps) {
  // Handle undefined summary gracefully
  if (!summary) {
    return null;
  }

  // Calculate total down count (down + error)
  const totalDownCount = (summary.down || 0);
  
  // Check if total is 0 to show N/A for all values
  const showNA = summary.total === 0;

  const cards = [
    {
      label: 'Healthy',
      value: showNA ? 'N/A' : summary.up || 0,
      percentage: showNA ? null : calculateHealthPercentage('Healthy', summary),
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      label: 'Down',
      value: showNA ? 'N/A' : totalDownCount,
      percentage: showNA ? null : calculateHealthPercentage('Down', summary),
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      label: 'Avg Response',
      value: showNA ? 'N/A' : `${summary.avgResponseTime || 0}ms`,
      displayValue: showNA ? 'N/A' : summary.avgResponseTime || 0,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
  ];

  return (
    <div className="flex gap-3" data-testid="health-overview">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`${card.bgColor} ${card.borderColor} border rounded-lg p-2 min-w-[160px] h-10 flex items-center`}
          >
            <div className="flex items-center gap-2 w-full">
              <Icon className={`h-5 w-5 ${card.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-none">
                  {card.label}
                </p>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-gray-400 dark:text-gray-500 animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {'displayValue' in card ? card.value : card.value}
                    </p>
                    {card.percentage && (
                      <p className={`text-xs font-semibold ${card.color}`}>
                        {card.percentage}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
