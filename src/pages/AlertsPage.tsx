import { useState, useMemo, useRef, useEffect } from 'react';
import { useAlerts } from '@/hooks/api/useAlerts';
import type { Alert, AlertFile } from '@/hooks/api/useAlerts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertEditorDialog } from '@/components/Alerts/AlertEditorDialog';
import { AlertViewDialog } from '@/components/Alerts/AlertViewDialog';
import { Search, AlertTriangle, Activity, Code2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { BreadcrumbPage } from '@/components/BreadcrumbPage';
import { cn } from '@/lib/utils';

interface AlertsPageProps {
  projectId: string;
  projectName: string;
}

export default function AlertsPage({ projectId, projectName }: AlertsPageProps) {
  const { data: alertsData, isLoading, error } = useAlerts(projectId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<{ file: AlertFile; alert: Alert } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [viewAlert, setViewAlert] = useState<{ file: AlertFile; alert: Alert } | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Scroll refs for severity filter
  const severityScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollSeverityLeft, setCanScrollSeverityLeft] = useState(false);
  const [canScrollSeverityRight, setCanScrollSeverityRight] = useState(false);

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

  // Scroll check function
  const checkSeverityScroll = () => {
    const container = severityScrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollSeverityLeft(scrollLeft > 10);
    setCanScrollSeverityRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll function
  const scrollSeverity = (direction: 'left' | 'right') => {
    const container = severityScrollRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const newScrollPosition = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
  };

  // Setup scroll listeners
  useEffect(() => {
    const sevContainer = severityScrollRef.current;

    if (sevContainer) {
      checkSeverityScroll();
      sevContainer.addEventListener('scroll', checkSeverityScroll);
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        sevContainer.scrollLeft += e.deltaY;
      };
      sevContainer.addEventListener('wheel', handleWheel, { passive: false });
    }

    const handleResize = () => {
      checkSeverityScroll();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (sevContainer) {
        sevContainer.removeEventListener('scroll', checkSeverityScroll);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [severities]);

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

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter(({ file, alert }) => {
      // Severity filter
      if (selectedSeverity !== 'all' && alert.labels?.severity !== selectedSeverity) {
        return false;
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
  }, [allAlerts, selectedSeverity, searchTerm]);

  const totalAlerts = filteredAlerts.length;

  const handleViewAlert = (file: AlertFile, alert: Alert) => {
    setViewAlert({ file, alert });
    setIsViewOpen(true);
  };

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

  if (error) {
    return (
      <BreadcrumbPage>
        <div className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load alerts: {error.message}</span>
          </div>
        </div>
      </BreadcrumbPage>
    );
  }

  if (isLoading) {
    return (
      <BreadcrumbPage>
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
      </BreadcrumbPage>
    );
  }

  return (
    <BreadcrumbPage>
      <div className="p-6 space-y-4">
        {/* Header Section - Matching Components Header */}
        <div className="border-b border-border pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left side - Title and count */}
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">Prometheus Alerts</h2>
              <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                {totalAlerts}
              </Badge>
            </div>
          </div>
        </div>

        {/* Filters - Severity Only */}
        <div className="bg-card border rounded-lg p-3 flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* Search */}
          <div className="relative w-full lg:w-80 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 bg-muted/50 h-9"
            />
          </div>

          {/* Severity Filters */}
          {severities.length > 0 && (
            <>
              {/* Divider */}
              <div className="hidden lg:block w-px h-8 bg-border flex-shrink-0" />

              <div className="relative w-full lg:w-auto overflow-hidden">
                {/* Left Fade Gradient */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none transition-opacity duration-300",
                    canScrollSeverityLeft ? "opacity-100" : "opacity-0"
                  )}
                />

                {/* Left Scroll Button */}
                <button
                  onClick={() => scrollSeverity('left')}
                  className={cn(
                    "absolute left-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-background/95 border border-border shadow-sm hover:bg-accent hover:border-accent-foreground/20 transition-all duration-300 flex items-center justify-center",
                    canScrollSeverityLeft
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none"
                  )}
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Scrollable Pills */}
                <div
                  ref={severityScrollRef}
                  className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {/* All Severities Button */}
                  <button
                    onClick={() => setSelectedSeverity('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                      selectedSeverity === 'all'
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "bg-gray-50 hover:bg-gray-100 text-muted-foreground border border-border/90 hover:border-border hover:scale-105 dark:bg-gray-800/50 dark:hover:bg-gray-700/70 dark:text-gray-300 dark:border-gray-600/50"
                    )}
                  >
                    All Severity
                  </button>

                  {/* Severity Pills */}
                  {severities.map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverity(selectedSeverity === sev ? 'all' : sev)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                        selectedSeverity === sev
                          ? "bg-primary text-primary-foreground shadow-sm scale-105"
                          : "bg-gray-50 hover:bg-gray-100 text-muted-foreground border border-border/90 hover:border-border hover:scale-105 dark:bg-gray-800/50 dark:hover:bg-gray-700/70 dark:text-gray-300 dark:border-gray-600/50"
                      )}
                    >
                      {sev}
                    </button>
                  ))}
                </div>

                {/* Right Scroll Button */}
                <button
                  onClick={() => scrollSeverity('right')}
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-background/95 border border-border shadow-sm hover:bg-accent hover:border-accent-foreground/20 transition-all duration-300 flex items-center justify-center",
                    canScrollSeverityRight
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none"
                  )}
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Right Fade Gradient */}
                <div
                  className={cn(
                    "absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none transition-opacity duration-300",
                    canScrollSeverityRight ? "opacity-100" : "opacity-0"
                  )}
                />
              </div>
            </>
          )}
        </div>

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
              filteredAlerts.map(({ file, alert }, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="grid grid-cols-12 px-4 py-3 border-b hover:bg-muted/50 text-sm items-center transition-colors"
                >
                  {/* Alert Name */}
                  <div
                    className="col-span-4 truncate font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleViewAlert(file, alert)}
                  >
                    {alert.alert}
                  </div>

                  {/* Severity */}
                  <div className="col-span-1">
                    {alert.labels?.severity && (
                      <Badge className={`text-xs ${getSeverityColor(alert.labels.severity)}`}>
                        {alert.labels.severity}
                      </Badge>
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
                      onClick={() => handleViewAlert(file, alert)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditAlert(file, alert)}
                    >
                      <Code2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* View Dialog */}
      {viewAlert && (
        <AlertViewDialog
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          alert={viewAlert.alert}
          file={viewAlert.file}
        />
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
    </BreadcrumbPage>
  );
}
