/**
 * Health Table Component
 * Displays all component health statuses in a table
 */

import React, { useState, useMemo } from 'react';
import type { ComponentHealthCheck } from '@/types/health';
import { HealthRow } from './HealthRow';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

interface HealthTableProps {
  healthChecks: ComponentHealthCheck[];
  isLoading: boolean;
  landscape: string;
}

export function HealthTable({ healthChecks, isLoading, landscape }: HealthTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredHealthChecks = useMemo(() => {
    if (!searchQuery) return healthChecks;
    return healthChecks.filter(check =>
      check.componentName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [healthChecks, searchQuery]);

  const toggleRow = (componentId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  if (isLoading && healthChecks.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center bg-white dark:bg-[#0D0D0D]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading components...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-[#0D0D0D]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Checked
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredHealthChecks.map((check) => (
                <HealthRow
                  key={check.componentId}
                  healthCheck={check}
                  isExpanded={expandedRows.has(check.componentId)}
                  onToggle={() => toggleRow(check.componentId)}
                />
              ))}
            </tbody>
          </table>

          {filteredHealthChecks.length === 0 && !isLoading && (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                <>No components found matching &quot;{searchQuery}&quot;</>
              ) : (
                <>No components available in {landscape}</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
