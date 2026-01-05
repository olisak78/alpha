import { useState, useMemo } from 'react';
import type { ComponentHealthCheck } from '@/types/health';
import { HealthRow } from './HealthRow';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useComponentDisplay } from '@/contexts/ComponentDisplayContext';

interface HealthTableProps {
  healthChecks: ComponentHealthCheck[];
  isLoading: boolean;
  landscape: string;
  onComponentClick?: (componentName: string) => void;
  components?: Array<{
    id: string;
    name: string;
    owner_id?: string | null;
    github?: string;
    sonar?: string;
    'is-library'?: boolean;
    'central-service'?: boolean;
  }>;
  hideDownComponents?: boolean;
  isCentralLandscape?: boolean;
}

type SortField = 'component' | 'status' | 'team';
type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

export function HealthTable({
  healthChecks,
  isLoading,
  landscape,
  onComponentClick,
  components = [],
  hideDownComponents = false,
  isCentralLandscape = false,
}: HealthTableProps) {
  // Get team data from context for sorting
  const { teamNamesMap } = useComponentDisplay();
  const componentOwnerMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    components.forEach(comp => {
      map[comp.id] = comp.owner_id || null;
    });
    return map;
  }, [components]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'alphabetic' | 'team'>('alphabetic');
  const [sortState, setSortState] = useState<SortState>({ field: null, direction: null });

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        // Cycle through: asc -> desc -> null -> asc
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { field: null, direction: null };
        }
      }
      return { field, direction: 'asc' };
    });
  };

  // Render sort icon based on current sort state
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortState.field !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    if (sortState.direction === 'asc') {
      return <ArrowUp className="h-4 w-4" />;
    }
    if (sortState.direction === 'desc') {
      return <ArrowDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4 opacity-50" />;
  };

  const { libraryComponents, nonLibraryComponents } = useMemo(() => {
    let filteredComponents = components;
    if (hideDownComponents && !isCentralLandscape) {
      filteredComponents = components.filter(component => {
        return component['central-service'] !== true;
      });
    }

    // Create a map of health checks by component ID for quick lookup
    const healthCheckMap = new Map(healthChecks.map(check => [check.componentId, check]));

    // Start with filtered components and create display objects
    let allComponentsWithHealth = filteredComponents.map(component => {
      const healthCheck = healthCheckMap.get(component.id);

      // If no health check exists, create a placeholder with "Not Available" status (unknown)
      if (!healthCheck) {
        return {
          componentId: component.id,
          componentName: component.name,
          landscape: landscape,
          healthUrl: '',
          status: 'UNKNOWN' as const,
          responseTime: undefined,
          lastChecked: undefined,
          error: 'Not supported in this landscape',
          response: undefined,
          isUnsupported: true
        };
      }

      return {
        ...healthCheck,
        isUnsupported: false
      };
    });

    // Apply search filter
    if (searchQuery) {
      allComponentsWithHealth = allComponentsWithHealth.filter((item) =>
        item.componentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Separate library and non-library components
    const libraries: typeof allComponentsWithHealth = [];
    const nonLibraries: typeof allComponentsWithHealth = [];

    allComponentsWithHealth.forEach((item) => {
      const component = filteredComponents.find(comp => comp.id === item.componentId);
      if (component?.['is-library']) {
        libraries.push(item);
      } else {
        nonLibraries.push(item);
      }
    });

    // Sort both arrays
    const sortComponents = (componentsArray: typeof allComponentsWithHealth) => {
      return [...componentsArray].sort((a, b) => {
        // If manual column sort is active, use it
        if (sortState.field && sortState.direction) {
          let comparison = 0;

          switch (sortState.field) {
            case 'component':
              comparison = a.componentName.localeCompare(b.componentName);
              break;

            case 'status': {
              // Define status priority: UP < UNKNOWN < DOWN < ERROR
              const statusPriority: Record<string, number> = {
                'UP': 1,
                'UNKNOWN': 2,
                'DOWN': 3,
                'ERROR': 4,
              };
              const priorityA = statusPriority[a.status] || 5;
              const priorityB = statusPriority[b.status] || 5;
              comparison = priorityA - priorityB;
              break;
            }

            case 'team': {
              const ownerIdA = componentOwnerMap[a.componentId];
              const ownerIdB = componentOwnerMap[b.componentId];
              const teamA = ownerIdA ? teamNamesMap[ownerIdA] || ownerIdA : 'Unassigned';
              const teamB = ownerIdB ? teamNamesMap[ownerIdB] || ownerIdB : 'Unassigned';
              comparison = teamA.localeCompare(teamB);
              break;
            }

            case 'responseTime': {
              const timeA = a.responseTime ?? Infinity;
              const timeB = b.responseTime ?? Infinity;
              comparison = timeA - timeB;
              break;
            }

            case 'lastChecked': {
              const dateA = a.lastChecked?.getTime() ?? 0;
              const dateB = b.lastChecked?.getTime() ?? 0;
              comparison = dateB - dateA; // Most recent first by default
              break;
            }
          }

          return sortState.direction === 'asc' ? comparison : -comparison;
        }

        // Otherwise, use the dropdown sort order
        if (sortOrder === 'team') {
          const ownerIdA = componentOwnerMap[a.componentId];
          const ownerIdB = componentOwnerMap[b.componentId];
          const teamA = ownerIdA ? teamNamesMap[ownerIdA] || '' : '';
          const teamB = ownerIdB ? teamNamesMap[ownerIdB] || '' : '';
          const teamCompare = teamA.localeCompare(teamB);
          if (teamCompare !== 0) return teamCompare;
        }
        return a.componentName.localeCompare(b.componentName);
      });
    };

    return {
      libraryComponents: sortComponents(libraries),
      nonLibraryComponents: sortComponents(nonLibraries),
    };
  }, [components, healthChecks, searchQuery, sortOrder, sortState, componentOwnerMap, teamNamesMap, hideDownComponents, isCentralLandscape, landscape]);

  const toggleRow = (componentId: string) => {
    // No longer toggle expansion in table view
    return;
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
      {/* Search and Sort (no HealthStatusFilter - managed in parent) */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
        <Select value={sortOrder} onValueChange={(value: 'alphabetic' | 'team') => setSortOrder(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alphabetic">Alphabetic</SelectItem>
            <SelectItem value="team">By Team</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Components Content */}
      {libraryComponents.length === 0 && nonLibraryComponents.length === 0 ? (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center bg-white dark:bg-[#0D0D0D]">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? (
              <>No components found matching &quot;{searchQuery}&quot;</>
            ) : hideDownComponents ? (
              <>No healthy components available in {landscape}</>
            ) : (
              <>No components available in {landscape}</>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Non-Library Components Section */}
          {nonLibraryComponents.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-[#0D0D0D]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {/* Component Column - Sortable */}
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                        onClick={() => handleSort('component')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Component</span>
                          <SortIcon field="component" />
                        </div>
                      </th>

                      {/* Status Column - Sortable */}
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Status</span>
                          <SortIcon field="status" />
                        </div>
                      </th>

                      {/* Response Time Column - Sortable */}
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"

                      >
                        Response Time
                      </th>

                      {/* Last Checked Column - Sortable */}
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                      >
                        Last Checked
                      </th>

                      {/* Team Column - Sortable */}
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                        onClick={() => handleSort('team')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Team</span>
                          <SortIcon field="team" />
                        </div>
                      </th>

                      {/* GitHub Column - Not Sortable */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        GitHub
                      </th>

                      {/* Sonar Column - Not Sortable */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sonar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {nonLibraryComponents.map((item) => {
                      const component = components.find(comp => comp.id === item.componentId);

                      return (
                        <HealthRow
                          key={item.componentId}
                          healthCheck={item}
                          isExpanded={false}
                          onToggle={() => toggleRow(item.componentId)}
                          onComponentClick={onComponentClick}
                          isUnsupported={item.isUnsupported}
                          component={{
                            ...component,
                            title: component?.name || '',
                            description: '',
                            owner_id: component?.owner_id || ''
                          }}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Library Components Section */}
          {libraryComponents.length > 0 && (
            <div className='space-y-4'>
              <h2 className="text-2xl font-bold">
                Library Components
              </h2>
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-[#0D0D0D]">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        {/* Component Column - Sortable */}
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                          onClick={() => handleSort('component')}
                        >
                          <div className="flex items-center gap-2">
                            <span>Component</span>
                            <SortIcon field="component" />
                          </div>
                        </th>

                        {/* Status Column - Sortable */}
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-2">
                            <span>Status</span>
                            <SortIcon field="status" />
                          </div>
                        </th>

                        {/* Response Time Column - Sortable */}
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                          onClick={() => handleSort('responseTime')}
                        >
                          <div className="flex items-center gap-2">
                            <span>Response Time</span>
                            <SortIcon field="responseTime" />
                          </div>
                        </th>

                        {/* Last Checked Column - Sortable */}
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                          onClick={() => handleSort('lastChecked')}
                        >
                          <div className="flex items-center gap-2">
                            <span>Last Checked</span>
                            <SortIcon field="lastChecked" />
                          </div>
                        </th>

                        {/* Team Column - Sortable */}
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                          onClick={() => handleSort('team')}
                        >
                          <div className="flex items-center gap-2">
                            <span>Team</span>
                            <SortIcon field="team" />
                          </div>
                        </th>

                        {/* GitHub Column - Not Sortable */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          GitHub
                        </th>

                        {/* Sonar Column - Not Sortable */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Sonar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {libraryComponents.map((item) => {
                        const component = components.find(comp => comp.id === item.componentId);

                        return (
                          <HealthRow
                            key={item.componentId}
                            healthCheck={item}
                            isExpanded={false}
                            onToggle={() => toggleRow(item.componentId)}
                            onComponentClick={onComponentClick}
                            isUnsupported={item.isUnsupported}
                            component={{
                              ...component,
                              title: component?.name || '',
                              description: '',
                              owner_id: component?.owner_id || ''
                            }}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}