import { useState } from "react";
import { Clock, Map, BarChart3, Table, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Landscape } from "@/types/developer-portal";

interface TimelinesTabProps {
  selectedLandscape: string | null;
  cisTimelines: any[];
  componentVersions: Record<string, any[]>;
  timelineViewMode: "table" | "chart";
  onTimelineViewModeChange: (mode: "table" | "chart") => void;
}

export default function TimelinesTab({
  selectedLandscape,
  cisTimelines,
  componentVersions,
  timelineViewMode,
  onTimelineViewModeChange,
}: TimelinesTabProps) {
  // Helper function to get current Takt
  const getCurrentTakt = () => {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Define Takt periods for current year
    const taktPeriods = [
      { takt: "T01A", start: new Date(currentYear, 0, 21), end: new Date(currentYear, 1, 10) },
      { takt: "T01B", start: new Date(currentYear, 1, 11), end: new Date(currentYear, 1, 24) },
      { takt: "T02A", start: new Date(currentYear, 1, 25), end: new Date(currentYear, 2, 10) },
      { takt: "T02B", start: new Date(currentYear, 2, 11), end: new Date(currentYear, 2, 24) },
      { takt: "T03A", start: new Date(currentYear, 2, 25), end: new Date(currentYear, 3, 7) },
      { takt: "T03B", start: new Date(currentYear, 3, 8), end: new Date(currentYear, 3, 28) },
      { takt: "T04A", start: new Date(currentYear, 3, 29), end: new Date(currentYear, 4, 19) },
      { takt: "T05A", start: new Date(currentYear, 4, 20), end: new Date(currentYear, 5, 3) },
      { takt: "T05B", start: new Date(currentYear, 5, 4), end: new Date(currentYear, 5, 16) },
      { takt: "T06A", start: new Date(currentYear, 5, 17), end: new Date(currentYear, 5, 30) },
      { takt: "T06B", start: new Date(currentYear, 6, 1), end: new Date(currentYear, 6, 14) },
      { takt: "T07A", start: new Date(currentYear, 6, 15), end: new Date(currentYear, 6, 28) },
      { takt: "T07B", start: new Date(currentYear, 6, 29), end: new Date(currentYear, 7, 11) },
      { takt: "T08A", start: new Date(currentYear, 7, 12), end: new Date(currentYear, 7, 25) },
      { takt: "T08B", start: new Date(currentYear, 7, 26), end: new Date(currentYear, 8, 8) },
      { takt: "T09A", start: new Date(currentYear, 8, 9), end: new Date(currentYear, 8, 22) },
      { takt: "T09B", start: new Date(currentYear, 8, 23), end: new Date(currentYear, 9, 6) },
      { takt: "T10A", start: new Date(currentYear, 9, 7), end: new Date(currentYear, 9, 20) },
      { takt: "T10B", start: new Date(currentYear, 9, 21), end: new Date(currentYear, 10, 3) },
      { takt: "T11A", start: new Date(currentYear, 10, 4), end: new Date(currentYear, 10, 17) },
      { takt: "T11B", start: new Date(currentYear, 10, 18), end: new Date(currentYear, 11, 1) },
      { takt: "T12A", start: new Date(currentYear, 11, 2), end: new Date(currentYear, 11, 15) },
      { takt: "T12B", start: new Date(currentYear, 11, 16), end: new Date(currentYear + 1, 0, 12) },
      { takt: "T13B", start: new Date(currentYear + 1, 0, 13), end: new Date(currentYear + 1, 0, 31) },
    ];

    const currentTakt = taktPeriods.find(period =>
      today >= period.start && today <= period.end
    );

    return currentTakt ? currentTakt.takt : null;
  };

  const currentTakt = getCurrentTakt();
  const tCycles = ['T01A', 'T01B', 'T02A', 'T02B', 'T03A', 'T03B', 'T04A', 'T04B', 'T05A', 'T05B', 'T06A', 'T06B', 'T07A', 'T07B', 'T08A', 'T08B', 'T09A', 'T09B', 'T10A', 'T10B', 'T11A', 'T11B', 'T12A', 'T12B', 'T13B'];

  const filteredTimelines = cisTimelines.filter(timeline => {
    if (!selectedLandscape) return true;
    return timeline.landscape === selectedLandscape;
  });

  return (
    <div className="space-y-6">
      {/* Current Takt Indicator */}
      {currentTakt ? (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-900 dark:text-blue-100">Current Delivery on Live:</span>
            </div>
            <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium dark:bg-blue-500">
              {currentTakt}
            </div>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              (Based on today's date: {new Date().toLocaleDateString()})
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">No active Takt period for current date</span>
          </div>
        </div>
      )}

      {/* Header and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className="text-lg font-semibold mb-1">Project Timelines</h3>
          <p className="text-muted-foreground text-sm">View deployment timeline schedules across all landscapes</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={timelineViewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => onTimelineViewModeChange("table")}
              className="flex items-center gap-2"
            >
              <Table className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={timelineViewMode === "chart" ? "default" : "ghost"}
              size="sm"
              onClick={() => onTimelineViewModeChange("chart")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Chart
            </Button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {timelineViewMode === "table" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Deployment Timeline Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <TableComponent>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Landscape</TableHead>
                    {tCycles.map((cycle) => (
                      <TableHead key={cycle} className="min-w-[120px] text-center">
                        {cycle}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimelines.map((timeline) => (
                    <TableRow key={timeline.landscape}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{timeline.landscape}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                              >
                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96" align="start">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm">Component Versions - {timeline.landscape}</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {Object.entries(componentVersions).map(([componentName, versionData]) => {
                                    const landscapeData = versionData.find(
                                      (data: any) => data.landscape === timeline.landscape
                                    );
                                    return (
                                      <div key={componentName} className="border-l-2 border-blue-200 pl-3 py-2">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="text-sm font-medium text-gray-900">
                                            {landscapeData?.buildProperties.name || componentName}
                                          </span>
                                          <Badge variant="outline" className="text-xs">
                                            v{landscapeData?.buildProperties.version || 'N/A'}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-gray-500 space-y-1">
                                          <div>Artifact: {landscapeData?.buildProperties.artifact}</div>
                                          <div>Commit: {landscapeData?.gitProperties['git.commit.id']?.substring(0, 8)}</div>
                                          <div>Build: {landscapeData?.gitProperties['git.build.time'] ?
                                            new Date(landscapeData.gitProperties['git.build.time']).toLocaleDateString() : 'N/A'}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                      {tCycles.map((cycle) => {
                        const value = timeline[cycle as keyof typeof timeline] as string;
                        const isCompleted = value && value.includes('✅');
                        const dateOnly = value ? value.replace(' ✅', '') : '';

                        return (
                          <TableCell key={cycle} className="text-center">
                            {value ? (
                              <div className={`px-2 py-1 rounded text-xs ${isCompleted
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                                }`}>
                                <div className="flex items-center justify-center gap-1">
                                  {isCompleted && <CheckCircle className="h-3 w-3" />}
                                  <span className="font-medium">
                                    {dateOnly || value}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-xs">-</div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </TableComponent>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="px-2 py-1 bg-green-100 border border-green-200 rounded dark:bg-green-900/30 dark:border-green-700">Completed</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">-</span>
                <span>Not Scheduled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart View */}
      {timelineViewMode === "chart" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Timeline Chart View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTimelines.map((timeline) => (
                <div key={timeline.landscape} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
                  <h4 className="font-medium mb-3">{timeline.landscape}</h4>
                  <div className="relative">
                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                      {tCycles.map((cycle, index) => {
                        const value = timeline[cycle as keyof typeof timeline] as string;
                        const isCompleted = value && value.includes('✅');
                        const hasDate = value && value.trim() !== '';

                        return (
                          <div key={cycle} className="flex flex-col items-center min-w-[60px]">
                            <div className="text-xs text-muted-foreground mb-1">{cycle}</div>
                            <div
                              className={`w-12 h-8 rounded border flex items-center justify-center text-xs font-medium ${isCompleted
                                  ? 'bg-green-500 dark:bg-green-600 text-white border-green-600 dark:border-green-500'
                                  : hasDate
                                    ? 'bg-blue-500 dark:bg-blue-600 text-white border-blue-600 dark:border-blue-500'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                                }`}
                              title={value || 'Not scheduled'}
                            >
                              {isCompleted ? '✓' : hasDate ? '●' : '-'}
                            </div>
                            {hasDate && (
                              <div className="text-xs text-muted-foreground mt-1 text-center">
                                {value.replace(' ✅', '').split(' ').slice(-1)[0]}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded border dark:bg-green-600"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded border dark:bg-blue-600 "></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded border dark:bg-gray-700"></div>
                <span>Not Scheduled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
