/**
 * Health Details Component
 * Displays expandable nested health information
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { HealthResponse, ComponentHealth } from '@/types/health';
import { StatusBadge } from './StatusBadge';

interface HealthDetailsProps {
  response: HealthResponse;
}

const JsonValue = ({ value, keyName }: { value: any; keyName: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isObject = typeof value === 'object' && value !== null;

  if (!isObject) {
    return <span className="text-gray-700 dark:text-gray-300 font-mono">{String(value)}</span>;
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs"
      >
        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {isExpanded ? 'collapse' : 'expand'} object
      </button>
      {isExpanded && (
        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
};

export function HealthDetails({ response }: HealthDetailsProps) {
  const renderComponentDetails = (name: string, component: ComponentHealth, level: number = 0) => {
    const indent = level * 24;

    return (
      <div key={name} className="mb-3" style={{ marginLeft: `${indent}px` }}>
        <div className="flex items-start gap-3 mb-2">
          <StatusBadge status={component.status} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {name}
            </p>
            {component.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {component.description}
              </p>
            )}
          </div>
        </div>

        {/* Render details */}
        {component.details && Object.keys(component.details).length > 0 && (
          <div className="ml-6 mt-2 space-y-2">
            {Object.entries(component.details).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-xs items-start">
                <span className="text-gray-500 dark:text-gray-400 font-medium min-w-fit">{key}:</span>
                <JsonValue value={value} keyName={key} />
              </div>
            ))}
          </div>
        )}

        {/* Recursively render nested components */}
        {component.components && Object.keys(component.components).length > 0 && (
          <div className="mt-2">
            {Object.entries(component.components).map(([nestedName, nestedComponent]) =>
              renderComponentDetails(nestedName, nestedComponent, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!response.components || Object.keys(response.components).length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No detailed health information available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Health Components
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({Object.keys(response.components).length} total)
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto pr-2">
        {Object.entries(response.components).map(([name, component]) =>
          renderComponentDetails(name, component)
        )}
      </div>
    </div>
  );
}
