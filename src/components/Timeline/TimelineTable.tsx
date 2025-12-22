import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { YearData } from '@/services/QPATimelineApi';

interface TimelineTableProps {
  yearData: YearData;
  year: string;
}

export function TimelineTable({ yearData, year }: TimelineTableProps) {
  const [searchFilter, setSearchFilter] = useState('');

  // Extract all Takts and landscapes
  const { takts, landscapes, timelineMap } = useMemo(() => {
    const taktSet = new Set<string>();
    const landscapeSet = new Set<string>();
    const map = new Map<string, Map<string, string>>(); // landscape -> takt -> date

    // Build the data structure
    Object.entries(yearData).forEach(([takt, taktData]) => {
      taktSet.add(takt);
      Object.entries(taktData).forEach(([landscape, date]) => {
        landscapeSet.add(landscape);
        if (!map.has(landscape)) {
          map.set(landscape, new Map());
        }
        map.get(landscape)!.set(takt, date);
      });
    });

    // Sort Takts (T01A, T01B, T02A, T02B, etc.)
    const sortedTakts = Array.from(taktSet).sort((a, b) => {
      const aMatch = a.match(/T(\d+)([AB])/);
      const bMatch = b.match(/T(\d+)([AB])/);
      if (!aMatch || !bMatch) return a.localeCompare(b);

      const aNum = parseInt(aMatch[1]);
      const bNum = parseInt(bMatch[1]);
      if (aNum !== bNum) return aNum - bNum;

      return aMatch[2].localeCompare(bMatch[2]);
    });

    const sortedLandscapes = Array.from(landscapeSet).sort();

    return {
      takts: sortedTakts,
      landscapes: sortedLandscapes,
      timelineMap: map
    };
  }, [yearData]);

  // Filter landscapes based on search
  const filteredLandscapes = useMemo(() => {
    if (!searchFilter.trim()) return landscapes;
    const filter = searchFilter.toLowerCase();
    return landscapes.filter(landscape => landscape.toLowerCase().includes(filter));
  }, [landscapes, searchFilter]);

  // Get cell color based on date status
  const getCellStyle = (dateStr: string | undefined) => {
    if (!dateStr) return 'bg-muted/30 text-muted-foreground';

    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const cellDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Past dates - gray
    if (cellDate < today) {
      return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }

    // Current date (today) - green
    if (cellDate.getTime() === today.getTime()) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-semibold';
    }

    // Future dates - white/default
    return 'bg-background text-foreground';
  };

  // Format date for display
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter landscapes..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Timeline Table */}
      <div className="rounded-md border overflow-auto max-h-[70vh]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-20 min-w-[150px] border-r font-bold">
                Landscape
              </TableHead>
              {takts.map((takt) => (
                <TableHead key={takt} className="text-center min-w-[100px] font-bold">
                  {takt}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLandscapes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={takts.length + 1} className="text-center text-muted-foreground py-8">
                  No landscapes found matching "{searchFilter}"
                </TableCell>
              </TableRow>
            ) : (
              filteredLandscapes.map((landscape) => {
                const landscapeData = timelineMap.get(landscape);
                return (
                  <TableRow key={landscape}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium border-r">
                      {landscape}
                    </TableCell>
                    {takts.map((takt) => {
                      const dateStr = landscapeData?.get(takt);
                      return (
                        <TableCell
                          key={`${landscape}-${takt}`}
                          className={cn(
                            'text-center text-sm',
                            getCellStyle(dateStr)
                          )}
                        >
                          {formatDate(dateStr)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 border" />
          <span>Past</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-background border" />
          <span>Future</span>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredLandscapes.length} of {landscapes.length} landscapes for {year}
      </div>
    </div>
  );
}
