import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { formatAlertDate } from '@/utils/dateUtils';
import {
  getSeverityColor, 
  getStatusColor
} from '@/utils/alertUtils';
import { AlertExpandedView } from './AlertExpandedView';
import { useTriggeredAlertsContext } from '@/contexts/TriggeredAlertsContext';
import { FilterButtons } from './FilterButtons';
import TablePagination from '@/components/TablePagination';
import { useTableSort } from '@/hooks/useTableSort';
import { sortAlerts } from './alertSortConfigs';
import { TriggeredAlertsTableHeader } from './TriggeredAlertsTableHeader';

interface TriggeredAlertsTableProps {
  showRegion?: boolean;
  onShowAlertDefinition?: (alertName: string) => void;
}

export function TriggeredAlertsTable({ showRegion = true, onShowAlertDefinition }: TriggeredAlertsTableProps) {
  const { 
    filteredAlerts, 
    projectId, 
    filters,
    actions,
    totalCount,
    totalPages,
  } = useTriggeredAlertsContext();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((alertKey: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertKey)) {
        newSet.delete(alertKey);
      } else {
        newSet.add(alertKey);
      }
      return newSet;
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    actions.setPage(page);
    // Clear expanded rows when changing pages
    setExpandedRows(new Set());
  }, [actions]);

  const { sortState, handleSort, sortedData: sortedAlerts } = useTableSort({
    data: filteredAlerts,
    sortFn: sortAlerts,
  });


  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card">
        <TriggeredAlertsTableHeader 
          showRegion={showRegion}
          sortState={sortState}
          onSort={handleSort}
        />

        {/* Table Body */}
        <div>
          {sortedAlerts.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No triggered alerts found</p>
            </div>
          ) : (
            sortedAlerts.map((alert, idx) => {
              const alertKey = `${alert.alertname}-${idx}`;
              const isExpanded = expandedRows.has(alertKey);
              
              return (
                <div key={alertKey}>
                  {/* Main Row */}
                  <div
                    className={`grid ${showRegion ? 'grid-cols-10' : 'grid-cols-9'} px-4 py-3 border-b hover:bg-muted/50 text-sm items-center transition-colors cursor-pointer`}
                    onClick={() => handleToggleExpand(alertKey)}
                  >
                    {/* Alert Name */}
                    <div className="col-span-4 flex items-center gap-1 group">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="truncate font-medium">
                          {alert.alertname}
                        </span>
                      </div>
                      <FilterButtons 
                        filterType="alertname" 
                        value={alert.alertname}
                      />
                    </div>

                    {/* Severity */}
                    <div className="col-span-1 flex items-center gap-1 min-w-0 group">
                      <Badge className={`text-xs ${getSeverityColor(alert.severity)} flex-shrink-0 hover:${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </Badge>
                      <FilterButtons 
                        filterType="severity" 
                        value={alert.severity}
                      />
                    </div>

                    {/* Start Time */}
                    <div className="col-span-1 text-xs text-muted-foreground">
                      {formatAlertDate(alert.startsAt)}
                    </div>

                    {/* End Time */}
                    <div className="col-span-1 text-xs text-muted-foreground">
                      {alert.endsAt ? formatAlertDate(alert.endsAt) : '-'}
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex items-center gap-1 min-w-0 group">
                      <Badge className={`text-xs ${getStatusColor(alert.status)} flex-shrink-0 hover:${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </Badge>
                      <FilterButtons 
                        filterType="status" 
                        value={alert.status}
                      />
                    </div>

                    {/* Landscape */}
                    <div className="col-span-1 flex items-center gap-1 min-w-0 group">
                      <span className="truncate text-muted-foreground">
                        {alert.landscape}
                      </span>
                      <FilterButtons 
                        filterType="landscape" 
                        value={alert.landscape}
                      />
                    </div>

                    {/* Region */}
                    {showRegion && (
                      <div className="col-span-1 flex items-center gap-1 min-w-0 group">
                        <span className="truncate text-muted-foreground">
                          {alert.region}
                        </span>
                        <FilterButtons 
                          filterType="region" 
                          value={alert.region}
                        />
                      </div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className={`${showRegion ? 'grid-cols-10' : 'grid-cols-9'} grid`}>
                      <div className={`${showRegion ? 'col-span-10' : 'col-span-9'}`}>
                        <AlertExpandedView
                          alertData={{
                            name: alert.alertname,
                            severity: alert.severity,
                            labels: alert.labels,
                            annotations: alert.annotations,
                            status: alert.status,
                            landscape: alert.landscape,
                            region: alert.region,
                            component: alert.component,
                            startsAt: alert.startsAt,
                            endsAt: alert.endsAt,
                          }}
                          projectId={projectId}
                          onShowAlertDefinition={onShowAlertDefinition}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {sortedAlerts.length > 0 && (
        <div className="mt-4">
          <TablePagination
            currentPage={filters.page}
            totalPages={totalPages}
            totalItems={totalCount}
            onPageChange={handlePageChange}
            itemsPerPage={filters.pageSize}
          />
        </div>
      )}
    </>
  );
}
