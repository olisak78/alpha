import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import type { HealthSummary } from '@/types/health';

interface HealthOverviewProps {
  summary: HealthSummary;
  isLoading: boolean;
}

export function HealthOverview({ summary, isLoading }: HealthOverviewProps) {
  const cards = [
    {
      label: 'Healthy',
      value: summary.up,
      percentage: summary.total > 0 ? ((summary.up / summary.total) * 100).toFixed(1) : '0',
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      label: 'Down',
      value: summary.down,
      percentage: summary.total > 0 ? ((summary.down / summary.total) * 100).toFixed(1) : '0',
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      label: 'Avg Response',
      value: `${summary.avgResponseTime}ms`,
      displayValue: summary.avgResponseTime,
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
            className={`${card.bgColor} ${card.borderColor} border rounded-lg px-4 py-2.5 min-w-[140px]`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${card.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                  {card.label}
                </p>
                {isLoading ? (
                  <div className="flex items-center mt-1">
                    <Loader2 className="h-5 w-5 text-gray-400 dark:text-gray-500 animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
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