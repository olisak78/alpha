import { useState } from "react";
import { 
  FileText, 
  Search, 
  Filter 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogLevelTabProps {
  selectedLandscape: string | null;
  selectedLandscapeName?: string;
  logLevels: Record<string, string>;
  onUpdateLogLevels: (levels: Record<string, string>) => void;
  mockLogLevelsAcrossLandscapes: Record<string, Record<string, string>>;
}

export default function LogLevelTab({
  selectedLandscape,
  selectedLandscapeName,
  logLevels,
  onUpdateLogLevels,
  mockLogLevelsAcrossLandscapes
}: LogLevelTabProps) {
  const [showLogLevelConfirmDialog, setShowLogLevelConfirmDialog] = useState(false);
  const [pendingLogLevelChange, setPendingLogLevelChange] = useState<{
    logger: string;
    oldLevel: string;
    newLevel: string;
    loggerName: string;
  } | null>(null);
  
  const [logLevelFilters, setLogLevelFilters] = useState({
    name: "",
    level: "all"
  });
  const [logLevelConsistencyFilter, setLogLevelConsistencyFilter] = useState<"all" | "consistent" | "mixed">("all");

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "ERROR": return "text-destructive";
      case "WARN": return "text-yellow-500";
      case "INFO": return "text-blue-500";
      case "DEBUG": return "text-purple-500";
      case "TRACE": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case "ERROR": return "🔴";
      case "WARN": return "🟡";
      case "INFO": return "🔵";
      case "DEBUG": return "🟣";
      case "TRACE": return "🟢";
      default: return "⚪";
    }
  };

  const getFilteredLoggers = () => {
    const loggerEntries = Object.entries(logLevels);
    
    return loggerEntries
      .filter(([loggerKey, level]) => {
        if (logLevelFilters.name && !loggerKey.toLowerCase().includes(logLevelFilters.name.toLowerCase())) {
          return false;
        }
        
        if (logLevelFilters.level !== "all" && level !== logLevelFilters.level) {
          return false;
        }
        
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b));
  };

  const getConsistencyFilteredLoggers = () => {
    const loggerEntries = Object.entries(mockLogLevelsAcrossLandscapes);
    
    return loggerEntries
      .filter(([loggerKey, landscapeLevels]) => {
        if (logLevelFilters.name && !loggerKey.toLowerCase().includes(logLevelFilters.name.toLowerCase())) {
          return false;
        }
        
        if (logLevelConsistencyFilter !== "all") {
          const levels = Object.values(landscapeLevels);
          const uniqueLevels = [...new Set(levels)];
          const isConsistent = uniqueLevels.length === 1;
          
          if (logLevelConsistencyFilter === "consistent" && !isConsistent) {
            return false;
          }
          if (logLevelConsistencyFilter === "mixed" && isConsistent) {
            return false;
          }
        }
        
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b));
  };

  const getAvailableLandscapes = () => {
    return Object.keys(mockLogLevelsAcrossLandscapes[Object.keys(mockLogLevelsAcrossLandscapes)[0]] || {});
  };

  const isLoggerConsistent = (loggerKey: string) => {
    const landscapeLevels = mockLogLevelsAcrossLandscapes[loggerKey];
    if (!landscapeLevels) return true;
    const levels = Object.values(landscapeLevels);
    return new Set(levels).size === 1;
  };

  const handleLogLevelChange = (logger: string, newLevel: string, loggerName: string) => {
    const oldLevel = logLevels[logger as keyof typeof logLevels];
    if (oldLevel === newLevel) return;
    
    setPendingLogLevelChange({
      logger,
      oldLevel,
      newLevel,
      loggerName
    });
    setShowLogLevelConfirmDialog(true);
  };

  const confirmLogLevelChange = () => {
    if (pendingLogLevelChange) {
      onUpdateLogLevels({
        ...logLevels,
        [pendingLogLevelChange.logger]: pendingLogLevelChange.newLevel
      });
      setShowLogLevelConfirmDialog(false);
      setPendingLogLevelChange(null);
    }
  };

  if (!selectedLandscape) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Log Level Overview - All Landscapes
            </CardTitle>
            <p className="text-muted-foreground">
              View and compare log levels across all landscapes. Select a landscape to configure individual log levels.
            </p>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by logger name..."
                  className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={logLevelFilters.name}
                  onChange={(e) => setLogLevelFilters(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center gap-2 border rounded-lg p-1">
                <button
                  onClick={() => setLogLevelConsistencyFilter("all")}
                  className={`px-3 py-1 text-sm rounded ${
                    logLevelConsistencyFilter === "all" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}
                >
                  All Logs
                </button>
                <button
                  onClick={() => setLogLevelConsistencyFilter("consistent")}
                  className={`px-3 py-1 text-sm rounded ${
                    logLevelConsistencyFilter === "consistent" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                      : "hover:bg-muted"
                  }`}
                >
                  Consistent
                </button>
                <button
                  onClick={() => setLogLevelConsistencyFilter("mixed")}
                  className={`px-3 py-1 text-sm rounded ${
                    logLevelConsistencyFilter === "mixed" 
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" 
                      : "hover:bg-muted"
                  }`}
                >
                  Mixed
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Log Levels Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium sticky left-0 bg-muted/50 border-r">
                      Logger Name
                    </th>
                    {getAvailableLandscapes().map((landscape) => (
                      <th key={landscape} className="text-center p-4 font-medium min-w-32">
                        {landscape}
                      </th>
                    ))}
                    <th className="text-center p-4 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getConsistencyFilteredLoggers().map(([loggerKey, landscapeLevels]) => (
                    <tr key={loggerKey} className="border-t hover:bg-muted/30">
                      <td className="p-4 font-mono text-xs sticky left-0 bg-background border-r max-w-80">
                        <div className="truncate" title={loggerKey}>
                          {loggerKey}
                        </div>
                      </td>
                      {getAvailableLandscapes().map((landscape) => (
                        <td key={landscape} className="p-4 text-center">
                          <Badge 
                            variant="secondary" 
                            className={`${getLogLevelColor(landscapeLevels[landscape] || "INFO")} font-mono text-xs`}
                          >
                            {getLogLevelIcon(landscapeLevels[landscape] || "INFO")} {landscapeLevels[landscape] || "INFO"}
                          </Badge>
                        </td>
                      ))}
                      <td className="p-4 text-center">
                        {isLoggerConsistent(loggerKey) ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Consistent
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                            Mixed
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {getConsistencyFilteredLoggers().length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Loggers Found</h3>
                <p>No loggers match your current filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Log Level Configuration
            <Badge variant="outline">{selectedLandscapeName}</Badge>
          </CardTitle>
          <p className="text-muted-foreground">
            Configure logging levels for different components. Changes require confirmation and take effect immediately.
          </p>
        </CardHeader>
      </Card>

      {/* Filters for Single Landscape View */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter by logger name..."
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={logLevelFilters.name}
                onChange={(e) => setLogLevelFilters(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={logLevelFilters.level}
                onChange={(e) => setLogLevelFilters(prev => ({ ...prev, level: e.target.value }))}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Levels</option>
                <option value="ERROR">ERROR</option>
                <option value="WARN">WARN</option>
                <option value="INFO">INFO</option>
                <option value="DEBUG">DEBUG</option>
                <option value="TRACE">TRACE</option>
              </select>
            </div>
            
            <Badge variant="secondary" className="ml-auto">
              {getFilteredLoggers().length} loggers
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Logger Cards */}
      {getFilteredLoggers().map(([loggerKey, currentLevel]) => (
        <Card key={loggerKey} className="border-l-4 border-l-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2 font-mono">
                      {loggerKey}
                      <span className="text-sm">
                        {getLogLevelIcon(currentLevel)}
                      </span>
                    </h4>
                  </div>
                </div>
                <div className="ml-11 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span>effectiveLevel:</span>
                    <Badge 
                      variant="secondary" 
                      className={`${getLogLevelColor(currentLevel)} font-mono`}
                    >
                      {currentLevel}
                    </Badge>
                  </div>
                </div>
              </div>
              <Select 
                value={currentLevel}
                onValueChange={(value) => handleLogLevelChange(loggerKey, value, loggerKey)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ERROR">🔴 ERROR</SelectItem>
                  <SelectItem value="WARN">🟡 WARN</SelectItem>
                  <SelectItem value="INFO">🔵 INFO</SelectItem>
                  <SelectItem value="DEBUG">🟣 DEBUG</SelectItem>
                  <SelectItem value="TRACE">🟢 TRACE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}

      {getFilteredLoggers().length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">No Loggers Found</h3>
          <p>No loggers match your current filters.</p>
        </div>
      )}

      {/* Log Level Change Confirmation Dialog */}
      <Dialog open={showLogLevelConfirmDialog} onOpenChange={setShowLogLevelConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Log Level Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the log level? This will immediately affect logging behavior in the selected landscape.
            </DialogDescription>
          </DialogHeader>
          {pendingLogLevelChange && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-muted space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{pendingLogLevelChange.loggerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>From:</span>
                    <Badge 
                      variant="outline" 
                      className={`${getLogLevelColor(pendingLogLevelChange.oldLevel)} font-mono`}
                    >
                      {getLogLevelIcon(pendingLogLevelChange.oldLevel)} {pendingLogLevelChange.oldLevel}
                    </Badge>
                  </div>
                  <span>→</span>
                  <div className="flex items-center gap-2">
                    <span>To:</span>
                    <Badge 
                      variant="outline" 
                      className={`${getLogLevelColor(pendingLogLevelChange.newLevel)} font-mono`}
                    >
                      {getLogLevelIcon(pendingLogLevelChange.newLevel)} {pendingLogLevelChange.newLevel}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowLogLevelConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmLogLevelChange}>
              Apply Change
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
