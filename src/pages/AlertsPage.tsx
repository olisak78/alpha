import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAlerts } from '@/hooks/api/useAlerts';
import type { Alert, AlertFile } from '@/hooks/api/useAlerts';
import { useGitHubPRs } from '@/hooks/api/useGitHubPRs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertEditorDialog } from '@/components/Alerts/AlertEditorDialog';
import { AddAlertDialog } from '@/components/Alerts/AddAlertDialog';
import { AlertExpandedView } from '@/components/TriggeredAlerts/AlertExpandedView';
import { FilterControls, FilterControlConfig } from '@/components/TriggeredAlerts/FilterControls';
import { AppliedFilters } from '@/components/AppliedFilters';
import { Search, AlertTriangle, Activity, Code2, ChevronDown, ChevronRight as ChevronRightIcon, Plus, FolderOpen, GitPullRequest, AlertCircle, Github, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import PendingReviewPage from './PendingReviewPage';

interface AlertsPageProps {
  projectId: string;
  projectName: string;
  alertsUrl?: string;
  initialSearchTerm?: string;
  onSearchTermChange?: (searchTerm: string) => void;
}

export default function AlertsPage({ projectId, projectName, alertsUrl='', initialSearchTerm, onSearchTermChange }: AlertsPageProps) {
  const { data: alertsData, isLoading, error } = useAlerts(projectId);
  const { data: prsData } = useGitHubPRs({
    state: 'open',
    sort: 'updated',
    direction: 'desc',
    per_page: 100,
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [excludedSeverity, setExcludedSeverity] = useState<string[]>([]);
  const [excludedAlertname, setExcludedAlertname] = useState<string[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<{ file: AlertFile; alert: Alert } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'alerts' | 'pending-review'>('alerts');

  // Calculate pending review PRs count
  const pendingReviewCount = useMemo(() => {
    return prsData?.pull_requests.filter(pr =>
      pr.title.startsWith('[Update-Rule]') || pr.title.startsWith('[Add-Rule]')
    ).length || 0;
  }, [prsData]);

  // Initialize expandedFiles with all file names when data loads
  useEffect(() => {
    if (alertsData?.files) {
      const allFileNames = alertsData.files.map(file => file.name);
      setExpandedFiles(new Set(allFileNames));
    }
  }, [alertsData]);

  // Handle initial search term from props
  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  // Handle search term changes
  const handleSearchTermChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    if (onSearchTermChange) {
      onSearchTermChange(newSearchTerm);
    }
  };

  // Get available severities from alerts data
  const severities = useMemo(() => {
    if (!alertsData?.files) return [];
    const sevs = new Set<string>();
    alertsData.files.forEach(file => {
      file.alerts?.forEach(alert => {
        if (alert.labels?.severity) {
          sevs.add(alert.labels.severity);
        }
      });
    });
    return Array.from(sevs).sort();
  }, [alertsData]);

  // Applied filters for display
  const appliedFilters = useMemo(() => {
    const filters = [];
    
    // Search term filter
    if (searchTerm) {
      filters.push({
        key: 'search',
        label: `Search: "${searchTerm}"`,
        onRemove: () => handleSearchTermChange('')
      });
    }
    
    // Severity inclusion filters
    if (selectedSeverity.length > 0) {
      selectedSeverity.forEach((severity, index) => {
        filters.push({
          key: `severity-${index}`,
          label: `Severity: ${severity}`,
          onRemove: () => setSelectedSeverity(prev => prev.filter(s => s !== severity))
        });
      });
    }
    
    // Severity exclusion filters
    if (excludedSeverity.length > 0) {
      excludedSeverity.forEach((severity, index) => {
        filters.push({
          key: `excluded-severity-${index}`,
          label: `Exclude Severity: ${severity}`,
          onRemove: () => setExcludedSeverity(prev => prev.filter(s => s !== severity))
        });
      });
    }
    
    // Alert name exclusion filters
    if (excludedAlertname.length > 0) {
      excludedAlertname.forEach((alertname, index) => {
        filters.push({
          key: `excluded-alertname-${index}`,
          label: `Exclude Alert: ${alertname}`,
          onRemove: () => setExcludedAlertname(prev => prev.filter(name => name !== alertname))
        });
      });
    }
    
    return filters;
  }, [selectedSeverity, excludedSeverity, excludedAlertname, searchTerm, handleSearchTermChange]);

  // Filter configuration for the popup
  const filterConfigs: FilterControlConfig[] = [
    {
      type: 'severity',
      label: 'Severity',
      options: severities,
      selected: selectedSeverity,
      onChange: (values: string[]) => {
        setSelectedSeverity(values);
      }
    }
  ];

  // Flatten alerts from all files into a single array with file context
  const allAlerts = useMemo(() => {
    if (!alertsData?.files) return [];

    const alerts: Array<{ file: AlertFile; alert: Alert }> = [];
    alertsData.files.forEach(file => {
      file.alerts?.forEach(alert => {
        alerts.push({ file, alert });
      });
    });
    return alerts;
  }, [alertsData]);

  // Filter alerts using local filters
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter(({ file, alert }) => {
      const alertSeverity = alert.labels?.severity || '';
      const alertName = alert.alert || '';

      // Exclude filters first (if excluded, don't show)
      if (excludedSeverity.length > 0 && excludedSeverity.includes(alertSeverity)) {
        return false;
      }
      
      if (excludedAlertname.length > 0 && excludedAlertname.includes(alertName)) {
        return false;
      }

      // Severity inclusion filter
      if (selectedSeverity.length > 0) {
        if (!selectedSeverity.includes(alertSeverity)) {
          return false;
        }
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          alert.alert?.toLowerCase().includes(searchLower) ||
          alert.expr?.toLowerCase().includes(searchLower) ||
          alert.annotations?.summary?.toLowerCase().includes(searchLower) ||
          file.name.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [allAlerts, selectedSeverity, excludedSeverity, excludedAlertname, searchTerm]);

  // Group alerts by file (always grouped)
  const groupedAlerts = useMemo(() => {
    const grouped = new Map<string, Array<{ file: AlertFile; alert: Alert }>>();

    filteredAlerts.forEach(item => {
      const fileName = item.file.name;
      if (!grouped.has(fileName)) {
        grouped.set(fileName, []);
      }
      grouped.get(fileName)!.push(item);
    });

    return grouped;
  }, [filteredAlerts]);

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

  const handleToggleFileExpand = useCallback((fileName: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  }, []);

  const handleEditAlert = (file: AlertFile, alert: Alert) => {
    setSelectedAlert({ file, alert });
    setIsEditorOpen(true);
  };

  const getSeverityColor = (severity?: string) => {
    if (!severity) return "bg-slate-500/10 text-slate-700 dark:text-slate-300";
    const sev = severity.toLowerCase();
    if (sev === "critical") return "bg-red-500/10 text-red-600 dark:text-red-400";
    if (sev === "warning") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    if (sev === "info") return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    return "bg-slate-500/10 text-slate-700 dark:text-slate-300";
  };

  const handleClearAllFilters = () => {
    setSelectedSeverity([]);
    setExcludedSeverity([]);
    setExcludedAlertname([]);
    handleSearchTermChange('');
  };


  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>Failed to load alerts: {error.message}</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Loading Prometheus alerts...
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters and Controls */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search - Always visible */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          {/* Add New Rule Button */}
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 h-10 bg-primary hover:bg-primary/90 flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add New Rule
          </Button>

          {/* Toggle to Pending Review / Back to Alerts */}
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'alerts' ? 'pending-review' : 'alerts')}
            className="flex items-center gap-2 h-10 flex-shrink-0 relative"
          >
            {viewMode === 'alerts' ? (
              <>
                <GitPullRequest className="h-4 w-4" />
                Pending Review
                {pendingReviewCount > 0 && (
                  <>
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
                      {pendingReviewCount}
                    </Badge>
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 fill-amber-100 dark:fill-amber-900/30" />
                  </>
                )}
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                Alerts Definitions
              </>
            )}
          </Button>

          {/* Filters Popup */}
          {severities.length > 0 && (
            <div className="flex-shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-4" align="start">
                  <FilterControls filterConfigs={filterConfigs} />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Applied Filters */}
          <AppliedFilters
            filters={appliedFilters}
            onClearAllFilters={handleClearAllFilters}
          />

          {/* Spacer to push GitHub button to the right */}
          <div className="flex-1" />

          {/* GitHub Repository Button (icon only, aligned right) */}
          {alertsUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(alertsUrl, '_blank', 'noopener,noreferrer')}
              className="h-10 w-10 p-0 flex-shrink-0"
              title="View alerts repository on GitHub"
            >
              <Github className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Conditional Content: Alerts or Pending Review */}
      {viewMode === 'pending-review' ? (
        <PendingReviewPage projectId={projectId} />
      ) : (
        <>
          {/* Alerts Table */}
          <div className="border rounded-lg overflow-hidden bg-card">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-3 border-b bg-muted/30 text-sm font-medium">
            <div className="col-span-4">Alert Name</div>
            <div className="col-span-1">Severity</div>
            <div className="col-span-5">Expression</div>
            <div className="col-span-1">Duration</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div>
            {filteredAlerts.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No alerts found</p>
              </div>
            ) : (
              // Grouped View (always)
              Array.from(groupedAlerts.entries()).map(([fileName, alerts]) => {
                const isFileExpanded = expandedFiles.has(fileName);
                const fileInfo = alerts[0].file;

                return (
                  <div key={fileName} className="border-b last:border-b-0">
                    {/* File Header */}
                    <div
                      className="grid grid-cols-12 px-4 py-3 bg-muted/30 hover:bg-muted/50 text-sm items-center transition-colors cursor-pointer font-medium"
                      onClick={() => handleToggleFileExpand(fileName)}
                    >
                      <div className="col-span-12 flex items-center gap-2">
                        {isFileExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <FolderOpen className="h-4 w-4 text-blue-600" />
                        <span className="font-mono">{fileName}</span>
                        <Badge variant="secondary" className="text-xs ml-2">
                          {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
                        </Badge>
                        {fileInfo.category && (
                          <Badge variant="outline" className="text-xs">
                            {fileInfo.category}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* File Alerts */}
                    {isFileExpanded && alerts.map(({ file, alert }, idx) => {
                      const alertKey = `${file.name}-${idx}`;
                      const isExpanded = expandedRows.has(alertKey);

                      return (
                        <div key={alertKey}>
                          {/* Main Row */}
                          <div
                            className="grid grid-cols-12 px-4 py-3 border-b hover:bg-muted/50 text-sm items-center transition-colors cursor-pointer"
                            onClick={() => handleToggleExpand(alertKey)}
                          >
                            {/* Alert Name */}
                            <div className="col-span-4 flex items-center gap-2 pl-8 group">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="truncate font-medium">
                                {alert.alert}
                              </span>
                            </div>
                            

                            {/* Severity */}
                            <div className="col-span-1 group">
                              {alert.labels?.severity && (
                                <div className="flex items-center gap-1">
                                  <Badge className={`text-xs ${getSeverityColor(alert.labels.severity)}`}>
                                    {alert.labels.severity}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Expression */}
                            <div className="col-span-5 truncate font-mono text-xs text-muted-foreground">
                              {alert.expr || '-'}
                            </div>

                            {/* Duration */}
                            <div className="col-span-1">
                              {alert.for && (
                                <Badge variant="secondary" className="text-xs font-mono">
                                  {alert.for}
                                </Badge>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAlert(file, alert);
                                }}
                              >
                                <Code2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="grid grid-cols-12">
                              <div className="col-span-12">
                                <AlertExpandedView
                                  alertData={{
                                    name: alert.alert,
                                    severity: alert.labels?.severity,
                                    labels: alert.labels,
                                    annotations: alert.annotations,
                                    expr: alert.expr,
                                    for: alert.for,
                                    contextInfo: {
                                      fileName: file.name,
                                      category: file.category,
                                    },
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
      </div>
        </>
      )}

      {/* Editor Dialog */}
      {selectedAlert && (
        <AlertEditorDialog
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          alert={selectedAlert.alert}
          file={selectedAlert.file}
          projectId={projectId}
        />
      )}

      {/* Add Alert Dialog */}
      <AddAlertDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        files={alertsData?.files || []}
        projectId={projectId}
      />
    </div>
  );
}
