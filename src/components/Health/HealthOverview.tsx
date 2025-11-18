/**
 * Health Overview Component
 * Displays summary statistics cards
 */

import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
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
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Down',
      value: summary.down,
      percentage: summary.total > 0 ? ((summary.down / summary.total) * 100).toFixed(1) : '0',
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Avg Response Time',
      value: `${summary.avgResponseTime}ms`,
      displayValue: summary.avgResponseTime,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.label}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {'displayValue' in card ? card.value : card.value}
                      </p>
                      {card.percentage && (
                        <p className={`text-sm font-medium ${card.color}`}>
                          {card.percentage}%
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className={`${card.bgColor} p-3 rounded-full`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}